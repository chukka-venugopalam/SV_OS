-- ============================================================================
-- SV-OS Seed Data: Skills
-- ============================================================================
-- Foundational skills across technology domains.
-- Categories: Programming Language, Database, Cloud, DevOps, Web, AI/ML, Security
-- ============================================================================

INSERT INTO skills (name, description, category, difficulty) VALUES

-- Programming Languages
('Python', 'High-level interpreted language known for readability and versatility', 'Programming Language', 'beginner'),
('JavaScript', 'Lightweight interpreted language for web development', 'Programming Language', 'beginner'),
('TypeScript', 'Typed superset of JavaScript with static typing', 'Programming Language', 'intermediate'),
('Java', 'Object-oriented language for enterprise applications', 'Programming Language', 'intermediate'),
('Go', 'Compiled language for systems programming and cloud services', 'Programming Language', 'intermediate'),
('Rust', 'Systems programming language focused on safety and performance', 'Programming Language', 'advanced'),
('SQL', 'Domain-specific language for relational database management', 'Programming Language', 'beginner'),
('Bash', 'Unix shell and command language for automation', 'Programming Language', 'intermediate'),

-- Web Technologies
('HTML', 'Standard markup language for web documents', 'Web', 'beginner'),
('CSS', 'Style sheet language for web presentation', 'Web', 'beginner'),
('React', 'JavaScript library for building user interfaces', 'Web', 'intermediate'),
('Next.js', 'React framework for production applications', 'Web', 'intermediate'),
('Node.js', 'JavaScript runtime for server-side applications', 'Web', 'intermediate'),
('REST API Design', 'Principles for designing RESTful web APIs', 'Web', 'intermediate'),
('GraphQL', 'Query language for APIs', 'Web', 'intermediate'),
('Tailwind CSS', 'Utility-first CSS framework', 'Web', 'beginner'),
('Docker', 'Container platform for application deployment', 'DevOps', 'intermediate'),
('Kubernetes', 'Container orchestration platform', 'DevOps', 'advanced'),
('CI/CD', 'Continuous integration and deployment practices', 'DevOps', 'intermediate'),
('Git', 'Distributed version control system', 'DevOps', 'beginner'),
('Terraform', 'Infrastructure as code tool', 'DevOps', 'advanced'),
('Linux Administration', 'Managing and configuring Linux systems', 'DevOps', 'intermediate'),

-- Databases
('PostgreSQL', 'Advanced open-source relational database', 'Database', 'intermediate'),
('MongoDB', 'Document-oriented NoSQL database', 'Database', 'intermediate'),
('Redis', 'In-memory data structure store', 'Database', 'intermediate'),
('Database Design', 'Structuring data for application requirements', 'Database', 'intermediate'),
('Query Optimization', 'Improving database query performance', 'Database', 'advanced'),

-- Cloud
('AWS', 'Amazon Web Services cloud platform', 'Cloud', 'advanced'),
('Google Cloud', 'Google Cloud Platform services', 'Cloud', 'advanced'),
('Azure', 'Microsoft Azure cloud platform', 'Cloud', 'advanced'),
('Serverless Architecture', 'Event-driven cloud computing model', 'Cloud', 'advanced'),
('Cloud Security', 'Securing cloud infrastructure and data', 'Cloud', 'advanced'),

-- AI/ML
('Machine Learning', 'Building predictive models from data', 'AI/ML', 'advanced'),
('Deep Learning', 'Neural network-based machine learning', 'AI/ML', 'advanced'),
('Natural Language Processing', 'Processing and analyzing text data', 'AI/ML', 'advanced'),
('Data Analysis', 'Extracting insights from structured data', 'AI/ML', 'intermediate'),

-- Security
('Network Security', 'Protecting network infrastructure', 'Security', 'intermediate'),
('Application Security', 'Securing software applications', 'Security', 'intermediate'),
('Cryptography', 'Secure communication techniques', 'Security', 'advanced'),
('Penetration Testing', 'Security assessment methodology', 'Security', 'advanced'),

-- Soft Skills
('System Design', 'Designing scalable distributed systems', 'Soft Skill', 'advanced'),
('Technical Communication', 'Explaining technical concepts clearly', 'Soft Skill', 'beginner'),
('Agile Methodologies', 'Iterative software development practices', 'Soft Skill', 'beginner'),
('Code Review', 'Systematic peer code examination', 'Soft Skill', 'intermediate');
