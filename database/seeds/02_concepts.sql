-- ============================================================================
-- SV-OS Seed Data: Core Concepts
-- ============================================================================

INSERT INTO knowledge_nodes (slug, title, description, node_type, difficulty, estimated_minutes, icon, color, is_published) VALUES

-- Programming Concepts
('variables', 'Variables and Data Types',
 'Fundamental programming concepts for storing and manipulating data using variables, constants, and primitive data types.',
 'concept', 'beginner', 30, 'braces', '#3B82F6', true),

('control-flow', 'Control Flow',
 'The order in which individual statements, instructions, or function calls are executed in a program using conditionals and loops.',
 'concept', 'beginner', 45, 'git-fork', '#3B82F6', true),

('functions', 'Functions and Methods',
 'Reusable blocks of code that perform a specific task, including parameters, return values, and scope.',
 'concept', 'beginner', 45, 'function-square', '#3B82F6', true),

('oop', 'Object-Oriented Programming',
 'A programming paradigm based on the concept of objects containing data and methods, including classes, inheritance, and polymorphism.',
 'concept', 'intermediate', 90, 'layers', '#3B82F6', true),

('functional-programming', 'Functional Programming',
 'A programming paradigm where programs are constructed by applying and composing functions, emphasizing immutability and pure functions.',
 'concept', 'advanced', 90, 'lambda', '#3B82F6', true),

('recursion', 'Recursion',
 'A technique where a function calls itself to solve a problem by breaking it down into smaller subproblems.',
 'concept', 'intermediate', 60, 'refresh-cw', '#3B82F6', true),

('error-handling', 'Error Handling',
 'The process of responding to and recovering from error conditions in a program using exceptions, try-catch blocks, and error codes.',
 'concept', 'beginner', 30, 'alert-triangle', '#3B82F6', true),

-- Data Structure Concepts
('arrays', 'Arrays and Lists',
 'Ordered collections of elements stored in contiguous memory locations, supporting index-based access.',
 'concept', 'beginner', 30, 'list', '#3B82F6', true),

('linked-lists', 'Linked Lists',
 'Linear data structures where elements are stored in nodes, each pointing to the next node using pointers.',
 'concept', 'intermediate', 45, 'link', '#3B82F6', true),

('stacks-queues', 'Stacks and Queues',
 'Abstract data types for ordered collections: LIFO (stack) and FIFO (queue) access patterns.',
 'concept', 'intermediate', 45, 'columns', '#3B82F6', true),

('trees', 'Trees and Binary Trees',
 'Hierarchical data structures consisting of nodes connected by edges, used for efficient searching and sorting.',
 'concept', 'intermediate', 60, 'git-branch', '#3B82F6', true),

('graphs', 'Graphs',
 'Non-linear data structures consisting of vertices (nodes) and edges connecting them, used to model relationships.',
 'concept', 'advanced', 90, 'share-2', '#3B82F6', true),

('hash-tables', 'Hash Tables',
 'Data structures that implement an associative array using a hash function to compute index for key-value pairs.',
 'concept', 'intermediate', 45, 'hash', '#3B82F6', true),

-- Algorithm Concepts
('searching', 'Searching Algorithms',
 'Algorithms for finding specific elements within data structures, including linear search, binary search, and search trees.',
 'concept', 'intermediate', 60, 'search', '#3B82F6', true),

('sorting', 'Sorting Algorithms',
 'Algorithms for arranging elements in a specific order, including bubble sort, merge sort, quicksort, and heapsort.',
 'concept', 'intermediate', 60, 'arrow-up-down', '#3B82F6', true),

('dynamic-programming', 'Dynamic Programming',
 'A method for solving complex problems by breaking them down into simpler subproblems and storing their solutions.',
 'concept', 'advanced', 90, 'cpu', '#3B82F6', true),

('complexity-analysis', 'Complexity Analysis',
 'The theoretical analysis of algorithm efficiency in terms of time and space using Big O notation.',
 'concept', 'intermediate', 60, 'bar-chart', '#3B82F6', true),

('greedy-algorithms', 'Greedy Algorithms',
 'Algorithms that make locally optimal choices at each step to find a global optimum for certain problems.',
 'concept', 'advanced', 60, 'maximize', '#3B82F6', true),

-- Database Concepts
('sql-basics', 'SQL Basics',
 'Structured Query Language fundamentals including SELECT, INSERT, UPDATE, DELETE queries and basic filtering.',
 'concept', 'beginner', 60, 'terminal', '#3B82F6', true),

('database-design', 'Database Design',
 'The process of structuring data to meet application requirements, including normalization, relationships, and schema design.',
 'concept', 'intermediate', 90, 'database', '#3B82F6', true),

('indexing', 'Indexing and Query Optimization',
 'Techniques for improving database query performance using indexes, query planning, and execution analysis.',
 'concept', 'intermediate', 45, 'zap', '#3B82F6', true),

-- Network Concepts
('http-basics', 'HTTP Protocol',
 'The Hypertext Transfer Protocol fundamentals including request methods, status codes, headers, and REST principles.',
 'concept', 'beginner', 45, 'globe', '#3B82F6', true),

('tcp-ip', 'TCP/IP Protocol Stack',
 'The fundamental protocols of the Internet including TCP, IP, DNS, and how data travels across networks.',
 'concept', 'intermediate', 90, 'network', '#3B82F6', true),

-- Web Concepts
('html-css', 'HTML & CSS',
 'The fundamental building blocks of web pages: HTML for structure and CSS for styling and layout.',
 'concept', 'beginner', 60, 'code', '#3B82F6', true),

('javascript-basics', 'JavaScript Basics',
 'Core JavaScript programming concepts including DOM manipulation, events, and asynchronous programming.',
 'concept', 'beginner', 90, 'file-text', '#3B82F6', true),

('rest-apis', 'REST API Design',
 'Principles and best practices for designing RESTful APIs including resource naming, status codes, and versioning.',
 'concept', 'intermediate', 60, 'api', '#3B82F6', true),

-- Security Concepts
('authentication', 'Authentication & Authorization',
 'The processes of verifying user identity (authentication) and determining access rights (authorization).',
 'concept', 'intermediate', 60, 'lock', '#3B82F6', true),

('encryption', 'Encryption & Cryptography',
 'The practice of securing information by encoding it so that only authorized parties can access it.',
 'concept', 'advanced', 90, 'shield', '#3B82F6', true),

-- System Design Concepts
('caching', 'Caching Strategies',
 'Techniques for storing frequently accessed data in fast-access storage to improve application performance.',
 'concept', 'intermediate', 45, 'zap', '#3B82F6', true),

('load-balancing', 'Load Balancing',
 'The distribution of network traffic across multiple servers to ensure reliability and performance.',
 'concept', 'advanced', 60, 'server', '#3B82F6', true),

('microservices', 'Microservices Architecture',
 'An architectural style that structures an application as a collection of loosely coupled, independently deployable services.',
 'concept', 'advanced', 90, 'grid', '#3B82F6', true);
