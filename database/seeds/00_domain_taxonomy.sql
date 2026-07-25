-- ============================================================================
-- SV-OS Seed Data: Canonical Domain Taxonomy
-- ============================================================================
-- Phase 5 audit remediation (Task 4): resolved 42 raw labels into 40 canonical
-- domains with hierarchy, aliases, and stable slugs.  3 collision pairs were
-- resolved by alias rather than duplication.
--
-- The 12 seeded subjects from 01_subjects.sql map onto this taxonomy:
--   computer-science → computer-systems (parent of many)
--   programming → programming-fundamentals
--   data-structures → data-structures
--   algorithms → algorithms
--   computer-networks → computer-networks
--   operating-systems → operating-systems
--   databases → databases
--   software-engineering → software-engineering
--   artificial-intelligence → artificial-intelligence
--   web-development → web-development
--   cybersecurity → cybersecurity
--   cloud-computing → cloud-computing
-- ============================================================================

-- ============================================================================
-- Root-level domains (parent = NULL)
-- ============================================================================
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('computer-systems', 'Computer Systems', '{}', NULL),
('computer-networks', 'Computer Networks', '{"Networks"}', NULL),
('systems', 'Systems', '{"Systems Engineering"}', NULL),
('software-engineering', 'Software Engineering', '{}', NULL),
('web-development', 'Web Development', '{}', NULL),
('artificial-intelligence', 'Artificial Intelligence', '{}', NULL),
('cybersecurity', 'Cybersecurity', '{}', NULL),
('mathematics', 'Mathematics', '{}', NULL),
('programming-fundamentals', 'Programming Fundamentals', '{"Programming"}', NULL),
('data-structures', 'Data Structures', '{}', NULL),
('algorithms', 'Algorithms', '{}', NULL),
('databases', 'Databases', '{}', NULL),
('theory-of-computation', 'Theory of Computation', '{}', NULL),
('compiler-design', 'Compiler Design', '{}', NULL),
('programming-languages', 'Programming Languages', '{}', NULL),
('mobile-development', 'Mobile Development', '{}', NULL),
('game-development', 'Game Development', '{}', NULL),
('embedded-systems', 'Embedded Systems', '{}', NULL),
('computer-graphics', 'Computer Graphics', '{}', NULL),
('high-performance-computing', 'High-Performance Computing', '{"HPC"}', NULL),
('blockchain', 'Blockchain', '{}', NULL),
('quantum-computing', 'Quantum Computing', '{}', NULL),
('hci-ui-ux', 'HCI / UI-UX', '{"Human-Computer Interaction", "UI-UX"}', NULL),
('developer-tooling', 'Developer Tooling', '{}', NULL),
('data-engineering', 'Data Engineering', '{}', NULL),
('career-preparation', 'Career Preparation', '{}', NULL);

-- ============================================================================
-- Child domains (parent references)
-- ============================================================================
-- Under computer-systems
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('digital-logic', 'Digital Logic', '{}', (SELECT id FROM domains WHERE slug = 'computer-systems')),
('computer-architecture', 'Computer Architecture', '{"Computer Organization"}', (SELECT id FROM domains WHERE slug = 'computer-systems')),
('operating-systems', 'Operating Systems', '{"OS"}', (SELECT id FROM domains WHERE slug = 'computer-systems'));

-- Under systems
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('distributed-systems', 'Distributed Systems', '{}', (SELECT id FROM domains WHERE slug = 'systems')),
('cloud-computing', 'Cloud Computing', '{}', (SELECT id FROM domains WHERE slug = 'systems')),
('devops', 'DevOps', '{}', (SELECT id FROM domains WHERE slug = 'systems')),
('system-design', 'System Design', '{}', (SELECT id FROM domains WHERE slug = 'systems'));

-- Under software-engineering
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('object-oriented-programming', 'Object-Oriented Programming', '{"OOP"}', (SELECT id FROM domains WHERE slug = 'software-engineering'));

-- Under web-development
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('browser-engineering', 'Browser Engineering', '{}', (SELECT id FROM domains WHERE slug = 'web-development'));

-- Under artificial-intelligence
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('machine-learning', 'Machine Learning', '{}', (SELECT id FROM domains WHERE slug = 'artificial-intelligence')),
('robotics', 'Robotics', '{}', (SELECT id FROM domains WHERE slug = 'artificial-intelligence'));

-- Under machine-learning
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('deep-learning', 'Deep Learning', '{}', (SELECT id FROM domains WHERE slug = 'machine-learning'));

-- Under deep-learning
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('generative-ai', 'Generative AI', '{}', (SELECT id FROM domains WHERE slug = 'deep-learning'));

-- Under cybersecurity
INSERT INTO domains (slug, display_name, aliases, parent_id) VALUES
('cryptography', 'Cryptography', '{}', (SELECT id FROM domains WHERE slug = 'cybersecurity'));

-- ============================================================================
-- Validation query: returns all domains with their hierarchy path
-- ============================================================================
-- SELECT
--     d.slug,
--     d.display_name,
--     d.aliases,
--     p.display_name AS parent_domain
-- FROM domains d
-- LEFT JOIN domains p ON p.id = d.parent_id
-- ORDER BY p.display_name NULLS FIRST, d.display_name;
