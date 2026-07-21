package com.hanghai.kchtg.luonghanghai.dto;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import lombok.*;
import java.time.*;
import java.util.List;

import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHaiResponse {
    private java.util.UUID id;
    private String ten;
    private Integer soLuongTram;
    private LocalDate thoiDiemSuaChuaTramGanNhat;
    private java.math.BigDecimal dienTichTram;
    private String ghiChu;
    private String maLuongHangHai;
    private java.util.UUID cangBienId;
    private java.util.UUID donViVanHanhId;
    private String diaDiem;
    private String diaDiemChiTiet;
    private String tramQuanLyLuong;
    private Integer soLuongNhanSuTaiTram;
    private Integer namBaoTriGanNhat;
    private java.math.BigDecimal khoiLuongNaoVet;
    private Integer soLuongPhao;
    private Integer soLuongTieu;
    private Integer tinhTrang;
    private java.util.UUID donViId;
    private String donViTen;
    private LuongHangHaiApprovalStatus approvalStatus;
    private Boolean pheDuyetC1;
    private String nguoiPheDuyetC1;
    private LocalDate ngayPheDuyetC1;
    private Boolean pheDuyetC2;
    private String nguoiPheDuyetC2;
    private LocalDate ngayPheDuyetC2;
    private String lyDoTuChoi;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private List<LuongHangHaiAttachmentResponse> attachments;
    private List<PheDuyetResponse> approvalHistory;
    private List<HistoryEntry> history;
    private String chieuCaoTinhKhong;
    private List<ChiTietTuyenLuongResponse> chiTietTuyenLuongList;
    private java.util.UUID khongGianId;
    private GisGeometryType loaiHinhHoc;
    private String toaDo;
    private java.util.UUID bieuTuongId;
}
