export type LearningGoal = {
  id: string;
  owner_id: string;
  language: "en" | "ko";
  title: string;
  start_date: string;
  end_date: string;
  target_total: number;
  unit: string;
  days_per_week: number;
  minutes_per_session: number;
  created_at: string;
  updated_at: string;
};

export type LearningTask = {
  id: string;
  owner_id: string;
  goal_id: string;
  scheduled_date: string;
  target_amount: number;
  status: "planned" | "done";
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StudySession = {
  id: string;
  owner_id: string;
  goal_id: string;
  task_id: string;
  studied_on: string;
  duration_minutes: number;
  note: string;
  created_at: string;
  updated_at: string;
};

export type FitnessSettings = {
  owner_id: string;
  weekly_sessions_target: number;
  updated_at: string;
};

export type FitnessPlan = {
  id: string;
  owner_id: string;
  title: string;
  planned_date: string;
  planned_minutes: number;
  exercise_type: string;
  planned_sets: number | null;
  planned_reps: number | null;
  planned_weight_kg: number | null;
  note: string;
  created_at: string;
  updated_at: string;
};

export type WorkoutSession = {
  id: string;
  owner_id: string;
  plan_id: string | null;
  title: string;
  performed_on: string;
  duration_minutes: number;
  actual_sets: number | null;
  actual_reps: number | null;
  actual_weight_kg: number | null;
  note: string;
  created_at: string;
  updated_at: string;
};

export type FitnessVideoBookmark = {
  id: string;
  owner_id: string;
  title: string;
  url: string;
  cover_url: string | null;
  note: string;
  created_at: string;
  updated_at: string;
};

export type LearningWorkspace = {
  ready: boolean;
  goals: LearningGoal[];
  tasks: LearningTask[];
  sessions: StudySession[];
};

export type FitnessWorkspace = {
  ready: boolean;
  settings: FitnessSettings | null;
  plans: FitnessPlan[];
  workouts: WorkoutSession[];
  videos: FitnessVideoBookmark[];
};
