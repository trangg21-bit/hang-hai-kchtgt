package com.hanghai.kchtg.tai.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "base_tai")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@Accessors(chain = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@SQLRestriction("deleted = false")
public abstract class BaseTai {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false, length = 50)
    private String code;

    @Column(nullable = false, length = 200)
    private String name;

    @Enumerated(EnumType.STRING)
    private TaiType taiType;

    @Enumerated(EnumType.STRING)
    private TaiStatus status;

    @Enumerated(EnumType.STRING)
    private TaiApprovalStatus approvalStatus;

    private UUID approvedBy;
    private Instant approvedAt;

    @Column(length = 1000)
    private String approvedRemarks;

    private UUID unapprovedBy;
    private Instant unapprovedAt;

    @Column(length = 1000)
    private String unapprovedRemarks;

    private Boolean deleted = false;
    private UUID deletedBy;
    private Instant deletedAt;

    private Instant createdAt;
    private UUID createdBy;
    private Instant updatedAt;
    private UUID updatedBy;

    @Version
    private Integer lockVersion;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public void softDelete() {
        this.deleted = true;
    }
}
