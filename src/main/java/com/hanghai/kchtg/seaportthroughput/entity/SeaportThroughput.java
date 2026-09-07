package com.hanghai.kchtg.seaportthroughput.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Sản lượng cảng biển (M-028 / F-301) — 1 dòng = 1 đơn vị quản lý x 1 tháng tổng hợp.
 * Schema phẳng: 24 cột chỉ tiêu DECIMAL (3 nhóm trong nước / ngoài nước / theo tuyến x 8) + passenger_trips,
 * khớp 1:1 Excel cụm #33 / URD III.7.53. Kế thừa BaseApprovableEntity (DataScope org_unit_id,
 * phê duyệt 2 cấp, audit).
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
@EqualsAndHashCode(callSuper = false)
@Entity
@Table(name = "seaport_throughput")
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class SeaportThroughput extends BaseApprovableEntity {

    /** Tháng tổng hợp sản lượng — chỉ lưu ngày đầu tháng (YYYY-MM-01); unique (org_unit_id, report_month). */
    @Column(name = "report_month", nullable = false)
    private LocalDate reportMonth;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    // ── Nhóm trong nước (domestic_*) ──
    @Column(name = "domestic_container_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticContainerTon;
    @Column(name = "domestic_container_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticContainerTonKm;
    @Column(name = "domestic_dry_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticDryTon;
    @Column(name = "domestic_dry_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticDryTonKm;
    @Column(name = "domestic_liquid_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticLiquidTon;
    @Column(name = "domestic_liquid_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticLiquidTonKm;
    @Column(name = "domestic_other_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticOtherTon;
    @Column(name = "domestic_other_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal domesticOtherTonKm;

    // ── Nhóm ngoài nước (foreign_*) ──
    @Column(name = "foreign_container_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignContainerTon;
    @Column(name = "foreign_container_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignContainerTonKm;
    @Column(name = "foreign_dry_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignDryTon;
    @Column(name = "foreign_dry_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignDryTonKm;
    @Column(name = "foreign_liquid_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignLiquidTon;
    @Column(name = "foreign_liquid_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignLiquidTonKm;
    @Column(name = "foreign_other_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignOtherTon;
    @Column(name = "foreign_other_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal foreignOtherTonKm;

    // ── Nhóm theo tuyến vận chuyển (route_*) ──
    @Column(name = "route_container_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeContainerTon;
    @Column(name = "route_container_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeContainerTonKm;
    @Column(name = "route_dry_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeDryTon;
    @Column(name = "route_dry_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeDryTonKm;
    @Column(name = "route_liquid_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeLiquidTon;
    @Column(name = "route_liquid_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeLiquidTonKm;
    @Column(name = "route_other_ton", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeOtherTon;
    @Column(name = "route_other_ton_km", nullable = false, precision = 18, scale = 2)
    private BigDecimal routeOtherTonKm;

    /** Lượt hành khách trong tháng (STT 29). */
    @Column(name = "passenger_trips", nullable = false)
    private long passengerTrips;
}
