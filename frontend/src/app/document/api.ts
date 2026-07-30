// ── GiayTo API helpers ────────────────────────────────────────────────
// Upload & list attachments for entities

import api from '../../services/api';
import type { Document, DocumentUploadResponse, DocumentEntityType, DocumentFilters } from './types';

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

export const documentApi = {
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
    const res = await api.post(`/v1/documents/upload/${entityType}/${entityId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data as DocumentUploadResponse;
  },

  /**
   * List attachments for a given entity.
   * @param entityType  e.g. "vung-nuoc"
   * @param entityId    string ID
   */
  async listByEntity(entityType: DocumentEntityType, entityId: string, params?: Partial<DocumentFilters>) {
    const sp = buildSearchParams({
      page: (params?.page ?? 1) - 1,
      size: params?.size,
    });
    const res = await api.get(`/v1/documents/entity/${entityType}/${entityId}?${sp}`);
    return parsePage<Document>(res);
  },

  /**
   * Get attachment by ID.
   */
  async findById(id: string) {
    const res = await api.get(`/v1/documents/${id}`);
    return res.data.data as Document;
  },

  /**
   * Delete an attachment.
   */
  async delete(id: string) {
    await api.delete(`/v1/documents/${id}`);
  },

  /**
   * Build the download URL from minioKey.
   */
  downloadUrl(minioKey: string): string {
    return `/api/v1/documents/download/${encodeURIComponent(minioKey)}`;
  },
};
