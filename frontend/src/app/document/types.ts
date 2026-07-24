// ── GiayTo types ──────────────────────────────────────────────────────

export type GiayToEntityType = 'port' | 'berth' | 'pier' | 'dry-port' | 'water-zone';

export const GIAYTO_ENTITY_TYPES: { value: GiayToEntityType; label: string }[] = [
  { value: 'port', label: 'Cảng biển' },
  { value: 'berth', label: 'Bến cảng' },
  { value: 'pier', label: 'Cầu cảng' },
  { value: 'dry-port', label: 'Cảng cạn' },
  { value: 'water-zone', label: 'Vùng nước' },
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
