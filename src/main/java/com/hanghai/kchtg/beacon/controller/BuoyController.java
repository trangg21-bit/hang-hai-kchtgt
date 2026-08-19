package com.hanghai.kchtg.beacon.controller;

import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.service.BuoyService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.entity.ChangeLog;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Buoy CRUD + approval endpoints (F-074 to F-077).
 */
@RestController
@RequestMapping("/api/buoys")
@RequiredArgsConstructor
public class BuoyController {

    private final BuoyService buoyService;
    private final ChangeLogRepository changeLogRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BuoyResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(buoyService.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuoyResponse>> findById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(buoyService.findById(id)));
    }

    @GetMapping("/search")
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
    @PreAuthorize("@auth.check(authentication, 'buoy:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode(
            @RequestParam(required = false) java.util.UUID stationId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Sinh mã phao tiêu thành công",
                Map.of("buoyCode", buoyService.generateCode(stationId))));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BuoyResponse>> create(
            @Valid @RequestBody CreateBuoyRequest request) {
        BuoyResponse response = buoyService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới phao tiêu thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BuoyResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuoyRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật phao tiêu thành công",
                buoyService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        buoyService.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa phao tiêu thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(
            @PathVariable UUID id) {
        buoyService.submitForApproval(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    public ResponseEntity<ApiResponse<BuoyResponse>> approveL1(
            @PathVariable UUID id, @RequestParam java.util.UUID approverId,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L1 thành công",
                buoyService.approveL1(id, approverId, content)));
    }

    @PostMapping("/{id}/approve-l2")
    public ResponseEntity<ApiResponse<BuoyResponse>> approveL2(
            @PathVariable UUID id, @RequestParam java.util.UUID approverId,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L2 thành công — Đã công bố",
                buoyService.approveL2(id, approverId, content)));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<BuoyResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam java.util.UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Đã từ chối",
                buoyService.reject(id, rejectReason, approverId)));
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(@PathVariable UUID id) {
        List<ChangeLog> changeHistory = changeLogRepository
                .findByEntityTypeAndEntityId("Buoy", id.toString());
        Map<String, Object> result = Map.of(
                "changeHistory", changeHistory,
                "approvalLog", List.of()
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/history/all")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllHistory() {
        List<ChangeLog> changeHistory = changeLogRepository.findByEntityType("Buoy");
        Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    BuoyResponse buoy = buoyService.findById(UUID.fromString(log.getEntityId()));
                    entityNames.put(log.getEntityId(), buoy.getName());
                } catch (Exception e) {
                    entityNames.put(log.getEntityId(), log.getEntityId());
                }
            }
        }
        Map<String, Object> result = Map.of(
                "entityType", "Buoy",
                "changeHistory", changeHistory,
                "entityNames", entityNames
        );
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
