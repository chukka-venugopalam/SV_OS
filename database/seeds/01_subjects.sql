-- ============================================================================
-- SV-OS Seed Data: Subjects
-- ============================================================================
-- These are top-level academic subjects in Computer Science.
-- ============================================================================

INSERT INTO knowledge_nodes (slug, title, description, node_type, difficulty, estimated_minutes, icon, color, is_published) VALUES
('computer-science', 'Computer Science',
 'The study of computers, computational systems, and the theoretical foundations of information and computation.',
 'subject', 'beginner', 60, 'monitor', '#8B5CF6', true),

('programming', 'Programming',
 'The process of designing and building executable computer programs to accomplish specific computing tasks.',
 'subject', 'beginner', 60, 'code', '#8B5CF6', true),

('data-structures', 'Data Structures',
 'Ways of organizing and storing data in a computer so that it can be accessed and modified efficiently.',
 'subject', 'intermediate', 120, 'database', '#8B5CF6', true),

('algorithms', 'Algorithms',
 'Step-by-step procedures or formulas for solving problems, including analysis of time and space complexity.',
 'subject', 'intermediate', 120, 'git-branch', '#8B5CF6', true),

('computer-networks', 'Computer Networks',
 'The study of how computers communicate with each other through interconnected devices and protocols.',
 'subject', 'intermediate', 90, 'wifi', '#8B5CF6', true),

('operating-systems', 'Operating Systems',
 'Software that manages computer hardware resources and provides common services for computer programs.',
 'subject', 'advanced', 120, 'hard-drive', '#8B5CF6', true),

('databases', 'Databases',
 'Organized collections of data stored and accessed electronically, including design, querying, and management.',
 'subject', 'intermediate', 90, 'database', '#8B5CF6', true),

('software-engineering', 'Software Engineering',
 'The systematic application of engineering approaches to the development of software systems.',
 'subject', 'intermediate', 90, 'layers', '#8B5CF6', true),

('artificial-intelligence', 'Artificial Intelligence',
 'The simulation of human intelligence processes by computer systems, including learning, reasoning, and problem-solving.',
 'subject', 'advanced', 180, 'brain', '#8B5CF6', true),

('web-development', 'Web Development',
 'The work involved in developing websites and web applications for the Internet or intranet.',
 'subject', 'beginner', 60, 'globe', '#8B5CF6', true),

('cybersecurity', 'Cybersecurity',
 'The practice of protecting systems, networks, and programs from digital attacks and unauthorized access.',
 'subject', 'intermediate', 120, 'shield', '#8B5CF6', true),

('cloud-computing', 'Cloud Computing',
 'The delivery of computing services including servers, storage, databases, networking, and software over the Internet.',
 'subject', 'intermediate', 90, 'cloud', '#8B5CF6', true);
