package com.hanghai.kchtg.luonghanghai.dto;

import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHaiUpdateRequest {
    private String loaiTau;
    private Integer soLuong;
    private LocalDate ngayGhiNhan;
    private String gioDien;
    private String taiTrong;
    private String dienTichDangBo;
    private String ghiChu;
    private String updatedBy;
    @Builder.Default private List<LuongHangHaiAttachmentResponse> attachments = List.of();
}
