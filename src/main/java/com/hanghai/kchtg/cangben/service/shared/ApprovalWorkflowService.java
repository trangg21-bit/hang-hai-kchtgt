package com.hanghai.kchtg.cangben.service.shared;

import com.hanghai.kchtg.cangben.entity.ApprovalLog;
import com.hanghai.kchtg.cangben.entity.base.ApprovalStatus;
import com.hanghai.kchtg.cangben.repository.ApprovalLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Approval workflow state machine.
 * <p>
 * Transitions:
 *   - APPROVE(PENDING) â†’ APPROVED + insert PheDuyetLog
 *   - REJECT(PENDING) â†’ REJECTED + insert PheDuyetLog (reason required)
 *   - Any transition from non-PENDING â†’ throws IllegalStateException (422)
 * </p>
 *
 * This is the single source of truth for approval state-machine logic.
 * Each entity's approval service delegates to this class.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalWorkflowService {

    private final ApprovalLogRepository approvalLogRepository;

    /**
     * Transition entity to approved.
     *
     * @param currentStatus current approval status from the entity
     * @param entityType    entity type name for PheDuyetLog
     * @param entityId      entity UUID
     * @param decidedBy     user UUID who approved
     * @return new approval status
     */
    @Transactional
    public ApprovalStatus approve(String currentStatus, String entityType, String entityId, String decidedBy) {
        ApprovalStatus status = parseStatus(currentStatus);

        if (status != ApprovalStatus.PENDING) {
            String msg = String.format("Cannot approve: %s [%s] is in state %s (must be PENDING)",
                    entityType, entityId, status);
            log.warn("Approval rejected: {}", msg);
            throw new IllegalStateException(msg);
        }

        log.info("APPROVE: {} [{}] approved by {}", entityType, entityId, decidedBy);

        // Insert PheDuyetLog record
        ApprovalLog approvalLog = ApprovalLog.builder()
                .id(UUID.randomUUID())
                .entityType(entityType)
                .entityId(entityId)
                .decision("APPROVED")
                .reason(null)
                .decidedBy(decidedBy)
                .decidedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        approvalLogRepository.save(approvalLog);

        return ApprovalStatus.APPROVED;
    }

    /**
     * Transition entity to rejected.
     *
     * @param currentStatus current approval status from the entity
     * @param entityType    entity type name for PheDuyetLog
     * @param entityId      entity UUID
     * @param decidedBy     user UUID who rejected
     * @param reason        rejection reason (must not be blank)
     * @return new approval status
     */
    @Transactional
    public ApprovalStatus reject(String currentStatus, String entityType, String entityId,
                                  String decidedBy, String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("Reason is required for reject action");
        }

        ApprovalStatus status = parseStatus(currentStatus);

        if (status != ApprovalStatus.PENDING) {
            String msg = String.format("Cannot reject: %s [%s] is in state %s (must be PENDING)",
                    entityType, entityId, status);
            log.warn("Reject rejected: {}", msg);
            throw new IllegalStateException(msg);
        }

        log.info("REJECT: {} [{}] rejected by {} â€” reason: {}", entityType, entityId, decidedBy, reason);

        // Insert PheDuyetLog record
        ApprovalLog rejectionLog = ApprovalLog.builder()
                .id(UUID.randomUUID())
                .entityType(entityType)
                .entityId(entityId)
                .decision("REJECTED")
                .reason(reason)
                .decidedBy(decidedBy)
                .decidedAt(LocalDateTime.now())
                .createdAt(LocalDateTime.now())
                .build();
        approvalLogRepository.save(rejectionLog);

        return ApprovalStatus.REJECTED;
    }

    /**
     * Reset approval status to PENDING when entity is updated
     * (must re-approve after changes).
     *
     * @param currentStatus current approval status from the entity
     * @return new approval status (always PENDING)
     */
    public ApprovalStatus resetToPending(String currentStatus) {
        parseStatus(currentStatus); // validate it exists
        return ApprovalStatus.PENDING;
    }

    private ApprovalStatus parseStatus(String raw) {
        try {
            return ApprovalStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid approval status: " + raw);
        }
    }
}
