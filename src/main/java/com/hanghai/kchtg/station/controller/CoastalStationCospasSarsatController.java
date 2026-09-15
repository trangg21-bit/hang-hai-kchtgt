package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.security.annotation.DataScope;
import com.hanghai.kchtg.station.dto.cospas.*;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.station.service.CoastalStationCospasSarsatService;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping({"/api/v1/stations/cospas-sarsat", "/api/v1/stations/cospas"})
@Validated
@RequiredArgsConstructor
@Tag(name = "Cospas-Sarsat Coastal Station", description = "Quản lý Đài thông tin vệ tinh Cospas-Sarsat")
@DataScope
public class CoastalStationCospasSarsatController {

    private static final int MAX_PAGE_SIZE = 200;

    private final CoastalStationCospasSarsatService service;

    @PostMapping({"", "/create"})
    @Operation(summary = "Tạo mới Đài Cospas-Sarsat")
    public ResponseEntity<CoastalStationCospasSarsat> createStation(
            @Valid @RequestBody CoastalStationCospasSarsatRequest request) {
        CoastalStationCospasSarsat created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật Đài Cospas-Sarsat")
    public ResponseEntity<CoastalStationCospasSarsat> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationCospasSarsatUpdateRequest request) {
        CoastalStationCospasSarsat updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa mềm Đài Cospas-Sarsat (chỉ khi DRAFT)")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết Đài Cospas-Sarsat theo ID")
    public ResponseEntity<CoastalStationCospasSarsatResponse> getStationById(@PathVariable UUID id) {
        CoastalStationCospasSarsat entity = service.getStationById(id);
        CoastalStationCospasSarsatResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Tìm kiếm phân trang danh sách Đài Cospas-Sarsat chuẩn VTS")
    public ResponseEntity<?> searchOrList(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) ApprovalStatus approvalStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(defaultValue = "true") boolean includeCounts,
            @RequestParam(required = false) String sort) {

        // Tương thích ngược: nếu không truyền tham số phân trang / bộ lọc nào, trả về danh sách đầy đủ
        if (page == null && size == null && keyword == null && orgUnitId == null && conditionStatus == null && approvalStatus == null && provinceId == null) {
            return ResponseEntity.ok(service.getAllStations());
        }

        int pageNum = page != null ? Math.max(0, page) : 0;
        int pageSize = size != null ? Math.min(Math.max(size, 1), MAX_PAGE_SIZE) : 10;
        Sort sortOrder = Sort.by(Sort.Direction.DESC, "createdAt");
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String prop = parts[0].trim();
            Sort.Direction dir = (parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())) ? Sort.Direction.ASC : Sort.Direction.DESC;
            sortOrder = Sort.by(dir, prop).and(sortOrder);
        }

        Pageable pageable = PageRequest.of(pageNum, pageSize, sortOrder);
        Page<CoastalStationCospasSarsatResponse> pageResult = service.searchPaged(
                orgUnitId, provinceId, conditionStatus, approvalStatus, keyword, updatedFrom, updatedTo, pageable);

        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("totalElements", pageResult.getTotalElements());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("size", pageResult.getSize());
        response.put("number", pageResult.getNumber());

        if (includeCounts) {
            response.put("statusCounts", service.countByApprovalStatus(orgUnitId, provinceId, conditionStatus, keyword, updatedFrom, updatedTo));
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/counts")
    @Operation(summary = "Đếm số lượng bản ghi theo từng tab trạng thái phê duyệt")
    public ResponseEntity<Map<String, Long>> getCounts(
            @RequestParam(required = false) UUID orgUnitId,
            @RequestParam(required = false) Integer provinceId,
            @RequestParam(required = false) ConditionStatus conditionStatus,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime updatedTo) {
        return ResponseEntity.ok(service.countByApprovalStatus(orgUnitId, provinceId, conditionStatus, keyword, updatedFrom, updatedTo));
    }

    @GetMapping("/options")
    @Operation(summary = "Lấy danh sách chọn nhẹ Đài Cospas-Sarsat (chỉ APPROVED & OPERATIONAL)")
    public ResponseEntity<List<CoastalStationCospasSarsatOptionResponse>> getOptions(
            @RequestParam(required = false) UUID orgUnitId) {
        return ResponseEntity.ok(service.getOptions(orgUnitId));
    }

    @GetMapping("/list")
    @Operation(summary = "Lấy toàn bộ danh sách Đài Cospas-Sarsat (chưa xóa)")
    public ResponseEntity<List<CoastalStationCospasSarsat>> getAllStations() {
        return ResponseEntity.ok(service.getAllStations());
    }

    @GetMapping("/search")
    @Operation(summary = "Tìm kiếm Đài Cospas-Sarsat theo từ khóa đơn giản")
    public ResponseEntity<List<CoastalStationCospasSarsat>> searchStations(@RequestParam String keyword) {
        return ResponseEntity.ok(service.searchStations(keyword));
    }

    @GetMapping("/by-code/{code}")
    @Operation(summary = "Tìm Đài Cospas-Sarsat theo mã")
    public ResponseEntity<CoastalStationCospasSarsat> findByCode(@PathVariable String code) {
        return service.findByCode(code)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP ---

    @PostMapping("/{id}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    public ResponseEntity<CoastalStationCospasSarsat> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve-l1")
    @Operation(summary = "Phê duyệt vòng 1 (Cảng vụ / Chi cục)")
    public ResponseEntity<CoastalStationCospasSarsat> approveLevel1(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel1(id));
    }

    @PostMapping("/{id}/approve-l2")
    @Operation(summary = "Phê duyệt vòng 2 (Cục Hàng hải)")
    public ResponseEntity<CoastalStationCospasSarsat> approveLevel2(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel2(id));
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt")
    public ResponseEntity<CoastalStationCospasSarsat> reject(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        String reason = body != null && body.get("rejectionReason") != null
                ? body.get("rejectionReason").toString()
                : "Từ chối phê duyệt";
        return ResponseEntity.ok(service.reject(id, reason));
    }

    // Tương thích ngược với endpoint /approve cũ
    @PostMapping("/{id}/approve")
    public ResponseEntity<CoastalStationCospasSarsat> approveLegacy(
            @PathVariable UUID id,
            @RequestBody(required = false) Map<String, Object> body) {
        boolean approved = body == null || !Boolean.FALSE.equals(body.get("approved"));
        return ResponseEntity.ok(service.approveStation(id, approved));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Xem lịch sử thay đổi của Đài Cospas-Sarsat")
    public ResponseEntity<List<CoastalStationCospasSarsatHistoryResponse>> getHistory(@PathVariable UUID id) {
        return ResponseEntity.ok(service.getHistory(id));
    }
}
