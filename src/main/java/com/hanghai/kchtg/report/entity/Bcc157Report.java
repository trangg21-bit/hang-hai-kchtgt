package com.hanghai.kchtg.report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity mapped to bcc157_report table.
 * BCC_157 (F-142) — Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng
 * đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng.
 */
@Entity
@Table(name = "bcc157_report", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"org_unit_id", "report_year", "nguon_du_lieu"})
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bcc157Report {

    @Id
    @GeneratedValue
    @Column(name = "id", columnDefinition = "UUID")
    private UUID id;

    @Column(name = "org_unit_id", nullable = false)
    private UUID orgUnitId;

    @Column(name = "report_year", nullable = false)
    private Integer reportYear;

    @Column(name = "nguon_du_lieu", length = 10)
    private String nguonDuLieu;

    @Column(name = "status", length = 20)
    private String status;

    // --- Section 1: Nguyên giá ---

    @Column(name = "ma_so_nguyen_gia_so_du_dau_nam", length = 20)
    private String maSoNguyenGiaSoDuDauNam;

    @Column(name = "tai_san_nguyen_gia_so_du_dau_nam", precision = 20, scale = 4)
    private BigDecimal taiSanNguyenGiaSoDuDauNam;

    @Column(name = "ma_so_nguyen_gia_tang_trong_nam", length = 20)
    private String maSoNguyenGiaTangTrongNam;

    @Column(name = "tai_san_nguyen_gia_tang_trong_nam", precision = 20, scale = 4)
    private BigDecimal taiSanNguyenGiaTangTrongNam;

    @Column(name = "ma_so_nguyen_gia_giam_trong_nam", length = 20)
    private String maSoNguyenGiaGiamTrongNam;

    @Column(name = "tai_san_nguyen_gia_giam_trong_nam", precision = 20, scale = 4)
    private BigDecimal taiSanNguyenGiaGiamTrongNam;

    @Column(name = "ma_so_nguyen_gia_so_du_cuoi_nam", length = 20)
    private String maSoNguyenGiaSoDuCuoiNam;

    @Column(name = "tai_san_nguyen_gia_so_du_cuoi_nam", precision = 20, scale = 4)
    private BigDecimal taiSanNguyenGiaSoDuCuoiNam;

    // --- Section 2: Giá trị hao mòn lũy kế ---

    @Column(name = "ma_so_gia_tri_hao_mon_so_du_dau_nam", length = 20)
    private String maSoGiaTriHaoMonSoDuDauNam;

    @Column(name = "tai_san_gia_tri_hao_mon_so_du_dau_nam", precision = 20, scale = 4)
    private BigDecimal taiSanGiaTriHaoMonSoDuDauNam;

    @Column(name = "ma_so_gia_tri_hao_mon_tang_trong_nam", length = 20)
    private String maSoGiaTriHaoMonTangTrongNam;

    @Column(name = "tai_san_gia_tri_hao_mon_tang_trong_nam", precision = 20, scale = 4)
    private BigDecimal taiSanGiaTriHaoMonTangTrongNam;

    @Column(name = "ma_so_gia_tri_hao_mon_giam_trong_nam", length = 20)
    private String maSoGiaTriHaoMonGiamTrongNam;

    @Column(name = "tai_san_gia_tri_hao_mon_giam_trong_nam", precision = 20, scale = 4)
    private BigDecimal taiSanGiaTriHaoMonGiamTrongNam;

    @Column(name = "ma_so_gia_tri_hao_mon_so_du_cuoi_nam", length = 20)
    private String maSoGiaTriHaoMonSoDuCuoiNam;

    @Column(name = "tai_san_gia_tri_hao_mon_so_du_cuoi_nam", precision = 20, scale = 4)
    private BigDecimal taiSanGiaTriHaoMonSoDuCuoiNam;

    // --- Section 3: Giá trị còn lại ---

    @Column(name = "ma_so_gia_tri_con_lai_tu_ngay_dau_nam", length = 20)
    private String maSoGiaTriConLaiTuNgayDauNam;

    @Column(name = "tai_san_gia_tri_con_lai_tu_ngay_dau_nam", precision = 20, scale = 4)
    private BigDecimal taiSanGiaTriConLaiTuNgayDauNam;

    @Column(name = "ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam", length = 20)
    private String maSoGiaTriConLaiTuNgayCuoiNam;

    @Column(name = "tai_san_gia_tri_con_lai_tu_ngay_cuoi_nam", precision = 20, scale = 4)
    private BigDecimal taiSanGiaTriConLaiTuNgayCuoiNam;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
