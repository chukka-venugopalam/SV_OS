-- ============================================================================
-- SV-OS Seed Data: Careers
-- ============================================================================

INSERT INTO careers (slug, title, description, average_salary, demand_level, required_experience, icon, color, is_published) VALUES
('frontend-engineer', 'Frontend Engineer',
 'Build and maintain user interfaces for web applications. Work with HTML, CSS, JavaScript, and modern frameworks like React or Vue to create responsive, accessible, and performant user experiences.',
 '$80,000 - $150,000', 'high_demand', '1-3 years', 'monitor', '#3B82F6', true),

('backend-engineer', 'Backend Engineer',
 'Design and build server-side logic, APIs, and databases. Implement business logic, manage data flow, and ensure scalability and security of web applications.',
 '$85,000 - $160,000', 'high_demand', '2-5 years', 'server', '#10B981', true),

('fullstack-engineer', 'Full Stack Engineer',
 'Work on both frontend and backend components of web applications. Bridge the gap between user interface design and server-side infrastructure.',
 '$90,000 - $170,000', 'high_demand', '2-5 years', 'layers', '#8B5CF6', true),

('data-engineer', 'Data Engineer',
 'Design, build, and maintain data pipelines and infrastructure. Work with large datasets, ETL processes, and data warehousing solutions.',
 '$95,000 - $165,000', 'high_demand', '2-5 years', 'database', '#F59E0B', true),

('ai-engineer', 'AI Engineer',
 'Develop and deploy machine learning models and AI systems. Work with deep learning frameworks, natural language processing, and computer vision.',
 '$120,000 - $200,000', 'high_demand', '3-5 years', 'brain', '#EF4444', true),

('cloud-engineer', 'Cloud Engineer',
 'Design and manage cloud infrastructure on platforms like AWS, GCP, or Azure. Implement CI/CD pipelines, containerization, and infrastructure as code.',
 '$100,000 - $180,000', 'high_demand', '3-5 years', 'cloud', '#06B6D4', true),

('devops-engineer', 'DevOps Engineer',
 'Bridge development and operations by automating deployment, monitoring, and infrastructure management. Ensure reliability and scalability of systems.',
 '$100,000 - $175,000', 'high_demand', '2-5 years', 'refresh-cw', '#EC4899', true),

('security-engineer', 'Security Engineer',
 'Protect systems and data from cyber threats. Implement security measures, conduct penetration testing, and respond to security incidents.',
 '$110,000 - $190,000', 'high_demand', '3-5 years', 'shield', '#DC2626', true),

('mobile-engineer', 'Mobile Engineer',
 'Develop mobile applications for iOS and Android platforms using native (Swift, Kotlin) or cross-platform (React Native, Flutter) frameworks.',
 '$85,000 - $160,000', 'stable', '2-4 years', 'smartphone', '#22C55E', true);
