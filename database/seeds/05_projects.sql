-- ============================================================================
-- SV-OS Seed Data: Projects (35 Total)
-- ============================================================================

INSERT INTO projects (slug, title, description, difficulty, estimated_hours, tech_stack, icon, color, is_published) VALUES
('personal-website', 'Personal Portfolio Website',
 'Design and build a responsive personal portfolio website showcasing software projects, technical articles, and professional experience. Implement custom layout styling, interactive DOM components, accessible UI elements, and fast asset loading.',
 'beginner', 20, ARRAY['HTML5', 'CSS3', 'JavaScript', 'Vite'], 'code', '#3B82F6', true),

('task-manager', 'Task Manager App',
 'Full-stack kanban task management application featuring JWT authentication, task drag-and-drop organization, subtask tracking, and real-time updates across concurrent user sessions.',
 'intermediate', 40, ARRAY['React', 'TypeScript', 'Node.js', 'Express', 'PostgreSQL', 'Socket.io'], 'code', '#3B82F6', true),

('url-shortener', 'URL Shortener Service',
 'High-throughput URL shortening service supporting Base62 encoding, custom aliases, Redis sub-millisecond redirect caching, and click analytics tracking.',
 'intermediate', 30, ARRAY['Python', 'FastAPI', 'Redis', 'PostgreSQL'], 'code', '#3B82F6', true),

('chat-app', 'Real-time Messaging Platform',
 'End-to-end encrypted messaging platform featuring low-latency WebSocket communication, message channel persistence, typing indicators, and RSA/AES hybrid payload encryption.',
 'intermediate', 45, ARRAY['React', 'Node.js', 'Socket.io', 'MongoDB', 'Web Crypto API'], 'code', '#3B82F6', true),

('ecommerce-api', 'E-Commerce REST API Engine',
 'Production-grade e-commerce REST API featuring catalog search, shopping cart management, Stripe payment processing, transactional inventory locks, and Docker containerization.',
 'intermediate', 50, ARRAY['Python', 'FastAPI', 'PostgreSQL', 'Stripe API', 'Docker'], 'code', '#3B82F6', true),

('netflix-clone', 'Video Streaming Platform Clone',
 'Scalable video streaming platform featuring HLS adaptive bitrate video streaming, user watch history tracking, content recommendation carousels, and AWS S3/CloudFront CDN integration.',
 'advanced', 80, ARRAY['React', 'Next.js', 'Node.js', 'FFmpeg', 'AWS S3', 'CloudFront'], 'code', '#3B82F6', true),

('social-media-dashboard', 'Social Media Analytics Dashboard',
 'Real-time analytics dashboard rendering high-dimensional social media engagement metrics, custom time-series aggregations, D3.js interactive charts, and CSV/PDF export generation.',
 'advanced', 60, ARRAY['React', 'D3.js', 'TypeScript', 'FastAPI', 'PostgreSQL', 'Redis'], 'code', '#3B82F6', true),

('docker-voting-app', 'Distributed Containerized Voting App',
 'Multi-service microservice voting application demonstrating container orchestration, Redis message queue decoupling, background worker processing, and live result visualization.',
 'advanced', 25, ARRAY['Docker', 'Docker Compose', 'Python', 'Node.js', 'Redis', 'PostgreSQL'], 'code', '#3B82F6', true),

('machine-learning-pipeline', 'Automated ML Pipeline Orchestrator',
 'Automated machine learning workflow orchestrator handling dataset preprocessing, model training experiments, metrics logging via MLflow, and REST inference model serving.',
 'advanced', 70, ARRAY['Python', 'PyTorch', 'FastAPI', 'MLflow', 'Docker'], 'code', '#3B82F6', true),

('api-gateway', 'Microservice API Gateway Service',
 'High-throughput API Gateway proxy supporting token bucket rate limiting, JWT auth validation, reverse proxy request routing, dynamic service discovery, and access logging.',
 'advanced', 55, ARRAY['Python', 'FastAPI', 'Redis', 'Docker', 'PostgreSQL'], 'code', '#3B82F6', true),

('relational-dbms-engine', 'Relational DBMS Storage & Query Engine',
 'Build a relational database management system engine from scratch in C++ or Rust. Implements disk page storage management, a B+ Tree index engine, a SQL lexer and recursive parser, a query execution plan evaluator, and two-phase locking ACID transactions.',
 'expert', 75, ARRAY['C++20', 'Rust', 'CMake', 'GoogleTest'], 'code', '#3B82F6', true),

('kv-store-lsm', 'LSM-Tree Key-Value Storage Engine',
 'High-throughput log-structured merge-tree (LSM-Tree) key-value storage engine inspired by RocksDB. Implements Write-Ahead Logging (WAL), an in-memory SkipList MemTable, SSTable file flushing, and background multi-level compaction.',
 'expert', 50, ARRAY['C++', 'Rust', 'Google Benchmark'], 'code', '#3B82F6', true),

