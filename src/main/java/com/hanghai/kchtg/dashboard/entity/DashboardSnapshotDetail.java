package com.hanghai.kchtg.dashboard.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "dashboard_snapshot_detail")
@Getter
@Setter
public class DashboardSnapshotDetail {
    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "snapshot_id", nullable = false)
    private DashboardSnapshot snapshot;

    @Column(name = "kcht_type")
    private String kchtType;

    @Column(name = "total_count")
    private Long totalCount;

    @Column(name = "operating_count")
    private Long operatingCount;

    @Column(name = "pending_count")
    private Long pendingCount;

    @Column(name = "suspended_count")
    private Long suspendedCount;

    @Column(name = "sequence_no")
    private Integer sequenceNo;
}
