package com.hanghai.kchtg.common.util;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

import java.util.UUID;

/**
 * Utility helper ghi nhận Lịch sử Biến động KCHTGT và Lịch sử Xóa mềm (Soft Delete) dùng chung cho tất cả các đối tượng KCHTGT.
 */
public final class InfrastructureHistoryUtils {

    private InfrastructureHistoryUtils() {
        // Utility class
    }

    /**
     * Ghi nhận lịch sử xóa mềm (Soft Delete) dùng chung cho mọi loại hạ tầng.
     *
     * @param repository  InfrastructureHistoryRepository
     * @param refId       ID của bản ghi hạ tầng bị xóa
     * @param refType     Loại hạ tầng (InfrastructureType)
     * @param userId      ID người thực hiện xóa
     * @param reason      Lý do xóa (nếu có)
     */
    public static void recordSoftDelete(
            InfrastructureHistoryRepository repository,
            UUID refId,
            InfrastructureType refType,
            UUID userId,
            String reason) {
        if (repository == null || refId == null || refType == null) {
            return;
        }
        repository.save(InfrastructureHistory.builder()
                .refId(refId)
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.DELETED)
                .approvedBy(userId)
                .reason(reason != null && !reason.isBlank() ? reason : "Xóa bản ghi")
                .changedField(EntityFields.DELETED_AT)
                .previousValue("null")
                .newValue("đã xóa mềm")
                .build());
    }

    public static void recordSoftDelete(
            InfrastructureHistoryRepository repository,
            UUID refId,
            InfrastructureType refType,
            UUID userId) {
        recordSoftDelete(repository, refId, refType, userId, "Xóa bản ghi");
    }
}
