package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * File đính kèm kế hoạch vận hành (PLAN) và file xác nhận (CONFIRMATION).
 */
@Entity
@Table(name = "operation_plan_file")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class OperationPlanFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "operation_plan_id")
    private UUID operationPlanId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "operation_plan_id", insertable = false, updatable = false)
    private OperationPlan operationPlan;

    @Column(name = "file_category", length = 20)
    private String fileCategory;

    @Column(name = "file_type", length = 50)
    private String fileType;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "uploaded_by")
    private UUID uploadedBy;

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onCreate() {
        this.uploadedAt = LocalDateTime.now();
    }
}
