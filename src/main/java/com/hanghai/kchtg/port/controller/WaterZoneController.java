package com.hanghai.kchtg.port.controller;

import java.util.UUID;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.port.dto.waterzone.*;
import com.hanghai.kchtg.port.entity.WaterZoneType;
import com.hanghai.kchtg.port.service.WaterZoneApprovalService;
import com.hanghai.kchtg.port.service.WaterZoneService;
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
@RequestMapping("/api/v1/water-zones")
@RequiredArgsConstructor
@Slf4j
@Validated
public class WaterZoneController {

    private final WaterZoneService waterZoneService;
    private final WaterZoneApprovalService waterZoneApprovalService;

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'waterzone:create')")
    public ResponseEntity<ApiResponse<WaterZoneResponse>> create(@Valid @RequestBody CreateWaterZoneRequest request) {
        log.info("Creating WaterZone: code={}", request.getWaterZoneCode());
        return ResponseEntity.ok(ApiResponse.success("Tạo mới vùng nước thành công", waterZoneService.create(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'waterzone:read')")
    public ResponseEntity<ApiResponse<WaterZoneResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin vùng nước thành công", waterZoneService.getById(id)));
    }

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'waterzone:read')")
    public ResponseEntity<ApiResponse<Page<WaterZoneResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) UUID portId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) WaterZoneType waterZoneType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String approvalStatus) {
        log.info("Listing WaterZones: page={}, size={}, orgUnitId={}, portId={}, search={}, waterZoneType={}, status={}, approvalStatus={}",
                page, size, orgUnitId, portId, search, waterZoneType, status, approvalStatus);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách vùng nước thành công",
                waterZoneService.findAll(page, size, orgUnitId, portId, search, waterZoneType, status, approvalStatus)));
    }

    @GetMapping("/code/{waterZoneCode}")
    @PreAuthorize("@auth.check(authentication, 'waterzone:read')")
    public ResponseEntity<ApiResponse<WaterZoneResponse>> findByCode(@PathVariable String waterZoneCode) {
        return ResponseEntity.ok(ApiResponse.success("Tìm theo mã vùng nước thành công",
                waterZoneService.findByCode(waterZoneCode)));
    }

    @PutMapping
    @PreAuthorize("@auth.check(authentication, 'waterzone:update')")
    public ResponseEntity<ApiResponse<WaterZoneResponse>> update(@Valid @RequestBody UpdateWaterZoneRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật vùng nước thành công", waterZoneService.update(request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'waterzone:delete')")
    public ResponseEntity<ApiResponse<Void>> softDelete(@PathVariable UUID id) {
        log.info("Soft-deleting WaterZone: id={}", id);
        waterZoneService.softDelete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa vùng nước thành công", null));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("@auth.check(authentication, 'waterzone:approve')")
    public ResponseEntity<ApiResponse<Void>> approve(
            @PathVariable UUID id,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Approving WaterZone: id={}, userId={}", id, userId);
        waterZoneApprovalService.approve(id, userId, null);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt vùng nước thành công", null));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'waterzone:approve')")
    public ResponseEntity<ApiResponse<Void>> reject(
            @PathVariable UUID id,
            @RequestParam @jakarta.validation.constraints.Size(min = 10, message = "Lý do từ chối tối thiểu 10 ký tự") String reason,
            Authentication authentication) {
        String userId = authentication.getName();
        log.info("Rejecting WaterZone: id={}, userId={}", id, userId);
        waterZoneApprovalService.approve(id, userId, reason);
        return ResponseEntity.ok(ApiResponse.success("Từ chối vùng nước thành công", null));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'waterzone:history')")
    public ResponseEntity<ApiResponse<Object>> getHistory(@PathVariable UUID id) {
        log.info("Getting WaterZone history: id={}", id);
        Object history = waterZoneApprovalService.getHistory(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử vùng nước thành công", history));
    }
}
