import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { roleService } from '../services/roleService';
import type { CreateRolePayload, UpdateRolePayload } from '../types/role';
import type { Role } from '../types/role';

export function useRoles(params?: { search?: string }) {
  return useQuery<Role[]>({
    queryKey: ['roles', params],
    queryFn: () => roleService.list(params),
    staleTime: 60_000,
  });
}

export function useRole(id: string | undefined) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => roleService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => roleService.create(payload),
    onSuccess: () => {
      message.success('Đã tạo vai trò mới');
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: Error) => {
      message.error(err.message || 'Tạo vai trò thất bại');
    },
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateRolePayload }) =>
      roleService.update(id, payload),
    onSuccess: () => {
      message.success('Đã cập nhật vai trò');
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: Error) => {
      message.error(err.message || 'Cập nhật vai trò thất bại');
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => roleService.delete(id),
    onSuccess: () => {
      message.success('Đã xóa vai trò');
      qc.invalidateQueries({ queryKey: ['roles'] });
    },
    onError: (err: Error) => {
      message.error(err.message || 'Xóa vai trò thất bại');
    },
  });
}
