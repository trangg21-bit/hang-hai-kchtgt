package com.hanghai.kchtg.dashboard;

import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.repository.MovementRequestRepository;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dashboard.service.KchtAssetCountService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Dashboard aggregation controller — cung cấp số liệu tổng hợp cho trang chủ.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final KchtAssetCountService kchtAssetCountService;
    private final MovementRequestRepository movementRequestRepo;

    /**
     * GET /api/v1/dashboard/approval-kcht
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho KCHT.
     */
    @GetMapping("/approval-kcht")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getKchtApprovalStats() {
        // Giữ endpoint cũ nhưng dùng chung phép tổng hợp đã cache.
        return ResponseEntity.ok(ApiResponse.success(
                kchtAssetCountService.getApprovalStats(null, null)
        ));
    }

    /**
     * GET /api/v1/dashboard/approval-asset
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho yêu cầu biến động tài sản.
     */
    @GetMapping("/approval-asset")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssetApprovalStats() {
        long approved = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                RequestStatus.APPROVED);
        long pending = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                RequestStatus.PENDING);
        long rejected = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                RequestStatus.REJECTED);

        long total = approved + pending + rejected;

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", total,
                "approved", approved,
                "pending", pending,
                "rejected", rejected
        )));
    }
}
