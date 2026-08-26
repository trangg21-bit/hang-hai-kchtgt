package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.station.dto.cospas.*;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.station.service.CoastalStationCospasSarsatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import com.hanghai.kchtg.security.annotation.DataScope;

@RestController
@RequestMapping("/api/v1/stations/cospas-sarsat")
@Validated
@RequiredArgsConstructor
@Tag(name = "Cospas-Sarsat Coastal Station")
@DataScope
public class CoastalStationCospasSarsatController {

    private final CoastalStationCospasSarsatService service;

    @PostMapping("/create")
    @Operation(summary = "Create a new Cospas-Sarsat station")
    public ResponseEntity<CoastalStationCospasSarsat> createStation(
            @Valid @RequestBody CoastalStationCospasSarsatRequest request) {
        CoastalStationCospasSarsat created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Cospas-Sarsat station")
    public ResponseEntity<CoastalStationCospasSarsat> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationCospasSarsatUpdateRequest request) {
        CoastalStationCospasSarsat updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a Cospas-Sarsat station")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a Cospas-Sarsat station by ID")
    public ResponseEntity<CoastalStationCospasSarsatResponse> getStationById(@PathVariable UUID id) {
        CoastalStationCospasSarsat entity = service.getStationById(id);
        CoastalStationCospasSarsatResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    @Operation(summary = "Get all active Cospas-Sarsat stations")
    public ResponseEntity<List<CoastalStationCospasSarsat>> getAllStations() {
        List<CoastalStationCospasSarsat> stations = service.getAllStations();
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/search")
    @Operation(summary = "Search Cospas-Sarsat stations by keyword")
    public ResponseEntity<List<CoastalStationCospasSarsat>> searchStations(
            @RequestParam String keyword) {
        List<CoastalStationCospasSarsat> results = service.searchStations(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/by-code/{code}")
    @Operation(summary = "Find a Cospas-Sarsat station by code")
    public ResponseEntity<CoastalStationCospasSarsat> findByCode(@PathVariable String code) {
        Optional<CoastalStationCospasSarsat> station = service.findByCode(code);
        return station.<ResponseEntity<CoastalStationCospasSarsat>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    @PreAuthorize("hasAnyAuthority('coastalstationcospassarsat:create', 'coastalstationcospassarsat:update', 'specialstation:create', 'specialstation:update', 'station:create', 'station:update', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationCospasSarsat> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve-l1")
    @Operation(summary = "Phê duyệt cấp 1 (Cảng vụ / Chi cục)")
    @PreAuthorize("hasAnyAuthority('coastalstationcospassarsat:approvec1', 'coastalstationcospassarsat:approve', 'specialstation:approve', 'station:approvec1', 'station:approve', 'data:approvec1', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationCospasSarsat> approveLevel1(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel1(id));
    }

    @PostMapping("/{id}/approve-l2")
    @Operation(summary = "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam)")
    @PreAuthorize("hasAnyAuthority('coastalstationcospassarsat:approvec2', 'coastalstationcospassarsat:approve', 'specialstation:approve', 'station:approvec2', 'station:approve', 'data:approvec2', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationCospasSarsat> approveLevel2(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel2(id));
    }

    /** @deprecated dùng /approve-l1 hoặc /approve-l2 — endpoint này giữ để tương thích client cũ. */
    @Deprecated
    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a Cospas-Sarsat station (legacy — tự chọn vòng theo trạng thái hiện tại)")
    @PreAuthorize("hasAnyAuthority('coastalstationcospassarsat:approvec1', 'coastalstationcospassarsat:approvec2', 'coastalstationcospassarsat:approve', 'specialstation:approve', 'station:approve', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationCospasSarsat> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationCospasSarsatApprovalRequest request) {
        CoastalStationCospasSarsat approved = service.approveStation(id, Boolean.TRUE.equals(request.getApproved()));
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt kèm lý do (tối thiểu 10 ký tự)")
    @PreAuthorize("hasAnyAuthority('coastalstationcospassarsat:reject', 'coastalstationcospassarsat:approvec1', 'coastalstationcospassarsat:approvec2', 'coastalstationcospassarsat:approve', 'specialstation:approve', 'station:approve', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationCospasSarsat> rejectStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationCospasSarsatApprovalRequest request) {
        CoastalStationCospasSarsat rejected = service.reject(id, request.getRejectionReason());
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for a Cospas-Sarsat station")
    public ResponseEntity<List<CoastalStationCospasSarsatHistoryResponse>> getHistory(@PathVariable UUID id) {
        List<CoastalStationCospasSarsatHistoryResponse> history = service.getHistory(id);
        return ResponseEntity.ok(history);
    }
}
