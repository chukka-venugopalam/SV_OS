-- ============================================================================
-- SV-OS Seed Data: Knowledge Graph Edges
-- ============================================================================
-- Connects knowledge nodes, careers, and projects into a graph.
-- Every edge includes: source, target, relationship_type, direction, description, weight
-- ============================================================================

-- ============================================================================
-- SUBJECT → CONCEPT relationships (PART_OF)
-- ============================================================================
INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward',
    CASE n2.slug
        WHEN 'variables' THEN 'Variables and data types are fundamental building blocks of programming'
        WHEN 'control-flow' THEN 'Control flow statements enable program decision-making'
        WHEN 'functions' THEN 'Functions enable code reuse and modular programming'
        WHEN 'oop' THEN 'Object-oriented programming is a core programming paradigm'
        WHEN 'functional-programming' THEN 'Functional programming is an advanced programming paradigm'
        WHEN 'recursion' THEN 'Recursion is a powerful problem-solving technique in programming'
        WHEN 'error-handling' THEN 'Error handling is essential for robust program design'
        WHEN 'arrays' THEN 'Arrays are the most fundamental data structure'
        WHEN 'linked-lists' THEN 'Linked lists build on array concepts with dynamic memory'
        WHEN 'stacks-queues' THEN 'Stacks and queues are essential abstract data types'
        WHEN 'trees' THEN 'Trees enable hierarchical data organization and fast searching'
        WHEN 'graphs' THEN 'Graphs model complex relationships between entities'
        WHEN 'hash-tables' THEN 'Hash tables provide O(1) average-case lookup performance'
        WHEN 'searching' THEN 'Searching algorithms are fundamental to data retrieval'
        WHEN 'sorting' THEN 'Sorting algorithms organize data for efficient processing'
        WHEN 'dynamic-programming' THEN 'Dynamic programming optimizes recursive solutions'
        WHEN 'complexity-analysis' THEN 'Complexity analysis is essential for algorithm evaluation'
        WHEN 'greedy-algorithms' THEN 'Greedy algorithms solve optimization problems efficiently'
        WHEN 'sql-basics' THEN 'SQL is the standard language for database interaction'
        WHEN 'database-design' THEN 'Good database design ensures data integrity and performance'
        WHEN 'indexing' THEN 'Indexing dramatically improves query performance'
        WHEN 'http-basics' THEN 'HTTP is the foundation of web communication'
        WHEN 'tcp-ip' THEN 'TCP/IP is the fundamental protocol stack of the Internet'
        WHEN 'html-css' THEN 'HTML and CSS are the building blocks of web pages'
        WHEN 'javascript-basics' THEN 'JavaScript enables interactive web experiences'
        WHEN 'rest-apis' THEN 'REST APIs enable communication between software systems'
        WHEN 'authentication' THEN 'Authentication is critical for web application security'
        WHEN 'encryption' THEN 'Encryption protects sensitive data from unauthorized access'
        WHEN 'caching' THEN 'Caching improves application performance significantly'
        WHEN 'load-balancing' THEN 'Load balancing ensures system reliability at scale'
        WHEN 'microservices' THEN 'Microservices enable scalable, independent service deployment'
    END, 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'programming' AND n2.slug IN ('variables', 'control-flow', 'functions', 'oop', 'functional-programming', 'recursion', 'error-handling');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Core data structures every programmer must know', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'data-structures' AND n2.slug IN ('arrays', 'linked-lists', 'stacks-queues', 'trees', 'graphs', 'hash-tables');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Algorithmic problem-solving techniques', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'algorithms' AND n2.slug IN ('searching', 'sorting', 'dynamic-programming', 'complexity-analysis', 'greedy-algorithms');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Core database concepts', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'databases' AND n2.slug IN ('sql-basics', 'database-design', 'indexing');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Networking concepts powering the Internet', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'computer-networks' AND n2.slug IN ('http-basics', 'tcp-ip');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Web development fundamentals', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'web-development' AND n2.slug IN ('html-css', 'javascript-basics', 'rest-apis', 'http-basics');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Cybersecurity concepts for safe computing', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'cybersecurity' AND n2.slug IN ('authentication', 'encryption');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'part_of', 'forward', 'Computer Science disciplines', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'computer-science' AND n2.slug IN ('programming', 'data-structures', 'algorithms', 'computer-networks', 'operating-systems', 'databases', 'software-engineering', 'artificial-intelligence', 'web-development', 'cybersecurity', 'cloud-computing');

