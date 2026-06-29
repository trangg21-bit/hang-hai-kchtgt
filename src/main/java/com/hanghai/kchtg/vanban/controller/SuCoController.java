package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.MucDoNghiemTrong;
import com.hanghai.kchtg.vanban.entity.TinhTrangXuLy;
import com.hanghai.kchtg.vanban.service.SuCoService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for F-131 Quản lý thông tin sự cố.
 *
 * Endpoints:
 *   GET    /api/v1/su-co                  — list all incidents
 *   POST   /api/v1/su-co                  — create a new incident
 *   GET    /api/v1/su-co/{id}             — get a single incident
 *   PUT    /api/v1/su-co/{id}             — update an incident
 *   DELETE /api/v1/su-co/{id}             — delete an incident
 *   POST   /api/v1/su-co/progress         — add progress update
 *   GET    /api/v1/su-co/{id}/progress    — get progress history
 */
@RestController
@RequestMapping("/api/v1/su-co")
@RequiredArgsConstructor
public class SuCoController {

    private final SuCoService suCoService;

    /**
     * GET /api/v1/su-co
     * Returns all incidents.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> listIncidents(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<SuCoResponse> result = suCoService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/su-co
     * Creates a new incident.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SuCoResponse>> createIncident(
            @RequestBody @Valid SuCoCreateRequest request) {
        SuCoResponse response = suCoService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo sự cố thành công", response));
    }

    /**
     * GET /api/v1/su-co/{id}
     * Returns a single incident by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SuCoResponse>> getIncident(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.getById(id)));
    }

    /**
     * PUT /api/v1/su-co/{id}
     * Updates an existing incident.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SuCoResponse>> updateIncident(
            @PathVariable Long id,
            @RequestBody @Valid SuCoCreateRequest request) {
        SuCoResponse response = suCoService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sự cố thành công", response));
    }

    /**
     * DELETE /api/v1/su-co/{id}
     * Deletes an incident.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable Long id) {
        suCoService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sự cố thành công", null));
    }

    /**
     * POST /api/v1/su-co/progress
     * Adds a progress update to an incident.
     */
    @PostMapping("/progress")
    public ResponseEntity<ApiResponse<TienDoXuLyResponse>> addProgress(
            @RequestBody @Valid TienDoXuLyRequest request) {
        TienDoXuLyResponse response = suCoService.addProgress(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiến độ thành công", response));
    }

    /**
     * GET /api/v1/su-co/{id}/progress
     * Returns progress history for an incident.
     */
    @GetMapping("/{id}/progress")
    public ResponseEntity<ApiResponse<List<TienDoXuLyResponse>>> getProgress(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.getProgressBySuCo(id)));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/su-co/status/{tinhTrang}
     * Filter by processing status.
     */
    @GetMapping("/status/{tinhTrang}")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangXuLy status = TinhTrangXuLy.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(suCoService.findByTinhTrangXuLy(status)));
    }

    /**
     * GET /api/v1/su-co/severity/{mucDo}
     * Filter by severity level.
     */
    @GetMapping("/severity/{mucDo}")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> filterBySeverity(
            @PathVariable String mucDo) {
        MucDoNghiemTrong severity = MucDoNghiemTrong.valueOf(mucDo);
        return ResponseEntity.ok(ApiResponse.success(suCoService.findByMucDoNghiemTrong(severity)));
    }

    /**
     * GET /api/v1/su-co/search/location
     * Search by location (partial match).
     */
    @GetMapping("/search/location")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> searchByLocation(
            @RequestParam String location,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.searchByViTriContaining(location, page, size).getContent()));
    }

    /**
     * GET /api/v1/su-co/search/description
     * Search by description (partial match).
     */
    @GetMapping("/search/description")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> searchByDescription(
            @RequestParam String description,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.searchByMoTaContaining(description, page, size).getContent()));
    }
}
