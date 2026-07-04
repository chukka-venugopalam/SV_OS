-- ============================================================================
-- SV-OS Seed Data: Projects
-- ============================================================================

INSERT INTO projects (slug, title, description, difficulty, estimated_hours, tech_stack, icon, color, is_published) VALUES
('personal-website', 'Personal Portfolio Website',
 'Build a personal portfolio website to showcase your projects, skills, and experience. Implement responsive design and smooth animations.',
 'beginner', 20, ARRAY['HTML', 'CSS', 'JavaScript', 'React'], 'user', '#3B82F6', true),

('task-manager', 'Task Manager App',
 'A full-stack task management application with CRUD operations, user authentication, drag-and-drop task organization, and real-time updates.',
 'intermediate', 40, ARRAY['React', 'Node.js', 'PostgreSQL', 'Socket.io'], 'check-square', '#10B981', true),

('url-shortener', 'URL Shortener',
 'Build a URL shortening service similar to Bit.ly with custom aliases, click tracking, analytics dashboard, and QR code generation.',
 'intermediate', 30, ARRAY['Python', 'FastAPI', 'Redis', 'PostgreSQL'], 'link', '#8B5CF6', true),

('chat-app', 'Real-time Chat Application',
 'A real-time messaging application with private and group chats, message history, file sharing, typing indicators, and online status.',
 'intermediate', 45, ARRAY['React', 'Node.js', 'Socket.io', 'MongoDB'], 'message-square', '#F59E0B', true),

('ecommerce-api', 'E-Commerce API',
 'Design and implement a RESTful API for an e-commerce platform with product management, cart, checkout, payment processing, and order tracking.',
 'intermediate', 50, ARRAY['FastAPI', 'PostgreSQL', 'Stripe', 'Redis'], 'shopping-cart', '#EF4444', true),

('netflix-clone', 'Netflix Clone',
 'Build a streaming platform clone with user authentication, video catalog browsing, search, watch history, and responsive video player.',
 'advanced', 80, ARRAY['React', 'Next.js', 'Node.js', 'PostgreSQL', 'AWS S3'], 'film', '#DC2626', true),

('social-media-dashboard', 'Social Media Analytics Dashboard',
 'Create a dashboard for visualizing social media metrics with interactive charts, custom date ranges, export functionality, and real-time data updates.',
 'advanced', 60, ARRAY['React', 'D3.js', 'FastAPI', 'PostgreSQL', 'Redis'], 'bar-chart', '#06B6D4', true),

('docker-voting-app', 'Docker Voting Application',
 'A distributed voting application demonstrating containerization with multiple services: vote UI, worker, result UI, and message queue.',
 'advanced', 25, ARRAY['Python', 'Node.js', 'Docker', 'Redis', 'PostgreSQL'], 'check-square', '#2496ED', true),

('machine-learning-pipeline', 'ML Pipeline Orchestrator',
 'Build a machine learning pipeline that automates data preprocessing, model training, evaluation, and deployment with experiment tracking.',
 'advanced', 70, ARRAY['Python', 'FastAPI', 'Docker', 'MLflow', 'PostgreSQL'], 'git-branch', '#EC4899', true),

('api-gateway', 'API Gateway Service',
 'Implement an API gateway with rate limiting, authentication, request routing, caching, and logging for microservices architecture.',
 'advanced', 55, ARRAY['FastAPI', 'Redis', 'Docker', 'PostgreSQL'], 'shield', '#22C55E', true);
