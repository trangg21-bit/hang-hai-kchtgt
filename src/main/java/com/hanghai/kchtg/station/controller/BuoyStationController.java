package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.buoy.BuoyStationResponse;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.station.dto.buoy.UpdateBuoyStationRequest;
import com.hanghai.kchtg.station.service.BuoyStationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

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
    private final BuoyRepository buoyRepository;

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'buoystation:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<List<BuoyStationResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/generate-code")
    @PreAuthorize("@auth.check(authentication, 'buoystation:create') or @auth.check(authentication, 'data:create')")
    public ResponseEntity<ApiResponse<Map<String, String>>> generateCode(
            @RequestParam(required = false) UUID portId) {
        String code = service.generateCode(portId);
        return ResponseEntity.ok(ApiResponse.success(
                "Sinh mã nhà trạm phao thành công", Map.of("code", code)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'buoystation:read') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/search")
    @PreAuthorize("@auth.check(authentication, 'buoystation:read') or @auth.check(authentication, 'data:read')")
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
    @PreAuthorize("@auth.check(authentication, 'buoystation:create') or @auth.check(authentication, 'data:create')")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> create(
            @Valid @RequestBody CreateBuoyStationRequest request) {
        BuoyStationResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm mới nhà trạm phao thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'buoystation:update') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBuoyStationRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật nhà trạm phao thành công",
                service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'buoystation:delete') or @auth.check(authentication, 'data:delete')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã xóa nhà trạm phao thành công", null));
    }

    @PostMapping("/{id}/submit-approval")
    @PreAuthorize("@auth.check(authentication, 'buoystation:create') or @auth.check(authentication, 'buoystation:update') or @auth.check(authentication, 'data:create') or @auth.check(authentication, 'data:update')")
    public ResponseEntity<ApiResponse<Void>> submitForApproval(@PathVariable UUID id) {
        service.submitForApproval(id);
        return ResponseEntity.ok(
                ApiResponse.success("Đã gửi phê duyệt", null));
    }

    @PostMapping("/{id}/approve-l1")
    @PreAuthorize("@auth.check(authentication, 'buoystation:approvec1') or @auth.check(authentication, 'buoystation:approvel1') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel1')")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> approveL1(
            @PathVariable UUID id,
            @RequestParam UUID approverId,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L1 thành công",
                service.approveL1(id, approverId, content)));
    }

    @PostMapping("/{id}/approve-l2")
    @PreAuthorize("@auth.check(authentication, 'buoystation:approvec2') or @auth.check(authentication, 'buoystation:approvel2') or @auth.check(authentication, 'data:approvec2') or @auth.check(authentication, 'data:approvel2')")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> approveL2(
            @PathVariable UUID id,
            @RequestParam UUID approverId,
            @RequestParam(required = false) String content) {
        return ResponseEntity.ok(ApiResponse.success(
                "Phê duyệt L2 thành công — Đã công bố",
                service.approveL2(id, approverId, content)));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("@auth.check(authentication, 'buoystation:approvec1') or @auth.check(authentication, 'buoystation:approvec2') or @auth.check(authentication, 'buoystation:approvel1') or @auth.check(authentication, 'buoystation:approvel2') or @auth.check(authentication, 'data:approvec1') or @auth.check(authentication, 'data:approvel2')")
    public ResponseEntity<ApiResponse<BuoyStationResponse>> reject(
            @PathVariable UUID id,
            @RequestParam String rejectReason,
            @RequestParam UUID approverId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Da từ chối",
                service.reject(id, rejectReason, approverId)));
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("@auth.check(authentication, 'buoystation:read') or @auth.check(authentication, 'buoystation:history') or @auth.check(authentication, 'data:read')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHistory(@PathVariable UUID id) {
        List<InfrastructureHistory> changeHistory = historyRepository
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.BUOY_STATION, id);
        Map<String, Object> result = Map.of(
                "changeHistory", changeHistory,
                "approvalLog", List.of(),
                "histories", changeHistory);
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
