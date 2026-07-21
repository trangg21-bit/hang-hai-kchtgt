package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for BCC_157 (F-142) report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bcc157Response {

    private UUID id;
    private UUID orgUnitId;
    private Integer reportYear;
    private String nguonDuLieu;
    private String status;

    // --- Section 1: Nguyên giá ---

    private String maSoNguyenGiaSoDuDauNam;
    private BigDecimal taiSanNguyenGiaSoDuDauNam;

    private String maSoNguyenGiaTangTrongNam;
    private BigDecimal taiSanNguyenGiaTangTrongNam;

    private String maSoNguyenGiaGiamTrongNam;
    private BigDecimal taiSanNguyenGiaGiamTrongNam;

    private String maSoNguyenGiaSoDuCuoiNam;
    private BigDecimal taiSanNguyenGiaSoDuCuoiNam;

    // --- Section 2: Giá trị hao mòn lũy kế ---

    private String maSoGiaTriHaoMonSoDuDauNam;
    private BigDecimal taiSanGiaTriHaoMonSoDuDauNam;

    private String maSoGiaTriHaoMonTangTrongNam;
    private BigDecimal taiSanGiaTriHaoMonTangTrongNam;

    private String maSoGiaTriHaoMonGiamTrongNam;
    private BigDecimal taiSanGiaTriHaoMonGiamTrongNam;

    private String maSoGiaTriHaoMonSoDuCuoiNam;
    private BigDecimal taiSanGiaTriHaoMonSoDuCuoiNam;

    // --- Section 3: Giá trị còn lại ---

    private String maSoGiaTriConLaiTuNgayDauNam;
    private BigDecimal taiSanGiaTriConLaiTuNgayDauNam;

    private String maSoGiaTriConLaiTuNgayCuoiNam;
    private BigDecimal taiSanGiaTriConLaiTuNgayCuoiNam;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
