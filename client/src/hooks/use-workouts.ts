import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dbOps } from '@/lib/database';
import type { Workout, InsertWorkout } from '@shared/schema';

export function useWorkouts() {
  return useQuery({
    queryKey: ['workouts'],
    queryFn: () => dbOps.getAllWorkouts(),
  });
}

export function useWorkout(id: string) {
  return useQuery({
    queryKey: ['workouts', id],
    queryFn: () => dbOps.getWorkout(id),
    enabled: !!id,
  });
}

export function useWorkoutsByClient(clientName: string) {
  return useQuery({
    queryKey: ['workouts', 'client', clientName],
    queryFn: () => dbOps.getWorkoutsByClient(clientName),
    enabled: !!clientName,
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (workout: InsertWorkout) => dbOps.createWorkout(workout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useUpdateWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Workout> }) =>
      dbOps.updateWorkout(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}

export function useDeleteWorkout() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => dbOps.deleteWorkout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
