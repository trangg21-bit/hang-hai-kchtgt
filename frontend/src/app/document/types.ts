// ── Document types ──────────────────────────────────────────────────────

export type DocumentEntityType = 'port' | 'berth' | 'pier' | 'dry-port' | 'water-zone';

export const DOCUMENT_ENTITY_TYPES: { value: DocumentEntityType; label: string }[] = [
  { value: 'port', label: 'Cảng biển' },
  { value: 'berth', label: 'Bến cảng' },
  { value: 'pier', label: 'Cầu cảng' },
  { value: 'dry-port', label: 'Cảng cạn' },
  { value: 'water-zone', label: 'Vùng nước' },
];

export interface Document {
  id: string;
  entityType: DocumentEntityType;
  entityId: string; // String (NOT UUID)
  fileName: string;
  fileSize: number; // Long in bytes
  mimeType: string; // ANY MIME type
  minioKey: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentUploadResponse {
  id: string;
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  minioKey: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentFilters {
  page: number;
  size: number;
}
