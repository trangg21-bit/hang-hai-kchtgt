package com.hanghai.kchtg.datasharingaggregation.controller;

import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.service.PortAndAssetSharingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sharing-aggregation/port-assets")
public class PortAndAssetSharingController {
    private final PortAndAssetSharingService service;

    public PortAndAssetSharingController(PortAndAssetSharingService service) {
        this.service = service;
    }

    @PostMapping("/dry-port")
    public ResponseEntity<DataSharingAggregationResponse> shareDryPort(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDryPort(dataPayload));
    }

    @PostMapping("/operational-status")
    public ResponseEntity<DataSharingAggregationResponse> shareOperationalStatusKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareOperationalStatusKCHTGT(dataPayload));
    }

    @PostMapping("/asset-info")
    public ResponseEntity<DataSharingAggregationResponse> shareAssetInfoKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAssetInfoKCHTGT(dataPayload));
    }

    @PostMapping("/aggregated-info")
    public ResponseEntity<DataSharingAggregationResponse> shareAggregatedInfoKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedInfoKCHTGT(dataPayload));
    }

    @PostMapping("/maintenance-info")
    public ResponseEntity<DataSharingAggregationResponse> shareMaintenanceInfoKCHTGT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareMaintenanceInfoKCHTGT(dataPayload));
    }

    @PostMapping("/aggregated-port")
    public ResponseEntity<DataSharingAggregationResponse> shareAggregatedPort(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedPort(dataPayload));
    }

    @PostMapping("/aggregated-berth")
    public ResponseEntity<DataSharingAggregationResponse> shareAggregatedBerthAndPier(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedBerthAndPier(dataPayload));
    }

    @PostMapping("/aggregated-navigation-channel")
    public ResponseEntity<DataSharingAggregationResponse> shareAggregatedNavigationChannel(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedNavigationChannel(dataPayload));
    }

    @PostMapping("/aggregated-transshipment")
    public ResponseEntity<DataSharingAggregationResponse> shareAggregatedTransshipmentAndAnchorage(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedTransshipmentAndAnchorage(dataPayload));
    }

    @PostMapping("/aggregated-buoy")
    public ResponseEntity<DataSharingAggregationResponse> shareAggregatedBuoy(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedBuoy(dataPayload));
    }

    @PostMapping("/lighthouse-summary")
    public ResponseEntity<DataSharingAggregationResponse> lighthouseSummary(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareAggregatedBeaconSystem(dataPayload));
    }

    @GetMapping
    public ResponseEntity<List<DataSharingAggregationResponse>> getRecords(
            @RequestParam(required = false) SharingStatus status) {
        if (status != null) {
            return ResponseEntity.ok(service.getPortAndAssetRecords(status));
        }
        return ResponseEntity.ok(service.getPortAndAssetRecords(null));
    }
}
