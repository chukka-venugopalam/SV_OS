'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Plus,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Loader2,
  StopCircle,
  Copy,
  Check,
  Trash2,
  Edit3,
  Clock,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Briefcase,
  FolderGit2,
  HelpCircle,
  ChevronDown,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/lib/formatters';
import { Button, Card, CardContent, Badge, Skeleton, Tooltip } from '@sv-os/ui';
import { PageTransition } from '@/components/shared/animations';
import { Shell } from '@/components/shared/shell';

// ── Types ─────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  content_type: string;
  token_count?: number;
  model_used?: string;
  created_at: string;
}

interface Conversation {
  id: string;
  title: string;
  session_type: string;
  message_count: number;
  is_archived: boolean;
  created_at: string;
}

interface Citation {
  title: string;
  slug: string;
  node_type: string;
  similarity?: number;
}

interface StreamEvent {
  type: 'token' | 'done' | 'error';
  content?: string;
  session_id?: string;
  suggestions?: string[];
  citations?: Citation[];
  error?: string;
}

// ── Session Type Config ───────────────────────────────────────────

const SESSION_TYPES = [
  { value: 'chat', label: 'Chat', icon: MessageSquare, color: 'text-primary-500' },
  { value: 'tutor', label: 'Tutor', icon: GraduationCap, color: 'text-info-500' },
  { value: 'planner', label: 'Planner', icon: Lightbulb, color: 'text-warning-500' },
  { value: 'career_mentor', label: 'Career', icon: Briefcase, color: 'text-success-500' },
  { value: 'project_mentor', label: 'Project', icon: FolderGit2, color: 'text-graph-subject' },
  { value: 'quiz', label: 'Quiz', icon: HelpCircle, color: 'text-danger-500' },
] as const;

// ── AI Chat Page ──────────────────────────────────────────────────

