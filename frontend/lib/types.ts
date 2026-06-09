export type GlobalRole = 'user' | 'admin';
export type StudioMemberRole = 'owner' | 'trainer' | 'client';
export type ClientStatus = 'active' | 'paused' | 'cancelled';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type WorkoutPlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  global_role: string;
  created_at: string;
  updated_at: string;
}

export interface StudioMember {
  id: string;
  studio_id: string;
  user_id: string;
  role: StudioMemberRole;
  created_at: string;
}

export interface Studio {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  studio_id: string;
  trainer_id: string | null;
  user_id: string | null;
  full_name: string;
  email: string | null;
  status: ClientStatus;
  goal: string | null;
  notes: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  studio_id: string;
  trainer_id: string;
  client_id: string;
  start_time: string;
  end_time: string;
  status: SessionStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  client?: { id: string; full_name: string; email: string | null } | null;
  trainer?: { id: string; full_name: string; email: string | null; avatar_url: string | null } | null;
}

export interface WorkoutPlan {
  id: string;
  studio_id: string;
  client_id: string;
  trainer_id: string;
  title: string;
  description: string | null;
  status: WorkoutPlanStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkoutDay {
  id: string;
  workout_plan_id: string;
  day_number: number;
  title: string;
  notes: string | null;
}

export interface WorkoutItem {
  id: string;
  workout_day_id: string;
  exercise_id: string;
  sets: number | null;
  reps: string | null;
  target_weight: string | null;
  rest_seconds: number | null;
  notes: string | null;
  exercises?: { id: string; name: string } | null;
}

export interface Exercise {
  id: string;
  name: string;
  muscle_group: string | null;
  equipment: string | null;
  difficulty: string | null;
}

export interface AnalyticsOverview {
  activeClients: number;
  newClientsThisMonth: number;
  sessionsThisWeek: number;
  completedSessionsThisMonth: number;
  missedSessionsThisMonth: number;
  workoutCompletionRate: number;
  missedCheckIns: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
}

export interface CheckIn {
  id: string;
  client_id: string;
  mood: number | null;
  energy_level: number | null;
  sleep_hours: number | null;
  weight: number | null;
  notes: string | null;
  created_at: string;
}

export interface Measurement {
  id: string;
  client_id: string;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  arms: number | null;
  legs: number | null;
  created_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
