package com.hanghai.kchtg.dashboard;

import com.hanghai.kchtg.assetmovement.repository.YeuCauBienDongRepository;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.CangCanRepository;
import com.hanghai.kchtg.cangben.repository.CauCangRepository;
import com.hanghai.kchtg.cangben.repository.VungNuocRepository;
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

    private final CangBienRepository cangBienRepo;
    private final BenCangRepository benCangRepo;
    private final CauCangRepository cauCangRepo;
    private final CangCanRepository cangCanRepo;
    private final VungNuocRepository vungNuocRepo;
    private final YeuCauBienDongRepository yeuCauRepo;

    /**
     * GET /api/v1/dashboard/approval-kcht
     * Trả về breakdown Đã duyệt / Chờ duyệt / Từ chối cho KCHT.
     */
    @GetMapping("/approval-kcht")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKchtApprovalStats() {
        long approved = cangBienRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + benCangRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + cauCangRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + cangCanRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET)
                + vungNuocRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.DUOC_PHE_DUYET);

        long pending = cangBienRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + benCangRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + cauCangRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + cangCanRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET)
                + vungNuocRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.CHO_PHE_DUYET);

        long rejected = cangBienRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + benCangRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + cauCangRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + cangCanRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI)
                + vungNuocRepo.countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet.TU_CHOI);

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
