import { create } from 'zustand';
import { MatchCandidate, Match } from '../types/match.types';

interface MatchState {
  candidates: MatchCandidate[];
  matches: Match[];
  currentIndex: number;
  setCandidates: (candidates: MatchCandidate[]) => void;
  setMatches: (matches: Match[]) => void;
  removeTopCandidate: () => void;
  addMatch: (match: Match) => void;
}

export const useMatchStore = create<MatchState>((set) => ({
  candidates: [],
  matches: [],
  currentIndex: 0,

  setCandidates: (candidates) => set({ candidates, currentIndex: 0 }),
  setMatches: (matches) => set({ matches }),

  removeTopCandidate: () =>
    set((state) => ({
      candidates: state.candidates.slice(1),
      currentIndex: state.currentIndex + 1,
    })),

  addMatch: (match) =>
    set((state) => ({ matches: [match, ...state.matches] })),
}));
