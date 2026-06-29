package com.hanghai.kchtg.station.controller;
import lombok.*;

import com.hanghai.kchtg.station.dto.haiphong.*;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.service.CoastalStationHaiphongService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/stations/haiphong")
@Validated
@RequiredArgsConstructor
@Tag(name = "Haiphong Maritime Station")
public class CoastalStationHaiphongController {

    private final CoastalStationHaiphongService service;

    @PostMapping("/create")
    @Operation(summary = "Create a new Haiphong maritime station")
    public ResponseEntity<CoastalStationHaiphong> createStation(@Valid @RequestBody CoastalStationHaiphongRequest request) {
        CoastalStationHaiphong created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing Haiphong maritime station")
    public ResponseEntity<CoastalStationHaiphong> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationHaiphongUpdateRequest request) {
        CoastalStationHaiphong updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a Haiphong maritime station")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a Haiphong maritime station by ID")
    public ResponseEntity<CoastalStationHaiphongResponse> getStationById(@PathVariable UUID id) {
        CoastalStationHaiphong entity = service.getStationById(id);
        CoastalStationHaiphongResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    @Operation(summary = "Get all active Haiphong maritime stations")
    public ResponseEntity<List<CoastalStationHaiphong>> getAllStations() {
        List<CoastalStationHaiphong> stations = service.getAllStations();
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/search")
    @Operation(summary = "Search Haiphong maritime stations by keyword")
    public ResponseEntity<List<CoastalStationHaiphong>> searchStations(
            @RequestParam String keyword) {
        List<CoastalStationHaiphong> results = service.searchStations(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/by-port/{portName}")
    @Operation(summary = "Find Haiphong maritime stations by port name")
    public ResponseEntity<List<CoastalStationHaiphong>> findByPortName(@PathVariable String portName) {
        List<CoastalStationHaiphong> results = service.findByPortName(portName);
        return ResponseEntity.ok(results);
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a Haiphong maritime station (supports L1 and L2 levels)")
    public ResponseEntity<CoastalStationHaiphong> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationHaiphongApprovalRequest request) {
        CoastalStationHaiphong approved = service.approveStation(id, request.getApproved(), 1L);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject a Haiphong maritime station")
    public ResponseEntity<CoastalStationHaiphong> rejectStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationHaiphongApprovalRequest request) {
        CoastalStationHaiphong rejected = service.rejectStation(id, request.getRejectionReason(), 1L);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for a Haiphong maritime station")
    public ResponseEntity<List<CoastalStationHaiphongHistoryResponse>> getHistory(@PathVariable UUID id) {
        List<CoastalStationHaiphongHistoryResponse> history = service.getHistory(id);
        return ResponseEntity.ok(history);
    }
}
