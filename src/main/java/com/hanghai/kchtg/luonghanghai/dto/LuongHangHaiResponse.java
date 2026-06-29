package com.hanghai.kchtg.luonghanghai.dto;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiResponse {

    private Long id;
    private String loaiTau;
    private Integer soLuong;
    private LocalDate ngayGhiNhan;
    private String gioDien;
    private String taiTrong;
    private String dienTichDangBo;
    private String ghiChu;
    private LuongHangHaiApprovalStatus approvalStatus;
    private Boolean pheDuyetC1;
    private String nguoiPheDuyetC1;
    private LocalDateTime ngayPheDuyetC1;
    private Boolean pheDuyetC2;
    private String nguoiPheDuyetC2;
    private LocalDateTime ngayPheDuyetC2;
    private String lyDoTuChoi;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private List<LuongHangHaiAttachmentResponse> attachments;
    private List<HistoryEntry> approvalHistory;
}
