package com.hanghai.kchtg.dashboard;

import com.hanghai.kchtg.assetmovement.repository.YeuCauBienDongRepository;
import com.hanghai.kchtg.cangben.repository.BerthRepository;
import com.hanghai.kchtg.cangben.repository.PortRepository;
import com.hanghai.kchtg.cangben.repository.DryPortRepository;
import com.hanghai.kchtg.cangben.repository.PierRepository;
import com.hanghai.kchtg.cangben.repository.WaterZoneRepository;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
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
    private final YeuCauBienDongRepository yeuCauRepo;

    /**
     * GET /api/v1/dashboard/approval-kcht
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho KCHT.
     */
    @GetMapping("/approval-kcht")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKchtApprovalStats() {
        long approved = portRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + berthRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + pierRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + dryPortRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + waterZoneRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET);

        long pending = portRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + berthRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + pierRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + dryPortRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + waterZoneRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET);

        long rejected = portRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + berthRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + pierRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + dryPortRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + waterZoneRepo.countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI);

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
        long approved = yeuCauRepo.countByTrangThaiAndDeletedFalse(
                com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau.DA_PHE_DUYET);
        long pending = yeuCauRepo.countByTrangThaiAndDeletedFalse(
                com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau.CHO_PHE_DUYET);
        long rejected = yeuCauRepo.countByTrangThaiAndDeletedFalse(
                com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau.TU_CHOI);

        long total = approved + pending + rejected;

        return ResponseEntity.ok(ApiResponse.success(Map.of(
                "total", total,
                "approved", approved,
                "pending", pending,
                "rejected", rejected
        )));
    }
}
