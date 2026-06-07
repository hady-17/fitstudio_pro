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