package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.vungnuoc.*;
import com.hanghai.kchtg.cangben.service.VungNuocApprovalService;
import com.hanghai.kchtg.cangben.service.VungNuocService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import java.util.UUID;

/**
 * REST controller for VungNuoc (water zone) CRUD + approval + history.
 * Covers features F-032 through F-037.
 * <p>
 * Endpoints:
 *   GET    /api/v1/vung-nuoc          — list with pagination
 *   GET    /api/v1/vung-nuoc/{id}      — get by id
 *   POST   /api/v1/vung-nuoc          — create
 *   PUT    /api/v1/vung-nuoc          — update
 *   DELETE /api/v1/vung-nuoc/{id}      — soft-delete
 *   POST   /api/v1/vung-nuoc/{id}/approve — approve
 *   POST   /api/v1/vung-nuoc/{id}/reject  — reject
 *   GET    /api/v1/vung-nuoc/{id}/history — history (change log)
 * </p>
 */
@RestController
@RequestMapping("/api/v1/vung-nuoc")
@RequiredArgsConstructor
@Slf4j
@Validated
public class VungNuocController {

    private final VungNuocService vungNuocService;
    private final VungNuocApprovalService vungNuocApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:create')")
    public ResponseEntity<ApiResponse<VungNuocResponse>> create(@Valid @RequestBody CreateVungNuocRequest request) {
        log.info("Creating VungNuoc: code={}", request.getMaVungNuoc());
        return ResponseEntity.ok(ApiResponse.success("Tạo mới vùng nước thành công", vungNuocService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:read')")
    public ResponseEntity<ApiResponse<VungNuocResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin vùng nước thành công", vungNuocService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:read')")
    public ResponseEntity<ApiResponse<Page<VungNuocResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID cangBienId) {
        log.info("Listing VungNuoc: page={}, size={}, orgUnitId={}, cangBienId={}", page, size, orgUnitId, cangBienId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vùng nước thành công",
                vungNuocService.findAll(page, size, orgUnitId, cangBienId)));
    }

    @GetMapping("/code/{maVungNuoc}")
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:read')")
    public ResponseEntity<ApiResponse<VungNuocResponse>> findByCode(@PathVariable String maVungNuoc) {
        return ResponseEntity.ok(ApiResponse.success("Tìm theo mã vùng nước thành công",
                vungNuocService.findByCode(maVungNuoc)));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:update')")
    public ResponseEntity<ApiResponse<VungNuocResponse>> update(@Valid @RequestBody UpdateVungNuocRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vùng nước thành công", vungNuocService.update(request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting VungNuoc: id={}", id);
        vungNuocService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa vùng nước thành công", null));
    }

    // ── APPROVAL ─────────────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving VungNuoc: id={}, userId={}", id, userId);
        vungNuocApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt vùng nước thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting VungNuoc: id={}, userId={}", id, userId);
        vungNuocApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối vùng nước thành công", null));
    }

    // ── HISTORY ──────────────────────────────────────────────────────

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'vungnuoc:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting VungNuoc history: id={}", id);
        Object history = vungNuocApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử vùng nước thành công", history));
    }
}