('unix-shell-and-kernel', 'Custom Unix Shell & Process Controller',
 'POSIX-compliant Unix shell built in C. Implements process spawning (fork/execvp), pipeline redirection (`|`, `>`, `<`), background job control (`&`, `fg`, `bg`), and signal handling (`SIGINT`, `SIGTSTP`, `SIGCHLD`).',
 'advanced', 35, ARRAY['C', 'GCC', 'Make', 'GDB'], 'code', '#3B82F6', true),

('user-threads-scheduler', 'User-Space Threading & Coroutine Library',
 'Preemptive user-space threading and coroutine library written in C and assembly. Implements custom context switching, user-space CPU scheduling (Round Robin), stack frame allocations, and coroutine yield primitives.',
 'expert', 40, ARRAY['C', 'x86-64 Assembly', 'Make'], 'code', '#3B82F6', true),

('custom-tcp-stack', 'Userspace TCP/IP Protocol Stack',
 'Userspace TCP/IP protocol stack built over Linux TUN/TAP virtual network interfaces. Implements Ethernet frame parsing, ARP table resolution, IPv4 packet routing, TCP 3-way handshake state machines, and sliding window flow control.',
 'expert', 65, ARRAY['C', 'Linux TUN/TAP', 'Wireshark'], 'code', '#3B82F6', true),

('http-proxy-cache', 'Asynchronous HTTP/1.1 Proxy Server',
 'High-throughput asynchronous HTTP/1.1 reverse proxy and cache server built using C epoll event loops. Features HTTP header parsing, connection pooling, thread pool worker dispatching, and LRU response caching.',
 'advanced', 40, ARRAY['C', 'epoll', 'CMake', 'curl'], 'code', '#3B82F6', true),

('c-compiler-subset', 'Subset C Compiler & x86-64 Code Generator',
 'Complete compiler compiling a subset of C language into executable x86-64 assembly. Implements a lexical scanner, recursive-descent AST parser, semantic type checker, stack-frame variable allocator, and assembly code generator.',
 'expert', 70, ARRAY['C++', 'x86-64 Assembly', 'GCC', 'Make'], 'code', '#3B82F6', true),

('bytecode-virtual-machine', 'Register-Based Bytecode Virtual Machine',
 'Register-based bytecode virtual machine and assembler execution environment. Implements custom instruction set architecture (ISA), bytecode compiler, register dispatch loop, garbage-collected heap memory, and stack frame evaluator.',
 'expert', 45, ARRAY['C++17', 'CMake', 'GoogleTest'], 'code', '#3B82F6', true),

('regex-engine-nfa-dfa', 'Regular Expression Engine (Thompson''s NFA & DFA Minimization)',
 'High-performance regular expression evaluation engine implementing Thompson''s NFA construction algorithm, Powerset subset construction (NFA to DFA conversion), and Hopcroft''s DFA state minimization algorithm for guaranteed O(N) linear-time string matching.',
 'expert', 35, ARRAY['Python', 'C++', 'Graphviz', 'PyTest'], 'code', '#3B82F6', true),

('sat-solver-dpll', 'DPLL Boolean Satisfiability (SAT) Solver',
 'Boolean Satisfiability (SAT) solver implementing the Davis-Putnam-Logemann-Loveland (DPLL) algorithm. Features Conjunctive Normal Form (CNF) DIMACS parsing, unit propagation, pure literal elimination, and backtracking search.',
 'expert', 40, ARRAY['C++', 'Python', 'PyTest'], 'code', '#3B82F6', true),

('transformer-nlp-engine', 'PyTorch Causal Transformer NLP Engine',
 'Build a GPT-style Causal Transformer decoder model from scratch in PyTorch. Implements multi-head self-attention mechanisms, positional encodings, layer normalization, BPE tokenization, and auto-regressive text generation.',
 'expert', 65, ARRAY['Python', 'PyTorch', 'HuggingFace Tokenizers', 'FastAPI'], 'code', '#3B82F6', true),

('computer-vision-segmentation', 'U-Net Medical Image Segmentation Engine',
 'Deep learning image segmentation engine implementing U-Net architecture in PyTorch for pixel-level medical MRI scan segmentation, complete with Dice loss optimization and data augmentation pipelines.',
 'expert', 55, ARRAY['Python', 'PyTorch', 'OpenCV', 'Albumentations'], 'code', '#3B82F6', true),

('realtime-flink-stream', 'Apache Flink Real-Time Event Processor',
 'Event-driven stream processing pipeline using Apache Flink and Kafka. Ingests high-volume financial transaction streams, computes tumbling/sliding window aggregations, detects fraud anomalies, and sinks metrics into Elasticsearch.',
 'expert', 60, ARRAY['Java', 'Apache Flink', 'Apache Kafka', 'Elasticsearch', 'Docker'], 'code', '#3B82F6', true),

('data-warehouse-elt', 'Snowflake & dbt Cloud ELT Data Pipeline',
 'Modern analytics ELT data warehouse pipeline using Snowflake and dbt (data build tool). Transforms raw transactional data streams into Kimball dimensional star schema data marts with automated schema testing and documentation.',
 'advanced', 45, ARRAY['SQL', 'dbt', 'Snowflake', 'Python', 'GitHub Actions'], 'code', '#3B82F6', true),

