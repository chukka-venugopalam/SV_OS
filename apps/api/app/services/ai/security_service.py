"""
Security Service — protects the AI layer from prompt injection, abuse, and leakage.

Provides:
- Prompt injection detection (heuristic + pattern-based)
- Output sanitization (XSS, malicious markdown)
- Rate limiting per user/endpoint
- Token limit enforcement
- Context leakage prevention
"""

from __future__ import annotations

import os
import re
import time
from collections import defaultdict
from typing import Any
from uuid import UUID

from structlog.stdlib import get_logger

logger = get_logger(__name__)

# ── Prompt injection patterns ─────────────────────────────────────
INJECTION_PATTERNS: list[re.Pattern] = [
    re.compile(r'ignore\s+(all\s+)?(previous|above|below|prior)\s+instructions', re.IGNORECASE),
    re.compile(r'forget\s+(all\s+)?(previous|above|below)\s+(instructions|context|conversation)', re.IGNORECASE),
    re.compile(r'you\s+are\s+(now|not\s+required|free\s+to)', re.IGNORECASE),
    re.compile(r'role[- ]?play\s+as', re.IGNORECASE),
    re.compile(r'system\s*(prompt|message|instruction)', re.IGNORECASE),
    re.compile(r'reveal\s+your\s+(system|instructions|prompt|rules)', re.IGNORECASE),
    re.compile(r'output\s+your\s+(system|instructions|prompt|rules|initialization)', re.IGNORECASE),
    re.compile(r'print\s+your\s+(system|instructions|prompt)', re.IGNORECASE),
    re.compile(r'you\s+have\s+been\s+(hacked|compromised|pwned)', re.IGNORECASE),
    re.compile(r'do\s+(not\s+)?(any|every)thing\s+i\s+say', re.IGNORECASE),
    re.compile(r'<\|im_start\|>|<\|im_end\|>|<\|system\|>', re.IGNORECASE),
]

# ── Sensitive patterns that should not be in AI responses ─────────
LEAKAGE_PATTERNS: list[re.Pattern] = [
    re.compile(r'AI_CHAT_PROVIDER|AI_EMBEDDING_PROVIDER', re.IGNORECASE),
    re.compile(r'OPENAI_API_KEY|ANTHROPIC_API_KEY|DEEPSEEK_API_KEY', re.IGNORECASE),
    re.compile(r'DATABASE_URL|SECRET_KEY', re.IGNORECASE),
    re.compile(r'Bearer\s+[A-Za-z0-9\-._~+/]+={0,2}', re.IGNORECASE),
]


