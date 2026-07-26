export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface VanBanPhapLyCreateRequest {
  soHieu: string;
  tenVanBan: string;
  loaiVanBan: string;
  nguoiKy: string;
  ngayBanHanh: string;
  ngayCoHieuLuc: string;
  coQuanBanHanh: string;
  trangThai: string;
  moTa: string;
}

export interface VanBanPhapLyResponse {
  id: string;
  soHieu: string;
  tenVanBan: string;
  loaiVanBan: string;
  nguoiKy: string;
  ngayBanHanh: string;
  ngayCoHieuLuc: string;
  coQuanBanHanh: string;
  trangThai: string;
  moTa: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
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
