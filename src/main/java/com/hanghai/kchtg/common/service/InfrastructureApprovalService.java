package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
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

    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

    /**
     * Gửi duyệt hồ sơ KCHT (T02, T03, T04, T05, T10, T11 trong ma trận chuyển trạng thái M-1006).
     * Áp dụng Rule 14: Người gửi thuộc cấp Cục (orgUnit.level == 1) -> Vào thẳng "Chờ Cục duyệt" (APPROVED_LEVEL1).
     * Người gửi thuộc cấp Cảng vụ/Chi cục -> Vào "Chờ Cảng vụ / Chi cục duyệt" (PENDING_APPROVAL).
     */
    @Transactional
    public void submit(ApprovableEntity entity, InfrastructureType refType, UUID userId) {
        submit(entity, refType, userId, null);
    }

    /**
     * Gửi duyệt kèm nội dung/ý kiến của người gửi (lưu vào approvalContentLevel1 — #54).
     * Content có thể null (gửi duyệt không kèm nội dung).
     */
    @Transactional
    public void submit(ApprovableEntity entity, InfrastructureType refType, UUID userId, String content) {
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

        // Nội dung/ý kiến người gửi khi gửi duyệt — lưu vào approvalContentLevel1 (#54)
        if (content != null && !content.trim().isEmpty()) {
            entity.setLevel1ApprovalContent(content.trim());
        }

        // Reset approver level nếu gửi lại từ đầu
        if (nextStatus == ApprovalStatus.PENDING_APPROVAL) {
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
        }
        entity.setApproverLevel2(null);
        entity.setApprovedDateLevel2(null);

        // Ghi lịch sử phê duyệt
        recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_0,
                InfrastructureHistoryStatus.PROPOSED, userId, content,
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
            throw new IllegalStateException("Bạn không thể tự phê duyệt bản ghi do chính mình tạo hoặc đề xuất");
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
                    InfrastructureHistoryStatus.REJECTED, userId, reason.trim(),
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
                    InfrastructureHistoryStatus.APPROVED, userId, reason,
                    "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.APPROVED_LEVEL1.getLabel());
        } else {
            throw new IllegalArgumentException("Quyết định phê duyệt C1 không hợp lệ: " + decision);
        }
    }

    /**
     * Phê duyệt Vòng 2 (Cục) (T08, T09).
     * Áp dụng nguyên tắc: Người duyệt C2 không được trùng người duyệt C1.
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

        // Quy tắc: Người duyệt C2 không được trùng người duyệt C1
        UUID c1Approver = entity.getApproverLevel1();
        if (c1Approver != null && c1Approver.equals(userId)) {
            throw new IllegalStateException("Người phê duyệt cấp Cục không được trùng với người phê duyệt cấp Cảng vụ / Chi cục");
        }

        // Quy tắc chống tự duyệt: Người tạo hồ sơ không được tự duyệt
        if (entity.getCreatedBy() != null && entity.getCreatedBy().equals(userId)) {
            throw new IllegalStateException("Người tạo hồ sơ không được tự phê duyệt bản ghi");
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
                    InfrastructureHistoryStatus.REJECTED, userId, reason.trim(),
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
                    InfrastructureHistoryStatus.APPROVED, userId, reason,
                    "Trạng thái phê duyệt", currentStatus.getLabel(), ApprovalStatus.APPROVED.getLabel());
        } else {
            throw new IllegalArgumentException("Quyết định phê duyệt C2 không hợp lệ: " + decision);
        }
    }

    /**
     * Kiểm tra hồ sơ có được phép chỉnh sửa ở trạng thái hiện tại hay không (quy tắc 12).
     *
     * <p>Ma trận chuẩn (nguồn: {@code QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md} bảng chuyển trạng thái mục 7
     * + Ca dùng 8, chuẩn hóa tại {@code docs/conventions/approval-2-level-spec.md} mục 3.9):</p>
     *
     * <ul>
     *   <li>{@code DRAFT}, {@code REJECTED_LEVEL1}, {@code REJECTED_LEVEL2} — cho sửa (người nhập).</li>
     *   <li>{@code PENDING_APPROVAL}, {@code APPROVED_LEVEL1} — <b>cấm sửa</b>, hồ sơ đang trong vòng duyệt.</li>
     *   <li>{@code APPROVED} — cho sửa qua "Lưu và phê duyệt" (T12), chỉ người có quyền phê duyệt cấp 2;
     *       quyền được chặn ở tầng controller bằng {@code @PreAuthorize("hasAnyAuthority('<res>:approvec2')")}.</li>
     *   <li>{@code ARCHIVED} — cấm sửa, hồ sơ đã xóa mềm.</li>
     * </ul>
     *
     * <p>Lý do cấm sửa khi đang chờ duyệt: nếu cho sửa, người nhập có thể đổi nội dung sau khi cán bộ đã
     * đọc, khiến cán bộ ký duyệt vào nội dung mình chưa từng xem — mất tính toàn vẹn của vòng duyệt.</p>
     *
     * @throws IllegalStateException nếu hồ sơ đang ở trạng thái không cho phép sửa
     */
    public void assertEditable(ApprovableEntity entity) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus status = entity.getApprovalStatus();
        if (status == null) {
            return;
        }

        if (status == ApprovalStatus.PENDING_APPROVAL || status == ApprovalStatus.APPROVED_LEVEL1) {
            throw new IllegalStateException("Không thể sửa hồ sơ đang trong quy trình phê duyệt");
        }

        if (status == ApprovalStatus.ARCHIVED) {
            throw new IllegalStateException("Không thể sửa hồ sơ đã xóa");
        }
    }

    /**
     * Kiểm tra hồ sơ có được phép xóa mềm ở trạng thái hiện tại hay không (quy tắc 11).
     *
     * <p>Nguồn: {@code QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md} — Ca dùng 9 ("Xóa hồ sơ nháp", điều kiện
     * trước: hồ sơ đang "Lưu tạm") và bảng chuyển trạng thái mục 7 (chỉ có dòng
     * {@code Lưu tạm → Xóa → Đã xóa}); chuẩn hóa tại {@code docs/conventions/approval-2-level-spec.md}
     * mục 3.6. "Case test bắt buộc" của tài liệu gốc ghi rõ: <i>không được xóa hồ sơ khi không ở
     * trạng thái "Lưu tạm"</i>.</p>
     *
     * <p>Vì sao không cho xóa hồ sơ <b>Đã duyệt</b>: hồ sơ đã qua 2 cấp ký và đang có hiệu lực; cho
     * xóa chỉ với quyền {@code delete} là nhẹ hơn cả <i>sửa</i> nó (quy tắc 12 đòi
     * {@code approvec2}) — xóa nặng hơn sửa mà lại dễ hơn. Hồ sơ hết giá trị sử dụng thì đổi
     * <b>tình trạng hoạt động</b>, không xóa.</p>
     *
     * @throws IllegalStateException nếu hồ sơ không ở trạng thái Lưu tạm
     */
    public void assertDeletable(ApprovableEntity entity) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        ApprovalStatus status = entity.getApprovalStatus();
        if (status == null) {
            return;
        }

        if (status != ApprovalStatus.DRAFT && status != ApprovalStatus.PROPOSED) {
            throw new IllegalStateException("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
        }
    }

    /**
     * Hồ sơ đang ở trạng thái Đã duyệt — thao tác sửa phải đi qua "Lưu và phê duyệt" (T12):
     * giữ nguyên trạng thái Đã duyệt và ghi bản cũ vào nhật ký thay đổi.
     *
     * <p>Tuyệt đối không hạ hồ sơ về {@code DRAFT} khi sửa: endpoint {@code /options} chỉ trả về bản ghi
     * {@code APPROVED}, hạ trạng thái sẽ làm hồ sơ đang khai thác biến mất khỏi mọi dropdown.</p>
     */
    public boolean requiresSaveAndApprove(ApprovableEntity entity) {
        return entity != null && entity.getApprovalStatus() == ApprovalStatus.APPROVED;
    }

    /**
     * Xóa hồ sơ nháp (T13). Chỉ được xóa hồ sơ khi ở trạng thái Lưu tạm (DRAFT / PROPOSED).
     */
    @Transactional
    public void deleteDraft(ApprovableEntity entity, InfrastructureType refType, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        assertDeletable(entity);
        ApprovalStatus currentStatus = entity.getApprovalStatus();

        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);

        recordHistory(entity.getId(), refType, ApprovalLevel.LEVEL_0,
                InfrastructureHistoryStatus.DELETED, userId, null,
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
                InfrastructureHistoryStatus.UPDATED, userId, changeDescription,
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
                InfrastructureHistoryStatus.APPROVED, userId, "Tích hợp hệ thống ngoài lưu thẳng Đã duyệt",
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
                || ApprovalStatus.REJECTED_LEVEL2.name().equals(upper);
    }

    private boolean isApproveDecision(String decision) {
        if (decision == null) return false;
        String upper = decision.trim().toUpperCase();
        return ApprovalStatus.APPROVED.name().equals(upper)
                || ApprovalStatus.APPROVED_LEVEL1.name().equals(upper)
                || ApprovalStatus.APPROVED_LEVEL2.name().equals(upper);
    }

    private void recordHistory(UUID refId, InfrastructureType refType, ApprovalLevel level,
                               InfrastructureHistoryStatus status, UUID userId, String reason,
                               String changedField, String previousValue, String newValue) {
        try {
            historyRepository.save(InfrastructureHistory.builder()
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
