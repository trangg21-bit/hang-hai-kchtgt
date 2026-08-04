package com.hanghai.kchtg.common.entity;

import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "approval_history", indexes = {
        @Index(name = "idx_approval_history_ref", columnList = "ref_type, ref_id")
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "ref_type", nullable = false)
    private InfrastructureType refType;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_level", nullable = false)
    private ApprovalLevel approvalLevel;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status", nullable = false)
    private ApprovalHistoryStatus status;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @CreatedDate
    @Column(name = "approved_date", nullable = false, updatable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime approvedDate;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "changed_field", length = 1000)
    private String changedField;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;
}
