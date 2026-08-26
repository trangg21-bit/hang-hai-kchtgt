package com.hanghai.kchtg.station.controller;

import com.hanghai.kchtg.station.dto.coastal.*;
import com.hanghai.kchtg.station.entity.CoastalStationVTS;
import com.hanghai.kchtg.station.service.CoastalStationVTSService;
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
@RequestMapping("/api/v1/stations/coastal")
@Validated
@RequiredArgsConstructor
@Tag(name = "Coastal Station VTS")
@DataScope
public class CoastalStationVTSController {

    private final CoastalStationVTSService service;

    @PostMapping
    @Operation(summary = "Create a new coastal station")
    public ResponseEntity<CoastalStationVTS> createStation(@Valid @RequestBody CoastalStationVTSRequest request) {
        CoastalStationVTS created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing coastal station")
    public ResponseEntity<CoastalStationVTS> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationVTSUpdateRequest request) {
        CoastalStationVTS updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a coastal station")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a coastal station by ID")
    public ResponseEntity<CoastalStationVTSResponse> getStationById(@PathVariable UUID id) {
        CoastalStationVTS entity = service.getStationById(id);
        CoastalStationVTSResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @Operation(summary = "Get all active coastal stations")
    public ResponseEntity<List<CoastalStationVTS>> getAllStations() {
        List<CoastalStationVTS> stations = service.getAllStations();
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/search")
    @Operation(summary = "Search coastal stations by keyword")
    public ResponseEntity<List<CoastalStationVTS>> searchStations(
            @RequestParam String keyword) {
        List<CoastalStationVTS> results = service.searchStations(keyword);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Gửi phê duyệt cấp Cảng vụ/Chi cục")
    @PreAuthorize("hasAnyAuthority('coastalstation:create', 'coastalstation:update', 'station:create', 'station:update', 'data:create', 'admin:all')")
    public ResponseEntity<CoastalStationVTS> submit(@PathVariable UUID id) {
        return ResponseEntity.ok(service.submit(id));
    }

    @PostMapping("/{id}/approve-l1")
    @Operation(summary = "Phê duyệt cấp 1 (Cảng vụ / Chi cục)")
    @PreAuthorize("hasAnyAuthority('coastalstation:approvec1', 'coastalstation:approve', 'station:approvec1', 'station:approve', 'data:approvec1', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationVTS> approveLevel1(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel1(id));
    }

    @PostMapping("/{id}/approve-l2")
    @Operation(summary = "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam)")
    @PreAuthorize("hasAnyAuthority('coastalstation:approvec2', 'coastalstation:approve', 'station:approvec2', 'station:approve', 'data:approvec2', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationVTS> approveLevel2(@PathVariable UUID id) {
        return ResponseEntity.ok(service.approveLevel2(id));
    }

    /** @deprecated dùng /approve-l1 hoặc /approve-l2 — endpoint này giữ để tương thích client cũ. */
    @Deprecated
    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a coastal station (legacy — tự chọn vòng theo trạng thái hiện tại)")
    @PreAuthorize("hasAnyAuthority('coastalstation:approvec1', 'coastalstation:approvec2', 'coastalstation:approve', 'station:approve', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationVTS> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationVTSApprovalRequest request) {
        CoastalStationVTS approved = service.approveStation(id, Boolean.TRUE.equals(request.getApproved()));
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối phê duyệt kèm lý do (tối thiểu 10 ký tự)")
    @PreAuthorize("hasAnyAuthority('coastalstation:reject', 'coastalstation:approvec1', 'coastalstation:approvec2', 'coastalstation:approve', 'station:reject', 'station:approve', 'data:approve', 'admin:all')")
    public ResponseEntity<CoastalStationVTS> rejectStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationVTSApprovalRequest request) {
        CoastalStationVTS rejected = service.reject(id, request.getRejectionReason());
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for a coastal station")
    public ResponseEntity<List<CoastalStationVTSHistoryResponse>> getHistory(@PathVariable UUID id) {
        List<CoastalStationVTSHistoryResponse> history = service.getHistory(id);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/by-code/{code}")
    @Operation(summary = "Find a coastal station by its code")
    public ResponseEntity<CoastalStationVTS> findByCode(@PathVariable String code) {
        Optional<CoastalStationVTS> station = service.findByCode(code);
        return station.<ResponseEntity<CoastalStationVTS>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
