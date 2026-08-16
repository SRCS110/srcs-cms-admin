-- ============================================================
-- Example seed data — one demo client site with 3 pages and a
-- few content blocks. Safe to delete once you understand the shape.
-- Replace <YOUR_AUTH_USER_UUID> with a real auth.users.id
-- (Supabase Dashboard -> Authentication -> Users -> copy UID).
-- ============================================================

insert into sites (id, slug, name, domain, status)
values ('00000000-0000-0000-0000-000000000001', 'demo-client', 'Demo Client Co.', 'demo.example.com', 'active');

insert into site_users (site_id, user_id, role)
values ('00000000-0000-0000-0000-000000000001', '<YOUR_AUTH_USER_UUID>', 'owner');

insert into pages (id, site_id, slug, title, meta_description)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'index', 'Home', 'Welcome to Demo Client Co.'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'about', 'About Us', 'Learn about Demo Client Co.'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000001', 'contact', 'Contact', 'Get in touch with Demo Client Co.');

insert into content_blocks (page_id, block_key, block_type, content, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', 'hero_heading', 'text', 'Welcome to Demo Client Co.', 1),
  ('00000000-0000-0000-0000-000000000101', 'hero_body', 'richtext', '<p>We build great things.</p>', 2),
  ('00000000-0000-0000-0000-000000000102', 'about_body', 'richtext', '<p>Our story goes here.</p>', 1),
  ('00000000-0000-0000-0000-000000000103', 'contact_email', 'text', 'hello@democlient.com', 1);
