package com.hanghai.kchtg.statistics.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.Instant;

/**
 * Audit trail for form approval lifecycle (submit, approve, reject, draft).
 */
@Entity
@Table(name = "form_approval_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormApprovalHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "form_id")
    private Long formId;

    /** Action: SUBMIT, APPROVE, REJECT, DRAFT */
    @Column(name = "action")
    private String action;

    /** User who performed the action */
    @Column(name = "actor")
    private String actor;

    /** Optional comment on the action */
    @Column(name = "comments", length = 1000)
    private String comments;

    @CreationTimestamp
    private Instant createdAt;
}
