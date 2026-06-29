package com.hanghai.kchtg.luonghanghai.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LuongHangHaiUpdateRequest {

    @Size(max = 100)
    private String loaiTau;

    private Integer soLuong;

    private LocalDate ngayGhiNhan;

    @Size(max = 50)
    private String gioDien;

    private String taiTrong;

    private String dienTichDangBo;

    @Size(max = 500)
    private String ghiChu;

    private String updatedBy;
}
