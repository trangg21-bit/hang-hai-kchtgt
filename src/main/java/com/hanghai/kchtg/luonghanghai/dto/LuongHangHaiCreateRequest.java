package com.hanghai.kchtg.luonghanghai.dto;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

/**
 * Create request for LuongHangHai (F-038).
 */
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class LuongHangHaiCreateRequest {
    @NotBlank(message = "Loai tau khong duoc de trong") private String loaiTau;
    private Integer soLuong;
    private LocalDate ngayGhiNhan;
    private String gioDien;
    private String taiTrong;
    private String dienTichDangBo;
    private String ghiChu;
    private String createdBy;
    @Builder.Default private LuongHangHaiApprovalStatus approvalStatus = LuongHangHaiApprovalStatus.PROPOSED;
}