package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.cangbien.*;
import com.hanghai.kchtg.cangben.service.PortApprovalService;
import com.hanghai.kchtg.cangben.service.PortService;
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
@RequestMapping("/api/v1/ports")
@RequiredArgsConstructor
@Slf4j
@Validated
public class PortController {

    private final PortService portService;
    private final PortApprovalService portApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'cangbien:create')")
    public ResponseEntity<ApiResponse<PortResponse>> create(
            @Valid @RequestBody CreatePortRequest request) {
        log.info("Creating Port: code={}", request.getPortCode());
        PortResponse response = portService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới cảng biển thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangbien:read')")
    public ResponseEntity<ApiResponse<PortResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Port by id={}", id);
        PortResponse response = portService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin cảng biển thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'cangbien:read')")
    public ResponseEntity<ApiResponse<Page<PortResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String portCode,
            @RequestParam(required = false) String portName,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus) {
        log.info("Listing Ports: page={}, size={}, orgUnitId={}, search={}, portCode={}, portName={}, province={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, portCode, portName, province, operationalStatus, approvalStatus);
        Page<PortResponse> result = portService.findAll(
                page, size, orgUnitId, portCode, portName, province, operationalStatus, approvalStatus, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách cảng biển thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'cangbien:update')")
    public ResponseEntity<ApiResponse<PortResponse>> update(
            @Valid @RequestBody UpdatePortRequest request) {
        log.info("Updating Port: id={}", request.getId());
        PortResponse response = portService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật cảng biển thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'cangbien:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Port: id={}", id);
        portService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa cảng biển thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'cangbien:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving Port: id={}, userId={}", id, userId);
        portApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt cảng biển thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'cangbien:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting Port: id={}, userId={}", id, userId);
        portApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối cảng biển thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'cangbien:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Port history: id={}", id);
        Object history = portApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử cảng biển thành công", history));
    }
}
