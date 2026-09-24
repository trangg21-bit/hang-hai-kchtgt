package com.hanghai.kchtg.common.util;

import java.util.UUID;

import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

/**
 * Utility helper ghi nhận Lịch sử Biến động KCHTGT và Lịch sử Xóa mềm (Soft Delete) dùng chung cho tất cả các đối tượng KCHTGT.
 */
public final class InfrastructureHistoryUtils {

    private InfrastructureHistoryUtils() {
        // Utility class
    }

    /**
     * Quy chuẩn KCHT: Không lưu log lịch sử khi xóa bản ghi (soft delete).
     * Hàm này được giữ lại dưới dạng no-op để tương thích ngược mà không tạo bản ghi rác.
     */
    public static void recordSoftDelete(
            InfrastructureHistoryRepository repository,
            UUID refId,
            InfrastructureType refType,
            UUID userId,
            String reason) {
        // No-op: Không lưu log khi xóa bản ghi, chỉ lưu log khi chỉnh sửa record có status = APPROVED
    }

    public static void recordSoftDelete(
            InfrastructureHistoryRepository repository,
            UUID refId,
            InfrastructureType refType,
            UUID userId) {
        // No-op
    }
}
