package com.hanghai.kchtg.cangben.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.cangben.dto.bencang.*;
import com.hanghai.kchtg.cangben.service.BerthApprovalService;
import com.hanghai.kchtg.cangben.service.BerthService;
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
@RequestMapping("/api/v1/berths")
@RequiredArgsConstructor
@Slf4j
@Validated
public class BerthController {

    private final BerthService berthService;
    private final BerthApprovalService berthApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'bencang:create')")
    public ResponseEntity<ApiResponse<BerthResponse>> create(
            @Valid @RequestBody CreateBerthRequest request) {
        log.info("Creating Berth: code={}", request.getBerthCode());
        BerthResponse response = berthService.create(request);
        return ResponseEntity.ok(ApiResponse.success("Tạo mới bến cảng thành công", response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'bencang:read')")
    public ResponseEntity<ApiResponse<BerthResponse>> getById(@PathVariable UUID id) {
        log.info("Getting Berth by id={}", id);
        BerthResponse response = berthService.getById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin bến cảng thành công", response));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'bencang:read')")
    public ResponseEntity<ApiResponse<Page<BerthResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String berthCode,
            @RequestParam(required = false) String berthName,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) String waterway,
            @RequestParam(required = false) String berthType,
            @RequestParam(required = false) String operationalStatus,
            @RequestParam(required = false) String approvalStatus) {
        log.info("Listing Berths: page={}, size={}, orgUnitId={}, search={}, berthCode={}, berthName={}, portId={}, status={}, approvalStatus={}",
                page, size, orgUnitId, search, berthCode, berthName, portId, operationalStatus, approvalStatus);
        Page<BerthResponse> result = berthService.findAll(page, size, orgUnitId,
                berthCode, berthName, portId, waterway, berthType, operationalStatus, approvalStatus, search);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bến cảng thành công", result));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'bencang:update')")
    public ResponseEntity<ApiResponse<BerthResponse>> update(
            @Valid @RequestBody UpdateBerthRequest request) {
        log.info("Updating Berth: id={}", request.getId());
        BerthResponse response = berthService.update(request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật bến cảng thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'bencang:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting Berth: id={}", id);
        berthService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa bến cảng thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'bencang:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving Berth: id={}, userId={}", id, userId);
        berthApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt bến cảng thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'bencang:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting Berth: id={}, userId={}", id, userId);
        berthApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối bến cảng thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'bencang:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting Berth history: id={}", id);
        Object history = berthApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử bến cảng thành công", history));
    }
}
