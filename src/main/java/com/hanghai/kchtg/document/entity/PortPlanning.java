package com.hanghai.kchtg.document.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Quy hoạch bến cảng — port planning records.
 * Used by F-132 Quản lý quy hoạch bến cảng.
 */
@Entity
@Table(name = "port_planning")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortPlanning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "project_name", nullable = false, length = 200)
    private String projectName;

    @Column(name = "approval_authority", length = 200)
    private String approvalAuthority;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "application_scope", length = 500)
    private String applicationScope;

    @Column(name = "map_scale", length = 50)
    private String mapScale;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30)
    private PlanningStatus status;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "portPlanning", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<PlanningCategory> planningCategories = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
