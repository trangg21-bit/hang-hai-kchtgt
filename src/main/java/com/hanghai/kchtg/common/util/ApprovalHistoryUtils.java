package com.hanghai.kchtg.common.util;

import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

import java.util.UUID;

/**
 * Utility helper ghi nhận Lịch sử Phê duyệt và Lịch sử Xóa mềm (Soft Delete) dùng chung cho tất cả các đối tượng KCHTGT.
 */
public final class ApprovalHistoryUtils {

    private ApprovalHistoryUtils() {
        // Utility class
    }

    /**
     * Ghi nhận lịch sử xóa mềm (Soft Delete) dùng chung cho mọi loại hạ tầng.
     *
     * @param repository  ApprovalHistoryRepository
     * @param refId       ID của bản ghi hạ tầng bị xóa
     * @param refType     Loại hạ tầng (InfrastructureType)
     * @param userId      ID người thực hiện xóa
     * @param reason      Lý do xóa (nếu có)
     */
    public static void recordSoftDelete(
            ApprovalHistoryRepository repository,
            UUID refId,
            InfrastructureType refType,
            UUID userId,
            String reason) {
        if (repository == null || refId == null || refType == null) {
            return;
        }
        repository.save(ApprovalHistory.builder()
                .refId(refId)
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.DELETED)
                .approvedBy(userId)
                .reason(reason != null && !reason.isBlank() ? reason : "Xóa bản ghi")
                .changedField(EntityFields.DELETED_AT)
                .previousValue("null")
                .newValue("đã xóa mềm")
                .build());
    }

    public static void recordSoftDelete(
            ApprovalHistoryRepository repository,
            UUID refId,
            InfrastructureType refType,
            UUID userId) {
        recordSoftDelete(repository, refId, refType, userId, "Xóa bản ghi");
    }
}