export default function AIChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionType, setSessionType] = useState('chat');
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showSessionTypes, setShowSessionTypes] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      const res = await apiClient.get<{ items: Conversation[]; total: number }>(
        '/ai/conversations',
        { params: { per_page: 50 } },
      );
      setConversations(res.data?.items ?? []);
    } catch {
      // Silently fail
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const startNewConversation = () => {
    setMessages([]);
    setSessionId(null);
    setSuggestions([]);
    setCitations([]);
    setError(null);
    setInput('');
    inputRef.current?.focus();
  };

  const loadConversation = async (convId: string) => {
    try {
      const res = await apiClient.get<{ items: ChatMessage[] }>(
        `/ai/conversations/${convId}/messages`,
      );
      setMessages(res.data?.items ?? []);
      setSessionId(convId);
      setSuggestions([]);
      setCitations([]);
      setError(null);
    } catch {
      setError('Failed to load conversation');
    }
  };

  const deleteConversation = async (convId: string) => {
    try {
      await apiClient.delete(`/ai/conversations/${convId}`);
      setConversations((prev) => prev.filter((c) => c.id !== convId));
      if (sessionId === convId) {
        startNewConversation();
      }
    } catch {
      setError('Failed to delete conversation');
    }
  };

  const copyMessage = async (content: string, msgId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(msgId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  // ── Send Message ────────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || isStreaming) return;

    setInput('');
    setError(null);
    setSuggestions([]);
    setCitations([]);
    setIsStreaming(true);

    // Add user message immediately
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      session_id: sessionId ?? '',
      role: 'user',
      content: trimmedInput,
      content_type: 'text',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    // Add placeholder assistant message
    const tempAssistantId = `temp-assistant-${Date.now()}`;
    const tempAssistantMsg: ChatMessage = {
      id: tempAssistantId,
      session_id: sessionId ?? '',
      role: 'assistant',
      content: '',
      content_type: 'markdown',
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempAssistantMsg]);

    try {
      abortControllerRef.current = new AbortController();
      const token = localStorage.getItem('access_token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}/api/v1/ai/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: trimmedInput,
            session_id: sessionId,
            session_type: sessionType,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedContent = '';
      let hasCompletedSessionId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const event: StreamEvent = JSON.parse(line.slice(6));

            if (event.type === 'token' && event.content) {
              accumulatedContent += event.content;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === tempAssistantId
                    ? { ...msg, content: accumulatedContent }
                    : msg,
                ),
              );
            } else if (event.type === 'done') {
              hasCompletedSessionId = event.session_id ?? null;
              if (hasCompletedSessionId && !sessionId) {
                setSessionId(hasCompletedSessionId);
              }
              setSuggestions(event.suggestions ?? []);
              setCitations(event.citations ?? []);
            } else if (event.type === 'error') {
              setError(event.error ?? 'An error occurred');
            }
          } catch {
            // Skip malformed events
          }
        }
      }

      // Reload conversations if this was a new session
      if (!sessionId) {
        loadConversations();
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Generation stopped');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to send message');
      }
      // Remove the empty assistant message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempAssistantId));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, [input, isStreaming, sessionId, sessionType]);

  const stopGeneration = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  const currentSessionConfig = SESSION_TYPES.find((s) => s.value === sessionType)
    ?? SESSION_TYPES[0];
  const SessionIcon = currentSessionConfig.icon;

  return (
    <PageTransition>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            'flex flex-col border-r border-neutral-200 bg-neutral-50 transition-all duration-300 dark:border-neutral-800 dark:bg-neutral-900/50',
            sidebarOpen ? 'w-72' : 'w-0 overflow-hidden',
          )}
        >
          <div className="flex items-center justify-between border-b border-neutral-200 p-3 dark:border-neutral-800">
            <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              Conversations
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="h-7 w-7 p-0"
            >
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {isLoadingConversations ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-neutral-400">
                <MessageSquare className="mx-auto mb-2 h-8 w-8" />
                <p>No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      sessionId === conv.id
                        ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300'
                        : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
                    )}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conv.id);
                      }}
                      className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-3.5 w-3.5 text-neutral-400 hover:text-danger-500" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-neutral-200 p-2 dark:border-neutral-800">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={startNewConversation}
            >
              <Plus className="h-4 w-4" />
              New conversation
            </Button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <div className="flex items-center gap-3">
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                  className="h-7 w-7 p-0"
                >
                  <PanelLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    AI Assistant
                  </h1>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {currentSessionConfig.label} mode
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Session Type Selector */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSessionTypes(!showSessionTypes)}
                  className="gap-1.5 text-xs"
                >
                  <SessionIcon className={cn('h-3.5 w-3.5', currentSessionConfig.color)} />
                  {currentSessionConfig.label}
                  <ChevronDown className="h-3 w-3" />
                </Button>
                {showSessionTypes && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSessionTypes(false)}
                    />
                    <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-neutral-200 bg-white p-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                      {SESSION_TYPES.map((st) => {
                        const ItemIcon = st.icon;
                        return (
                          <button
                            key={st.value}
                            onClick={() => {
                              setSessionType(st.value);
                              setShowSessionTypes(false);
                            }}
                            className={cn(
                              'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                              sessionType === st.value
                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-300'
                                : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
                            )}
                          >
                            <ItemIcon className={cn('h-3.5 w-3.5', st.color)} />
                            {st.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-md space-y-6 text-center">
                  <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                      <Sparkles className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                      How can I help you today?
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                      I can help you learn, plan, build projects, and more.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      onClick={() => {
                        setInput('Explain how the knowledge graph works in SV-OS');
                        setSessionType('tutor');
                      }}
                      className="rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <GraduationCap className="mb-1 h-4 w-4 text-info-500" />
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        Tutor me
                      </p>
                      <p className="text-xs text-neutral-400">
                        Explain concepts and detect gaps
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        setInput('Create a weekly learning plan for JavaScript');
                        setSessionType('planner');
                      }}
                      className="rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <Lightbulb className="mb-1 h-4 w-4 text-warning-500" />
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        Plan learning
                      </p>
                      <p className="text-xs text-neutral-400">
                        Generate a personalized schedule
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        setInput('What skills do I need for a career in machine learning?');
                        setSessionType('career_mentor');
                      }}
                      className="rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <Briefcase className="mb-1 h-4 w-4 text-success-500" />
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        Career advice
                      </p>
                      <p className="text-xs text-neutral-400">
                        Analyse skills and readiness
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        setInput('Help me plan a full-stack web app project');
                        setSessionType('project_mentor');
                      }}
                      className="rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <FolderGit2 className="mb-1 h-4 w-4 text-graph-subject" />
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        Project help
                      </p>
                      <p className="text-xs text-neutral-400">
                        Get project roadmaps and guidance
                      </p>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setInput('Quiz me on Python basics');
                        setSessionType('quiz');
                      }}
                      className="rounded-lg border border-neutral-200 p-3 text-left text-sm transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                      <HelpCircle className="mb-1 h-4 w-4 text-danger-500" />
                      <p className="font-medium text-neutral-700 dark:text-neutral-300">
                        Quiz me
                      </p>
                      <p className="text-xs text-neutral-400">
                        Generate practice questions
                      </p>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-4 px-4 py-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'group flex gap-3',
                      msg.role === 'user' ? 'justify-end' : 'justify-start',
                    )}
                  >
                    <div
                      className={cn(
                        'flex max-w-[80%] flex-col gap-1',
                        msg.role === 'user' ? 'items-end' : 'items-start',
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {msg.role === 'assistant' && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400">
                            <Bot className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <div
                          className={cn(
                            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                            msg.role === 'user'
                              ? 'bg-primary-500 text-white'
                              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
                            msg.content === '' && 'min-h-[2rem]',
                          )}
                        >
                          {msg.content === '' && isStreaming ? (
                            <span className="inline-flex gap-1">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '0ms' }} />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '150ms' }} />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-primary-400" style={{ animationDelay: '300ms' }} />
                            </span>
                          ) : (
                            <div className="prose prose-sm max-w-none dark:prose-invert">
                              {renderMarkdown(msg.content)}
                            </div>
                          )}
                        </div>
                        {msg.role === 'user' && (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400">
                            <User className="h-3.5 w-3.5" />
                          </div>
                        )}
                      </div>

                      {/* Message actions */}
                      {msg.role === 'assistant' && msg.content && (
                        <div className="flex items-center gap-1 px-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => copyMessage(msg.content, msg.id)}
                            className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                            title="Copy response"
                          >
                            {copiedId === msg.id ? (
                              <Check className="h-3 w-3 text-success-500" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          {msg.model_used && (
                            <span className="text-[10px] text-neutral-400">
                              {msg.model_used}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInput(suggestion);
                          setTimeout(() => sendMessage(), 100);
                        }}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {/* Citations */}
                {citations.length > 0 && (
                  <div className="rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                      Knowledge Sources
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {citations.map((cite, idx) => (
                        <Link
                          key={idx}
                          href={`/explore/${cite.slug}`}
                          className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                          <BookOpen className="h-3 w-3" />
                          {cite.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="rounded-lg bg-danger-50 p-3 text-sm text-danger-700 dark:bg-danger-950/30 dark:text-danger-400">
                    {error}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-neutral-200 p-4 dark:border-neutral-800">
            <div className="mx-auto max-w-3xl">
              <div className="relative flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your learning journey..."
                  rows={1}
                  className="flex-1 resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 pr-12 text-sm outline-none transition-colors placeholder:text-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-500 dark:focus:border-primary-400"
                  style={{ minHeight: '2.75rem', maxHeight: '8rem' }}
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <button
                    onClick={stopGeneration}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-danger-500 text-white transition-colors hover:bg-danger-600"
                    title="Stop generation"
                  >
                    <StopCircle className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className={cn(
                      'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors',
                      input.trim()
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-neutral-200 text-neutral-400 dark:bg-neutral-700',
                    )}
                    title="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[10px] text-neutral-400">
                AI responses are generated by {process.env.NEXT_PUBLIC_AI_PROVIDER ?? 'AI'} and may not be accurate. Verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// ── Simple Markdown Renderer ──────────────────────────────────────

function renderMarkdown(content: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockLang = '';
  let inList = false;
  let listItems: React.ReactNode[] = [];

  const processLine = (line: string, idx: number) => {
    // Code blocks
    if (line.trimStart().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={idx} className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-100 dark:bg-neutral-950">
            <code>{codeBlockContent}</code>
          </pre>,
        );
        codeBlockContent = '';
        codeBlockLang = '';
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent += line + '\n';
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={idx} className="mt-4 mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {line.slice(4)}
        </h3>,
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={idx} className="mt-4 mb-2 text-base font-bold text-neutral-900 dark:text-neutral-100">
          {line.slice(3)}
        </h2>,
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={idx} className="mt-4 mb-2 text-lg font-bold text-neutral-900 dark:text-neutral-100">
          {line.slice(2)}
        </h1>,
      );
      return;
    }

    // List items
    if (line.match(/^[\s]*[-*]\s/) || line.match(/^\d+\.\s/)) {
      const content = line.replace(/^[\s]*[-*]\s/, '').replace(/^\d+\.\s/, '');
      const isBold = content.startsWith('**') && content.endsWith('**');
      const displayContent = isBold ? content.slice(2, -2) : content;
      listItems.push(
        <li key={`li-${idx}`} className="text-sm text-neutral-700 dark:text-neutral-300">
          {isBold ? <strong>{displayContent}</strong> : content}
        </li>,
      );
      inList = true;
      return;
    }

    // Flush list
    if (inList && !line.match(/^[\s]*[-*]\s/) && !line.match(/^\d+\.\s/)) {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${idx}`} className="my-2 list-disc pl-5 space-y-1">
            {listItems}
          </ul>,
        );
        listItems = [];
        inList = false;
      }
    }

    // Empty line
    if (!line.trim()) {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${idx}`} className="my-2 list-disc pl-5 space-y-1">
            {listItems}
          </ul>,
        );
        listItems = [];
        inList = false;
      }
      elements.push(<div key={idx} className="h-2" />);
      return;
    }

    // Bold text
    const rendered = line
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code class="rounded bg-neutral-200 px-1 py-0.5 text-xs dark:bg-neutral-700">$1</code>');

    elements.push(
      <p key={idx} className="text-sm text-neutral-700 dark:text-neutral-300" dangerouslySetInnerHTML={{ __html: rendered }} />,
    );
  };

  lines.forEach((line, idx) => processLine(line, idx));

  // Flush remaining list
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="ul-final" className="my-2 list-disc pl-5 space-y-1">
        {listItems}
      </ul>,
    );
  }

  // Flush remaining code block
  if (inCodeBlock && codeBlockContent) {
    elements.push(
      <pre key="code-final" className="my-2 overflow-x-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-100">
        <code>{codeBlockContent}</code>
      </pre>,
    );
  }

  return elements;
}
