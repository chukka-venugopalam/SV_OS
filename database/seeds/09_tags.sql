-- ============================================================================
-- SV-OS Seed Data: Tags
-- ============================================================================
-- Foundational tags for categorising knowledge nodes.
-- Tags are free-form (unlike enums) and can be extended on the fly.
-- ============================================================================

INSERT INTO tags (name, description) VALUES

-- Difficulty/Level
('beginner-friendly', 'Suitable for newcomers with no prior experience'),
('intermediate', 'Requires basic understanding of the topic'),
('advanced', 'Assumes solid foundational knowledge'),
('expert-level', 'Advanced material for experienced practitioners'),

-- Content Type
('hands-on', 'Includes practical exercises or tutorials'),
('theoretical', 'Focuses on concepts and theory'),
('project-based', 'Centered around building a project'),
('reference', 'Documentation or reference material'),

-- Topic Tags
('web-development', 'Related to building websites and web applications'),
('data-science', 'Related to data analysis and machine learning'),
('cloud-computing', 'Related to cloud platforms and services'),
('cybersecurity', 'Related to security practices and tools'),
('mobile-development', 'Related to building mobile applications'),
('devops', 'Related to development operations and infrastructure'),
('database', 'Related to database systems and data storage'),
('api-development', 'Related to building and designing APIs'),
('testing', 'Related to software testing practices'),
('performance', 'Related to optimisation and performance tuning'),

-- Format Tags
('video-tutorial', 'Video-based learning content'),
('written-guide', 'Text-based documentation or tutorial'),
('interactive', 'Interactive learning experience'),
('cheatsheet', 'Quick reference summary'),

-- Technology-specific
('python', 'Python programming language content'),
('javascript', 'JavaScript programming language content'),
('typescript', 'TypeScript programming language content'),
('react', 'React framework content'),
('postgresql', 'PostgreSQL database content'),
('docker', 'Docker container content'),
('git', 'Git version control content');
