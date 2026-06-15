-- =====================================================
-- FitStudio Pro - Seed Exercise Library
-- =====================================================
-- This file is executed automatically when running:
-- npx supabase db reset

insert into public.exercises (
  name,
  muscle_group,
  equipment,
  difficulty
)
values
  -- Chest
  ('Push Up', 'Chest', 'Bodyweight', 'beginner'),
  ('Knee Push Up', 'Chest', 'Bodyweight', 'beginner'),
  ('Bench Press', 'Chest', 'Barbell', 'intermediate'),
  ('Incline Bench Press', 'Chest', 'Barbell', 'intermediate'),
  ('Decline Bench Press', 'Chest', 'Barbell', 'intermediate'),
  ('Dumbbell Bench Press', 'Chest', 'Dumbbells', 'intermediate'),
  ('Incline Dumbbell Press', 'Chest', 'Dumbbells', 'intermediate'),
  ('Dumbbell Fly', 'Chest', 'Dumbbells', 'beginner'),
  ('Chest Fly Machine', 'Chest', 'Machine', 'beginner'),
  ('Cable Chest Fly', 'Chest', 'Cable', 'intermediate'),
  ('Dips', 'Chest', 'Bodyweight', 'intermediate'),

  -- Back
  ('Pull Up', 'Back', 'Bodyweight', 'intermediate'),
  ('Assisted Pull Up', 'Back', 'Machine', 'beginner'),
  ('Chin Up', 'Back', 'Bodyweight', 'intermediate'),
  ('Lat Pulldown', 'Back', 'Machine', 'beginner'),
  ('Close Grip Lat Pulldown', 'Back', 'Machine', 'beginner'),
  ('Barbell Row', 'Back', 'Barbell', 'intermediate'),
  ('Dumbbell Row', 'Back', 'Dumbbells', 'beginner'),
  ('Seated Cable Row', 'Back', 'Cable', 'beginner'),
  ('T-Bar Row', 'Back', 'Machine', 'intermediate'),
  ('Straight Arm Pulldown', 'Back', 'Cable', 'beginner'),
  ('Back Extension', 'Back', 'Bodyweight', 'beginner'),

  -- Legs
  ('Bodyweight Squat', 'Legs', 'Bodyweight', 'beginner'),
  ('Goblet Squat', 'Legs', 'Dumbbell', 'beginner'),
  ('Back Squat', 'Legs', 'Barbell', 'intermediate'),
  ('Front Squat', 'Legs', 'Barbell', 'advanced'),
  ('Leg Press', 'Legs', 'Machine', 'beginner'),
  ('Walking Lunge', 'Legs', 'Bodyweight', 'beginner'),
  ('Dumbbell Lunge', 'Legs', 'Dumbbells', 'intermediate'),
  ('Bulgarian Split Squat', 'Legs', 'Dumbbells', 'intermediate'),
  ('Leg Extension', 'Legs', 'Machine', 'beginner'),
  ('Leg Curl', 'Legs', 'Machine', 'beginner'),
  ('Romanian Deadlift', 'Legs', 'Barbell', 'intermediate'),
  ('Deadlift', 'Legs', 'Barbell', 'advanced'),
  ('Hip Thrust', 'Legs', 'Barbell', 'intermediate'),
  ('Glute Bridge', 'Legs', 'Bodyweight', 'beginner'),
  ('Standing Calf Raise', 'Legs', 'Machine', 'beginner'),
  ('Seated Calf Raise', 'Legs', 'Machine', 'beginner'),

  -- Shoulders
  ('Dumbbell Shoulder Press', 'Shoulders', 'Dumbbells', 'intermediate'),
  ('Barbell Overhead Press', 'Shoulders', 'Barbell', 'intermediate'),
  ('Arnold Press', 'Shoulders', 'Dumbbells', 'intermediate'),
  ('Lateral Raise', 'Shoulders', 'Dumbbells', 'beginner'),
  ('Front Raise', 'Shoulders', 'Dumbbells', 'beginner'),
  ('Rear Delt Fly', 'Shoulders', 'Dumbbells', 'beginner'),
  ('Face Pull', 'Shoulders', 'Cable', 'beginner'),
  ('Upright Row', 'Shoulders', 'Barbell', 'intermediate'),
  ('Shrugs', 'Shoulders', 'Dumbbells', 'beginner'),

  -- Arms
  ('Bicep Curl', 'Arms', 'Dumbbells', 'beginner'),
  ('Barbell Curl', 'Arms', 'Barbell', 'beginner'),
  ('Hammer Curl', 'Arms', 'Dumbbells', 'beginner'),
  ('Preacher Curl', 'Arms', 'Machine', 'intermediate'),
  ('Cable Curl', 'Arms', 'Cable', 'beginner'),
  ('Tricep Pushdown', 'Arms', 'Cable', 'beginner'),
  ('Overhead Tricep Extension', 'Arms', 'Dumbbell', 'beginner'),
  ('Skull Crusher', 'Arms', 'Barbell', 'intermediate'),
  ('Close Grip Bench Press', 'Arms', 'Barbell', 'intermediate'),
  ('Bench Dip', 'Arms', 'Bodyweight', 'beginner'),

  -- Core
  ('Plank', 'Core', 'Bodyweight', 'beginner'),
  ('Side Plank', 'Core', 'Bodyweight', 'beginner'),
  ('Crunch', 'Core', 'Bodyweight', 'beginner'),
  ('Bicycle Crunch', 'Core', 'Bodyweight', 'beginner'),
  ('Reverse Crunch', 'Core', 'Bodyweight', 'beginner'),
  ('Russian Twist', 'Core', 'Bodyweight', 'beginner'),
  ('Mountain Climber', 'Core', 'Bodyweight', 'beginner'),
  ('Dead Bug', 'Core', 'Bodyweight', 'beginner'),
  ('Hanging Leg Raise', 'Core', 'Bodyweight', 'intermediate'),
  ('Cable Woodchopper', 'Core', 'Cable', 'intermediate'),
  ('Ab Wheel Rollout', 'Core', 'Bodyweight', 'advanced'),

  -- Cardio
  ('Treadmill Walk', 'Cardio', 'Machine', 'beginner'),
  ('Treadmill Run', 'Cardio', 'Machine', 'beginner'),
  ('Stationary Bike', 'Cardio', 'Machine', 'beginner'),
  ('Rowing Machine', 'Cardio', 'Machine', 'intermediate'),
  ('Elliptical', 'Cardio', 'Machine', 'beginner'),
  ('Jump Rope', 'Cardio', 'Bodyweight', 'intermediate'),
  ('Burpee', 'Cardio', 'Bodyweight', 'intermediate'),
  ('High Knees', 'Cardio', 'Bodyweight', 'beginner'),
  ('Jumping Jacks', 'Cardio', 'Bodyweight', 'beginner'),

  -- Full Body
  ('Kettlebell Swing', 'Full Body', 'Kettlebell', 'intermediate'),
  ('Clean and Press', 'Full Body', 'Barbell', 'advanced'),
  ('Dumbbell Thruster', 'Full Body', 'Dumbbells', 'intermediate'),
  ('Medicine Ball Slam', 'Full Body', 'Medicine Ball', 'beginner'),
  ('Battle Ropes', 'Full Body', 'Ropes', 'intermediate'),
  ('Farmer Carry', 'Full Body', 'Dumbbells', 'beginner'),
  ('Sled Push', 'Full Body', 'Sled', 'intermediate'),

  -- Mobility
  ('Cat Cow Stretch', 'Mobility', 'Bodyweight', 'beginner'),
  ('Worlds Greatest Stretch', 'Mobility', 'Bodyweight', 'beginner'),
  ('Hip Flexor Stretch', 'Mobility', 'Bodyweight', 'beginner'),
  ('Hamstring Stretch', 'Mobility', 'Bodyweight', 'beginner'),
  ('Shoulder Dislocation', 'Mobility', 'Band', 'beginner'),
  ('Thoracic Rotation', 'Mobility', 'Bodyweight', 'beginner');

