package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.TinhTrangQuyHoach;
import com.hanghai.kchtg.vanban.service.QuyHoachBenCangService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for F-132 Quản lý quy hoạch bến cảng.
 *
 * Endpoints:
 *   GET    /api/v1/quy-hoach-ben-cang            — list all port planning records
 *   POST   /api/v1/quy-hoach-ben-cang            — create a new port planning record
 *   GET    /api/v1/quy-hoach-ben-cang/{id}       — get a single record
 *   PUT    /api/v1/quy-hoach-ben-cang/{id}       — update a record
 *   DELETE /api/v1/quy-hoach-ben-cang/{id}       — delete a record
 *   GET    /api/v1/quy-hoach-ben-cang/search     — dynamic search (F-133)
 */
@RestController
@RequestMapping("/api/v1/quy-hoach-ben-cang")
@RequiredArgsConstructor
public class QuyHoachBenCangController {

    private final QuyHoachBenCangService quyHoachBenCangService;

    /**
     * GET /api/v1/quy-hoach-ben-cang
     * Returns all port planning records.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<QuyHoachBenCangResponse> result = quyHoachBenCangService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/quy-hoach-ben-cang
     * Creates a new port planning record.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<QuyHoachBenCangResponse>> createPlan(
            @RequestBody @Valid QuyHoachBenCangCreateRequest request) {
        QuyHoachBenCangResponse response = quyHoachBenCangService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo quy hoạch bến cảng thành công", response));
    }

    /**
     * GET /api/v1/quy-hoach-ben-cang/{id}
     * Returns a single port planning record by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<QuyHoachBenCangResponse>> getPlan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.getById(id)));
    }

    /**
     * PUT /api/v1/quy-hoach-ben-cang/{id}
     * Updates an existing port planning record.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<QuyHoachBenCangResponse>> updatePlan(
            @PathVariable Long id,
            @RequestBody @Valid QuyHoachBenCangCreateRequest request) {
        QuyHoachBenCangResponse response = quyHoachBenCangService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quy hoạch bến cảng thành công", response));
    }

    /**
     * DELETE /api/v1/quy-hoach-ben-cang/{id}
     * Deletes a port planning record.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        quyHoachBenCangService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa quy hoạch bến cảng thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/quy-hoach-ben-cang/status/{tinhTrang}
     * Filter by planning status.
     */
    @GetMapping("/status/{tinhTrang}")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangQuyHoach status = TinhTrangQuyHoach.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.findByTinhTrang(status)));
    }

    /**
     * GET /api/v1/quy-hoach-ben-cang/name-search
     * Search by project name (partial match).
     */
    @GetMapping("/name-search")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> searchByName(
            @RequestParam String keyword,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.searchByTenDoAnContaining(keyword, page, size).getContent()));
    }

    /**
     * GET /api/v1/quy-hoach-ben-cang/date-range
     * Filter by approval date range.
     */
    @GetMapping("/date-range")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> filterByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.findByNgayPheDuyetBetween(start, end)));
    }

    // ── Dynamic Search Endpoint (F-133) ───────────────────────────────

    /**
     * GET /api/v1/quy-hoach-ben-cang/search
     * Dynamic search with keyword, status, year range (F-133).
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<KetQuaTraCuuResponse>> searchPlans(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "yearStart", required = false) LocalDate yearStart,
            @RequestParam(name = "yearEnd", required = false) LocalDate yearEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        KetQuaTraCuuResponse result = quyHoachBenCangService.traCuu(
                keyword, status, yearStart, yearEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
