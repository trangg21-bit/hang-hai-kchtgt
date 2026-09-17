package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.buoy.BuoyStationResponse;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.station.dto.buoy.UpdateBuoyStationRequest;
import com.hanghai.kchtg.station.service.BuoyStationService;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * REST Controller cho CRUD + duyet nha tram phao (F-080 den F-085).
 */
@RestController
@RequestMapping("/api/v1/buoy-station")
@RequiredArgsConstructor
@DataScope
public class BuoyStationController {

        private final BuoyStationService service;
        private final InfrastructureHistoryRepository historyRepository;
        private final BuoyStationRepository phaoRepo;
        private final UserRepository userRepository;

        @GetMapping
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:read', 'buoyasset:manage', 'buoyasset:read', 'buoy:manage', 'buoy:read', 'data:read')")
        public ResponseEntity<ApiResponse<List<BuoyStationResponse>>> findAll() {
                return ResponseEntity.ok(ApiResponse.success(service.findAll()));
        }

        @GetMapping("/generate-code")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:create', 'buoyasset:manage', 'buoyasset:create', 'buoy:manage', 'buoy:create', 'data:create')")
        public ResponseEntity<ApiResponse<Map<String, String>>> generateCode(
                        @RequestParam(required = false) UUID portId) {
                String code = service.generateCode(portId);
                return ResponseEntity.ok(ApiResponse.success(
                                "Sinh mã nhà trạm phao thành công", Map.of("code", code)));
        }

        @GetMapping("/{id}")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:read', 'buoyasset:manage', 'buoyasset:read', 'buoy:manage', 'buoy:read', 'data:read')")
        public ResponseEntity<ApiResponse<BuoyStationResponse>> findById(@PathVariable UUID id) {
                return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
        }

        @GetMapping("/search")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:read', 'buoyasset:manage', 'buoyasset:read', 'buoy:manage', 'buoy:read', 'data:read')")
        public ResponseEntity<ApiResponse<List<BuoyStationResponse>>> search(
                        @RequestParam(required = false) String name,
                        @RequestParam(required = false) String code,
                        @RequestParam(required = false) String type,
                        @RequestParam(required = false) String status,
                        @RequestParam(required = false) UUID unitId,
                        @RequestParam(required = false) String province,
                        @RequestParam(required = false) UUID portId,
                        @RequestParam(required = false) UUID operatingOrgId) {
                return ResponseEntity.ok(ApiResponse.success(
                                service.search(name, code, type, status, unitId, province, portId, operatingOrgId)));
        }

