package com.hanghai.kchtg.common.service;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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

import com.hanghai.kchtg.security.SecurityUtils;
import org.springframework.security.access.AccessDeniedException;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

/**
 * Dịch vụ xử lý phê duyệt 2 cấp tập trung dùng chung cho toàn bộ 28 loại Kết cấu hạ tầng hàng hải (KCHT)
 * tuân thủ đặc tả thống nhất M-1006 (QUY-TRINH-PHE-DUYET-2-CAP-KCHT.md).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InfrastructureApprovalService {

    @SuppressWarnings("unused")
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
        }

        // Chỉ được submit từ DRAFT, PROPOSED hoặc các trạng thái bị từ chối
        boolean canSubmit = currentStatus == ApprovalStatus.DRAFT
                || currentStatus == ApprovalStatus.PROPOSED
                || currentStatus == ApprovalStatus.REJECTED_LEVEL1
                || currentStatus == ApprovalStatus.REJECTED_LEVEL2
                || currentStatus == ApprovalStatus.REJECTED;

        if (!canSubmit) {
            throw new IllegalStateException("Chỉ có thể gửi duyệt hồ sơ ở trạng thái Lưu tạm hoặc Bị từ chối. Trạng thái hiện tại: "
                    + currentStatus.getLabel());
        }

        // Kiểm tra cấp đơn vị của người gửi (Đặc tả 25/09/2026):
        // Cấp Cục gửi -> Vào thẳng "Chờ Cục duyệt" (APPROVED_LEVEL1, bỏ vòng 1)
        // Cấp Cảng vụ / Chi cục gửi -> Chờ Cảng vụ duyệt (PENDING_APPROVAL)
        boolean isDepartmentLevel = isDepartmentLevelUser(userId);

        ApprovalStatus nextStatus;
        if (isDepartmentLevel) {
            // Cấp Cục gửi -> Vào thẳng "Chờ Cục duyệt" (APPROVED_LEVEL1, bỏ vòng 1)
            nextStatus = ApprovalStatus.APPROVED_LEVEL1;
            entity.setApproverLevel1(userId);
            entity.setApprovedDateLevel1(LocalDateTime.now());
            if (content != null && !content.trim().isEmpty()) {
                entity.setLevel1ApprovalContent(content.trim());
            } else {
                entity.setLevel1ApprovalContent("Cấp Cục gửi trực tiếp");
            }
        } else {
            // Cấp Cảng vụ / Chi cục gửi -> Chờ Cảng vụ duyệt (PENDING_APPROVAL)
            nextStatus = ApprovalStatus.PENDING_APPROVAL;
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
            if (content != null && !content.trim().isEmpty()) {
                entity.setLevel1ApprovalContent(content.trim());
            } else {
                entity.setLevel1ApprovalContent(null);
            }
        }

        entity.setApprovalStatus(nextStatus);
        entity.setRejectionReason(null);

        // Ghi thời điểm + người gửi phê duyệt (#50, #51) — refresh cả khi gửi lại sau từ chối
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(userId);

        entity.setApproverLevel2(null);
        entity.setApprovedDateLevel2(null);
        entity.setLevel2ApprovalContent(null);

        // Lịch sử chỉ ghi khi bản ghi được phê duyệt cấp cuối cùng (APPROVED)
        // — không ghi ở bước submit.
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
            throw new IllegalStateException("Chỉ có thể phê duyệt cấp Cảng vụ từ trạng thái 'Chờ phê duyệt cấp Cảng vụ/Chi cục'");
        }

        if (isRejectDecision(decision)) {
            // Từ chối vòng 1 (T07) - Bắt buộc lý do tối thiểu 10 ký tự (Quy tắc 25/09)
            if (reason == null || reason.trim().length() < 10) {
                throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
            }
            entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
            entity.setRejectionReason(reason.trim());
            entity.setApproverLevel1(userId);
            entity.setApprovedDateLevel1(LocalDateTime.now());
            entity.setLevel1ApprovalContent(reason.trim());
            // Lịch sử chỉ ghi khi phê duyệt cấp cuối — không ghi reject L1.
        } else if (isApproveDecision(decision)) {
            // Đồng ý vòng 1 (T06) -> Chuyển sang Chờ Cục duyệt (APPROVED_LEVEL1)
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
            entity.setRejectionReason(null);
            entity.setApproverLevel1(userId);
            entity.setApprovedDateLevel1(LocalDateTime.now());
            // #54 — nội dung phê duyệt
            entity.setLevel1ApprovalContent(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Đã phê duyệt cấp Cảng vụ/Chi cục");
            // Lịch sử chỉ ghi khi phê duyệt cấp cuối — không ghi approve L1.
        } else {
            throw new IllegalArgumentException("Quyết định phê duyệt cấp Chi cục không hợp lệ");
        }
    }

    /**
     * Phê duyệt Vòng 2 (Cục) (T08, T09).
     * Áp dụng nguyên tắc: Người duyệt C2 không được trùng người duyệt C1 khi C1 do Cảng vụ/Chi cục duyệt.
     * Chặn 2 lớp: Chỉ tài khoản cấp Cục mới được duyệt C2. Bỏ nguyên tắc 4 mắt (cho phép tự duyệt C2).
     */
    @Transactional
    public void approveC2(ApprovableEntity entity, InfrastructureType refType, String decision, String reason, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        // Lớp bảo vệ 2: Chỉ tài khoản thuộc cấp Cục mới có quyền phê duyệt cấp 2
        if (!isDepartmentLevelUser(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ tài khoản thuộc cấp Cục mới có quyền phê duyệt cấp 2");
        }

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus != ApprovalStatus.APPROVED_LEVEL1
                && !(currentStatus == ApprovalStatus.PENDING_APPROVAL && entity.getApproverLevel1() != null)) {
            throw new IllegalStateException("Chỉ có thể phê duyệt cấp Cục từ trạng thái 'Chờ phê duyệt cấp Cục'");
        }

        // Quy tắc: Người duyệt C2 không được trùng người duyệt C1 (chỉ áp dụng khi C1 thực sự do Chi cục duyệt)
        UUID c1Approver = entity.getApproverLevel1();
        if (c1Approver != null && c1Approver.equals(userId) && !isDepartmentLevelUser(c1Approver)) {
            throw new IllegalStateException("Người phê duyệt cấp Cục không được trùng với người phê duyệt cấp Chi cục");
        }

        if (isRejectDecision(decision)) {
            // Từ chối vòng 2 (T09) - Bắt buộc lý do tối thiểu 10 ký tự (Quy tắc 25/09)
            if (reason == null || reason.trim().length() < 10) {
                throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
            }
            entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);
            entity.setRejectionReason(reason.trim());
            entity.setApproverLevel2(userId);
            entity.setApprovedDateLevel2(LocalDateTime.now());
            entity.setLevel2ApprovalContent(reason.trim());
            // Lịch sử chỉ ghi khi phê duyệt cấp cuối — không ghi reject L2.
        } else if (isApproveDecision(decision)) {
            // Đồng ý vòng 2 (T08) -> Đã duyệt (APPROVED)
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setRejectionReason(null);
            // Nếu Cấp 1 chưa được gán (ví dụ luồng tắt từ Cục), tự động bổ sung Cấp 1
            if (entity.getApproverLevel1() == null) {
                entity.setApproverLevel1(userId);
                entity.setApprovedDateLevel1(LocalDateTime.now());
                entity.setLevel1ApprovalContent("Cấp Cục phê duyệt trực tiếp");
            }
            entity.setApproverLevel2(userId);
            entity.setApprovedDateLevel2(LocalDateTime.now());
            // #57 — nội dung phê duyệt
            entity.setLevel2ApprovalContent(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Lưu và phê duyệt trực tiếp");
            // Lịch sử chỉ ghi khi CHỈNH SỬA dữ liệu trên bản ghi đã duyệt — không ghi khi chỉ bấm nút duyệt.
        } else {
            throw new IllegalArgumentException("Quyết định phê duyệt cấp Cục không hợp lệ");
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
    /**
     * approval-2-level-spec §3.6 (quy tắc 11): hồ sơ "Lưu tạm" chỉ do **người
     * nhập** xóa. Trước đây chỉ kiểm tra trạng thái, nên bất kỳ ai có quyền
     * {@code <resource>:delete} trong cùng phạm vi đơn vị đều xóa được bản nháp
     * của đồng nghiệp.
     *
     * Nới hai trường hợp để không chặn nhầm: tài khoản cấp Cục (vai trò quản trị
     * dữ liệu toàn quốc) và hồ sơ cũ không còn lưu người tạo.
     */
    public void assertDeletableBy(ApprovableEntity entity, UUID userId) {
        if (entity == null || entity.getCreatedBy() == null) {
            return;
        }
        if (userId != null && userId.equals(entity.getCreatedBy())) {
            return;
        }
        if (isDepartmentLevelUser(userId)) {
            return;
        }
        throw new IllegalStateException("Chỉ người nhập hồ sơ mới được xóa bản Lưu tạm này");
    }

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
        assertDeletableBy(entity, userId);
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);

        // Lịch sử chỉ ghi khi phê duyệt cấp cuối — không ghi xóa nháp.
    }

    /**
     * Sửa hồ sơ đã duyệt (T12 - "Lưu và phê duyệt"). Bản ghi cũ được lưu vào lịch sử, hồ sơ giữ trạng thái Đã duyệt.
     */
    @Transactional
    public void recordSaveAndApprove(ApprovableEntity entity, InfrastructureType refType, String changeDescription, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        LocalDateTime now = LocalDateTime.now();
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        if (entity.getApproverLevel1() == null) {
            entity.setApproverLevel1(userId);
            entity.setApprovedDateLevel1(now);
            entity.setLevel1ApprovalContent("Cấp Cục phê duyệt trực tiếp");
        }
        entity.setApproverLevel2(userId);
        entity.setApprovedDateLevel2(now);
        if (entity.getLevel2ApprovalContent() == null || entity.getLevel2ApprovalContent().isBlank()) {
            entity.setLevel2ApprovalContent("Lưu và phê duyệt");
        }
        // Biến động trường dữ liệu thực tế được ghi nhận bởi caller service (ChangeHistoryService).
        // Không ghi nhận trường phê duyệt ảo "approvalStatus: Đã duyệt -> Đã duyệt" vào infrastructure_history.
    }

    /**
     * Dữ liệu tích hợp lưu thẳng trạng thái Đã duyệt (T14).
     */
    @Transactional
    public void directApprove(ApprovableEntity entity, InfrastructureType refType, UUID userId) {
        if (entity == null) {
            throw new IllegalArgumentException("Dữ liệu hồ sơ không được để trống");
        }

        LocalDateTime now = LocalDateTime.now();
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApproverLevel1(userId);
        entity.setApprovedDateLevel1(now);
        entity.setLevel1ApprovalContent("Dữ liệu tích hợp tự động phê duyệt");
        entity.setApproverLevel2(userId);
        entity.setApprovedDateLevel2(now);
        entity.setLevel2ApprovalContent("Dữ liệu tích hợp tự động phê duyệt");

        // Lịch sử chỉ ghi khi chỉnh sửa dữ liệu — không ghi khi chỉ chuyển trạng thái.
    }

    /**
     * Kiểm tra người dùng có thuộc đơn vị cấp cao nhất (Cục / Root Department) hay không (Rule 14).
     *
     * <p>Xác định theo cấu trúc phân cấp tổ chức:
     * - Đơn vị có cấp bậc DEPARTMENT (OrgUnitRank.DEPARTMENT)
     * - HOẶC đơn vị có cấp độ 1 (level == 1)
     * - HOẶC đơn vị gốc không có đơn vị cha (parentId == null)
     * - Nếu tài khoản không gán đơn vị cụ thể (toàn quyền hệ thống), mặc định thuộc phạm vi cấp cao nhất.
     * </p>
     */
    public boolean isDepartmentLevelUser(UUID userId) {
        if (userId == null) return false;
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return false;
            }
            OrgUnit orgUnit = user.getOrgUnit();
            if (orgUnit == null) {
                // Người dùng quản trị toàn quyền không giới hạn đơn vị con
                return true;
            }
            return orgUnit.getRank() == OrgUnitRank.DEPARTMENT
                    || (orgUnit.getLevel() != null && orgUnit.getLevel() == 1)
                    || orgUnit.getParentId() == null;
        } catch (Exception e) {
            log.warn("Không thể xác định cấp đơn vị của người dùng {}: {}", userId, e.getMessage());
            return false;
        }
    }

    /**
     * Kiểm tra thẩm quyền "Lưu và phê duyệt" (phê duyệt trực tiếp cấp Cục khi tạo mới hoặc cập nhật).
     * Chỉ người dùng cấp trung ương có quyền approvec2 (hoặc quyền C2 dùng chung)
     * mới được phép thực hiện thao tác này. Quyền quản trị không tự thay thế quyền C2.
     */
    public void requireApproveC2Permission(UUID userId, String resourcePermission) {
        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        if (!isDepartmentLevelUser(effectiveUserId)) {
            throw new AccessDeniedException(
                    "Chỉ tài khoản cấp Cục mới được lưu và phê duyệt trực tiếp; các đơn vị khác phải gửi hồ sơ qua quy trình phê duyệt 2 cấp");
        }
        Set<String> perms = SecurityUtils.getCurrentUserPermissions();
        if (perms == null || !perms.contains(resourcePermission)) {
            throw new AccessDeniedException(
                    "Bạn không có quyền phê duyệt — thao tác 'Lưu và phê duyệt' cần quyền duyệt C2, kể cả với tài khoản quản trị");
        }
    }

    private boolean isRejectDecision(String decision) {
        if (decision == null) return false;
        String upper = decision.trim().toUpperCase();
        return ApprovalStatus.REJECTED.name().equals(upper)
                || ApprovalStatus.REJECTED_LEVEL1.name().equals(upper)
                || ApprovalStatus.REJECTED_LEVEL2.name().equals(upper);
    }

    public boolean hasApproveC1Permission(UUID userId, InfrastructureType refType) {
        Set<String> perms = SecurityUtils.getCurrentUserPermissions();
        if ((perms == null || perms.isEmpty()) && userId != null) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    perms = user.getAllPermissions();
                }
            } catch (Exception e) {
                log.warn("Không thể tải quyền của người dùng {}: {}", userId, e.getMessage());
            }
        }
        if (perms == null || perms.isEmpty()) {
            return false;
        }
        if (perms.contains("*") || perms.contains("admin:all")) {
            return true;
        }
        String resource = resolveResourceKey(refType);
        if (resource != null && !resource.isBlank()) {
            String r = resource.toLowerCase();
            return perms.contains(r + ":approvec1")
                    || perms.contains(r + ":approve_level1")
                    || perms.contains(r + ":approvel1")
                    || perms.contains(r + ":approve:c1")
                    || perms.contains(r + ":approve");
        }
        return perms.stream().anyMatch(p -> p.endsWith(":approvec1") || p.endsWith(":approvel1") || p.endsWith(":approve:c1"));
    }

    public boolean hasApproveC2Permission(UUID userId, InfrastructureType refType) {
        if (!isDepartmentLevelUser(userId)) {
            return false;
        }
        Set<String> perms = SecurityUtils.getCurrentUserPermissions();
        if ((perms == null || perms.isEmpty()) && userId != null) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null) {
                    perms = user.getAllPermissions();
                }
            } catch (Exception e) {
                log.warn("Không thể tải quyền của người dùng {}: {}", userId, e.getMessage());
            }
        }
        if (perms == null || perms.isEmpty()) {
            return false;
        }
        if (perms.contains("*") || perms.contains("admin:all")) {
            return true;
        }
        String resource = resolveResourceKey(refType);
        if (resource != null && !resource.isBlank()) {
            String r = resource.toLowerCase();
            return perms.contains(r + ":approvec2")
                    || perms.contains(r + ":approve_level2")
                    || perms.contains(r + ":approvel2")
                    || perms.contains(r + ":approve:c2");
        }
        return perms.stream().anyMatch(p -> p.endsWith(":approvec2") || p.endsWith(":approvel2") || p.endsWith(":approve:c2"));
    }

    /**
     * Kiểm tra quyền sửa hồ sơ KCHT theo Rule R3 & R4 (quy chuẩn 25/09/2026).
     * Hồ sơ APPROVED: chỉ tài khoản có quyền C1 hoặc C2 mới được phép sửa.
     */
    public void assertCanEdit(ApprovableEntity entity, UUID userId, InfrastructureType refType) {
        assertEditable(entity);
        if (entity != null && (entity.getApprovalStatus() == ApprovalStatus.APPROVED || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2)) {
            boolean hasC2 = hasApproveC2Permission(userId, refType);
            boolean hasC1 = hasApproveC1Permission(userId, refType);
            if (!hasC2 && !hasC1) {
                throw new AccessDeniedException("Tài khoản không có quyền phê duyệt cấp 1 hoặc cấp 2 để chỉnh sửa hồ sơ đã duyệt");
            }
        }
    }

    /**
     * Xử lý chuyển đổi trạng thái khi sửa hồ sơ Đã duyệt (Rule R4a & R4b đặc tả 25/09/2026):
     * - Cục (có approvec2) -> giữ nguyên APPROVED
     * - Cảng vụ (có approvec1, luồng 2 cấp) -> quay lại luồng duyệt:
     *   + nếu requestedStatus == APPROVED_LEVEL1 ("Lưu và phê duyệt") -> APPROVED_LEVEL1 (tự duyệt C1, chờ Cục duyệt C2)
     *   + nếu requestedStatus == PENDING_APPROVAL hoặc khác ("Lưu và gửi phê duyệt") -> PENDING_APPROVAL (chờ Cảng vụ duyệt C1)
     */
    @Transactional
    public void handleApprovedRecordEdit(ApprovableEntity entity, InfrastructureType refType, ApprovalStatus requestedStatus, UUID userId) {
        if (entity == null) return;
        boolean hasC2 = hasApproveC2Permission(userId, refType);
        LocalDateTime now = LocalDateTime.now();
        if (hasC2) {
            // Rule R4a: Cấp Cục có quyền C2 -> Giữ nguyên trạng thái APPROVED
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else {
            // Rule R4b: Cấp Cảng vụ/Chi cục có quyền C1 -> Chuyển về luồng duyệt
            if (requestedStatus == ApprovalStatus.APPROVED_LEVEL1) {
                // "Lưu và phê duyệt" (tự duyệt C1) -> Chờ Cục duyệt C2
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
                entity.setSubmittedAt(now);
                entity.setSubmittedBy(userId);
                entity.setApproverLevel1(userId);
                entity.setApprovedDateLevel1(now);
                entity.setLevel1ApprovalContent("Cấp Cảng vụ/Chi cục chỉnh sửa và phê duyệt C1");
                entity.setApproverLevel2(null);
                entity.setApprovedDateLevel2(null);
                entity.setLevel2ApprovalContent(null);
            } else {
                // "Lưu và gửi phê duyệt" -> Chờ Cảng vụ duyệt C1
                entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
                entity.setSubmittedAt(now);
                entity.setSubmittedBy(userId);
                entity.setApproverLevel1(null);
                entity.setApprovedDateLevel1(null);
                entity.setLevel1ApprovalContent(null);
                entity.setApproverLevel2(null);
                entity.setApprovedDateLevel2(null);
                entity.setLevel2ApprovalContent(null);
            }
        }
    }

    public static String resolveResourceKey(InfrastructureType refType) {
        if (refType == null) return null;
        return switch (refType) {
            case SEAPORT -> "port";
            case PORT_TERMINAL -> "berth";
            case PIER -> "pier";
            case DRY_PORT -> "dryport";
            case WATER_AREA -> "waterzone";
            case DIKE_REVETMENT -> "dikerevetment";
            case NAVIGATION_CHANNEL -> "navigationchannel";
            case SHIP_REPAIR_FACILITY, SHIP_REPAIR_YARD -> "shiprepairyard";
            case LIGHTHOUSE -> "lighthouse";
            case BUOY -> "buoy";
            case VTS_SYSTEM -> "vts";
            case RADAR_STATION, RADAR_STATION_LEGACY -> "radarstation";
            case BUOY_BERTH -> "buoyberth";
            case ANCHORAGE_AREA -> "anchorage";
            case TRANSSHIPMENT_AREA -> "transferarea";
            case STORM_SHELTER_AREA -> "stormshelterarea";
            case DAI_TTDH -> "daittdh";
            case COASTAL_RADIO_STATION -> "coastalstation";
            case INMARSAT_STATION -> "coastalstationinmarsat";
            case COSPAS_SARSAT_STATION -> "coastalstationcospassarsat";
            case LRIT_STATION -> "lritstation";
            case HANOI_STATION -> "coastalstationhaiphong";
            case BUOY_STATION -> "buoystation";
            case VTS_OPERATION_CENTER -> "vtsoperationcenter";
            case AIS_SYSTEM -> "aissystem";
            case CCTV -> "cctv";
            case VHF -> "vhf";
            case SCADA -> "scada";
            case TRANSMISSION -> "transmission";
            case VTS_ASSIST -> "vtsassist";
            case SEAPORT_THROUGHPUT -> "seaportthroughput";
            default -> refType.name().toLowerCase().replace("_", "");
        };
    }

    private boolean isApproveDecision(String decision) {
        if (decision == null) return false;
        String upper = decision.trim().toUpperCase();
        return ApprovalStatus.APPROVED.name().equals(upper)
                || ApprovalStatus.APPROVED_LEVEL1.name().equals(upper)
                || ApprovalStatus.APPROVED_LEVEL2.name().equals(upper);
    }
}
