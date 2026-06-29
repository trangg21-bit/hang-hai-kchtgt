package com.hanghai.kchtg.station.controller;
import lombok.*;

import com.hanghai.kchtg.station.dto.lrit.*;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.service.CoastalStationLRITService;
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
@RequestMapping("/api/v1/stations/lrit")
@Validated
@RequiredArgsConstructor
@Tag(name = "LRIT Coastal Station")
public class CoastalStationLRITController {

    private final CoastalStationLRITService service;

    @PostMapping("/create")
    @Operation(summary = "Create a new LRIT station")
    public ResponseEntity<CoastalStationLRIT> createStation(@Valid @RequestBody CoastalStationLRITRequest request) {
        CoastalStationLRIT created = service.createStation(request);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing LRIT station")
    public ResponseEntity<CoastalStationLRIT> updateStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationLRITUpdateRequest request) {
        CoastalStationLRIT updated = service.updateStation(id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete an LRIT station")
    public ResponseEntity<Void> deleteStation(@PathVariable UUID id) {
        service.deleteStation(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get an LRIT station by ID")
    public ResponseEntity<CoastalStationLRITResponse> getStationById(@PathVariable UUID id) {
        CoastalStationLRIT entity = service.getStationById(id);
        CoastalStationLRITResponse response = service.buildResponse(entity);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/list")
    @Operation(summary = "Get all active LRIT stations")
    public ResponseEntity<List<CoastalStationLRIT>> getAllStations() {
        List<CoastalStationLRIT> stations = service.getAllStations();
        return ResponseEntity.ok(stations);
    }

    @GetMapping("/search")
    @Operation(summary = "Search LRIT stations by keyword")
    public ResponseEntity<List<CoastalStationLRIT>> searchStations(
            @RequestParam String keyword) {
        List<CoastalStationLRIT> results = service.searchStations(keyword);
        return ResponseEntity.ok(results);
    }

    @GetMapping("/by-terminal/{terminalId}")
    @Operation(summary = "Find an LRIT station by terminal ID")
    public ResponseEntity<CoastalStationLRIT> findByTerminalId(@PathVariable String terminalId) {
        Optional<CoastalStationLRIT> station = service.findByTerminalId(terminalId);
        return station.<ResponseEntity<CoastalStationLRIT>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/by-imo/{imoNumber}")
    @Operation(summary = "Find an LRIT station by IMO number")
    public ResponseEntity<CoastalStationLRIT> findByImoNumber(@PathVariable String imoNumber) {
        Optional<CoastalStationLRIT> station = service.findByImoNumber(imoNumber);
        return station.<ResponseEntity<CoastalStationLRIT>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve an LRIT station (supports L1 and L2 levels)")
    public ResponseEntity<CoastalStationLRIT> approveStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationLRITApprovalRequest request) {
        CoastalStationLRIT approved = service.approveStation(id, request.getApproved(), 1L);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject an LRIT station")
    public ResponseEntity<CoastalStationLRIT> rejectStation(
            @PathVariable UUID id,
            @Valid @RequestBody CoastalStationLRITApprovalRequest request) {
        CoastalStationLRIT rejected = service.rejectStation(id, request.getRejectionReason(), 1L);
        return ResponseEntity.ok(rejected);
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get change history for an LRIT station")
    public ResponseEntity<List<CoastalStationLRITHistoryResponse>> getHistory(@PathVariable UUID id) {
        List<CoastalStationLRITHistoryResponse> history = service.getHistory(id);
        return ResponseEntity.ok(history);
    }
}
