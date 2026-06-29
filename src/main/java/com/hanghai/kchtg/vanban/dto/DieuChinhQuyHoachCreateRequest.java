package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.TinhTrangDieuChinh;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for creating a DieuChinhQuyHoach record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DieuChinhQuyHoachCreateRequest {

    @NotNull(message = "quyHoachId không được để trống")
    private Long quyHoachId;

    private String loaiDieuChinh;
    private String lyDo;
    private String moTaChiTiet;
    private String phamViAnhHuong;
    private TinhTrangDieuChinh tinhTrang;
    private String nguoiDangKy;
    private LocalDateTime ngayDangKy;
}
