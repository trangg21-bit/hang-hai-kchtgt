package com.hanghai.kchtg.vanban.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.vanban.dto.*;
import com.hanghai.kchtg.vanban.entity.LoaiVanBan;
import com.hanghai.kchtg.vanban.entity.TinhTrangHieuLuc;
import com.hanghai.kchtg.vanban.service.VanBanPhapLyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * REST controller for F-128 Quản lý văn bản pháp lý.
 *
 * Endpoints:
 *   GET    /api/v1/van-ban-phap-ly           — list all legal documents
 *   POST   /api/v1/van-ban-phap-ly           — create a new legal document
 *   GET    /api/v1/van-ban-phap-ly/{id}      — get a single legal document
 *   PUT    /api/v1/van-ban-phap-ly/{id}      — update a legal document
 *   DELETE /api/v1/van-ban-phap-ly/{id}      — delete a legal document
 *   GET    /api/v1/van-ban-phap-ly/search    — dynamic search (F-135)
 */
@RestController
@RequestMapping("/api/v1/van-ban-phap-ly")
@RequiredArgsConstructor
public class VanBanPhapLyController {

    private final VanBanPhapLyService vanBanPhapLyService;

    /**
     * GET /api/v1/van-ban-phap-ly
     * Returns all legal documents.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<VanBanPhapLyResponse>>> listVanBan(
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        Page<VanBanPhapLyResponse> result = vanBanPhapLyService.findAll(page, size);
        return ResponseEntity.ok(ApiResponse.success(result.getContent()));
    }

    /**
     * POST /api/v1/van-ban-phap-ly
     * Creates a new legal document.
     */
    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'vanban:create')")
    public ResponseEntity<ApiResponse<VanBanPhapLyResponse>> createVanBan(
            @RequestBody @Valid VanBanPhapLyCreateRequest request) {
        VanBanPhapLyResponse response = vanBanPhapLyService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo văn bản pháp lý thành công", response));
    }

    /**
     * GET /api/v1/van-ban-phap-ly/{id}
     * Returns a single legal document by ID.
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<VanBanPhapLyResponse>> getVanBan(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.getById(id)));
    }

    /**
     * PUT /api/v1/van-ban-phap-ly/{id}
     * Updates an existing legal document.
     */
    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:update')")
    public ResponseEntity<ApiResponse<VanBanPhapLyResponse>> updateVanBan(
            @PathVariable Long id,
            @RequestBody @Valid VanBanPhapLyCreateRequest request) {
        VanBanPhapLyResponse response = vanBanPhapLyService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật văn bản pháp lý thành công", response));
    }

    /**
     * DELETE /api/v1/van-ban-phap-ly/{id}
     * Deletes a legal document.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vanban:delete')")
    public ResponseEntity<ApiResponse<Void>> deleteVanBan(@PathVariable Long id) {
        vanBanPhapLyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa văn bản pháp lý thành công", null));
    }

    // ── Filter Endpoints ──────────────────────────────────────────────

    /**
     * GET /api/v1/van-ban-phap-ly/status/{tinhTrang}
     * Filter by legal status.
     */
    @GetMapping("/status/{tinhTrang}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<VanBanPhapLyResponse>>> filterByStatus(
            @PathVariable String tinhTrang) {
        TinhTrangHieuLuc status = TinhTrangHieuLuc.valueOf(tinhTrang);
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.findByTinhTrangHieuLuc(status)));
    }

    /**
     * GET /api/v1/van-ban-phap-ly/type/{loai}
     * Filter by document type.
     */
    @GetMapping("/type/{loai}")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<List<VanBanPhapLyResponse>>> filterByType(
            @PathVariable String loai) {
        LoaiVanBan type = LoaiVanBan.valueOf(loai);
        return ResponseEntity.ok(ApiResponse.success(vanBanPhapLyService.findByLoaiVanBan(type)));
    }

    // ── Search Endpoint (F-135) ───────────────────────────────────────

    /**
     * GET /api/v1/van-ban-phap-ly/search
     * Dynamic search with keyword, issuing body, type, status, year range (F-135).
     */
    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'vanban:read')")
    public ResponseEntity<ApiResponse<KetQuaTimKiemResponse>> searchDocuments(
            @RequestParam(name = "keyword", required = false) String keyword,
            @RequestParam(name = "coQuan", required = false) String coQuan,
            @RequestParam(name = "loai", required = false) String loai,
            @RequestParam(name = "tinhTrang", required = false) String tinhTrang,
            @RequestParam(name = "yearStart", required = false) LocalDate yearStart,
            @RequestParam(name = "yearEnd", required = false) LocalDate yearEnd,
            @RequestParam(name = "page", required = false, defaultValue = "0") int page,
            @RequestParam(name = "size", required = false, defaultValue = "20") int size) {
        KetQuaTimKiemResponse result = vanBanPhapLyService.searchDocuments(
                keyword, coQuan, loai, tinhTrang, yearStart, yearEnd, page, size);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
