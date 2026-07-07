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
 * Entity representing a berth (Bến cảng) — child of CangBien.
 * Corresponds to table: ben_cang (Flyway V15).
 * FK: cang_bien_id → cang_bien.id (NOT NULL)
 */
@Entity
@Table(name = "ben_cang",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_ben"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BenCang extends BaseEntity {

    @Column(name = "ma_ben", nullable = false, unique = true, length = 50)
    private String maBen;

    @Column(name = "ten_ben", nullable = false, length = 255)
    private String tenBen;

    @Column(name = "cang_bien_id", nullable = false)
    private UUID cangBienId;

    @Column(name = "tuyen_duong_thuy", length = 255)
    private String tuyenDuongThuy;

    @Column(name = "vi_do", precision = 10, scale = 6)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 6)
    private BigDecimal kinhDo;

    @Column(name = "chieu_dai", precision = 15, scale = 2)
    private BigDecimal chieuDai;

    @Column(name = "chieu_rong", precision = 15, scale = 2)
    private BigDecimal chieuRong;

    @Column(name = "loai_ben", length = 100)
    private String loaiBen;

    @Column(name = "do_sau_luong", precision = 10, scale = 2)
    private BigDecimal doSauLuong;

    @Column(name = "trang_thai_hoat_dong", length = 50)
    private String trangThaiHoatDong;

    @Column(name = "trang_thai_phe_duyet", nullable = false, length = 50)
    private String trangThaiPheDuyet;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;
}
