package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Kế hoạch vận hành — operational planning records.
 * Used by F-129 Quản lý thông tin vận hành.
 */
@Entity
@Table(name = "operation_plans")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "operation_date")
    private LocalDate operationDate;

    @Column(name = "pier", length = 200)
    private String pier;

    @Column(name = "equipment", length = 200)
    private String equipment;

    @Column(name = "start_time")
    private LocalTime startTime;

    @Column(name = "end_time")
    private LocalTime endTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private OperationStatus status;

    @Column(name = "created_by")
    private UUID createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdDate;

    @Column(name = "updated_by")
    private UUID updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedDate;

    @OneToMany(mappedBy = "operationPlan", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<OperationDetail> operationDetails = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdDate = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
