/**
 * Learning Platform state store — Zustand store for recommendations,
 * learning paths, careers, and assessments UI state.
 */

'use client';

import { create } from 'zustand';

import type {
  Recommendation,
  LearningPath,
  CareerProfile,
  Assessment,
} from '@/lib/learning-client';

export interface LearningState {
  // Recommendations
  recommendations: Recommendation[];
  isRecommendationsLoading: boolean;
  recommendationMode: 'next' | 'daily' | 'weekly' | 'goal';

  // Learning Paths
  currentPath: LearningPath | null;
  isPathLoading: boolean;

  // Careers
  selectedCareer: CareerProfile | null;
  careers: CareerProfile[];
  isCareersLoading: boolean;

  // Assessments
  currentAssessment: Assessment | null;
  assessmentSubmitting: boolean;

  // Actions
  setRecommendations: (recs: Recommendation[]) => void;
  setRecommendationsLoading: (loading: boolean) => void;
  setRecommendationMode: (mode: 'next' | 'daily' | 'weekly' | 'goal') => void;
  setCurrentPath: (path: LearningPath | null) => void;
  setPathLoading: (loading: boolean) => void;
  setSelectedCareer: (career: CareerProfile | null) => void;
  setCareers: (careers: CareerProfile[]) => void;
  setCareersLoading: (loading: boolean) => void;
  setCurrentAssessment: (assessment: Assessment | null) => void;
  setAssessmentSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  recommendations: [],
  isRecommendationsLoading: false,
  recommendationMode: 'next',

  currentPath: null,
  isPathLoading: false,

  selectedCareer: null,
  careers: [],
  isCareersLoading: false,

  currentAssessment: null,
  assessmentSubmitting: false,

  setRecommendations: (recs) => set({ recommendations: recs }),
  setRecommendationsLoading: (loading) => set({ isRecommendationsLoading: loading }),
  setRecommendationMode: (mode) => set({ recommendationMode: mode }),
  setCurrentPath: (path) => set({ currentPath: path }),
  setPathLoading: (loading) => set({ isPathLoading: loading }),
  setSelectedCareer: (career) => set({ selectedCareer: career }),
  setCareers: (careers) => set({ careers }),
  setCareersLoading: (loading) => set({ isCareersLoading: loading }),
  setCurrentAssessment: (assessment) => set({ currentAssessment: assessment }),
  setAssessmentSubmitting: (submitting) => set({ assessmentSubmitting: submitting }),

  reset: () =>
    set({
      recommendations: [],
      isRecommendationsLoading: false,
      currentPath: null,
      isPathLoading: false,
      selectedCareer: null,
      careers: [],
      isCareersLoading: false,
      currentAssessment: null,
      assessmentSubmitting: false,
    }),
}));
