import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbOps } from '@/lib/database';
import type { Client, InsertClient, InsertCoachProfile } from '@shared/schema';

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: () => dbOps.getAllClients(),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => dbOps.getClient(id),
    enabled: !!id,
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (client: InsertClient) => dbOps.createClient(client),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useUpdateClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Client> }) =>
      dbOps.updateClient(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeleteClient() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => dbOps.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useCoachProfile() {
  return useQuery({
    queryKey: ['coach-profile'],
    queryFn: async () => {
      const profile = await dbOps.getCoachProfile();
      return profile || null;
    },
  });
}

export function useCreateCoachProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profile: InsertCoachProfile) => dbOps.createCoachProfile(profile),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-profile'] });
    },
  });
}

export function useUpdateCoachProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<InsertCoachProfile> }) =>
      dbOps.updateCoachProfile(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach-profile'] });
    },
  });
}
