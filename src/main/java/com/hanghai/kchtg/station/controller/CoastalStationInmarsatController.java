package com.hanghai.kchtg.station.controller;
import lombok.*;

import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.station.service.CoastalStationInmarsatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stations/inmarsat")
@Validated
@RequiredArgsConstructor
@Tag(name = "Inmarsat Coastal Station")
public class CoastalStationInmarsatController {

    private final CoastalStationInmarsatService service;

    @PostMapping("/create")
    @Operation(summary = "Create a new Inmarsat station")
    public ResponseEntity<CoastalStationInmarsat> createStation(@Valid @RequestBody CoastalStationInmarsatRequest request) {
        CoastalStationInmarsat created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Inmarsat station")
    public ResponseEntity<CoastalStationInmarsat> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationInmarsatUpdateRequest request) {
        CoastalStationInmarsat updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an Inmarsat station")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an Inmarsat station by ID")
    public ResponseEntity<CoastalStationInmarsatResponse> getStationById(@PathVariable UUID id) {
        CoastalStationInmarsat entity = service.getStationById(id);
        CoastalStationInmarsatResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    @Operation(summary = "Get all active Inmarsat stations")
    public ResponseEntity<List<CoastalStationInmarsat>> getAllStations() {
        List<CoastalStationInmarsat> stations = service.getAllStations();
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/search")
    @Operation(summary = "Search Inmarsat stations by keyword")
    public ResponseEntity<List<CoastalStationInmarsat>> searchStations(
            @RequestParam String keyword) {
        List<CoastalStationInmarsat> results = service.searchStations(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/by-device/{code}")
    @Operation(summary = "Find an Inmarsat station by device code")
    public ResponseEntity<CoastalStationInmarsat> findByDeviceCode(@PathVariable String code) {
        Optional<CoastalStationInmarsat> station = service.findByDeviceCode(code);
        return station.<ResponseEntity<CoastalStationInmarsat>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve an Inmarsat station (supports L1 and L2 levels)")
    public ResponseEntity<CoastalStationInmarsat> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationInmarsatApprovalRequest request) {
        CoastalStationInmarsat approved = service.approveStation(id, request.getApproved(), 1L);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject an Inmarsat station")
    public ResponseEntity<CoastalStationInmarsat> rejectStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationInmarsatApprovalRequest request) {
        CoastalStationInmarsat rejected = service.rejectStation(id, request.getRejectionReason(), 1L);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for an Inmarsat station")
    public ResponseEntity<List<CoastalStationInmarsatHistoryResponse>> getHistory(@PathVariable UUID id) {
        List<CoastalStationInmarsatHistoryResponse> history = service.getHistory(id);
        return ResponseEntity.ok(history);
    }
}
