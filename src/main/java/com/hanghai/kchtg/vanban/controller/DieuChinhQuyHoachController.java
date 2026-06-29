package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.TinhTrangDieuChinh;
import com.hanghai.kchtg.vanban.service.DieuChinhQuyHoachService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for F-134 Cập nhật quy hoạch bến cảng.
 *
 * Endpoints:
 *   GET    /api/v1/dieu-chinh-quy-hoach          — list all planning adjustments
 *   POST   /api/v1/dieu-chinh-quy-hoach          — create a new adjustment
 *   GET    /api/v1/dieu-chinh-quy-hoach/{id}     — get a single adjustment
 *   PUT    /api/v1/dieu-chinh-quy-hoach/{id}     — update an adjustment
 *   DELETE /api/v1/dieu-chinh-quy-hoach/{id}     — delete an adjustment
 *   POST   /api/v1/dieu-chinh-quy-hoach/{id}/approval — approve an adjustment
 */
@RestController
@RequestMapping("/api/v1/dieu-chinh-quy-hoach")
@RequiredArgsConstructor
public class DieuChinhQuyHoachController {

    private final DieuChinhQuyHoachService dieuChinhQuyHoachService;

    /**
     * GET /api/v1/dieu-chinh-quy-hoach
     * Returns all planning adjustment records.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DieuChinhQuyHoachResponse>>> listAdjustments() {
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.findAll()));
    }

    /**
     * POST /api/v1/dieu-chinh-quy-hoach
     * Creates a new planning adjustment.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<DieuChinhQuyHoachResponse>> createAdjustment(
            @RequestBody @Valid DieuChinhQuyHoachCreateRequest request) {
        DieuChinhQuyHoachResponse response = dieuChinhQuyHoachService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo điều chỉnh quy hoạch thành công", response));
    }

    /**
     * GET /api/v1/dieu-chinh-quy-hoach/{id}
     * Returns a single planning adjustment by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DieuChinhQuyHoachResponse>> getAdjustment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.getById(id)));
    }

    /**
     * PUT /api/v1/dieu-chinh-quy-hoach/{id}
     * Updates an existing planning adjustment.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DieuChinhQuyHoachResponse>> updateAdjustment(
            @PathVariable Long id,
            @RequestBody @Valid DieuChinhQuyHoachCreateRequest request) {
        DieuChinhQuyHoachResponse response = dieuChinhQuyHoachService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật điều chỉnh quy hoạch thành công", response));
    }

    /**
     * DELETE /api/v1/dieu-chinh-quy-hoach/{id}
     * Deletes a planning adjustment.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAdjustment(@PathVariable Long id) {
        dieuChinhQuyHoachService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa điều chỉnh quy hoạch thành công", null));
    }

    /**
     * GET /api/v1/dieu-chinh-quy-hoach/quy-hoach/{quyHoachId}
     * Returns all adjustments for a specific port planning.
     */
    @GetMapping("/quy-hoach/{quyHoachId}")
    public ResponseEntity<ApiResponse<List<DieuChinhQuyHoachResponse>>> getByQuyHoachId(@PathVariable Long quyHoachId) {
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.findByQuyHoachId(quyHoachId)));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/dieu-chinh-quy-hoach/status/{tinhTrang}
     * Filter by adjustment status.
     */
    @GetMapping("/status/{tinhTrang}")
    public ResponseEntity<ApiResponse<List<DieuChinhQuyHoachResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangDieuChinh status = TinhTrangDieuChinh.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(dieuChinhQuyHoachService.findByTinhTrang(status)));
    }

    /**
     * POST /api/v1/dieu-chinh-quy-hoach/{id}/approval
     * Adds an approval record for an adjustment (F-134).
     */
    @PostMapping("/{id}/approval")
    public ResponseEntity<ApiResponse<PheDuyetDieuChinhResponse>> addApproval(
            @PathVariable Long id,
            @RequestBody @Valid PheDuyetDieuChinhRequest request) {
        PheDuyetDieuChinhResponse response = dieuChinhQuyHoachService.addApproval(id, request);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt điều chỉnh thành công", response));
    }
}
