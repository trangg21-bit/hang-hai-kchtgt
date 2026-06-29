package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.TinhTrangQuyHoach;
import com.hanghai.kchtg.vanban.service.QuyHoachBenCangService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for F-132 Quản lý quy hoạch bến cảng.
 */
@RestController
@RequestMapping("/api/v1/quy-hoach-ben-cang")
@RequiredArgsConstructor
public class QuyHoachBenCangController {

    private final QuyHoachBenCangService quyHoachBenCangService;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> listPlans(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<QuyHoachBenCangResponse> result = quyHoachBenCangService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:quy-hoach:create')")
    public ResponseEntity<ApiResponse<QuyHoachBenCangResponse>> createPlan(
            @RequestBody @Valid QuyHoachBenCangCreateRequest request) {
        QuyHoachBenCangResponse response = quyHoachBenCangService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo quy hoạch bến cảng thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<QuyHoachBenCangResponse>> getPlan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.getById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:quy-hoach:update')")
    public ResponseEntity<ApiResponse<QuyHoachBenCangResponse>> updatePlan(
            @PathVariable Long id,
            @RequestBody @Valid QuyHoachBenCangCreateRequest request) {
        QuyHoachBenCangResponse response = quyHoachBenCangService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật quy hoạch bến cảng thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:quy-hoach:delete')")
    public ResponseEntity<ApiResponse<Void>> deletePlan(@PathVariable Long id) {
        quyHoachBenCangService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa quy hoạch bến cảng thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    @GetMapping("/status/{tinhTrang}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangQuyHoach status = TinhTrangQuyHoach.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.findByTinhTrang(status)));
    }

    @GetMapping("/name-search")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> searchByName(
            @RequestParam String keyword,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.searchByTenDoAnContaining(keyword, page, size).getContent()));
    }

    @GetMapping("/date-range")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<QuyHoachBenCangResponse>>> filterByDateRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end) {
        return ResponseEntity.ok(ApiResponse.success(quyHoachBenCangService.findByNgayPheDuyetBetween(start, end)));
    }

    // ── Dynamic Search Endpoint (F-133) ───────────────────────────────

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'vanban:quy-hoach:search')")
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
