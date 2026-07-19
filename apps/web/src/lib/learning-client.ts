/**
 * Learning Platform API client — typed client for recommendations,
 * learning paths, careers, and assessments.
 */

import { apiClient } from './api-client';

export interface Recommendation {
  node_id: string;
  title: string;
  slug: string;
  node_type: string;
  difficulty: string;
  priority: number;
  priority_label: string;
  reason: string;
  estimated_minutes: number;
}

export interface LearningPath {
  path_id: string;
  goal_node_id: string;
  goal_title: string;
  strategy: string;
  status: string;
  completion_percentage: number;
  total_estimated_minutes: number;
  milestone_count: number;
  milestones: Array<{
    level: number;
    title: string;
    node_count: number;
    estimated_minutes: number;
    completed: boolean;
    nodes: Array<{
      node_id: string;
      title: string;
      slug: string;
      node_type: string;
      difficulty: string;
      estimated_minutes: number;
      completed: boolean;
    }>;
  }>;
}

export interface CareerProfile {
  id: string;
  title: string;
  slug: string;
  description: string;
  industry: string;
  seniority: string;
  salary_range: string;
  demand: string;
  required_skills: string[];
}

export interface SkillGap {
  career_id: string;
  career_title: string;
  total_required: number;
  completed: number;
  missing: number;
  weak: number;
  completion_percentage: number;
  gaps: Array<{
    skill_name: string;
    status: string;
    node_id: string;
    node_title: string;
    urgency: string;
  }>;
}

export interface Assessment {
  assessment_id: string;
  node_id: string;
  title: string;
  description: string;
  question_count: number;
  passing_score: number;
  max_attempts: number;
  total_points: number;
  questions: Array<{
    question_id: string;
    text: string;
    question_type: string;
    options: string[];
    points: number;
    difficulty: string;
  }>;
}

export interface AssessmentSubmission {
  submission_id: string;
  assessment_id: string;
  score: number;
  passed: boolean;
  earned_points: number;
  total_points: number;
  question_results?: Array<{
    question_id: string;
    is_correct: boolean;
    points: number;
    earned: number;
  }>;
}

export const learningClient = {
  // Recommendations
  getNextRecommendations: (limit = 5) =>
    apiClient.get<{ items: Recommendation[]; count: number }>('/recommendations/next', {
      params: { limit },
    }),
  getBatchRecommendations: (limit = 20) =>
    apiClient.get<{ items: Recommendation[]; count: number }>('/recommendations/batch', {
      params: { limit },
    }),
  getDailyRecommendations: (limit = 10) =>
    apiClient.get<{ items: Recommendation[]; count: number }>('/recommendations/daily', {
      params: { limit },
    }),
  getWeeklyRecommendations: (limit = 20) =>
    apiClient.get<{ items: Recommendation[]; count: number }>('/recommendations/weekly', {
      params: { limit },
    }),
  getRecommendationsByGoal: (goalNodeId: string, limit = 10) =>
    apiClient.get<{ items: Recommendation[]; count: number }>(
      `/recommendations/by-goal/${goalNodeId}`,
      { params: { limit } },
    ),
  getRecommendationHistory: (limit = 50) =>
    apiClient.get<{ items: Recommendation[]; count: number }>('/recommendations/history', {
      params: { limit },
    }),

  // Learning Paths
  generateLearningPath: (goalNodeId: string, strategy = 'dependency_roadmap') =>
    apiClient.post<LearningPath>('/learning-paths/generate', {
      goal_node_id: goalNodeId,
      strategy,
    }),
  getLearningPath: (pathId: string) => apiClient.get<LearningPath>(`/learning-paths/${pathId}`),
  resumeLearningPath: (pathId: string) =>
    apiClient.post<LearningPath>(`/learning-paths/${pathId}/resume`),
  pauseLearningPath: (pathId: string) => apiClient.post(`/learning-paths/${pathId}/pause`),
  rebuildLearningPath: (pathId: string) =>
    apiClient.post<LearningPath>(`/learning-paths/${pathId}/rebuild`),
  generateCareerRoadmap: (careerNodeId: string) =>
    apiClient.post<LearningPath>('/learning-paths/roadmap/career', {
      career_node_id: careerNodeId,
    }),

  // Careers
  getCareer: (careerId: string) => apiClient.get<CareerProfile>(`/careers-platform/${careerId}`),
  searchCareers: (query: string, limit = 20) =>
    apiClient.get<{ items: CareerProfile[]; count: number }>('/careers-platform', {
      params: { q: query, limit },
    }),
  compareCareers: (careerIds: string[]) =>
    apiClient.post<{ items: CareerProfile[]; count: number }>('/careers-platform/compare', {
      career_ids: careerIds,
    }),
  getSkillGap: (userId: string, careerId: string) =>
    apiClient.post<SkillGap>('/careers-platform/skill-gap', {
      user_id: userId,
      career_id: careerId,
    }),
  getCareerProgression: (careerId: string) =>
    apiClient.get(`/careers-platform/${careerId}/progression`),
  getCareerStatistics: () => apiClient.get('/careers-platform/statistics'),

  // Assessments
  createAssessment: (nodeId: string, title: string, questions: Array<Record<string, unknown>>) =>
    apiClient.post<Assessment>('/assessments-platform/create', {
      node_id: nodeId,
      title,
      questions,
    }),
  getAssessment: (assessmentId: string) =>
    apiClient.get<Assessment>(`/assessments-platform/${assessmentId}`),
  getAssessmentsForNode: (nodeId: string) =>
    apiClient.get<{ items: Assessment[]; count: number }>(`/assessments-platform/node/${nodeId}`),
  submitAssessment: (assessmentId: string, answers: Array<Record<string, unknown>>) =>
    apiClient.post<AssessmentSubmission>('/assessments-platform/submit', {
      assessment_id: assessmentId,
      answers,
    }),
  getAssessmentAttempts: (assessmentId: string) =>
    apiClient.get(`/assessments-platform/attempts/${assessmentId}`),
  getAssessmentStatistics: (assessmentId: string) =>
    apiClient.get(`/assessments-platform/statistics/${assessmentId}`),
};
