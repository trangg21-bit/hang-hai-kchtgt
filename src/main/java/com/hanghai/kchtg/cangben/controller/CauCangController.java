package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.caucang.*;
import com.hanghai.kchtg.cangben.service.CauCangApprovalService;
import com.hanghai.kchtg.cangben.service.CauCangService;
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
 * REST controller for CauCang (crane/gantry) CRUD + approval + history.
 * Covers features F-020 through F-025.
 * <p>
 * Endpoints:
 *   GET    /api/v1/cau-cang          — list with pagination
 *   GET    /api/v1/cau-cang/{id}      — get by id
 *   POST   /api/v1/cau-cang          — create
 *   PUT    /api/v1/cau-cang          — update
 *   DELETE /api/v1/cau-cang/{id}      — soft-delete
 *   POST   /api/v1/cau-cang/{id}/approve — approve
 *   POST   /api/v1/cau-cang/{id}/reject  — reject
 *   GET    /api/v1/cau-cang/{id}/history — history (change log)
 * </p>
 */
@RestController
@RequestMapping("/api/v1/cau-cang")
@RequiredArgsConstructor
@Slf4j
@Validated
public class CauCangController {

    private final CauCangService cauCangService;
    private final CauCangApprovalService cauCangApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'caucang:create')")
    public ResponseEntity<ApiResponse<CauCangResponse>> create(@Valid @RequestBody CreateCauCangRequest request) {
        log.info("Creating CauCang: code={}", request.getMaCau());
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cầu cảng thành công", cauCangService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'caucang:read')")
    public ResponseEntity<ApiResponse<CauCangResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cầu cảng thành công", cauCangService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'caucang:read')")
    public ResponseEntity<ApiResponse<Page<CauCangResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cầu cảng thành công",
                cauCangService.findAll(page, size, orgUnitId)));
    }

    @GetMapping("/code/{maCau}")
    @PreAuthorize("@auth.check(authentication, 'caucang:read')")
    public ResponseEntity<ApiResponse<CauCangResponse>> findByCode(@PathVariable String maCau) {
        return ResponseEntity.ok(ApiResponse.success("Tìm theo mã cầu cảng thành công",
                cauCangService.findByCode(maCau)));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'caucang:update')")
    public ResponseEntity<ApiResponse<CauCangResponse>> update(@Valid @RequestBody UpdateCauCangRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cầu cảng thành công", cauCangService.update(request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'caucang:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting CauCang: id={}", id);
        cauCangService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cầu cảng thành công", null));
    }

    // ── APPROVAL ─────────────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'caucang:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving CauCang: id={}, userId={}", id, userId);
        cauCangApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cầu cảng thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'caucang:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting CauCang: id={}, userId={}", id, userId);
        cauCangApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cầu cảng thành công", null));
    }

    // ── HISTORY ──────────────────────────────────────────────────────

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'caucang:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting CauCang history: id={}", id);
        Object history = cauCangApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cầu cảng thành công", history));
    }
}
