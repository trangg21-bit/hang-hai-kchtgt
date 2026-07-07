// ── GiayTo API helpers ────────────────────────────────────────────────
// Upload & list attachments for entities

import api from '../../services/api';
import type { GiayTo, GiayToUploadResponse, GiayToEntityType, GiayToFilters } from './types';

/* ── Helpers ──────────────────────────────────────────────────────────── */

function parsePage<T>(res: any): { data: T[]; total: number; page: number; pageSize: number } {
  const pageData = res.data.data;
  return {
    data: pageData.content || [],
    total: pageData.totalElements ?? 0,
    page: (pageData.number ?? 0) + 1, // 0-based → 1-based
    pageSize: pageData.size ?? 20,
  };
}

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

/* ── Upload ──────────────────────────────────────────────────────────── */

export const giayToApi = {
  /**
   * Upload a file as multipart/form-data to an entity.
   * @param entityType  e.g. "vung-nuoc"
   * @param entityId    string ID (NOT UUID in the path)
   * @param file        File instance
   * @param userId      user ID from auth session
   */
  async upload(entityType: GiayToEntityType, entityId: string, file: File, userId: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);
    const res = await api.post(`/giay-to/upload/${entityType}/${entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as GiayToUploadResponse;
  },

  /**
   * List attachments for a given entity.
   * @param entityType  e.g. "vung-nuoc"
   * @param entityId    string ID
   */
  async listByEntity(entityType: GiayToEntityType, entityId: string, params?: Partial<GiayToFilters>) {
    const sp = buildSearchParams({
      page: (params?.page ?? 1) - 1,
      size: params?.size,
    });
    const res = await api.get(`/giay-to/entity/${entityType}/${entityId}?${sp}`);
    return parsePage<GiayTo>(res);
  },

  /**
   * Get attachment by ID.
   */
  async findById(id: string) {
    const res = await api.get(`/giay-to/${id}`);
    return res.data.data as GiayTo;
  },

  /**
   * Delete an attachment.
   */
  async delete(id: string) {
    await api.delete(`/giay-to/${id}`);
  },

  /**
   * Build the download URL from minioKey.
   */
  downloadUrl(minioKey: string): string {
    return `/api/giay-to/download/${encodeURIComponent(minioKey)}`;
  },
};
