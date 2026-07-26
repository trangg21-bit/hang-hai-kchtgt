package com.hanghai.kchtg.port.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.pier.*;
import com.hanghai.kchtg.port.entity.PierType;
import com.hanghai.kchtg.port.service.PierApprovalService;
import com.hanghai.kchtg.port.service.PierService;
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

@RestController
@RequestMapping("/api/v1/piers")
@RequiredArgsConstructor
@Slf4j
@Validated
public class PierController {

    private final PierService pierService;
    private final PierApprovalService pierApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'pier:create')")
    public ResponseEntity<ApiResponse<PierResponse>> create(@Valid @RequestBody CreatePierRequest request) {
        log.info("Creating Pier: code={}", request.getPierCode());
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cầu cảng thành công", pierService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'pier:read')")
    public ResponseEntity<ApiResponse<PierResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cầu cảng thành công", pierService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'pier:read')")
    public ResponseEntity<ApiResponse<Page<PierResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID berthId,
            @RequestParam(required = false) PierType pierType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus) {
        log.info("Listing Piers: page={}, size={}, orgUnitId={}, search={}, berthId={}, pierType={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, berthId, pierType, status, approvalStatus);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cầu cảng thành công",
                pierService.findAll(page, size, orgUnitId, search, berthId, pierType, status, approvalStatus)));
    }

    @GetMapping("/code/{pierCode}")
    @PreAuthorize("@auth.check(authentication, 'pier:read')")
    public ResponseEntity<ApiResponse<PierResponse>> findByCode(@PathVariable String pierCode) {
        return ResponseEntity.ok(ApiResponse.success("Tìm theo mã cầu cảng thành công",
                pierService.findByCode(pierCode)));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'pier:update')")
    public ResponseEntity<ApiResponse<PierResponse>> update(@Valid @RequestBody UpdatePierRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cầu cảng thành công", pierService.update(request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'pier:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Pier: id={}", id);
        pierService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cầu cảng thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'pier:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving Pier: id={}, userId={}", id, userId);
        pierApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cầu cảng thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'pier:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting Pier: id={}, userId={}", id, userId);
        pierApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cầu cảng thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'pier:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Pier history: id={}", id);
        Object history = pierApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cầu cảng thành công", history));
    }
}
