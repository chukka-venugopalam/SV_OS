# SV-OS New Simulator Specs — Part B, File 5 of 6

Covers: Computer Networks — 4 nodes. IP Addressing & Routing, TCP & Congestion Control excluded (covered).

---

## 1. osi-encapsulation-visualizer

**Node:** Network Models (OSI / TCP-IP)
**Mechanism:** Sends a message down the 7-layer OSI stack at the sender (each layer prepends its own header, changing the PDU's name) and back up the stack at the receiver (each layer strips its header), showing encapsulation and decapsulation as mirror-image processes.
**Step sequence:**

1. Start with raw application data at Layer 7.
2. Layer 6→4: each layer adds its header (or reformats), data becomes a Segment (TCP) or Datagram (UDP) at Layer 4.
3. Layer 3: adds IP header → Packet.
4. Layer 2: adds frame header/trailer → Frame.
5. Layer 1: transmitted as raw Bits; receiver reverses steps 2–4 in opposite order, stripping one header per layer going up.
   **Per-step highlight + explanation:**

- Highlight the growing/shrinking header stack wrapped around the payload at each layer.
- "Sender: data → +TCP header (Segment) → +IP header (Packet) → +frame header/trailer (Frame) → bits on the wire. Receiver strips frame header first, then IP header, then TCP header — exact reverse order, since headers nest like an envelope inside an envelope."

---

## 2. crc-error-detection-visualizer

**Node:** Physical & Data Link Layer
**Mechanism:** Computes a CRC checksum via binary polynomial division: append r zero bits (r = generator's degree) to the message, divide by the generator polynomial using XOR (no borrow), and append the remainder as the frame check sequence; receiver divides the received bits by the same generator — a nonzero remainder signals an error.
**Step sequence:**

1. Append r zero-bits to the message (r = degree of the generator).
2. Align the generator under the leftmost bits; XOR if the leading bit is 1, else leave unchanged.
3. Shift one bit right (bring down the next dividend bit); repeat the XOR-or-not step.
4. Continue until all bits are consumed; the final r bits are the CRC remainder.
5. Transmit message+remainder; receiver re-divides by the same generator — remainder 0 means no detected error.
   **Per-step highlight + explanation:**

- Highlight the active 4-bit window and whether an XOR fired at each shift.
- "Message 1101, generator 1011 (degree 3, x³+x+1): append 3 zeros → 1101000; division yields remainder 001; transmitted codeword = 1101001. Verified: generator × quotient(1111) + remainder(001) = 1101000 in GF(2) arithmetic."
- Note: if the existing sliding-window simulator is confirmed to be genuine Data-Link flow control (Go-Back-N/Selective Repeat), it already covers that half of this node — CRC is the priority gap regardless.

---

## 3. diffie-hellman-visualizer

**Node:** Network Security Fundamentals
**Mechanism:** Deliberately distinct from the existing RSA simulator — walks through Diffie-Hellman key exchange: two parties agree on public parameters (prime p, generator g), each picks a private exponent, exchanges public values computed via modular exponentiation, and independently derives the same shared secret without ever transmitting it.
**Step sequence:**

1. Publish shared parameters p (prime) and g (generator).
2. Alice picks private a, computes A = gᵃ mod p; Bob picks private b, computes B = gᵇ mod p.
3. Alice and Bob exchange A and B over the public channel (a, b stay secret).
4. Alice computes shared secret = Bᵃ mod p; Bob computes Aᵇ mod p.
5. Show both computations yield the same value: gᵃᵇ mod p.
   **Per-step highlight + explanation:**

- Highlight which values are public (transmitted) vs. private (never leave each party) throughout.
- "p=23, g=5, a=6, b=15: A=5⁶ mod23=8, B=5¹⁵ mod23=19. Alice: 19⁶ mod23=2. Bob: 8¹⁵ mod23=2 — both derive shared secret 2, despite only A, B, p, g ever crossing the network."

---

## 4. dns-resolution-visualizer

**Node:** Application Layer Protocols (HTTP/DNS)
**Mechanism:** Included despite this node showing as "covered" in your data — the wired simulator demonstrates sliding-window flow control, which is Data Link/Transport content, not HTTP or DNS. This spec covers actual DNS resolution (recursive resolver performing iterative queries up the naming hierarchy) plus a basic HTTP request/response cycle.
**Step sequence (DNS branch):**

1. Client sends a recursive query for a domain to its configured resolver.
2. Resolver queries a root server → gets a referral to the relevant TLD server (e.g., .com).
3. Resolver queries the TLD server → gets a referral to the authoritative name server for the domain.
4. Resolver queries the authoritative server → receives the IP address.
5. Resolver returns the IP to the client and caches it for the record's TTL.
   **Step sequence (HTTP branch):**
6. Client sends a request (method, path, headers) to the resolved IP.
7. Server processes the request and returns a status line + headers + body.
   **Per-step highlight + explanation:**

- Highlight the query/referral hop currently active, and which server holds authority at each step.
- "Resolving www.example.com: root refers to .com TLD server, .com TLD refers to example.com's authoritative server, authoritative server returns the A record IP — 3 iterative hops behind the client's single recursive request."
- "GET /index.html HTTP/1.1 → server responds 200 OK with Content-Type and body; a missing resource instead returns 404 Not Found — the status code alone tells the client how to proceed, without parsing the body."

---

_File 5 of 6. Next: File 6 (Software Engineering + OOP + Distributed Systems) — the largest file, all 12 nodes newly built._
