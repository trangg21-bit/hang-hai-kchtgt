package com.hanghai.kchtg.vts.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity(name = "VTSApprovalHistory")
@Table(name = "approval_history")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "he_thong_vts_id", nullable = true)
    private java.util.UUID heThongVTSId;

    @Column(name = "approval_level", nullable = false)
    private Integer approvalLevel;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "approved_by", nullable = false, length = 100)
    private String approvedBy;

    @CreatedDate
    @Column(name = "approved_date", nullable = false, updatable = false)
    private LocalDateTime approvedDate;

    @Column(name = "reason", length = 500)
    private String reason;
}
