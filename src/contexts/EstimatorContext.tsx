import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Estimate, EstimatorProfile } from '@/types/estimate';
import type { EstimateStatus, BlockerType } from '@/lib/status';
import {
  fetchEstimates,
  insertEstimate,
  updateEstimate,
  deleteEstimate,
  setBlocker,
  clearBlocker,
  changeStatus,
  fetchEstimatorProfiles,
  addEstimatorProfile,
  fetchVerifiedCarriers,
  ensureCarrier,
} from '@/lib/supabase-queries';
import { useCurrentUser } from './UserContext';
import { canViewAllUsers } from '@/lib/auth';

interface EstimatorContextValue {
  // Data
  estimates: Estimate[];
  profiles: EstimatorProfile[];
  carriers: string[];
  isLoading: boolean;
  error: Error | null;

  // Mutations
  addEstimate: (estimate: Partial<Estimate>) => Promise<Estimate>;
  editEstimate: (id: string, updates: Partial<Estimate>) => Promise<Estimate>;
  removeEstimate: (id: string) => Promise<void>;
  blockEstimate: (estimateId: string, blockerType: BlockerType, blockerName: string, blockerReason: string) => Promise<void>;
  unblockEstimate: (estimateId: string, resolutionNote?: string) => Promise<void>;
  updateStatus: (estimateId: string, fromStatus: EstimateStatus, toStatus: EstimateStatus) => Promise<void>;
  createProfile: (userId: string, displayName: string) => Promise<void>;
  saveCarrier: (name: string) => Promise<void>;
}

const EstimatorContext = createContext<EstimatorContextValue | null>(null);

export function EstimatorProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();
  const showAll = canViewAllUsers(user.role);

  // ── Queries ────────────────────────────────────────────────

  const estimatesQuery = useQuery({
    queryKey: ['estimates', showAll ? 'all' : user.userId],
    queryFn: () => fetchEstimates(showAll ? undefined : user.userId),
  });

  const profilesQuery = useQuery({
    queryKey: ['estimator-profiles'],
    queryFn: fetchEstimatorProfiles,
  });

  const carriersQuery = useQuery({
    queryKey: ['carriers'],
    queryFn: fetchVerifiedCarriers,
  });

  // ── Mutations ──────────────────────────────────────────────

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['estimates'] });
  };

  const addMutation = useMutation({
    mutationFn: insertEstimate,
    onSuccess: invalidate,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Estimate> }) =>
      updateEstimate(id, updates),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: deleteEstimate,
    onSuccess: invalidate,
  });

  const blockMutation = useMutation({
    mutationFn: (params: Parameters<typeof setBlocker>[0]) => setBlocker(params),
    onSuccess: invalidate,
  });

  const unblockMutation = useMutation({
    mutationFn: (params: Parameters<typeof clearBlocker>[0]) => clearBlocker(params),
    onSuccess: invalidate,
  });

  const statusMutation = useMutation({
    mutationFn: (params: Parameters<typeof changeStatus>[0]) => changeStatus(params),
    onSuccess: invalidate,
  });

  const profileMutation = useMutation({
    mutationFn: ({ userId, displayName }: { userId: string; displayName: string }) =>
      addEstimatorProfile(userId, displayName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['estimator-profiles'] }),
  });

  const carrierMutation = useMutation({
    mutationFn: ensureCarrier,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['carriers'] }),
  });

  // ── Context value ──────────────────────────────────────────

  const value: EstimatorContextValue = {
    estimates: estimatesQuery.data ?? [],
    profiles: profilesQuery.data ?? [],
    carriers: carriersQuery.data ?? [],
    isLoading: estimatesQuery.isLoading || profilesQuery.isLoading,
    error: estimatesQuery.error as Error | null,

    addEstimate: async (estimate) => {
      return addMutation.mutateAsync(estimate);
    },
    editEstimate: async (id, updates) => {
      return editMutation.mutateAsync({ id, updates });
    },
    removeEstimate: async (id) => {
      return removeMutation.mutateAsync(id);
    },
    blockEstimate: async (estimateId, blockerType, blockerName, blockerReason) => {
      const est = estimatesQuery.data?.find((e) => e.id === estimateId);
      if (!est) return;
      await blockMutation.mutateAsync({
        estimateId,
        estimatorId: est.estimator_id,
        fileNumber: est.file_number,
        blockerType,
        blockerName,
        blockerReason,
      });
    },
    unblockEstimate: async (estimateId, resolutionNote) => {
      const est = estimatesQuery.data?.find((e) => e.id === estimateId);
      if (!est) return;
      await unblockMutation.mutateAsync({
        estimateId,
        estimatorId: est.estimator_id,
        fileNumber: est.file_number,
        resolutionNote,
      });
    },
    updateStatus: async (estimateId, fromStatus, toStatus) => {
      const est = estimatesQuery.data?.find((e) => e.id === estimateId);
      if (!est) return;
      await statusMutation.mutateAsync({
        estimateId,
        estimatorId: est.estimator_id,
        fileNumber: est.file_number,
        fromStatus,
        toStatus,
      });
    },
    createProfile: async (userId, displayName) => {
      await profileMutation.mutateAsync({ userId, displayName });
    },
    saveCarrier: async (name) => {
      await carrierMutation.mutateAsync(name);
    },
  };

  return (
    <EstimatorContext.Provider value={value}>
      {children}
    </EstimatorContext.Provider>
  );
}

export function useEstimatorContext(): EstimatorContextValue {
  const ctx = useContext(EstimatorContext);
  if (!ctx) throw new Error('useEstimatorContext must be used within <EstimatorProvider>');
  return ctx;
}
