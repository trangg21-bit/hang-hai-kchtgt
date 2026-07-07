// ── GiayTo types ──────────────────────────────────────────────────────

export type GiayToEntityType = 'cang-bien' | 'ben-cang' | 'cau-cang' | 'cang-can' | 'vung-nuoc';

export const GIAYTO_ENTITY_TYPES: { value: GiayToEntityType; label: string }[] = [
  { value: 'cang-bien', label: 'Cảng biển' },
  { value: 'ben-cang', label: 'Bến cảng' },
  { value: 'cau-cang', label: 'Cầu cảng' },
  { value: 'cang-can', label: 'Cảng cạn' },
  { value: 'vung-nuoc', label: 'Vùng nước' },
];

export interface GiayTo {
  id: string;
  entityType: GiayToEntityType;
  entityId: string; // String (NOT UUID)
  fileName: string;
  fileSize: number; // Long in bytes
  mimeType: string; // ANY MIME type
  minioKey: string;
  uploadedBy: string;
  createdAt: string;
}

export interface GiayToUploadResponse {
  id: string;
  entityType: GiayToEntityType;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  minioKey: string;
  uploadedBy: string;
  createdAt: string;
}

export interface GiayToFilters {
  page: number;
  size: number;
}