-- =====================================================
-- FitStudio Pro - Demo Data
-- =====================================================
-- Seeds a demo studio with an owner, two trainers, and eight clients for
-- local development, sales demos, and onboarding QA. All seeded auth users
-- share the password 'Demo@1234'.
--
-- The handle_new_user() trigger (see
-- 20260523103847_auto_create_profile_on_signup.sql) auto-creates the
-- matching public.profiles row for each auth.users insert below.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'owner@demo.fitstudiopro.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dana Owner"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'trainer1@demo.fitstudiopro.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Tariq Trainer"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'trainer2@demo.fitstudiopro.com', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Nadia Trainer"}', now(), now(), '', '', '', '');

insert into auth.identities (
  provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  u.id::text,
  u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email',
  now(), now(), now()
from auth.users u
where u.id in (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003'
);

-- ---- Studio ----

insert into public.studios (id, owner_id, name, slug, description)
values (
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Demo Fitness Studio',
  'demo-fitness-studio',
  'Sample studio with demo trainers and clients for local development and onboarding QA.'
);

insert into public.studio_members (studio_id, user_id, role)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'owner'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'trainer'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'trainer');

-- ---- Clients ----

insert into public.clients (id, studio_id, trainer_id, full_name, email, status, goal, notes, joined_at)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Ali Hassan', 'ali.hassan@example.com', 'active', 'Build muscle', 'Prefers evening sessions.', current_date - 60),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Sara Ahmed', 'sara.ahmed@example.com', 'active', 'Lose weight', 'Vegetarian diet.', current_date - 45),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Omar Khalid', 'omar.khalid@example.com', 'active', 'Improve endurance', 'Training for a 10k.', current_date - 30),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Layla Youssef', 'layla.youssef@example.com', 'paused', 'General fitness', 'Paused while travelling.', current_date - 90),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Mona Saeed', 'mona.saeed@example.com', 'active', 'Strength training', 'Focus on compound lifts.', current_date - 50),
  ('30000000-0000-0000-0000-000000000006', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Khalid Naser', 'khalid.naser@example.com', 'active', 'Lose weight', 'Knee injury - avoid high impact.', current_date - 20),
  ('30000000-0000-0000-0000-000000000007', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Rana Fathy', 'rana.fathy@example.com', 'active', 'Marathon prep', 'Long runs on weekends.', current_date - 15),
  ('30000000-0000-0000-0000-000000000008', '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Tarek Aziz', 'tarek.aziz@example.com', 'cancelled', 'Rehab', 'Cancelled membership.', current_date - 100);

-- ---- Workout plans ----

insert into public.workout_plans (id, studio_id, client_id, trainer_id, title, description, start_date, status)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '8-Week Hypertrophy Program', 'Progressive overload split focused on muscle growth.', current_date - 56, 'active'),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Fat Loss Kickstart', 'Full-body circuits with cardio finishers.', current_date - 42, 'active'),
  ('40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003', 'Strength Foundations', 'Compound lift progressions: squat, bench, deadlift, overhead press.', current_date - 49, 'active'),
  ('40000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003', 'Low-Impact Fat Loss', 'Joint-friendly conditioning and strength work.', current_date - 18, 'active');

-- ---- Workout days ----

insert into public.workout_days (id, workout_plan_id, day_number, title, notes)
values
  ('41000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 1, 'Upper Body Push', 'Chest, shoulders, triceps.'),
  ('41000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 2, 'Lower Body', 'Quads, hamstrings, glutes.'),
  ('41000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 1, 'Full Body Circuit A', 'Keep rest under 60 seconds between exercises.'),
  ('41000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 2, 'Full Body Circuit B', 'Finish with a 10 minute incline walk.'),
  ('41000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 1, 'Squat Day', 'Work up to a top set of 5.'),
  ('41000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 2, 'Bench & Overhead Press Day', 'Focus on bar path and lockout.'),
  ('41000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004', 1, 'Low-Impact Full Body', 'Avoid jumping or high-impact movements.'),
  ('41000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000004', 2, 'Mobility & Core', 'Slow, controlled tempo throughout.');

-- ---- Workout items ----

insert into public.workout_items (workout_day_id, exercise_id, sets, reps, target_weight, rest_seconds)
values
  -- 8-Week Hypertrophy Program / Upper Body Push
  ('41000000-0000-0000-0000-000000000001', (select id from public.exercises where name = 'Bench Press'), 4, '8-10', '60kg', 90),
  ('41000000-0000-0000-0000-000000000001', (select id from public.exercises where name = 'Incline Dumbbell Press'), 3, '10-12', '22kg', 75),
  ('41000000-0000-0000-0000-000000000001', (select id from public.exercises where name = 'Dumbbell Shoulder Press'), 3, '10-12', '16kg', 75),
  ('41000000-0000-0000-0000-000000000001', (select id from public.exercises where name = 'Tricep Pushdown'), 3, '12-15', '25kg', 60),
  -- 8-Week Hypertrophy Program / Lower Body
  ('41000000-0000-0000-0000-000000000002', (select id from public.exercises where name = 'Back Squat'), 4, '8', '80kg', 120),
  ('41000000-0000-0000-0000-000000000002', (select id from public.exercises where name = 'Romanian Deadlift'), 3, '10', '60kg', 90),
  ('41000000-0000-0000-0000-000000000002', (select id from public.exercises where name = 'Leg Press'), 3, '12', '100kg', 75),
  ('41000000-0000-0000-0000-000000000002', (select id from public.exercises where name = 'Standing Calf Raise'), 3, '15', '40kg', 45),
  -- Fat Loss Kickstart / Full Body Circuit A
  ('41000000-0000-0000-0000-000000000003', (select id from public.exercises where name = 'Goblet Squat'), 3, '15', '16kg', 45),
  ('41000000-0000-0000-0000-000000000003', (select id from public.exercises where name = 'Dumbbell Row'), 3, '12', '14kg', 45),
  ('41000000-0000-0000-0000-000000000003', (select id from public.exercises where name = 'Push Up'), 3, '12', null, 45),
  ('41000000-0000-0000-0000-000000000003', (select id from public.exercises where name = 'Mountain Climber'), 3, '30 sec', null, 30),
  -- Fat Loss Kickstart / Full Body Circuit B
  ('41000000-0000-0000-0000-000000000004', (select id from public.exercises where name = 'Kettlebell Swing'), 3, '15', '12kg', 45),
  ('41000000-0000-0000-0000-000000000004', (select id from public.exercises where name = 'Walking Lunge'), 3, '12', null, 45),
  ('41000000-0000-0000-0000-000000000004', (select id from public.exercises where name = 'Plank'), 3, '45 sec', null, 30),
  ('41000000-0000-0000-0000-000000000004', (select id from public.exercises where name = 'Jump Rope'), 3, '60 sec', null, 30),
  -- Strength Foundations / Squat Day
  ('41000000-0000-0000-0000-000000000005', (select id from public.exercises where name = 'Back Squat'), 5, '5', '70kg', 150),
  ('41000000-0000-0000-0000-000000000005', (select id from public.exercises where name = 'Romanian Deadlift'), 3, '8', '50kg', 90),
  ('41000000-0000-0000-0000-000000000005', (select id from public.exercises where name = 'Leg Curl'), 3, '12', '30kg', 60),
  ('41000000-0000-0000-0000-000000000005', (select id from public.exercises where name = 'Plank'), 3, '60 sec', null, 45),
  -- Strength Foundations / Bench & Overhead Press Day
  ('41000000-0000-0000-0000-000000000006', (select id from public.exercises where name = 'Bench Press'), 5, '5', '45kg', 150),
  ('41000000-0000-0000-0000-000000000006', (select id from public.exercises where name = 'Barbell Overhead Press'), 4, '6', '30kg', 120),
  ('41000000-0000-0000-0000-000000000006', (select id from public.exercises where name = 'Barbell Row'), 3, '8', '40kg', 90),
  ('41000000-0000-0000-0000-000000000006', (select id from public.exercises where name = 'Face Pull'), 3, '15', '15kg', 45),
  -- Low-Impact Fat Loss / Low-Impact Full Body
  ('41000000-0000-0000-0000-000000000007', (select id from public.exercises where name = 'Leg Press'), 3, '12', '60kg', 60),
  ('41000000-0000-0000-0000-000000000007', (select id from public.exercises where name = 'Seated Cable Row'), 3, '12', '35kg', 60),
  ('41000000-0000-0000-0000-000000000007', (select id from public.exercises where name = 'Chest Fly Machine'), 3, '12', '20kg', 60),
  ('41000000-0000-0000-0000-000000000007', (select id from public.exercises where name = 'Stationary Bike'), null, '15 min', null, 0),
  -- Low-Impact Fat Loss / Mobility & Core
  ('41000000-0000-0000-0000-000000000008', (select id from public.exercises where name = 'Cat Cow Stretch'), 2, '10', null, 30),
  ('41000000-0000-0000-0000-000000000008', (select id from public.exercises where name = 'Dead Bug'), 3, '12', null, 30),
  ('41000000-0000-0000-0000-000000000008', (select id from public.exercises where name = 'Side Plank'), 3, '30 sec', null, 30),
  ('41000000-0000-0000-0000-000000000008', (select id from public.exercises where name = 'Hip Flexor Stretch'), 2, '30 sec', null, 15);

-- ---- Workout logs ----

insert into public.workout_logs (client_id, workout_day_id, completed_at, difficulty_rating, feedback)
values
  ('30000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', now() - interval '13 days', 7, 'Felt strong on bench, hit a new rep PR.'),
  ('30000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000002', now() - interval '11 days', 8, 'Legs were sore from the last session but pushed through.'),
  ('30000000-0000-0000-0000-000000000001', '41000000-0000-0000-0000-000000000001', now() - interval '6 days', 6, 'Lighter session, low on sleep.'),
  ('30000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000003', now() - interval '10 days', 5, 'Circuit was tough but manageable.'),
  ('30000000-0000-0000-0000-000000000002', '41000000-0000-0000-0000-000000000004', now() - interval '3 days', 6, 'Good energy, finished the full circuit.'),
  ('30000000-0000-0000-0000-000000000005', '41000000-0000-0000-0000-000000000005', now() - interval '9 days', 8, 'New squat top set at 70kg for 5.'),
  ('30000000-0000-0000-0000-000000000005', '41000000-0000-0000-0000-000000000006', now() - interval '4 days', 7, 'Bench felt heavy but form was solid.');

-- ---- Sessions ----

insert into public.sessions (studio_id, trainer_id, client_id, start_time, end_time, status, notes)
values
  -- Trainer 1 (Tariq) history
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', current_date - 21 + time '09:00', current_date - 21 + time '10:00', 'completed', 'Upper body push session.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', current_date - 14 + time '10:00', current_date - 14 + time '11:00', 'completed', 'Full body circuit A.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000003', current_date - 12 + time '09:00', current_date - 12 + time '10:00', 'no_show', 'Client did not show up, no message.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', current_date - 7 + time '09:00', current_date - 7 + time '10:00', 'completed', 'Lower body session.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', current_date - 5 + time '14:00', current_date - 5 + time '15:00', 'cancelled', 'Client requested to cancel - travelling.'),
  -- Trainer 1 (Tariq) upcoming
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', current_date + 1 + time '09:00', current_date + 1 + time '10:00', 'scheduled', null),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', current_date + 3 + time '10:00', current_date + 3 + time '11:00', 'scheduled', null),
  -- Trainer 2 (Nadia) history
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', current_date - 20 + time '09:00', current_date - 20 + time '10:00', 'completed', 'Squat day, new top set.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', current_date - 13 + time '11:00', current_date - 13 + time '12:00', 'completed', 'Low-impact full body session.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', current_date - 9 + time '08:00', current_date - 9 + time '09:00', 'completed', 'Long run prep and mobility work.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000005', current_date - 6 + time '09:00', current_date - 6 + time '10:00', 'completed', 'Bench and overhead press day.'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000008', current_date - 4 + time '15:00', current_date - 4 + time '16:00', 'no_show', 'No response after multiple reminders.'),
  -- Trainer 2 (Nadia) upcoming
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000006', current_date + 1 + time '11:00', current_date + 1 + time '12:00', 'scheduled', null),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000007', current_date + 2 + time '08:00', current_date + 2 + time '09:00', 'scheduled', null);

-- ---- Check-ins ----

insert into public.check_ins (client_id, weight, mood, energy_level, sleep_hours, notes, created_at)
values
  ('30000000-0000-0000-0000-000000000001', 78.5, 7, 7, 7.0, 'Feeling good, strength going up.', now() - interval '28 days'),
  ('30000000-0000-0000-0000-000000000001', 78.8, 8, 8, 7.5, 'Great week, hit a new bench PR.', now() - interval '21 days'),
  ('30000000-0000-0000-0000-000000000001', 79.2, 7, 7, 6.5, 'Slightly less sleep this week.', now() - interval '14 days'),
  ('30000000-0000-0000-0000-000000000001', 79.6, 8, 8, 7.0, 'Back on track with sleep.', now() - interval '7 days'),

  ('30000000-0000-0000-0000-000000000002', 82.0, 6, 6, 6.0, 'Adjusting to the new meal plan.', now() - interval '28 days'),
  ('30000000-0000-0000-0000-000000000002', 81.2, 7, 7, 6.5, 'Down almost a kilo, feeling motivated.', now() - interval '21 days'),
  ('30000000-0000-0000-0000-000000000002', 80.5, 7, 8, 7.0, 'Energy levels improving.', now() - interval '14 days'),
  ('30000000-0000-0000-0000-000000000002', 79.8, 8, 8, 7.5, 'Steady progress, clothes fitting looser.', now() - interval '7 days'),

  ('30000000-0000-0000-0000-000000000005', 65.0, 8, 8, 7.5, 'Strength steadily improving.', now() - interval '28 days'),
  ('30000000-0000-0000-0000-000000000005', 65.2, 8, 7, 7.0, 'Busy week at work, still got sessions in.', now() - interval '21 days'),
  ('30000000-0000-0000-0000-000000000005', 65.0, 9, 9, 8.0, 'Best week so far, hit a new squat PR.', now() - interval '14 days'),
  ('30000000-0000-0000-0000-000000000005', 65.4, 8, 8, 7.5, 'Consistent and feeling strong.', now() - interval '7 days'),

  ('30000000-0000-0000-0000-000000000006', 95.0, 5, 5, 5.5, 'Knee still a bit sore, kept it low impact.', now() - interval '19 days'),
  ('30000000-0000-0000-0000-000000000006', 94.0, 6, 6, 6.0, 'Knee feeling better, good progress.', now() - interval '12 days'),
  ('30000000-0000-0000-0000-000000000006', 93.2, 6, 6, 6.5, 'Down two kilos total, staying consistent.', now() - interval '5 days');

-- ---- Measurements ----

insert into public.measurements (client_id, weight, waist, chest, arms, legs, created_at)
values
  ('30000000-0000-0000-0000-000000000001', 78.0, 82.0, 102.0, 35.0, 58.0, now() - interval '56 days'),
  ('30000000-0000-0000-0000-000000000001', 78.6, 82.5, 103.0, 35.5, 58.5, now() - interval '28 days'),
  ('30000000-0000-0000-0000-000000000001', 79.6, 83.0, 104.0, 36.0, 59.0, now() - interval '7 days'),

  ('30000000-0000-0000-0000-000000000002', 83.5, 88.0, 96.0, 30.0, 56.0, now() - interval '42 days'),
  ('30000000-0000-0000-0000-000000000002', 81.5, 85.5, 95.0, 29.5, 55.0, now() - interval '21 days'),
  ('30000000-0000-0000-0000-000000000002', 79.8, 83.0, 94.0, 29.0, 54.0, now() - interval '7 days');

-- ---- Trainer availability ----

insert into public.trainer_availability (studio_id, trainer_id, day_of_week, start_time, end_time)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 1, '09:00', '17:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 2, '09:00', '17:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 3, '09:00', '17:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 4, '09:00', '17:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 5, '09:00', '17:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 1, '10:00', '18:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 2, '10:00', '18:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 3, '10:00', '18:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 4, '10:00', '18:00'),
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 5, '10:00', '18:00');