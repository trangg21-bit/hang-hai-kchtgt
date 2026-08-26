package com.hanghai.kchtg.beacon.controller;

import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.service.BuoyService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.security.annotation.DataScope;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Buoy CRUD + approval endpoints (F-074 to F-077).
 */
@RestController
@RequestMapping("/api/buoys")
@RequiredArgsConstructor
@DataScope
public class BuoyController {

    private final BuoyService buoyService;
    private final InfrastructureHistoryRepository historyRepository;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'buoy:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<BuoyResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(buoyService.findAll()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'buoy:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<BuoyResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(buoyService.findById(id)));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'buoy:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<BuoyResponse>>> search(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String code,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String locationDetail,
            @RequestParam(required = false) String approvalStatus) {
        return ResponseEntity.ok(ApiResponse.success(
                buoyService.search(name, code, type, status, condition, provinceId, locationDetail, approvalStatus)));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'buoy:create') or @auth.check(authentication, 'data:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode(
            @RequestParam(required = false) UUID stationId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Sinh mã phao tiêu thành công",
                Map.of("buoyCode", buoyService.generateCode(stationId))));
    }

    @PostMapping
    @PreAuthorize("@auth.check(authentication, 'buoy:create') or @auth.check(authentication, 'data:create')")
    public ResponseEntity<ApiResponse<BuoyResponse>> create(
            @Valid @RequestBody CreateBuoyRequest request) {
        BuoyResponse response = buoyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới phao tiêu thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'buoy:update') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<BuoyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuoyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật phao tiêu thành công",
                buoyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'buoy:delete') or @auth.check(authentication, 'data:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        buoyService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa phao tiêu thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("@auth.check(authentication, 'buoy:create') or @auth.check(authentication, 'buoy:update') or @auth.check(authentication, 'data:create') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
        buoyService.submitForApproval(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("@auth.check(authentication, 'buoy:approvec1') or @auth.check(authentication, 'buoy:approvel1') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel1')")
    public ResponseEntity<ApiResponse<BuoyResponse>> approveL1(
            @PathVariable UUID id,
            @RequestParam UUID approverId,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L1 thành công",
                buoyService.approveL1(id, approverId, content)));
    }

    @PostMapping("/{id}/approve-l2")
    @PreAuthorize("@auth.check(authentication, 'buoy:approvec2') or @auth.check(authentication, 'buoy:approvel2') or @auth.check(authentication, 'data:approvec2') or @auth.check(authentication, 'data:approvel2')")
    public ResponseEntity<ApiResponse<BuoyResponse>> approveL2(
            @PathVariable UUID id,
            @RequestParam UUID approverId,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L2 thành công — Đã công bố",
                buoyService.approveL2(id, approverId, content)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'buoy:approve') or @auth.check(authentication, 'data:write')")
    public ResponseEntity<ApiResponse<BuoyResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối",
                buoyService.reject(id, rejectReason, approverId)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'buoy:read') or @auth.check(authentication, 'buoy:history') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(@PathVariable UUID id) {
        List<InfrastructureHistory> changeHistory = historyRepository
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.BUOY, id);
        Map<String, Object> result = new HashMap<>();
        result.put("changeHistory", changeHistory);
        result.put("approvalLog", List.of());
        result.put("histories", changeHistory);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/history/all")
    @PreAuthorize("@auth.check(authentication, 'buoy:read') or @auth.check(authentication, 'buoy:history') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllHistory() {
        List<InfrastructureHistory> changeHistory = historyRepository
                .findByRefTypeOrderByApprovedDateDesc(InfrastructureType.BUOY);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : changeHistory) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        BuoyResponse buoy = buoyService.findById(logItem.getRefId());
                        entityNames.put(refIdStr, buoy.getName());
                    } catch (Exception e) {
                        entityNames.put(refIdStr, refIdStr);
                    }
                }
            }
        }
        Map<String, Object> result = new HashMap<>();
        result.put("entityType", "Buoy");
        result.put("changeHistory", changeHistory);
        result.put("entityNames", entityNames);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