('kubernetes-operator-custom', 'Custom Kubernetes Operator in Go',
 'Custom Kubernetes Controller Operator built in Go using `operator-sdk` and `controller-runtime`. Extends the Kubernetes API with a custom DatabaseCluster CRD automating primary-replica failovers, backup snapshots, and rolling upgrades.',
 'expert', 50, ARRAY['Go', 'Kubernetes', 'Docker', 'Operator SDK', 'Kustomize'], 'code', '#3B82F6', true),

('terraform-multi-cloud-infra', 'Multi-Cloud Terraform Infrastructure Automation',
 'Modular Infrastructure-as-Code (IaC) project using Terraform to provision multi-region AWS and GCP cloud infrastructure, complete with VPC peering, EKS Kubernetes clusters, IAM policies, and remote S3 state locking.',
 'advanced', 40, ARRAY['Terraform', 'HCL', 'AWS CLI', 'GCP SDK'], 'code', '#3B82F6', true),

('network-packet-ids', 'High-Speed Network Intrusion Detection System (IDS)',
 'Network Intrusion Detection System (IDS) capturing live network interface traffic via libpcap. Performs real-time packet protocol decoding, signature-based pattern matching (Snort rules), and port scan anomaly detection.',
 'expert', 60, ARRAY['C++', 'libpcap', 'Snort Rules', 'CMake'], 'code', '#3B82F6', true),

('vulnerability-scanner-static', 'AST-Based Static Security Code Analyzer',
 'Static Application Security Testing (SAST) tool analyzing source code Abstract Syntax Trees (AST) to detect OWASP Top 10 security vulnerabilities including SQL Injection, Command Injection, XSS, and hardcoded secrets.',
 'advanced', 45, ARRAY['Python', 'ast module', 'Click', 'SARIF'], 'code', '#3B82F6', true),

('distributed-consensus-raft', 'Raft Distributed Consensus Engine',
 'Go implementation of the Raft distributed consensus protocol. Implements leader election, randomized term timeouts, replicated write-ahead log state machines, log compaction, and cluster membership changes.',
 'expert', 70, ARRAY['Go', 'gRPC', 'Protobuf'], 'code', '#3B82F6', true),

('distributed-file-system-gfs', 'Distributed File System (Google File System Clone)',
 'Distributed object storage system modeled after Google File System (GFS). Features a central Master node managing metadata and chunk leases, multi-chunkserver data replication, and client streaming read/write access.',
 'expert', 75, ARRAY['Go', 'gRPC', 'Protobuf'], 'code', '#3B82F6', true),

('react-native-crypto-wallet', 'Cross-Platform Web3 Mobile Wallet',
 'Cross-platform mobile cryptocurrency wallet built in React Native. Implements BIP-39 mnemonic seed generation, BIP-32/44 hierarchical deterministic key derivation, secure local storage encryption, and RPC transaction signing.',
 'advanced', 50, ARRAY['React Native', 'TypeScript', 'ethers.js', 'Expo'], 'code', '#3B82F6', true),

('wasm-video-editor', 'In-Browser WebAssembly Video Editor',
 'Browser-based non-linear video editing tool leveraging Rust compiled to WebAssembly (Wasm). Executes FFmpeg frame processing, video trimming, format transcoding, and visual filters client-side in the browser without server rendering.',
 'expert', 55, ARRAY['Rust', 'WebAssembly', 'wasm-bindgen', 'React', 'WebCodecs API'], 'code', '#3B82F6', true),

('stm32-rtos-weather-station', 'STM32 FreeRTOS Environmental Weather Station',
 'Real-time embedded firmware running on STM32 ARM Cortex-M microcontroller using FreeRTOS. Reads I2C temperature/pressure sensors via Direct Memory Access (DMA), processes sensor telemetry, and transmits data over SPI Wi-Fi module.',
 'advanced', 45, ARRAY['C', 'FreeRTOS', 'STM32CubeIDE', 'ARM GCC'], 'code', '#3B82F6', true),

('vulkan-3d-render-engine', 'Vulkan 3D Physically Based Rendering (PBR) Engine',
 'Modern 3D graphics rendering engine built from scratch using Vulkan API in C++17. Features Physically Based Rendering (PBR) lighting equations, GLTF 3D model loading, shadow mapping, and dynamic Vulkan command buffer pipelines.',
 'expert', 80, ARRAY['C++17', 'Vulkan SDK', 'GLSL Shaders', 'GLM', 'glfw'], 'code', '#3B82F6', true),

('zero-trust-auth-mesh', 'Zero-Trust Service Mesh Proxy Engine',
 'Zero-Trust service mesh sidecar proxy enforcing Mutual TLS (mTLS) encryption, SPIFFE/SPIRE cryptographic workload identity verification, and fine-grained Open Policy Agent (OPA) RBAC authorization across microservices.',
 'expert', 50, ARRAY['Go', 'gRPC', 'SPIFFE/SPIRE', 'Open Policy Agent (OPA)', 'Docker'], 'code', '#3B82F6', true)
ON CONFLICT (slug) DO NOTHING;
