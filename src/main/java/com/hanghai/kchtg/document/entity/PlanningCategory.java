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
 * Danh mục quy hoạch chi tiết — planning target row of a port planning
 * (F-132, matrix rows 25-38; child table planning_categories).
 *
 * Legacy columns (category_name/unit_of_measure/planned_value/actual_value/status)
 * stay mapped; the phase column models Hiện trạng / Sau quy hoạch, extended with
 * the §4.1 detail columns (D9 — table/entity names kept, no rename).
 */
@Entity
@Table(name = "planning_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PlanningCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "port_planning_id", nullable = false)
    private PortPlanning portPlanning;

    /** Giai đoạn: Hiện trạng / Sau quy hoạch (rows 25-38 group header). */
    @Column(name = "phase", length = 50)
    private String phase;

    @Column(name = "category_name", length = 200)
    private String categoryName;

    @Column(name = "unit_of_measure", length = 50)
    private String unitOfMeasure;

    @Column(name = "planned_value", precision = 15, scale = 2)
    private BigDecimal plannedValue;

    @Column(name = "actual_value", precision = 15, scale = 2)
    private BigDecimal actualValue;

    @Column(name = "status", length = 50)
    private String status;

    /** Phân loại cảng, bến cảng, cầu cảng (row 25) — free text (D7-FINAL). */
    @Column(name = "port_category", length = 100)
    private String portCategory;

    /** Cảng/bến/cầu record id (row 26) — record picker, soft ref without FK. */
    @Column(name = "port_id")
    private UUID portId;

    /** Denormalized tên cảng/bến/cầu for display (row 26). */
    @Column(name = "port_name", length = 300)
    private String portName;

    /** Công năng khai thác (row 27) — free text (D7-FINAL). */
    @Column(name = "exploitation_function", length = 200)
    private String exploitationFunction;

    /** Phân loại (row 28) — free text (D7-FINAL). */
    @Column(name = "classification", length = 100)
    private String classification;

    /** Số lượng cầu cảng (row 30). */
    @Column(name = "berth_count")
    private Integer berthCount;

    /** Chiều dài (m) (row 31). */
    @Column(name = "length", precision = 15, scale = 2)
    private BigDecimal lengthM;

    /** Cỡ tàu (tấn) / Dự kiến cỡ tàu (row 32 / 35). */
    @Column(name = "ship_size", length = 100)
    private String shipSize;

    /** Dự kiến công suất (Triệu tấn) (row 36). */
    @Column(name = "capacity", precision = 15, scale = 2)
    private BigDecimal capacity;

    /** Diện tích vùng đất (ha) (row 37). */
    @Column(name = "land_area", precision = 15, scale = 2)
    private BigDecimal landArea;

    /** Diện tích vùng nước (ha) (row 38). */
    @Column(name = "water_area", precision = 15, scale = 2)
    private BigDecimal waterArea;

    /** Ghi chú quy hoạch chi tiết (row 29). */
    @Column(name = "note", length = 500)
    private String note;
}
