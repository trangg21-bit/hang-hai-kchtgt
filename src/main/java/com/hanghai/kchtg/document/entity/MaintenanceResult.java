package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Kết quả bảo trì — maintenance result records.
 * Used by F-130 Quản lý thông tin bảo trì.
 */
@Entity
@Table(name = "maintenance_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_plan_id", nullable = false)
    private MaintenancePlan maintenancePlan;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartDate;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndDate;

    @Column(name = "result_description", columnDefinition = "TEXT")
    private String resultDescription;

    @Column(name = "replaced_parts", length = 500)
    private String replacedParts;

    @Column(name = "downtime_duration")
    private Long downtimeDuration;

    @Column(name = "recorder", length = 100)
    private String recorder;

    @Column(name = "recorded_date")
    private LocalDate recordedDate;
}
