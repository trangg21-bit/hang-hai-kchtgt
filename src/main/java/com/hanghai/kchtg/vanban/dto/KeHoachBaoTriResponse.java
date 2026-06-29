package com.hanghai.kchtg.vanban.dto;

import com.hanghai.kchtg.vanban.entity.LoaiBaoTri;
import com.hanghai.kchtg.vanban.entity.TinhTrangBaoTri;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for KeHoachBaoTri.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KeHoachBaoTriResponse {

    private Long id;
    private String thietBi;
    private LoaiBaoTri loaiBaoTri;
    private LocalDate ngayBatDauDuKien;
    private LocalDate ngayKetThucDuKien;
    private TinhTrangBaoTri tinhTrang;
    private BigDecimal chiPhiDuKien;
    private String nguoiTao;
    private LocalDateTime ngayTao;
    private String nguoiSuaDoi;
    private LocalDateTime ngaySuaDoi;
}
