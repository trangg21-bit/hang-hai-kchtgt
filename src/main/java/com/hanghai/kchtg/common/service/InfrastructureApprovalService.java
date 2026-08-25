package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitRank;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Dịch vụ xử lý phê duyệt 2 cấp tập trung dùng chung cho toàn bộ 28 loại Kết cấu hạ tầng hàng hải (KCHT)
 * tuân thủ đặc tả thống nhất M-1006 (QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InfrastructureApprovalService {

    private final ApprovalHistoryRepository historyRepository;
    private final UserRepository userRepository;

    /**
     * Gửi duyệt hồ sơ KCHT (T02, T03, T04, T05, T10, T11 trong ma trận chuyển trạng thái M-1006).
     * Áp dụng Rule 14: Người gửi thuộc cấp Cục (orgUnit.level == 1) -> Vào thẳng "Chờ Cục duyệt" (APPROVED_LEVEL1).
     * Người gửi thuộc cấp Cảng vụ/Chi cục -> Vào "Chờ Cảng vụ / Chi cục duyệt" (PENDING_APPROVAL).
     */
    @Transactional
    public void submit(ApprovableEntity entity, InfrastructureType refType, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus == null) {
            currentStatus = ApprovalStatus.DRAFT;
        }

        // Chỉ được submit từ DRAFT, PROPOSED hoặc các trạng thái bị từ chối
        boolean canSubmit = currentStatus == ApprovalStatus.DRAFT
                || currentStatus == ApprovalStatus.PROPOSED
                || currentStatus == ApprovalStatus.REJECTED_LEVEL1
                || currentStatus == ApprovalStatus.REJECTED_LEVEL2
                || currentStatus == ApprovalStatus.REJECTED;

        if (!canSubmit) {
            throw new IllegalStateException("Chỉ có thể gửi duyệt hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về. Trạng thái hiện tại: "
                    + currentStatus.getLabel());
        }

        // Kiểm tra cấp đơn vị của người gửi (Rule 14)
        boolean isDepartmentLevel = isDepartmentLevelUser(userId);

        ApprovalStatus nextStatus;
        if (isDepartmentLevel) {
            // Cấp Cục gửi -> Bỏ qua vòng 1, sang thẳng Chờ Cục duyệt (APPROVED_LEVEL1)
            nextStatus = ApprovalStatus.APPROVED_LEVEL1;
        } else {
            // Cấp Cảng vụ / Chi cục gửi -> Chờ Cảng vụ duyệt (PENDING_APPROVAL)
            nextStatus = ApprovalStatus.PENDING_APPROVAL;
        }

        entity.setApprovalStatus(nextStatus);
        entity.setRejectionReason(null);

        // Ghi thời điểm + người gửi phê duyệt (#50, #51) — refresh cả khi gửi lại sau từ chối
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(userId);

        // Reset approver level nếu gửi lại từ đầu
        if (nextStatus == ApprovalStatus.PENDING_APPROVAL) {
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
        }
        entity.setApproverLevel2(null);
        entity.setApprovedDateLevel2(null);

        // Ghi lịch sử phê duyệt
        recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_0,
                ApprovalHistoryStatus.PROPOSED, userId, null,
                "Trạng thái phê duyệt", currentStatus.getLabel(), nextStatus.getLabel());
    }

    /**
     * Phê duyệt Vòng 1 (Cảng vụ / Chi cục) (T06, T07).
     */
    @Transactional
    public void approveC1(ApprovableEntity entity, InfrastructureType refType, String decision, String reason, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus != ApprovalStatus.PENDING_APPROVAL && currentStatus != ApprovalStatus.PROPOSED) {
            throw new IllegalStateException("Chỉ có thể phê duyệt C1 từ trạng thái Chờ Cảng vụ / Chi cục duyệt (PENDING_APPROVAL)");
        }

        // Quy tắc chống tự duyệt (BR-015): Người tạo hồ sơ không được tự phê duyệt
        if (entity.getCreatedBy() != null && entity.getCreatedBy().equals(userId)) {
            throw new IllegalStateException("Bạn không thể phê duyệt bản do chính mình gửi (4-eyes principle)");
        }

        if (isRejectDecision(decision)) {
            // Từ chối vòng 1 (T07) - Bắt buộc lý do
            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
            }
            entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
            entity.setRejectionReason(reason.trim());
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
            // #54 — nội dung trả về vẫn được ghi
            entity.setLevel1ApprovalContent(reason.trim());

            recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_1,
                    ApprovalHistoryStatus.REJECTED, userId, reason.trim(),
                    "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.REJECTED_LEVEL1.getLabel());
        } else if (isApproveDecision(decision)) {
            // Đồng ý vòng 1 (T06) -> Chuyển sang Chờ Cục duyệt (APPROVED_LEVEL1)
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
            entity.setRejectionReason(null);
            entity.setApproverLevel1(userId);
            entity.setApprovedDateLevel1(LocalDateTime.now());
            // #54 — nội dung phê duyệt
            entity.setLevel1ApprovalContent(reason);

            recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_1,
                    ApprovalHistoryStatus.APPROVED, userId, reason,
                    "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.APPROVED_LEVEL1.getLabel());
        } else {
            throw new IllegalArgumentException("Quyết định phê duyệt C1 không hợp lệ: " + decision);
        }
    }

    /**
     * Phê duyệt Vòng 2 (Cục) (T08, T09).
     * Áp dụng nguyên tắc 4-eyes: Người duyệt C2 không được trùng người duyệt C1.
     */
    @Transactional
    public void approveC2(ApprovableEntity entity, InfrastructureType refType, String decision, String reason, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus != ApprovalStatus.APPROVED_LEVEL1
                && !(currentStatus == ApprovalStatus.PENDING_APPROVAL && entity.getApproverLevel1() != null)) {
            throw new IllegalStateException("Chỉ có thể phê duyệt C2 từ trạng thái Chờ Cục duyệt (APPROVED_LEVEL1)");
        }

        // Quy tắc 4-eyes: Người duyệt C2 không được trùng người duyệt C1
        UUID c1Approver = entity.getApproverLevel1();
        if (c1Approver != null && c1Approver.equals(userId)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (4-eyes principle)");
        }

        // Quy tắc chống tự duyệt: Người tạo hồ sơ không được tự duyệt
        if (entity.getCreatedBy() != null && entity.getCreatedBy().equals(userId)) {
            throw new IllegalStateException("Người tạo hồ sơ không được tự phê duyệt (4-eyes principle)");
        }

        if (isRejectDecision(decision)) {
            // Từ chối vòng 2 (T09) - Bắt buộc lý do
            if (reason == null || reason.trim().isEmpty()) {
                throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
            }
            entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);
            entity.setRejectionReason(reason.trim());
            entity.setApproverLevel2(null);
            entity.setApprovedDateLevel2(null);
            // #57 — nội dung trả về vẫn được ghi
            entity.setLevel2ApprovalContent(reason.trim());

            recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_2,
                    ApprovalHistoryStatus.REJECTED, userId, reason.trim(),
                    "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.REJECTED_LEVEL2.getLabel());
        } else if (isApproveDecision(decision)) {
            // Đồng ý vòng 2 (T08) -> Đã duyệt (APPROVED)
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setRejectionReason(null);
            entity.setApproverLevel2(userId);
            entity.setApprovedDateLevel2(LocalDateTime.now());
            // #57 — nội dung phê duyệt
            entity.setLevel2ApprovalContent(reason);

            recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_2,
                    ApprovalHistoryStatus.APPROVED, userId, reason,
                    "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.APPROVED.getLabel());
        } else {
            throw new IllegalArgumentException("Quyết định phê duyệt C2 không hợp lệ: " + decision);
        }
    }

    /**
     * Xóa hồ sơ nháp (T13). Chỉ được xóa hồ sơ khi ở trạng thái Lưu tạm (DRAFT / PROPOSED).
     */
    @Transactional
    public void deleteDraft(ApprovableEntity entity, InfrastructureType refType, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus != ApprovalStatus.DRAFT && currentStatus != ApprovalStatus.PROPOSED) {
            throw new IllegalStateException("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm (DRAFT)");
        }

        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);

        recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_0,
                ApprovalHistoryStatus.DELETED, userId, null,
                "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.ARCHIVED.getLabel());
    }

    /**
     * Sửa hồ sơ đã duyệt (T12 - "Lưu và phê duyệt"). Bản ghi cũ được lưu vào lịch sử, hồ sơ giữ trạng thái Đã duyệt.
     */
    @Transactional
    public void recordSaveAndApprove(ApprovableEntity entity, InfrastructureType refType, String changeDescription, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApproverLevel2(userId);
        entity.setApprovedDateLevel2(LocalDateTime.now());

        recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_2,
                ApprovalHistoryStatus.UPDATED, userId, changeDescription,
                "Hồ sơ đã duyệt cập nhật", "Đã duyệt", "Đã duyệt");
    }

    /**
     * Dữ liệu tích hợp lưu thẳng trạng thái Đã duyệt (T14).
     */
    @Transactional
    public void directApprove(ApprovableEntity entity, InfrastructureType refType, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus currentStatus = entity.getApprovalStatus() != null ? entity.getApprovalStatus() : ApprovalStatus.DRAFT;
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApproverLevel2(userId);
        entity.setApprovedDateLevel2(LocalDateTime.now());

        recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_2,
                ApprovalHistoryStatus.APPROVED, userId, "Tích hợp hệ thống ngoài lưu thẳng Đã duyệt",
                "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.APPROVED.getLabel());
    }

    /**
     * Kiểm tra người dùng có thuộc đơn vị cấp Cục hay không (Rule 14).
     * Sử dụng enum OrgUnitRank.DEPARTMENT (hoặc level == 1).
     */
    public boolean isDepartmentLevelUser(UUID userId) {
        if (userId == null) return false;
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null || user.getOrgUnit() == null) {
                return false;
            }
            OrgUnit orgUnit = user.getOrgUnit();
            return orgUnit.getRank() == OrgUnitRank.DEPARTMENT
                    || (orgUnit.getLevel() != null && orgUnit.getLevel() == 1);
        } catch (Exception e) {
            log.warn("Không thể xác định cấp đơn vị của người dùng {}: {}", userId, e.getMessage());
            return false;
        }
    }

    private boolean isRejectDecision(String decision) {
        if (decision == null) return false;
        String upper = decision.trim().toUpperCase();
        return ApprovalStatus.REJECTED.name().equals(upper)
                || ApprovalStatus.REJECTED_LEVEL1.name().equals(upper)
                || ApprovalStatus.REJECTED_LEVEL2.name().equals(upper)
                || "REJECT".equals(upper);
    }

    private boolean isApproveDecision(String decision) {
        if (decision == null) return false;
        String upper = decision.trim().toUpperCase();
        return ApprovalStatus.APPROVED.name().equals(upper)
                || ApprovalStatus.APPROVED_LEVEL1.name().equals(upper)
                || ApprovalStatus.APPROVED_LEVEL2.name().equals(upper)
                || "APPROVE".equals(upper);
    }

    private void recordHistory(UUID refId, InfrastructureType refType, ApprovalLevel level,
                               ApprovalHistoryStatus status, UUID userId, String reason,
                               String changedField, String previousValue, String newValue) {
        try {
            historyRepository.save(ApprovalHistory.builder()
                    .refId(refId)
                    .refType(refType)
                    .approvalLevel(level)
                    .status(status)
                    .approvedBy(userId)
                    .reason(reason)
                    .changedField(changedField)
                    .previousValue(previousValue)
                    .newValue(newValue)
                    .build());
        } catch (Exception e) {
            log.error("Không thể ghi lịch sử phê duyệt cho refId={}, refType={}: {}", refId, refType, e.getMessage());
        }
    }
}
