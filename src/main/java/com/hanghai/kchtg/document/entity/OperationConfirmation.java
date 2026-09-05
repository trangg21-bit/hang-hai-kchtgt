package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Xác nhận vận hành khai thác (F-129 #17–26) — chỉ ghi khi kế hoạch ở trạng thái HOAN_THANH.
 */
@Entity
@Table(name = "operation_confirmation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class OperationConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "operation_plan_id")
    private UUID operationPlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_plan_id", insertable = false, updatable = false)
    private OperationPlan operationPlan;

    @Column(name = "actual_start_date")
    private LocalDateTime actualStartDate;

    @Column(name = "actual_end_date")
    private LocalDateTime actualEndDate;

    @Column(name = "operating_time", length = 100)
    private String operatingTime;

    @Column(name = "operating_status", length = 100)
    private String operatingStatus;

    @Column(name = "downtime", length = 100)
    private String downtime;

    @Column(name = "incident_frequency", length = 100)
    private String incidentFrequency;

    @Column(name = "max_capacity", precision = 15, scale = 2)
    private BigDecimal maxCapacity;

    @Column(name = "actual_capacity", precision = 15, scale = 2)
    private BigDecimal actualCapacity;

    @Column(name = "result_content", columnDefinition = "TEXT")
    private String resultContent;

    @Column(name = "result_note", columnDefinition = "TEXT")
    private String resultNote;

    @Column(name = "recorder", length = 100)
    private String recorder;

    @Column(name = "recorded_date")
    private LocalDate recordedDate;
}
