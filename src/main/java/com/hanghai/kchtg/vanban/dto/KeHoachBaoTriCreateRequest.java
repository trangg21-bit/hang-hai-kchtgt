package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.LoaiBaoTri;
import com.hanghai.kchtg.vanban.entity.TinhTrangBaoTri;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating a KeHoachBaoTri record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachBaoTriCreateRequest {

    @NotBlank(message = "Thiết bị không được để trống")
    private String thietBi;
    private LoaiBaoTri loaiBaoTri;
    private LocalDate ngayBatDauDuKien;
    private LocalDate ngayKetThucDuKien;
    private TinhTrangBaoTri tinhTrang;
    private BigDecimal chiPhiDuKien;
    private String nguoiTao;
}
