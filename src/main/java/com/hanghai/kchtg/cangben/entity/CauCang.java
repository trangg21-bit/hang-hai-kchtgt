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
 * Entity representing a crane/gantry (Cầu cảng) — child of BenCang.
 * Corresponds to table: cau_cang (Flyway V16).
 * FK: ben_cang_id → ben_cang.id (NOT NULL)
 */
@Entity
@Table(name = "cau_cang",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_cau"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CauCang extends BaseEntity {

    @Column(name = "ma_cau", nullable = false, unique = true, length = 50)
    private String maCau;

    @Column(name = "ten_cau", nullable = false, length = 255)
    private String tenCau;

    @Column(name = "ben_cang_id", nullable = false)
    private UUID benCangId;

    @Column(name = "chieu_dai", precision = 15, scale = 2)
    private BigDecimal chieuDai;

    @Column(name = "tai_trong", precision = 15, scale = 2)
    private BigDecimal taiTrong;

    @Column(name = "loai_cau", length = 100)
    private String loaiCau;

    @Column(name = "trang_thai_hoat_dong", length = 50)
    private String trangThaiHoatDong;

    @Column(name = "trang_thai_phe_duyet", nullable = false, length = 50)
    private String trangThaiPheDuyet;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;
}
