package com.hanghai.kchtg.deke.dto;

import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for DeKe (F-044 to F-049).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeKeResponse {

    private Long id;
    private String loaiDe;
    private String viTri;
    private Double chieuDai;
    private Double chieuRong;
    private Double chieuCao;
    private String matVatLieu;
    private String tinhTrang;
    private DeKeApprovalStatus trangThaiPheDuyet;
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
    private List<DeKeAttachmentResponse> attachments;
    private List<PheDuyetResponse> approvalHistory;
    private List<HistoryEntry> history;
}
