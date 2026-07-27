package com.hanghai.kchtg.radarstation.entity;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity(name = "RadarStationApprovalHistory")
@Table(name = "approval_history")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private UUID id;

    @Column(name = "radar_station_id", nullable = true)
    private UUID radarStationId;

    @Column(name = "approval_level", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalLevel approvalLevel;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approved_by", nullable = false, length = 100)
    private UUID approvedBy;

    @CreatedDate
    @Column(name = "approved_date", nullable = false, updatable = false)
    private LocalDateTime approvedDate;

    @Column(name = "reason", length = 500)
    private String reason;
}
