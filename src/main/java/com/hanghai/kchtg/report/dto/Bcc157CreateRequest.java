package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Create request DTO for BCC_157 (F-142) report.
 * Matches the 20 report fields from V1 Bcc157Dto.Bcc157ZlstComReport.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bcc157CreateRequest {

    private UUID orgUnitId;
    private Integer reportYear;
    private String nguonDuLieu;

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
}
