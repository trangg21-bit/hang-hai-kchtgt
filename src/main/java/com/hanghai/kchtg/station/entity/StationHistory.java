package com.hanghai.kchtg.station.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "station_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class StationHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String tramType;

    private UUID entityId;

    private String actionType;

    private String changedField;

    @Column(length = 4000)
    private String previousValue;

    @Column(length = 4000)
    private String newValue;

    private Long changedBy;
    private LocalDateTime changedAt;

    @Column(length = 1000)
    private String reason;

    @Column(length = 4000)
    private String diffData;
}
