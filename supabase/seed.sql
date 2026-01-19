-- Create a test user
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create user profile
INSERT INTO public.user_profiles (user_id, full_name)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Test User')
ON CONFLICT (user_id) DO NOTHING;

-- Create default workspace
INSERT INTO public.workspaces (id, name, slug, default_locale, created_by)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'Default Workspace',
  'default-workspace',
  'en',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
) ON CONFLICT (id) DO NOTHING;

-- Add user to workspace
INSERT INTO public.workspace_members (workspace_id, user_id, role)
VALUES (
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'owner'
) ON CONFLICT (workspace_id, user_id) DO NOTHING;
