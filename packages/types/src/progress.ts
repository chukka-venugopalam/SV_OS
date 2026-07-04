export type ProgressStatus = 'not_started' | 'learning' | 'completed' | 'mastered';

export interface UserProgress {
  id: string;
  user_id: string;
  node_id: string;
  status: ProgressStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProgressStats {
  total_nodes: number;
  not_started: number;
  learning: number;
  completed: number;
  mastered: number;
  completion_percentage: number;
}
