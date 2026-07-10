package com.hanghai.kchtg.cangben.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDongConverter;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyetConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing a water zone (Vùng nước) — child of CangBien.
 * Corresponds to table: vung_nuoc (Flyway V18).
 * FK: cang_bien_id → cang_bien.id (NOT NULL)
 */
@Entity
@Table(name = "vung_nuoc",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_vung_nuoc"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class VungNuoc extends BaseEntity {

    @Column(name = "ma_vung_nuoc", nullable = false, unique = true, length = 50)
    private String maVungNuoc;

    @Column(name = "ten_vung_nuoc", nullable = false, length = 255)
    private String tenVungNuoc;

    @Column(name = "cang_bien_id", nullable = false)
    private UUID cangBienId;

    @Column(name = "dien_tich", precision = 15, scale = 2)
    private BigDecimal dienTich;

    @Column(name = "do_sau_max", precision = 10, scale = 2)
    private BigDecimal doSauMax;

    @Column(name = "do_sau_trung_binh", precision = 10, scale = 2)
    private BigDecimal doSauTrungBinh;

    @Column(name = "loai_vung_nuoc", length = 100)
    private String loaiVungNuoc;

    @Column(name = "trang_thai_hoat_dong")
    @Convert(converter = TrangThaiHoatDongConverter.class)
    private TrangThaiHoatDong trangThaiHoatDong;

    @Column(name = "trang_thai_phe_duyet", nullable = false)
    @Convert(converter = TrangThaiPheDuyetConverter.class)
    private TrangThaiPheDuyet trangThaiPheDuyet;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "bieu_tuong_id")
    private java.util.UUID bieuTuongId;
}
