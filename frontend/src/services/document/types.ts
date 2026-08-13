export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  statusCounts?: Record<string, number>;
}

export interface LegalDocumentCreateRequest {
  documentName: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  effectiveDate: string;
  expirationDate?: string;
  documentType?: string;
  applicationArea?: string;
  signer?: string;
  validityStatus?: string;
  description?: string;
  draft?: boolean;
}

export interface LegalDocumentResponse {
  id: string;
  documentName: string;
  documentNumber: string;
  issuingAuthority: string;
  issueDate: string;
  effectiveDate: string;
  expirationDate?: string;
  documentType?: string;
  applicationArea?: string;
  validityStatus?: string;
  signer?: string;
  description?: string;
  attachedDocuments?: Array<{
    id: string; documentName: string; filePath: string; fileSize?: number; uploadedAt: string;
  }>;
  draft?: boolean;
  createdBy?: string; createdByName?: string; createdDate?: string; updatedBy?: string; updatedByName?: string; updatedDate?: string;
}

export interface LegalDocumentHistoryResponse {
  id: string;
  action: string;
  changedBy?: string;
  changedAt: string;
  documentName: string;
  documentNumber?: string;
  validityStatus?: string;
}

export interface SuCoCreateRequest {
  thoiGianPhatHien?: string;
  viTri: string;
  mucDoNghiemTrong?: string;
  moTa?: string;
  tinhTrangXuLy?: string;
  nguoiBaoCao?: string;
}

export interface SuCoResponse {
  id: string;
  thoiGianPhatHien: string;
  viTri: string;
  mucDoNghiemTrong: string;
  moTa: string;
  tinhTrangXuLy: string;
  nguoiBaoCao: string;
  ngayTao: string;
  nguoiSuaDoi: string;
  ngaySuaDoi: string;
}

export interface QuyHoachBenCangCreateRequest {
  projectName: string;
  coQuanPheDuyet: string;
  ngayPheDuyet?: string;
  phamViApDung?: string;
  tiLeBanDo?: string;
  tinhTrang?: string;
  duongDanFile?: string;
}

export interface QuyHoachBenCangResponse {
  id: string;
  projectName: string;
  coQuanPheDuyet: string;
  ngayPheDuyet: string;
  phamViApDung: string;
  tiLeBanDo: string;
  tinhTrang: string;
  duongDanFile: string;
  nguoiTao: string;
  ngayTao: string;
  nguoiSuaDoi: string;
  ngaySuaDoi: string;
}
