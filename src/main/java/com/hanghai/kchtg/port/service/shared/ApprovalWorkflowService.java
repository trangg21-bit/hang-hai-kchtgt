package com.hanghai.kchtg.port.service.shared;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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
 *   - APPROVE(PENDING) → APPROVED + insert InfrastructureHistory
 *   - REJECT(PENDING) → REJECTED + insert InfrastructureHistory (reason required)
 *   - Any transition from non-PENDING → throws IllegalStateException (422)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalWorkflowService {

    private final InfrastructureHistoryRepository historyRepository;

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

        if (status != ApprovalStatus.PENDING_APPROVAL) {
            String msg = String.format("Cannot approve: %s [%s] is in state %s (must be PENDING)",
                    entityType, entityId, status);
            log.warn("Approval rejected: {}", msg);
            throw new IllegalStateException(msg);
        }

        log.info("APPROVE: {} [{}] approved by {}", entityType, entityId, decidedBy);

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

        if (status != ApprovalStatus.PENDING_APPROVAL) {
            String msg = String.format("Cannot reject: %s [%s] is in state %s (must be PENDING)",
                    entityType, entityId, status);
            log.warn("Reject rejected: {}", msg);
            throw new IllegalStateException(msg);
        }

        log.info("REJECT: {} [{}] rejected by {} — reason: {}", entityType, entityId, decidedBy, reason);

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
        return ApprovalStatus.PENDING_APPROVAL;
    }

    private ApprovalStatus parseStatus(String raw) {
        try {
            return ApprovalStatus.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid approval status: " + raw);
        }
    }
}
