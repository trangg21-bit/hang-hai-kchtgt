package com.hanghai.kchtg.port.service.shared;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
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
 *   - APPROVE(PENDING) → APPROVED + insert InfrastructureHistory / PheDuyetLog
 *   - REJECT(PENDING) → REJECTED + insert InfrastructureHistory / PheDuyetLog (reason required)
 *   - Any transition from non-PENDING → throws IllegalStateException (422)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ApprovalWorkflowService {

    private final ApprovalLogRepository approvalLogRepository;
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

        UUID userUuid = null;
        try {
            if (decidedBy != null) userUuid = UUID.fromString(decidedBy);
        } catch (Exception ignored) {}

        UUID refUuid = null;
        try {
            if (entityId != null) refUuid = UUID.fromString(entityId);
        } catch (Exception ignored) {}

        if (refUuid != null && historyRepository != null) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(refUuid)
                    .refType(ChangeHistoryService.resolveInfrastructureType(entityType))
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.APPROVED)
                    .approvedBy(userUuid)
                    .approvedDate(LocalDateTime.now())
                    .reason("Phê duyệt hồ sơ")
                    .changedField("Trạng thái phê duyệt")
                    .previousValue(currentStatus)
                    .newValue(ApprovalStatus.APPROVED.getLabel())
                    .build());
        }

        if (approvalLogRepository != null) {
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
            // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; user yêu cầu không ghi lịch sử phê duyệt
            // approvalLogRepository.save(approvalLog);
        }

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

        UUID userUuid = null;
        try {
            if (decidedBy != null) userUuid = UUID.fromString(decidedBy);
        } catch (Exception ignored) {}

        UUID refUuid = null;
        try {
            if (entityId != null) refUuid = UUID.fromString(entityId);
        } catch (Exception ignored) {}

        if (refUuid != null && historyRepository != null) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(refUuid)
                    .refType(ChangeHistoryService.resolveInfrastructureType(entityType))
                    .approvalLevel(ApprovalLevel.LEVEL_1)
                    .status(InfrastructureHistoryStatus.REJECTED)
                    .approvedBy(userUuid)
                    .approvedDate(LocalDateTime.now())
                    .reason(reason)
                    .changedField("Trạng thái phê duyệt")
                    .previousValue(currentStatus)
                    .newValue(ApprovalStatus.REJECTED.getLabel())
                    .build());
        }

        if (approvalLogRepository != null) {
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
            // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; user yêu cầu không ghi lịch sử phê duyệt
            // approvalLogRepository.save(rejectionLog);
        }

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
