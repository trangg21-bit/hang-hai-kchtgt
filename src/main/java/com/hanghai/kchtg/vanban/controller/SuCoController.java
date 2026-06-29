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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for F-131 Quản lý thông tin sự cố.
 */
@RestController
@RequestMapping("/api/v1/su-co")
@RequiredArgsConstructor
public class SuCoController {

    private final SuCoService suCoService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> listIncidents(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<SuCoResponse> result = suCoService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:su-co:create')")
    public ResponseEntity<ApiResponse<SuCoResponse>> createIncident(
            @RequestBody @Valid SuCoCreateRequest request) {
        SuCoResponse response = suCoService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Báo cáo sự cố thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<SuCoResponse>> getIncident(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:su-co:update')")
    public ResponseEntity<ApiResponse<SuCoResponse>> updateIncident(
            @PathVariable Long id,
            @RequestBody @Valid SuCoCreateRequest request) {
        SuCoResponse response = suCoService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật sự cố thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:su-co:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteIncident(@PathVariable Long id) {
        suCoService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa sự cố thành công", null));
    }

    @PostMapping("/progress")
    @PreAuthorize("@auth.check(authentication, 'vanban:su-co:progress')")
    public ResponseEntity<ApiResponse<TienDoXuLyResponse>> addProgress(
            @RequestBody @Valid TienDoXuLyRequest request) {
        TienDoXuLyResponse response = suCoService.addProgress(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiến độ thành công", response));
    }

    @GetMapping("/{id}/progress")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<TienDoXuLyResponse>>> getProgress(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.getProgressBySuCo(id)));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    @GetMapping("/status/{tinhTrang}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangXuLy status = TinhTrangXuLy.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(suCoService.findByTinhTrangXuLy(status)));
    }

    @GetMapping("/severity/{mucDo}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> filterBySeverity(
            @PathVariable String mucDo) {
        MucDoNghiemTrong severity = MucDoNghiemTrong.valueOf(mucDo);
        return ResponseEntity.ok(ApiResponse.success(suCoService.findByMucDoNghiemTrong(severity)));
    }

    @GetMapping("/search/location")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> searchByLocation(
            @RequestParam String location,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.searchByViTriContaining(location, page, size).getContent()));
    }

    @GetMapping("/search/description")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<SuCoResponse>>> searchByDescription(
            @RequestParam String description,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(suCoService.searchByMoTaContaining(description, page, size).getContent()));
    }
}
