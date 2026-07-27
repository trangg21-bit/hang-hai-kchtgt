package com.hanghai.kchtg.dashboard;

import com.hanghai.kchtg.assetmovement.repository.MovementRequestRepository;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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

    private final PortRepository portRepo;
    private final BerthRepository berthRepo;
    private final PierRepository pierRepo;
    private final DryPortRepository dryPortRepo;
    private final WaterZoneRepository waterZoneRepo;
    private final MovementRequestRepository movementRequestRepo;

    /**
     * GET /api/v1/dashboard/approval-kcht
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho KCHT.
     */
    @GetMapping("/approval-kcht")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKchtApprovalStats() {
        long approved = portRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED)
                + berthRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED)
                + pierRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED)
                + dryPortRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED)
                + waterZoneRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED);

        long pending = portRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.PENDING)
                + berthRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.PENDING)
                + pierRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.PENDING)
                + dryPortRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.PENDING)
                + waterZoneRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.PENDING);

        long rejected = portRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.REJECTED)
                + berthRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.REJECTED)
                + pierRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.REJECTED)
                + dryPortRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.REJECTED)
                + waterZoneRepo.countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.REJECTED);

        long total = approved + pending + rejected;

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", total,
                "approved", approved,
                "pending", pending,
                "rejected", rejected
        )));
    }

    /**
     * GET /api/v1/dashboard/approval-asset
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho yêu cầu biến động tài sản.
     */
    @GetMapping("/approval-asset")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAssetApprovalStats() {
        long approved = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                com.hanghai.kchtg.assetmovement.entity.RequestStatus.APPROVED);
        long pending = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                com.hanghai.kchtg.assetmovement.entity.RequestStatus.PENDING);
        long rejected = movementRequestRepo.countByStatusAndDeletedAtIsNull(
                com.hanghai.kchtg.assetmovement.entity.RequestStatus.REJECTED);

        long total = approved + pending + rejected;

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", total,
                "approved", approved,
                "pending", pending,
                "rejected", rejected
        )));
    }
}
