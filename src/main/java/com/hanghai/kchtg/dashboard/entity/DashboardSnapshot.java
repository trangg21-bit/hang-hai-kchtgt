package com.hanghai.kchtg.dashboard.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dashboard_snapshot")
@Getter
@Setter
public class DashboardSnapshot {
    @Id
    private UUID id;

    @Column(name = "snapshot_year")
    private Integer snapshotYear;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "total_count")
    private Long totalCount;

    @Column(name = "operating_count")
    private Long operatingCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "snapshot", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DashboardSnapshotDetail> details = new ArrayList<>();
}
