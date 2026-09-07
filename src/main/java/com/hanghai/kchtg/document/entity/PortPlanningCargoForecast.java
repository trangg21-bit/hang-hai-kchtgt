package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Dự báo hàng hóa thông qua cảng — cargo forecast band row of a port planning
 * (F-132, matrix rows 18-24; child table port_planning_cargo_forecast).
 *
 * One row per (classification + cảng/bến/cầu target): three goods bands with
 * weight min/max — Hàng container, Hàng tổng hợp/rời, Hàng lỏng/khí — plus the
 * auto-computed total band (BR-132-02: min &le; max; BR-132-03: total auto).
 */
@Entity
@Table(name = "port_planning_cargo_forecast")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PortPlanningCargoForecast {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "port_planning_id", nullable = false)
    private PortPlanning portPlanning;

    /** Phân loại cảng, bến cảng, cầu cảng (row 18) — free text (D7-FINAL). */
    @Column(name = "classification", length = 100)
    private String classification;

    /** Cảng/bến/cầu record id (row 19) — record picker, soft ref without FK. */
    @Column(name = "port_id")
    private UUID portId;

    /** Denormalized tên cảng/bến/cầu for display (row 19). */
    @Column(name = "port_name", length = 300)
    private String portName;

    /** Hàng container — trọng lượng tối thiểu/tối đa (row 20). */
    @Column(name = "container_min", precision = 15, scale = 2)
    private BigDecimal containerMin;

    @Column(name = "container_max", precision = 15, scale = 2)
    private BigDecimal containerMax;

    /** Hàng tổng hợp, rời — trọng lượng tối thiểu/tối đa (row 21). */
    @Column(name = "bulk_min", precision = 15, scale = 2)
    private BigDecimal bulkMin;

    @Column(name = "bulk_max", precision = 15, scale = 2)
    private BigDecimal bulkMax;

    /** Hàng lỏng, khí — trọng lượng tối thiểu/tối đa (row 22). */
    @Column(name = "liquid_min", precision = 15, scale = 2)
    private BigDecimal liquidMin;

    @Column(name = "liquid_max", precision = 15, scale = 2)
    private BigDecimal liquidMax;

    /** Tổng cộng (row 23) — disabled input, auto-computed by the service. */
    @Column(name = "total_min", precision = 15, scale = 2)
    private BigDecimal totalMin;

    @Column(name = "total_max", precision = 15, scale = 2)
    private BigDecimal totalMax;

    /** Ghi chú dự báo hàng hóa (row 24). */
    @Column(name = "note", length = 500)
    private String note;
}
