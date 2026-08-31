package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.station.service.CoastalStationInmarsatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller cho Đài thông tin vệ tinh Inmarsat (M-004: F-098..F-103).
 */
@RestController
@RequestMapping("/api/v1/stations/inmarsat")
@Validated
@RequiredArgsConstructor
@Tag(name = "Inmarsat Coastal Station", description = "Quản lý Đài thông tin vệ tinh Inmarsat")
@DataScope
public class CoastalStationInmarsatController {

    private final CoastalStationInmarsatService service;

    @GetMapping
    @Operation(summary = "Tìm kiếm phân trang danh sách Đài Inmarsat (F-102)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<Page<CoastalStationInmarsatResponse>> search(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UUID operatingOrgId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) String conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) UUID updatedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<CoastalStationInmarsatResponse> results = service.searchPaged(
                orgUnitId, keyword, operatingOrgId, provinceId, conditionStatus, approvalStatus,
                updatedBy, updatedFrom, updatedTo, pageable);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/counts")
    @Operation(summary = "Thống kê số lượng bản ghi theo tab trạng thái phê duyệt")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<Map<String, Long>> getCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String conditionStatus) {
        return ResponseEntity.ok(service.countByApprovalStatus(orgUnitId, keyword, conditionStatus));
    }

    @GetMapping("/generate-code")
    @Operation(summary = "Tự sinh mã Đài Inmarsat (INMARSAT-xxxx)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<Map<String, String>> generateCode() {
        String code = service.generateCode();
        return ResponseEntity.ok(Map.of("code", code));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết Đài Inmarsat (F-102)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> getStationById(@PathVariable UUID id) {
        CoastalStationInmarsat entity = service.getStationById(id);
        return ResponseEntity.ok(service.buildResponse(entity));
    }

    @PostMapping
    @Operation(summary = "Tạo mới Đài Inmarsat (Lưu tạm) (F-098)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:create', 'specialstation:create', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> createStation(
            @Valid @RequestBody CoastalStationInmarsatRequest request) {
        CoastalStationInmarsat created = service.createStation(request);
        return ResponseEntity.ok(service.buildResponse(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin Đài Inmarsat (F-099)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:update', 'specialstation:update', 'data:update', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationInmarsatUpdateRequest request) {
        CoastalStationInmarsat updated = service.updateStation(id, request);
        return ResponseEntity.ok(service.buildResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm Đài Inmarsat (F-100)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:delete', 'specialstation:delete', 'data:delete', 'admin:all')")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục (F-101)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:create', 'coastalstationinmarsat:update', 'specialstation:create', 'specialstation:update', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> submit(@PathVariable UUID id) {
        CoastalStationInmarsat submitted = service.submit(id);
        return ResponseEntity.ok(service.buildResponse(submitted));
    }

    @PostMapping("/{id}/approve-l1")
    @Operation(summary = "Phê duyệt cấp 1 (Cảng vụ / Chi cục) Đài Inmarsat (F-101)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:approvec1', 'coastalstationinmarsat:approve', 'specialstation:approve', 'data:approvec1', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> approveLevel1(@PathVariable UUID id) {
        CoastalStationInmarsat approved = service.approveLevel1(id);
        return ResponseEntity.ok(service.buildResponse(approved));
    }

    @PostMapping("/{id}/approve-l2")
    @Operation(summary = "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam) Đài Inmarsat (F-101)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:approvec2', 'coastalstationinmarsat:approve', 'specialstation:approve', 'data:approvec2', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> approveLevel2(@PathVariable UUID id) {
        CoastalStationInmarsat approved = service.approveLevel2(id);
        return ResponseEntity.ok(service.buildResponse(approved));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt Đài Inmarsat kèm lý do (F-101)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:reject', 'coastalstationinmarsat:approve', 'specialstation:approve', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationInmarsatResponse> reject(
            @PathVariable UUID id,
            @RequestBody CoastalStationInmarsatApprovalRequest request) {
        String reason = request.getRejectionReason() != null ? request.getRejectionReason() : request.getNote();
        CoastalStationInmarsat rejected = service.reject(id, reason);
        return ResponseEntity.ok(service.buildResponse(rejected));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Xem lịch sử thay đổi Đài Inmarsat (F-103)")
    @PreAuthorize("hasAnyAuthority('coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    public ResponseEntity<List<CoastalStationInmarsatHistoryResponse>> getHistory(@PathVariable UUID id) {
        List<CoastalStationInmarsatHistoryResponse> history = service.getHistory(id);
        return ResponseEntity.ok(history);
    }

    // Dropdown dùng liên module nên chỉ yêu cầu đã đăng nhập; phạm vi dữ liệu do
    // data scope trong truy vấn đảm nhiệm (giống các module KCHT khác).
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/options")
    @Operation(summary = "Danh sách Đài Inmarsat phục vụ dropdown options (chỉ APPROVED & OPERATIONAL)")
    public ResponseEntity<List<CoastalStationInmarsatOptionResponse>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(service.getOptions(orgUnitId));
    }

    // --- COMPATIBILITY APIS ---
    //
    // Bốn endpoint dưới đây trước kia KHÔNG có @PreAuthorize: bất kỳ ai đăng nhập
    // đều đọc được toàn bộ dữ liệu và — nghiêm trọng hơn — phê duyệt được hồ sơ.
    // Nay gắn quyền đúng như các endpoint chính.

    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    @GetMapping("/list")
    @Operation(summary = "Lấy tất cả đài Inmarsat đang hoạt động (Legacy)")
    public ResponseEntity<List<CoastalStationInmarsat>> getAllStations() {
        return ResponseEntity.ok(service.getAllStations());
    }

    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm GIS đài Inmarsat (Legacy)")
    public ResponseEntity<List<CoastalStationInmarsat>> searchStations(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchStations(keyword));
    }

    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationinmarsat:read', 'specialstation:read', 'data:read', 'admin:all')")
    @GetMapping("/by-device/{code}")
    @Operation(summary = "Tìm đài Inmarsat theo mã thiết bị (Legacy)")
    public ResponseEntity<CoastalStationInmarsat> findByDeviceCode(@PathVariable String code) {
        Optional<CoastalStationInmarsat> station = service.findByDeviceCode(code);
        return station.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * Duyệt vòng đang mở. Giữ URL cũ cho tích hợp chưa chuyển đổi nhưng nay đòi
     * đúng quyền duyệt như /approve-l1 và /approve-l2.
     */
    @PreAuthorize("@auth.checkAny(authentication, 'coastalstationinmarsat:approvec1', 'coastalstationinmarsat:approvec2', 'coastalstationinmarsat:approve', 'specialstation:approve', 'admin:all')")
    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt Đài Inmarsat (Legacy)")
    public ResponseEntity<CoastalStationInmarsat> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationInmarsatApprovalRequest request) {
        CoastalStationInmarsat approved = service.approveStation(id, Boolean.TRUE.equals(request.getApproved()), 1L);
        return ResponseEntity.ok(approved);
    }
}