        @PostMapping
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:create', 'buoyasset:manage', 'buoyasset:create', 'buoy:manage', 'buoy:create', 'data:create')")
        public ResponseEntity<ApiResponse<BuoyStationResponse>> create(
                        @Valid @RequestBody CreateBuoyStationRequest request) {
                BuoyStationResponse response = service.create(request);
                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success("Thêm mới nhà trạm phao thành công", response));
        }

        @PutMapping("/{id}")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:update', 'buoyasset:manage', 'buoyasset:update', 'buoy:manage', 'buoy:update', 'data:update')")
        public ResponseEntity<ApiResponse<BuoyStationResponse>> update(
                        @PathVariable UUID id,
                        @Valid @RequestBody UpdateBuoyStationRequest request) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Cập nhật nhà trạm phao thành công",
                                service.update(id, request)));
        }

        @DeleteMapping("/{id}")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:delete', 'buoyasset:manage', 'buoyasset:delete', 'buoy:manage', 'buoy:delete', 'data:delete')")
        public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
                service.delete(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Đã xóa nhà trạm phao thành công", null));
        }

        @PostMapping("/{id}/submit-approval")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:create', 'buoystation:update', 'buoyasset:manage', 'buoyasset:create', 'buoyasset:update', 'buoy:manage', 'buoy:create', 'buoy:update', 'data:create', 'data:update')")
        public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
                service.submitForApproval(id);
                return ResponseEntity.ok(
                                ApiResponse.success("Đã gửi phê duyệt", null));
        }

        @PostMapping("/{id}/approve-l1")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:approvec1', 'buoystation:approvel1', 'buoyasset:manage', 'buoyasset:approvec1', 'buoyasset:approvel1', 'buoy:manage', 'buoy:approvec1', 'buoy:approvel1', 'data:approvec1', 'data:approvel1')")
        public ResponseEntity<ApiResponse<BuoyStationResponse>> approveL1(
                        @PathVariable UUID id,
                        @RequestParam UUID approverId,
                        @RequestParam(required = false) String content) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Phê duyệt L1 thành công",
                                service.approveL1(id, approverId, content)));
        }

        @PostMapping("/{id}/approve-l2")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:approvec2', 'buoystation:approvel2', 'buoyasset:manage', 'buoyasset:approvec2', 'buoyasset:approvel2', 'buoy:manage', 'buoy:approvec2', 'buoy:approvel2', 'data:approvec2', 'data:approvel2')")
        public ResponseEntity<ApiResponse<BuoyStationResponse>> approveL2(
                        @PathVariable UUID id,
                        @RequestParam UUID approverId,
                        @RequestParam(required = false) String content) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Phê duyệt L2 thành công — Đã công bố",
                                service.approveL2(id, approverId, content)));
        }

        @PostMapping("/{id}/reject")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:approvec1', 'buoystation:approvec2', 'buoystation:approvel1', 'buoystation:approvel2', 'buoyasset:manage', 'buoyasset:approvec1', 'buoyasset:approvec2', 'buoyasset:approvel1', 'buoyasset:approvel2', 'buoy:manage', 'buoy:approvec1', 'buoy:approvec2', 'data:approvec1', 'data:approvel2')")
        public ResponseEntity<ApiResponse<BuoyStationResponse>> reject(
                        @PathVariable UUID id,
                        @RequestParam String rejectReason,
                        @RequestParam UUID approverId) {
                return ResponseEntity.ok(ApiResponse.success(
                                "Da từ chối",
                                service.reject(id, rejectReason, approverId)));
        }

        @GetMapping("/{id}/history")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:read', 'buoystation:history', 'buoyasset:manage', 'buoyasset:read', 'buoyasset:history', 'buoy:manage', 'buoy:read', 'buoy:history', 'data:read')")
        public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(@PathVariable UUID id) {
                String entityId = id.toString();
                String currentApprovalStatus = phaoRepo.findById(id)
                                .map(e -> e.getApprovalStatus() != null ? e.getApprovalStatus().name() : "")
                                .orElse("");

                List<InfrastructureHistory> list = historyRepository
                                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.BUOY_STATION, id);

                Set<UUID> userIds = list.stream()
                                .map(InfrastructureHistory::getApprovedBy)
                                .filter(Objects::nonNull)
                                .collect(Collectors.toSet());
                Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap()
                                : userRepository.findAllById(userIds).stream()
                                                .collect(Collectors.toMap(
                                                                User::getId,
                                                                u -> u.getFullName() != null
                                                                                && !u.getFullName().isBlank()
                                                                                                ? u.getFullName()
                                                                                                : u.getUsername(),
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
                                                        ? userNameMap.getOrDefault(h.getApprovedBy(),
                                                                        h.getApprovedBy().toString())
                                                        : null);
                                        m.put("approvedDate", h.getApprovedDate());
                                        m.put("changedAt", h.getApprovedDate());
                                        m.put("reason", "");
                                        m.put("changedField", h.getChangedField());
                                        m.put("fieldName", h.getChangedField());
                                        m.put("previousValue", h.getPreviousValue());
                                        m.put("oldValue", h.getPreviousValue());
                                        m.put("newValue", h.getNewValue());
                                        m.put("value", h.getNewValue());
                                        return m;
                                })
                                .toList();

                Map<String, Object> result = Map.of(
                                "entityId", entityId,
                                "entityType", "BuoyStation",
                                "currentApprovalStatus", currentApprovalStatus,
                                "changeHistory", changeHistory,
                                "approvalLog", List.of(),
                                "histories", list);
                return ResponseEntity.ok(ApiResponse.success(result));
        }

        @GetMapping("/history/all")
        @PreAuthorize("@auth.checkAny(authentication, 'buoystation:manage', 'buoystation:read', 'buoystation:history', 'buoyasset:manage', 'buoyasset:read', 'buoyasset:history', 'buoy:manage', 'buoy:read', 'buoy:history', 'data:read')")
        public ResponseEntity<ApiResponse<Map<String, Object>>> getAllHistory() {
                List<InfrastructureHistory> list = historyRepository
                                .findByRefTypeOrderByApprovedDateDesc(InfrastructureType.BUOY_STATION);
                Map<String, String> entityNames = new HashMap<>();
                for (InfrastructureHistory logItem : list) {
                        if (logItem.getRefId() != null) {
                                String refIdStr = logItem.getRefId().toString();
                                if (!entityNames.containsKey(refIdStr)) {
                                        try {
                                                phaoRepo.findById(logItem.getRefId())
                                                                .ifPresent(p -> entityNames.put(refIdStr, p.getName()));
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
                Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap()
                                : userRepository.findAllById(userIds).stream()
                                                .collect(Collectors.toMap(
                                                                User::getId,
                                                                u -> u.getFullName() != null
                                                                                && !u.getFullName().isBlank()
                                                                                                ? u.getFullName()
                                                                                                : u.getUsername(),
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
                                                        ? userNameMap.getOrDefault(h.getApprovedBy(),
                                                                        h.getApprovedBy().toString())
                                                        : null);
                                        m.put("approvedDate", h.getApprovedDate());
                                        m.put("changedAt", h.getApprovedDate());
                                        m.put("changedField", h.getChangedField());
                                        m.put("fieldName", h.getChangedField());
                                        m.put("previousValue", h.getPreviousValue());
                                        m.put("oldValue", h.getPreviousValue());
                                        m.put("newValue", h.getNewValue());
                                        m.put("value", h.getNewValue());
                                        return m;
                                })
                                .toList();
                return ResponseEntity.ok(ApiResponse.success(
                                Map.of("entityType", "BuoyStation", "changeHistory", changeHistory, "entityNames",
                                                entityNames)));
        }
}
