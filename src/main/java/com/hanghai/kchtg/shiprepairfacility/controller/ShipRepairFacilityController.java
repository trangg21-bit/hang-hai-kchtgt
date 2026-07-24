package com.hanghai.kchtg.shiprepairfacility.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.shiprepairfacility.dto.*;
import com.hanghai.kchtg.shiprepairfacility.service.ShipRepairFacilityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ship-repair-facility")
@RequiredArgsConstructor
@Slf4j
public class ShipRepairFacilityController {

    private final ShipRepairFacilityService service;

    @PreAuthorize("@auth.check(authentication, 'shiprepair:create')")
    @PostMapping
    public ResponseEntity<ApiResponse<ShipRepairFacilityResponse>> create(
            @Valid @RequestBody ShipRepairFacilityCreateRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            ShipRepairFacilityResponse response = service.create(request, username);
            return ResponseEntity.ok(ApiResponse.success("Tạo mới thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi tạo cơ sở sửa chữa, đóng tàu: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:read')")
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShipRepairFacilityResponse>> getById(@PathVariable java.util.UUID id) {
        try {
            ShipRepairFacilityResponse response = service.getById(id);
            return ResponseEntity.ok(ApiResponse.success("Xem chi tiết thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy cơ sở sửa chữa, đóng tàu theo id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:read')")
    @GetMapping
    public ResponseEntity<ApiResponse<List<ShipRepairFacilityResponse>>> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        try {
            List<ShipRepairFacilityResponse> responses = service.findAll(page, size);
            return ResponseEntity.ok(ApiResponse.success("Danh sách cơ sở sửa chữa, đóng tàu", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm tất cả cơ sở sửa chữa, đóng tàu: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:update')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ShipRepairFacilityResponse>> update(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody ShipRepairFacilityUpdateRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            ShipRepairFacilityResponse response = service.update(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Cập nhật thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi cập nhật cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:delete')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable java.util.UUID id, Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            service.delete(id, username);
            return ResponseEntity.ok(ApiResponse.success("Xóa thành công", null));
        } catch (Exception e) {
            log.warn("Lỗi khi xóa cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:approvec1')")
    @PostMapping("/{id}/approve/c1")
    public ResponseEntity<ApiResponse<ShipRepairFacilityResponse>> approveC1(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            ShipRepairFacilityResponse response = service.approveC1(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 1 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C1 cho cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:approvec2')")
    @PostMapping("/{id}/approve/c2")
    public ResponseEntity<ApiResponse<ShipRepairFacilityResponse>> approveC2(
            @PathVariable java.util.UUID id,
            @Valid @RequestBody ApprovalRequest request,
            Authentication authentication) {
        try {
            String username = authentication != null ? authentication.getName() : "system";
            ShipRepairFacilityResponse response = service.approveC2(id, request, username);
            return ResponseEntity.ok(ApiResponse.success("Phê duyệt cấp 2 thành công", response));
        } catch (Exception e) {
            log.warn("Lỗi khi duyệt C2 cho cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:history')")
    @GetMapping("/{id}/history")
    public ResponseEntity<ApiResponse<List<HistoryEntry>>> getHistory(@PathVariable java.util.UUID id) {
        try {
            List<HistoryEntry> history = service.getHistory(id);
            return ResponseEntity.ok(ApiResponse.success("Lịch sử phê duyệt thành công", history));
        } catch (Exception e) {
            log.warn("Lỗi khi lấy lịch sử cho cơ sở sửa chữa, đóng tàu id {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PreAuthorize("@auth.check(authentication, 'shiprepair:read')")
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ShipRepairFacilityResponse>>> search(
            @RequestParam(required = false) java.util.UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String approvalStatus,
            @RequestParam(required = false) String approvalStatusPheDuyet) {
        try {
            List<ShipRepairFacilityResponse> responses = service.search(orgUnitId, keyword, province, approvalStatus, approvalStatusPheDuyet);
            return ResponseEntity.ok(ApiResponse.success("Tìm kiếm thành công", responses));
        } catch (Exception e) {
            log.warn("Lỗi khi tìm kiếm cơ sở sửa chữa, đóng tàu: {}", e.getMessage());
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
