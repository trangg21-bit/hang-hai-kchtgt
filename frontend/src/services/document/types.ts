export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
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
  createdBy?: string; createdByName?: string; createdAt: string; updatedAt: string;
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
