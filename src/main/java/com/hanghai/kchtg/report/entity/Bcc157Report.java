package com.hanghai.kchtg.report.entity;

import java.util.UUID;

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
    private String openingOriginalCostCode;

    @Column(name = "tai_san_nguyen_gia_so_du_dau_nam", precision = 20, scale = 4)
    private BigDecimal assetOpeningOriginalCost;

    @Column(name = "ma_so_nguyen_gia_tang_trong_nam", length = 20)
    private String originalCostIncreaseCode;

    @Column(name = "tai_san_nguyen_gia_tang_trong_nam", precision = 20, scale = 4)
    private BigDecimal assetOriginalCostIncrease;

    @Column(name = "ma_so_nguyen_gia_giam_trong_nam", length = 20)
    private String originalCostDecreaseCode;

    @Column(name = "tai_san_nguyen_gia_giam_trong_nam", precision = 20, scale = 4)
    private BigDecimal assetOriginalCostDecrease;

    @Column(name = "ma_so_nguyen_gia_so_du_cuoi_nam", length = 20)
    private String closingOriginalCostCode;

    @Column(name = "tai_san_nguyen_gia_so_du_cuoi_nam", precision = 20, scale = 4)
    private BigDecimal assetClosingOriginalCost;

    // --- Section 2: Giá trị hao mòn lũy kế ---

    @Column(name = "ma_so_gia_tri_hao_mon_so_du_dau_nam", length = 20)
    private String openingAccumulatedDepreciationCode;

    @Column(name = "tai_san_gia_tri_hao_mon_so_du_dau_nam", precision = 20, scale = 4)
    private BigDecimal assetOpeningAccumulatedDepreciation;

    @Column(name = "ma_so_gia_tri_hao_mon_tang_trong_nam", length = 20)
    private String depreciationIncreaseCode;

    @Column(name = "tai_san_gia_tri_hao_mon_tang_trong_nam", precision = 20, scale = 4)
    private BigDecimal assetDepreciationIncrease;

    @Column(name = "ma_so_gia_tri_hao_mon_giam_trong_nam", length = 20)
    private String depreciationDecreaseCode;

    @Column(name = "tai_san_gia_tri_hao_mon_giam_trong_nam", precision = 20, scale = 4)
    private BigDecimal assetDepreciationDecrease;

    @Column(name = "ma_so_gia_tri_hao_mon_so_du_cuoi_nam", length = 20)
    private String closingDepreciationCode;

    @Column(name = "tai_san_gia_tri_hao_mon_so_du_cuoi_nam", precision = 20, scale = 4)
    private BigDecimal assetClosingDepreciation;

    // --- Section 3: Giá trị còn lại ---

    @Column(name = "ma_so_gia_tri_con_lai_tu_ngay_dau_nam", length = 20)
    private String openingResidualValueCode;

    @Column(name = "tai_san_gia_tri_con_lai_tu_ngay_dau_nam", precision = 20, scale = 4)
    private BigDecimal assetOpeningResidualValue;

    @Column(name = "ma_so_gia_tri_con_lai_tu_ngay_cuoi_nam", length = 20)
    private String closingResidualValueCode;

    @Column(name = "tai_san_gia_tri_con_lai_tu_ngay_cuoi_nam", precision = 20, scale = 4)
    private BigDecimal assetClosingResidualValue;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
