import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { userService } from '../services/userService';
import type { CreateUserPayload, UpdateUserPayload } from '../types/user';
import type { PaginatedResponse } from '../types/common';
import type { User } from '../types/user';

interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roleId?: string;
  status?: string;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend' | null;
}

export function useUsers(params: ListParams) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', params],
    queryFn: () => userService.list(params),
    staleTime: 30_000,
  });
}

export function useUser(id: string | undefined) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: () => userService.getById(id!),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userService.create(payload),
    onSuccess: () => {
      message.success('Đã tạo người dùng thành công');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      userService.update(id, payload),
    onSuccess: () => {
      message.success('Đã cập nhật người dùng');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      message.success('Đã xóa người dùng');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useToggleLockUser() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.toggleLock(id),
    onSuccess: (res) => {
      const statusText = res.data.status === 'locked' ? 'đã bị khóa' : 'đã được mở khóa';
      message.success(`Tài khoản ${statusText}`);
      qc.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (id: string) => userService.resetPassword(id),
    onSuccess: (res) => {
      message.success(`Mật khẩu mới: ${res.data.newPassword}`);
    },
  });
}
