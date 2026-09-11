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
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    private final UserRepository userRepository;

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
        String entityId = id.toString();
        String entityType = "Buoy";

        List<InfrastructureHistory> list = historyRepository
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.BUOY, id);

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("fieldName", h.getChangedField());
                    m.put("oldValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("changedAt", h.getApprovedDate());
                    return m;
                })
                .toList();

        List<Map<String, Object>> approvalLog = list.stream()
                .filter(h -> h.getStatus() != null && h.getChangedField() == null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("decision", h.getStatus().name());
                    m.put("reason", h.getReason() != null ? h.getReason() : "");
                    m.put("decidedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("decidedAt", h.getApprovedDate());
                    m.put("cap", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : "");
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("entityId", entityId);
        result.put("entityType", entityType);
        result.put("changeHistory", changeHistory);
        result.put("approvalLog", approvalLog);
        result.put("histories", list);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/history/all")
    @PreAuthorize("@auth.check(authentication, 'buoy:read') or @auth.check(authentication, 'buoy:history') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllHistory() {
        String entityType = "Buoy";
        List<InfrastructureHistory> list = historyRepository
                .findByRefTypeOrderByApprovedDateDesc(InfrastructureType.BUOY);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
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
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        List<Map<String, Object>> changeHistory = list.stream()
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("refId", h.getRefId());
                    m.put("entityId", h.getRefId() != null ? h.getRefId().toString() : null);
                    m.put("refType", h.getRefType());
                    m.put("approvalLevel", h.getApprovalLevel());
                    m.put("status", h.getStatus());
                    m.put("approvedBy", h.getApprovedBy() != null
                            ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString())
                            : null);
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("reason", h.getReason());
                    m.put("changedField", h.getChangedField());
                    m.put("fieldName", h.getChangedField());
                    m.put("previousValue", h.getPreviousValue());
                    m.put("oldValue", h.getPreviousValue());
                    m.put("newValue", h.getNewValue());
                    m.put("changedBy", h.getApprovedBy() != null
                            ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString())
                            : null);
                    m.put("changedAt", h.getApprovedDate());
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("entityType", entityType);
        result.put("changeHistory", changeHistory);
        result.put("entityNames", entityNames);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