-- ============================================================================
-- PREREQUISITE relationships between concepts
-- ============================================================================
INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Must understand variables before writing functions that use them', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'variables' AND n2.slug = 'functions';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Variables are needed before controlling program flow', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'variables' AND n2.slug = 'control-flow';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Functions are a prerequisite for understanding object-oriented programming', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'functions' AND n2.slug = 'oop';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Functions must be understood before learning recursion', 0.8
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'functions' AND n2.slug = 'recursion';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Functions are required before handling errors properly', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'functions' AND n2.slug = 'error-handling';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'OOP concepts provide context for understanding functional programming paradigms', 0.5
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'oop' AND n2.slug = 'functional-programming';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Arrays provide the foundation for understanding linked lists', 0.8
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'arrays' AND n2.slug = 'linked-lists';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Array concepts help understand stack and queue implementations', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'arrays' AND n2.slug = 'stacks-queues';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Linked lists are a stepping stone to understanding trees', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'linked-lists' AND n2.slug = 'trees';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Tree concepts are essential before studying graphs', 0.8
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'trees' AND n2.slug = 'graphs';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Understanding arrays helps with hash table implementation', 0.6
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'arrays' AND n2.slug = 'hash-tables';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Recursion is a key technique for tree traversal algorithms', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'recursion' AND n2.slug = 'trees';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Complexity analysis is essential for evaluating search algorithms', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'complexity-analysis' AND n2.slug = 'searching';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Complexity analysis is essential for comparing sorting algorithms', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'complexity-analysis' AND n2.slug = 'sorting';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Recursion is fundamental to understanding dynamic programming', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'recursion' AND n2.slug = 'dynamic-programming';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Sorting concepts help understand greedy algorithm trade-offs', 0.5
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'sorting' AND n2.slug = 'greedy-algorithms';

-- ============================================================================
-- TECHNOLOGY relationships (RELATED_TO, USES)
-- ============================================================================
INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'bidirectional', 'TypeScript is a typed superset of JavaScript that compiles to plain JavaScript', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'javascript' AND n2.slug = 'typescript';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'forward', 'React is a UI library built with JavaScript', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'javascript' AND n2.slug = 'react';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'forward', 'Next.js is a React framework for production applications', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'react' AND n2.slug = 'nextjs';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'forward', 'Node.js enables JavaScript to run on the server side', 0.8
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'javascript' AND n2.slug = 'nodejs';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'bidirectional', 'Tailwind CSS pairs beautifully with React for styling', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'react' AND n2.slug = 'tailwind';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'forward', 'FastAPI is a modern Python web framework', 0.8
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'python' AND n2.slug = 'fastapi';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'forward', 'PostgreSQL is a relational database that uses SQL', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'sql' AND n2.slug = 'postgresql';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'forward', 'Kubernetes extends Docker for container orchestration at scale', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'docker' AND n2.slug = 'kubernetes';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'related_to', 'bidirectional', 'GraphQL is an alternative API paradigm to REST, often used with Node.js', 0.6
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug = 'nodejs' AND n2.slug = 'graphql';

-- PREREQUISITE: concepts → technologies
INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Core programming concepts are required before learning Python', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('variables', 'control-flow', 'functions') AND n2.slug = 'python';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Programming fundamentals and JavaScript basics are required to learn JavaScript', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('variables', 'control-flow', 'functions', 'javascript-basics') AND n2.slug = 'javascript';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'JavaScript and web fundamentals are prerequisites for React', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('javascript', 'javascript-basics', 'html-css') AND n2.slug = 'react';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'React knowledge is required before learning Next.js', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('react', 'javascript') AND n2.slug = 'nextjs';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'JavaScript and REST API knowledge are needed for Node.js', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('javascript', 'rest-apis', 'http-basics') AND n2.slug = 'nodejs';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'SQL and database design concepts are prerequisites for PostgreSQL', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('sql-basics', 'database-design', 'indexing') AND n2.slug = 'postgresql';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'SQL basics must be learned before using SQL in practice', 1.0
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('sql-basics', 'database-design') AND n2.slug = 'sql';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'REST API design, Python, and HTTP knowledge are prerequisites for FastAPI', 0.9
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('rest-apis', 'python', 'http-basics') AND n2.slug = 'fastapi';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'HTML/CSS and React fundamentals are needed before Tailwind CSS', 0.7
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('html-css', 'react') AND n2.slug = 'tailwind';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Caching and data concepts help understand Redis use cases', 0.6
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('caching', 'indexing') AND n2.slug = 'redis';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Caching and load balancing concepts are useful before learning AWS', 0.5
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('caching', 'load-balancing') AND n2.slug = 'aws';

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, n2.id, 'prerequisite', 'forward', 'Docker and microservices knowledge are prerequisites for Kubernetes', 0.8
FROM knowledge_nodes n1, knowledge_nodes n2
WHERE n1.slug IN ('docker', 'microservices') AND n2.slug = 'kubernetes';

-- ============================================================================
-- CAREER → CONCEPT relationships (REQUIRES)
-- ============================================================================
-- Note: career_requirements table handles the direct career→node relationships
-- These edges supplement by connecting career as a node to concept nodes
INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT n1.id, c2.id, 'requires', 'forward', 'Frontend engineers must master HTML/CSS, JavaScript, HTTP, and REST APIs as core skills', 1.0
FROM knowledge_nodes n1
CROSS JOIN (
    SELECT id FROM careers WHERE slug = 'frontend-engineer'
) c2
WHERE n1.slug IN ('html-css', 'javascript-basics', 'http-basics');

INSERT INTO knowledge_edges (source_node_id, target_node_id, relationship_type, direction, description, weight)
SELECT c1.id, n2.id, 'requires', 'forward', 'Backend engineers need strong programming, database, and API fundamentals', 1.0
FROM (SELECT id FROM careers WHERE slug = 'backend-engineer') c1
CROSS JOIN knowledge_nodes n2
WHERE n2.slug IN ('variables', 'control-flow', 'functions', 'sql-basics', 'http-basics');