class SecurityService:
    """Security layer for the AI chat system.

    Validates inputs, sanitizes outputs, and enforces rate limits
    to protect against prompt injection, data leakage, and abuse.
    """

    def __init__(self) -> None:
        self._rate_limits: dict[str, dict[str, Any]] = {}
        self._max_message_length = int(os.getenv('AI_MAX_MESSAGE_LENGTH', '50000'))
        self._max_response_length = int(os.getenv('AI_MAX_RESPONSE_LENGTH', '100000'))
        self._max_context_length = int(os.getenv('AI_MAX_CONTEXT_LENGTH', '30000'))

    # ── Input Validation ───────────────────────────────────────────

    def validate_input(self, message: str) -> tuple[bool, str]:
        """Validate user input for security concerns.

        Returns (is_safe, reason).
        """
        if not message or not message.strip():
            return False, 'Message cannot be empty'

        if len(message) > self._max_message_length:
            return False, f'Message exceeds maximum length of {self._max_message_length} characters'

        # Check for injection patterns
        for pattern in INJECTION_PATTERNS:
            if pattern.search(message):
                logger.warning('prompt_injection_detected', pattern=pattern.pattern)
                return False, 'Message contains prohibited patterns'

        # Check for encoded injection attempts
        decoded = self._decode_attempts(message)
        if decoded != message:
            for pattern in INJECTION_PATTERNS:
                if pattern.search(decoded):
                    logger.warning('encoded_injection_detected', pattern=pattern.pattern)
                    return False, 'Message contains prohibited patterns'

        return True, ''

    def validate_context_length(self, context: str) -> tuple[bool, str]:
        """Validate that context isn't too large."""
        if len(context) > self._max_context_length:
            return False, f'Context exceeds maximum length of {self._max_context_length} characters'
        return True, ''

    # ── Output Sanitization ────────────────────────────────────────

    def sanitize_output(self, content: str) -> str:
        """Sanitize AI output for safe display.

        Removes:
        - Script tags and event handlers
        - Leaked credentials
        - Harmful markdown
        - Excessively long sequences
        """
        # Remove script tags and event handlers
        content = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL | re.IGNORECASE)
        content = re.sub(r'\son\w+\s*=\s*["\'][^"\']*["\']', '', content, flags=re.IGNORECASE)
        content = re.sub(r'javascript\s*:', '', content, flags=re.IGNORECASE)

        # Remove leaked credentials
        for pattern in LEAKAGE_PATTERNS:
            content = pattern.sub('[REDACTED]', content)

        # Normalize excessive whitespace
        content = re.sub(r'\n{4,}', '\n\n\n', content)
        content = re.sub(r' {4,}', '    ', content)

        # Truncate if too long
        if len(content) > self._max_response_length:
            content = content[:self._max_response_length] + '\n\n*[Truncated due to length]*'

        return content

    # ── Rate Limiting ──────────────────────────────────────────────

    def check_rate_limit(
        self, user_id: UUID, endpoint: str,
        max_requests: int = 30, window_seconds: int = 60,
    ) -> tuple[bool, int]:
        """Check if user has exceeded rate limit.

        Returns (is_allowed, retry_after_seconds).
        """
        key = f'{user_id}:{endpoint}'
        now = time.time()

        if key not in self._rate_limits:
            self._rate_limits[key] = {
                'count': 1,
                'window_start': now,
            }
            return True, 0

        entry = self._rate_limits[key]
        elapsed = now - entry['window_start']

        if elapsed > window_seconds:
            # Reset window
            entry['count'] = 1
            entry['window_start'] = now
            return True, 0

        entry['count'] += 1

        if entry['count'] > max_requests:
            retry_after = int(window_seconds - elapsed)
            logger.warning(
                'rate_limit_exceeded',
                user_id=str(user_id),
                endpoint=endpoint,
                count=entry['count'],
                retry_after=retry_after,
            )
            return False, max(1, retry_after)

        return True, 0

    def reset_rate_limit(self, user_id: UUID, endpoint: str) -> None:
        """Reset rate limit for a user/endpoint combination."""
        key = f'{user_id}:{endpoint}'
        self._rate_limits.pop(key, None)

    # ── Token Limit Enforcement ────────────────────────────────────

    def estimate_tokens(self, text: str) -> int:
        """Roughly estimate token count (4 chars per token)."""
        return len(text) // 4

    def enforce_token_limit(
        self, messages: list[dict], max_tokens: int = 8000,
    ) -> list[dict]:
        """Truncate message history to fit within token budget.

        Keeps the system prompt and most recent messages.
        """
        total = 0
        result = []
        # Process in reverse to keep most recent messages
        for msg in reversed(messages):
            tokens = self.estimate_tokens(msg.get('content', ''))
            if total + tokens > max_tokens:
                continue
            total += tokens
            result.append(msg)

        # Restore to original order, keeping system prompt first
        system_msgs = [m for m in messages if m.get('role') == 'system']
        chat_msgs = [m for m in messages if m.get('role') != 'system']
        kept_ids = {id(m) for m in result}
        kept_chat = [m for m in chat_msgs if id(m) in kept_ids]

        return system_msgs + kept_chat

    # ── Helpers ────────────────────────────────────────────────────

    def _decode_attempts(self, text: str) -> str:
        """Try to decode encoding tricks used to bypass filters."""
        result = text
        # URL decoding
        try:
            from urllib.parse import unquote
            result = unquote(result)
        except Exception:
            pass
        # Base64 (if looks encoded)
        if re.match(r'^[A-Za-z0-9+/=]+$', result) and len(result) > 20:
            try:
                import base64
                decoded = base64.b64decode(result).decode('utf-8', errors='ignore')
                result = decoded
            except Exception:
                pass
        # Hex encoding
        if re.match(r'^[0-9a-fA-F]+$', result) and len(result) > 20:
            try:
                result = bytes.fromhex(result).decode('utf-8', errors='ignore')
            except Exception:
                pass
        return result
