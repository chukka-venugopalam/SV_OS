/**
 * Learning Platform hooks — React TanStack Query hooks for
 * recommendations, learning paths, careers, and assessments.
 */

'use client';

import { useQuery, useMutation } from '@tanstack/react-query';

import { learningClient } from '@/lib/learning-client';

// ── Recommendations ────────────────────────────────────────────

export function useNextRecommendations(limit = 5) {
  return useQuery({
    queryKey: ['recommendations', 'next', limit],
    queryFn: async () => {
      const response = await learningClient.getNextRecommendations(limit);
      return response.data;
    },
    staleTime: 60_000,
  });
}

export function useDailyRecommendations(limit = 10) {
  return useQuery({
    queryKey: ['recommendations', 'daily', limit],
    queryFn: async () => {
      const response = await learningClient.getDailyRecommendations(limit);
      return response.data;
    },
    staleTime: 120_000,
  });
}

export function useWeeklyRecommendations(limit = 20) {
  return useQuery({
    queryKey: ['recommendations', 'weekly', limit],
    queryFn: async () => {
      const response = await learningClient.getWeeklyRecommendations(limit);
      return response.data;
    },
    staleTime: 300_000,
  });
}

export function useRecommendationHistory(limit = 50) {
  return useQuery({
    queryKey: ['recommendations', 'history', limit],
    queryFn: async () => {
      const response = await learningClient.getRecommendationHistory(limit);
      return response.data;
    },
    staleTime: 60_000,
  });
}

// ── Learning Paths ─────────────────────────────────────────────

export function useGenerateLearningPath() {
  return useMutation({
    mutationFn: async ({ goalNodeId, strategy }: { goalNodeId: string; strategy?: string }) => {
      const response = await learningClient.generateLearningPath(goalNodeId, strategy);
      return response.data;
    },
  });
}

export function useLearningPath(pathId: string | null) {
  return useQuery({
    queryKey: ['learning-path', pathId],
    queryFn: async () => {
      if (!pathId) return null;
      const response = await learningClient.getLearningPath(pathId);
      return response.data;
    },
    enabled: !!pathId,
    staleTime: 60_000,
  });
}

export function useResumeLearningPath() {
  return useMutation({
    mutationFn: async (pathId: string) => {
      const response = await learningClient.resumeLearningPath(pathId);
      return response.data;
    },
  });
}

export function useRebuildLearningPath() {
  return useMutation({
    mutationFn: async (pathId: string) => {
      const response = await learningClient.rebuildLearningPath(pathId);
      return response.data;
    },
  });
}

// ── Careers ────────────────────────────────────────────────────

export function useCareer(careerId: string | null) {
  return useQuery({
    queryKey: ['career', careerId],
    queryFn: async () => {
      if (!careerId) return null;
      const response = await learningClient.getCareer(careerId);
      return response.data;
    },
    enabled: !!careerId,
    staleTime: 300_000,
  });
}

export function useSearchCareers(query: string) {
  return useQuery({
    queryKey: ['careers', 'search', query],
    queryFn: async () => {
      if (!query) return { items: [], count: 0 };
      const response = await learningClient.searchCareers(query);
      return response.data;
    },
    enabled: !!query,
    staleTime: 300_000,
  });
}

export function useCompareCareers() {
  return useMutation({
    mutationFn: async (careerIds: string[]) => {
      const response = await learningClient.compareCareers(careerIds);
      return response.data;
    },
  });
}

export function useSkillGap() {
  return useMutation({
    mutationFn: async ({ userId, careerId }: { userId: string; careerId: string }) => {
      const response = await learningClient.getSkillGap(userId, careerId);
      return response.data;
    },
  });
}

export function useCareerStatistics() {
  return useQuery({
    queryKey: ['careers', 'statistics'],
    queryFn: async () => {
      const response = await learningClient.getCareerStatistics();
      return response.data;
    },
    staleTime: 300_000,
  });
}

// ── Assessments ────────────────────────────────────────────────

export function useAssessment(assessmentId: string | null) {
  return useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      const response = await learningClient.getAssessment(assessmentId);
      return response.data;
    },
    enabled: !!assessmentId,
    staleTime: 60_000,
  });
}

export function useAssessmentsForNode(nodeId: string | null) {
  return useQuery({
    queryKey: ['assessments', 'node', nodeId],
    queryFn: async () => {
      if (!nodeId) return { items: [], count: 0 };
      const response = await learningClient.getAssessmentsForNode(nodeId);
      return response.data;
    },
    enabled: !!nodeId,
    staleTime: 60_000,
  });
}

export function useCreateAssessment() {
  return useMutation({
    mutationFn: async ({
      nodeId,
      title,
      questions,
    }: {
      nodeId: string;
      title: string;
      questions: Array<Record<string, unknown>>;
    }) => {
      const response = await learningClient.createAssessment(nodeId, title, questions);
      return response.data;
    },
  });
}

export function useSubmitAssessment() {
  return useMutation({
    mutationFn: async ({
      assessmentId,
      answers,
    }: {
      assessmentId: string;
      answers: Array<Record<string, unknown>>;
    }) => {
      const response = await learningClient.submitAssessment(assessmentId, answers);
      return response.data;
    },
  });
}

export function useAssessmentStatistics(assessmentId: string | null) {
  return useQuery({
    queryKey: ['assessment', 'statistics', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      const response = await learningClient.getAssessmentStatistics(assessmentId);
      return response.data;
    },
    enabled: !!assessmentId,
    staleTime: 120_000,
  });
}
