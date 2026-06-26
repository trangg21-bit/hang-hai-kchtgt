package com.hanghai.kchtg.report.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Tide data entity for F-101: Báo cáo tổng hợp thủy văn.
 * Records hydrological measurements at tide stations.
 */
@Entity
@Table(name = "tide_data")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TideData extends BaseEntity {

    @Column(name = "station_code", nullable = false, length = 50)
    private String stationCode;

    @Column(name = "water_level")
    private Double waterLevel;

    @Column(name = "flow_rate")
    private Double flowRate;

    @Column(name = "tide_level")
    private Double tideLevel;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;
}
