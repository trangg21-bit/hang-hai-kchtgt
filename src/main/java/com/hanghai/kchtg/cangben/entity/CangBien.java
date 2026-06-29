package com.hanghai.kchtg.cangben.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing a port (Cảng biển) — M-002 root entity.
 * Corresponds to table: cang_bien (Flyway V14).
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The code (maCang) is immutable after creation.
 * </p>
 */
@Entity
@Table(name = "cang_bien",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_cang"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CangBien extends BaseEntity {

    @Column(name = "ma_cang", nullable = false, unique = true, length = 50)
    private String maCang;

    @Column(name = "ten_cang", nullable = false, length = 255)
    private String tenCang;

    @Column(name = "tinh_thanh_pho", length = 100)
    private String tinhThanhPho;

    @Column(name = "vi_do", precision = 10, scale = 6)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 6)
    private BigDecimal kinhDo;

    @Column(name = "dien_tich", precision = 15, scale = 2)
    private BigDecimal dienTich;

    @Column(name = "kha_nang_tiep_nhan", precision = 15, scale = 2)
    private BigDecimal khaNangTiepNhan;

    @Column(name = "trang_thai_hoat_dong", length = 50)
    private String trangThaiHoatDong;

    @Column(name = "trang_thai_phe_duyet", nullable = false, length = 50)
    private String trangThaiPheDuyet;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;
}
