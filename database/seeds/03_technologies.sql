-- ============================================================================
-- SV-OS Seed Data: Technologies
-- ============================================================================

INSERT INTO knowledge_nodes (slug, title, description, node_type, difficulty, estimated_minutes, icon, color, is_published) VALUES
('python', 'Python',
 'A high-level, interpreted programming language known for its readability and versatility in web development, data science, and automation.',
 'technology', 'beginner', 120, 'python', '#3776AB', true),

('javascript', 'JavaScript',
 'A lightweight, interpreted programming language primarily used for web development to create interactive frontend experiences.',
 'technology', 'beginner', 120, 'javascript', '#F7DF1E', true),

('typescript', 'TypeScript',
 'A typed superset of JavaScript that compiles to plain JavaScript, adding static typing and enhanced tooling.',
 'technology', 'intermediate', 90, 'typescript', '#3178C6', true),

('react', 'React',
 'A JavaScript library for building user interfaces with a component-based architecture and declarative programming model.',
 'technology', 'intermediate', 120, 'react', '#61DAFB', true),

('nextjs', 'Next.js',
 'A React framework providing server-side rendering, static site generation, and full-stack capabilities.',
 'technology', 'intermediate', 90, 'nextjs', '#000000', true),

('nodejs', 'Node.js',
 'A JavaScript runtime built on Chrome V8 engine for building scalable server-side applications.',
 'technology', 'intermediate', 90, 'nodejs', '#339933', true),

('postgresql', 'PostgreSQL',
 'An advanced, open-source relational database management system known for reliability, feature robustness, and performance.',
 'technology', 'intermediate', 120, 'postgresql', '#336791', true),

('docker', 'Docker',
 'A platform for developing, shipping, and running applications in containers for consistency across environments.',
 'technology', 'intermediate', 90, 'docker', '#2496ED', true),

('git', 'Git',
 'A distributed version control system for tracking changes in source code during software development.',
 'technology', 'beginner', 60, 'git', '#F05032', true),

('sql', 'SQL',
 'A domain-specific language for managing and querying relational databases.',
 'technology', 'beginner', 90, 'terminal', '#CC2927', true),

('fastapi', 'FastAPI',
 'A modern, fast web framework for building APIs with Python, based on standard Python type hints.',
 'technology', 'intermediate', 60, 'zap', '#009688', true),

('tailwind', 'Tailwind CSS',
 'A utility-first CSS framework for rapidly building custom user interfaces with a design system approach.',
 'technology', 'beginner', 60, 'palette', '#06B6D4', true),

('redis', 'Redis',
 'An in-memory data structure store used as a database, cache, and message broker for high-performance applications.',
 'technology', 'intermediate', 60, 'database', '#DC382D', true),

('aws', 'Amazon Web Services',
 'A comprehensive cloud computing platform offering compute, storage, database, and machine learning services.',
 'technology', 'advanced', 180, 'cloud', '#FF9900', true),

('kubernetes', 'Kubernetes',
 'An open-source container orchestration platform for automating deployment, scaling, and management of containerized applications.',
 'technology', 'advanced', 120, 'refresh-cw', '#326CE5', true),

('graphql', 'GraphQL',
 'A query language for APIs that allows clients to request exactly the data they need.',
 'technology', 'intermediate', 60, 'share-2', '#E535AB', true),

('mongodb', 'MongoDB',
 'A document-oriented NoSQL database for building modern applications with flexible, JSON-like schemas.',
 'technology', 'intermediate', 90, 'database', '#47A248', true);
