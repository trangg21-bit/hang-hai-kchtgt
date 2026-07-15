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
 * Entity representing an inland port (Cảng cạn) — independent, no parent FK.
 * Corresponds to table: cang_can (Flyway V17).
 */
@Entity
@Table(name = "cang_can",
        uniqueConstraints = @UniqueConstraint(columnNames = "ma_cang_can"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CangCan extends BaseEntity {

    @Column(name = "ma_cang_can", nullable = false, unique = true, length = 50)
    private String maCangCan;

    @Column(name = "ten_cang_can", nullable = false, length = 255)
    private String tenCangCan;

    @Column(name = "tinh_thanh_pho", length = 100)
    private String tinhThanhPho;

    @Column(name = "vi_do", precision = 10, scale = 6)
    private BigDecimal viDo;

    @Column(name = "kinh_do", precision = 10, scale = 6)
    private BigDecimal kinhDo;

    @Column(name = "dien_tich", precision = 15, scale = 2)
    private BigDecimal dienTich;

    @Column(name = "cong_suat_teu", precision = 15, scale = 2)
    private BigDecimal congSuatTEU;

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

    @Column(name = "spatial_id")
    private java.util.UUID khongGianId;
}
