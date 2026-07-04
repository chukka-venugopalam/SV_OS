-- ============================================================================
-- SV-OS Seed Data: Learning Resources
-- ============================================================================

INSERT INTO learning_resources (node_id, title, url, resource_type, platform, is_free, duration_minutes, difficulty) VALUES
-- Python
((SELECT id FROM knowledge_nodes WHERE slug = 'python'), 'Python Official Tutorial', 'https://docs.python.org/3/tutorial/', 'documentation', 'Python.org', true, 480, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'python'), 'CS50P - Python Programming', 'https://cs50.harvard.edu/python/', 'course', 'Harvard', true, 720, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'python'), 'Automate the Boring Stuff with Python', 'https://automatetheboringstuff.com/', 'book', 'Al Sweigart', true, 600, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'python'), 'Python for Everybody', 'https://www.coursera.org/specializations/python', 'course', 'Coursera', false, 480, 'beginner'),

-- JavaScript
((SELECT id FROM knowledge_nodes WHERE slug = 'javascript'), 'MDN JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'documentation', 'MDN', true, 600, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'javascript'), 'JavaScript.info', 'https://javascript.info/', 'article', 'javascript.info', true, 480, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'javascript'), 'Eloquent JavaScript', 'https://eloquentjavascript.net/', 'book', 'Marijn Haverbeke', true, 540, 'beginner'),

-- React
((SELECT id FROM knowledge_nodes WHERE slug = 'react'), 'React Official Docs', 'https://react.dev/learn', 'documentation', 'React', true, 360, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'react'), 'Epic React', 'https://epicreact.dev/', 'course', 'Kent C. Dodds', false, 1200, 'intermediate'),
((SELECT id FROM knowledge_nodes WHERE slug = 'react'), 'React Tutorial for Beginners', 'https://www.youtube.com/watch?v=Ke90Tje7VS0', 'video', 'YouTube', true, 300, 'beginner'),

-- SQL
((SELECT id FROM knowledge_nodes WHERE slug = 'sql'), 'SQL Tutorial - W3Schools', 'https://www.w3schools.com/sql/', 'article', 'W3Schools', true, 240, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'sql'), 'PostgreSQL Tutorial', 'https://www.postgresqltutorial.com/', 'article', 'PostgreSQL Tutorial', true, 360, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'sql'), 'SQL for Data Analysis', 'https://www.youtube.com/watch?v=7mz73uXD9DA', 'video', 'YouTube', true, 240, 'beginner'),

-- Data Structures
((SELECT id FROM knowledge_nodes WHERE slug = 'data-structures'), 'MIT 6.006 - Introduction to Algorithms', 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/', 'course', 'MIT OCW', true, 1440, 'intermediate'),
((SELECT id FROM knowledge_nodes WHERE slug = 'arrays'), 'Array Data Structure Guide', 'https://www.geeksforgeeks.org/array-data-structure/', 'article', 'GeeksforGeeks', true, 120, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'trees'), 'Binary Tree Data Structure', 'https://www.geeksforgeeks.org/binary-tree-data-structure/', 'article', 'GeeksforGeeks', true, 180, 'intermediate'),
((SELECT id FROM knowledge_nodes WHERE slug = 'graphs'), 'Graph Data Structure', 'https://www.geeksforgeeks.org/graph-data-structure-and-algorithms/', 'article', 'GeeksforGeeks', true, 240, 'intermediate'),

-- Algorithms
((SELECT id FROM knowledge_nodes WHERE slug = 'sorting'), 'Sorting Algorithms Visualized', 'https://www.youtube.com/watch?v=lyZQPjUT5B4', 'video', 'YouTube', true, 30, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'dynamic-programming'), 'Dynamic Programming - MIT 6.006', 'https://www.youtube.com/watch?v=OQ5jsbhAv_M', 'video', 'MIT', true, 120, 'advanced'),
((SELECT id FROM knowledge_nodes WHERE slug = 'complexity-analysis'), 'Big O Notation - CS50', 'https://www.youtube.com/watch?v=zUUkiEllHG0', 'video', 'Harvard', true, 45, 'intermediate'),

-- Docker
((SELECT id FROM knowledge_nodes WHERE slug = 'docker'), 'Docker Get Started Guide', 'https://docs.docker.com/get-started/', 'documentation', 'Docker', true, 120, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'docker'), 'Docker Mastery Course', 'https://www.udemy.com/course/docker-mastery/', 'course', 'Udemy', false, 600, 'intermediate'),

-- Git
((SELECT id FROM knowledge_nodes WHERE slug = 'git'), 'Pro Git Book', 'https://git-scm.com/book/en/v2', 'book', 'Git SCM', true, 360, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'git'), 'Git and GitHub for Beginners', 'https://www.youtube.com/watch?v=RGOj5yH7evk', 'video', 'YouTube', true, 60, 'beginner'),

-- Networking
((SELECT id FROM knowledge_nodes WHERE slug = 'tcp-ip'), 'Computer Networking Course - Kunal Kushwaha', 'https://www.youtube.com/watch?v=IPvYjXCsTgY', 'video', 'YouTube', true, 180, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'http-basics'), 'HTTP Crash Course', 'https://www.youtube.com/watch?v=iYM2zFP3Zn0', 'video', 'YouTube', true, 60, 'beginner'),

-- OOP
((SELECT id FROM knowledge_nodes WHERE slug = 'oop'), 'Object-Oriented Programming Concepts', 'https://www.youtube.com/watch?v=SiBw7os-_zI', 'video', 'YouTube', true, 60, 'beginner'),
((SELECT id FROM knowledge_nodes WHERE slug = 'oop'), 'Head First Object-Oriented Analysis and Design', 'https://www.oreilly.com/library/view/head-first-object-oriented/0596008678/', 'book', 'OReilly', false, 480, 'intermediate');
