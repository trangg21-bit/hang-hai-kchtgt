package com.hanghai.kchtg.deke.dto;

import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.List;

/**
 * Create request for DeKe (F-044).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeKeCreateRequest {

    @NotBlank(message = "Loai de khong duoc de trong")
    private String loaiDe;

    @NotBlank(message = "Vi tri khong duoc de trong")
    private String viTri;

    private Double chieuDai;
    private Double chieuRong;
    private Double chieuCao;
    private String matVatLieu;
    private String tinhTrang;
    private String createdBy;

    @Builder.Default
    private DeKeApprovalStatus trangThaiPheDuyet = DeKeApprovalStatus.PROPOSED;

    private List<DeKeAttachmentCreate> attachments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DeKeAttachmentCreate {
        private String tenTaiLieu;
        private String duongDan;
        private Long kichThuoc;
        private String loaiTaiLieu;
        private String nguoiTaiLen;
    }
}
