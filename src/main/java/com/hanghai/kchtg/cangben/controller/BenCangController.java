package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.bencang.*;
import com.hanghai.kchtg.cangben.service.BenCangApprovalService;
import com.hanghai.kchtg.cangben.service.BenCangService;
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
 * REST controller for BenCang (berth) CRUD + approval + history.
 * Covers features F-014 through F-019.
 * <p>
 * Endpoints:
 *   GET    /api/v1/ben-cang          — list with pagination
 *   GET    /api/v1/ben-cang/{id}      — get by id
 *   POST   /api/v1/ben-cang          — create
 *   PUT    /api/v1/ben-cang          — update
 *   DELETE /api/v1/ben-cang/{id}      — soft-delete
 *   POST   /api/v1/ben-cang/{id}/approve — approve
 *   POST   /api/v1/ben-cang/{id}/reject  — reject
 *   GET    /api/v1/ben-cang/{id}/history — history (change log)
 * </p>
 */
@RestController
@RequestMapping("/api/v1/ben-cang")
@RequiredArgsConstructor
@Slf4j
@Validated
public class BenCangController {

    private final BenCangService benCangService;
    private final BenCangApprovalService benCangApprovalService;

    // ── CREATE (F-014) ───────────────────────────────────────────────

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'bencang:create')")
    public ResponseEntity<ApiResponse<BenCangResponse>> create(
            @Valid @RequestBody CreateBenCangRequest request) {
        log.info("Creating BenCang: code={}", request.getMaBen());
        BenCangResponse response = benCangService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới bến cảng thành công", response));
    }

    // ── READ (F-017) ─────────────────────────────────────────────────

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'bencang:read')")
    public ResponseEntity<ApiResponse<BenCangResponse>> getById(@PathVariable UUID id) {
        log.info("Getting BenCang by id={}", id);
        BenCangResponse response = benCangService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin bến cảng thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'bencang:read')")
    public ResponseEntity<ApiResponse<Page<BenCangResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId) {
        log.info("Listing BenCang: page={}, size={}, orgUnitId={}", page, size, orgUnitId);
        Page<BenCangResponse> result = benCangService.findAll(page, size, orgUnitId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bến cảng thành công", result));
    }

    // ── UPDATE (F-015) ───────────────────────────────────────────────

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'bencang:update')")
    public ResponseEntity<ApiResponse<BenCangResponse>> update(
            @Valid @RequestBody UpdateBenCangRequest request) {
        log.info("Updating BenCang: id={}", request.getId());
        BenCangResponse response = benCangService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bến cảng thành công", response));
    }

    // ── DELETE (F-016) ───────────────────────────────────────────────

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'bencang:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting BenCang: id={}", id);
        benCangService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bến cảng thành công", null));
    }

    // ── APPROVAL (F-017) ────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'bencang:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving BenCang: id={}, userId={}", id, userId);
        benCangApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bến cảng thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'bencang:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting BenCang: id={}, userId={}", id, userId);
        benCangApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối bến cảng thành công", null));
    }

    // ── HISTORY (F-019) ────────────────────────────────────────────

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'bencang:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting BenCang history: id={}", id);
        Object history = benCangApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử bến cảng thành công", history));
    }
}
