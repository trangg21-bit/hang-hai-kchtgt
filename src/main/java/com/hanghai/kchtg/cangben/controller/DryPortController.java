package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.cangcan.*;
import com.hanghai.kchtg.cangben.service.DryPortApprovalService;
import com.hanghai.kchtg.cangben.service.DryPortService;
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
@RequestMapping("/api/v1/dry-ports")
@RequiredArgsConstructor
@Slf4j
@Validated
public class DryPortController {

    private final DryPortService dryPortService;
    private final DryPortApprovalService dryPortApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'cangcan:create')")
    public ResponseEntity<ApiResponse<DryPortResponse>> create(
            @Valid @RequestBody CreateDryPortRequest request) {
        log.info("Creating DryPort: code={}", request.getDryPortCode());
        DryPortResponse response = dryPortService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cảng cạn thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangcan:read')")
    public ResponseEntity<ApiResponse<DryPortResponse>> getById(@PathVariable UUID id) {
        log.info("Getting DryPort by id={}", id);
        DryPortResponse response = dryPortService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng cạn thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'cangcan:read')")
    public ResponseEntity<ApiResponse<Page<DryPortResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus) {
        log.info("Listing DryPorts: page={}, size={}, orgUnitId={}, search={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, status, approvalStatus);
        Page<DryPortResponse> result = dryPortService.findAll(page, size, orgUnitId, search, status, approvalStatus);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng cạn thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'cangcan:update')")
    public ResponseEntity<ApiResponse<DryPortResponse>> update(
            @Valid @RequestBody UpdateDryPortRequest request) {
        log.info("Updating DryPort: id={}", request.getId());
        DryPortResponse response = dryPortService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cảng cạn thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangcan:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting DryPort: id={}", id);
        dryPortService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng cạn thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'cangcan:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving DryPort: id={}, userId={}", id, userId);
        dryPortApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cảng cạn thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'cangcan:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting DryPort: id={}, userId={}", id, userId);
        dryPortApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng cạn thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'cangcan:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting DryPort history: id={}", id);
        Object history = dryPortApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng cạn thành công", history));
    }
}
