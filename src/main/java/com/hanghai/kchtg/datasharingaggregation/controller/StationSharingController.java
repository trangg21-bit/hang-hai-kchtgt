package com.hanghai.kchtg.datasharingaggregation.controller;

import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.service.StationSharingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sharing-aggregation/stations")
public class StationSharingController {
    private final StationSharingService service;

    public StationSharingController(StationSharingService service) {
        this.service = service;
    }

    @PostMapping("/coastal-station")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiTTDH(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiTTDH(dataPayload));
    }

    @PostMapping("/inmarsat-station")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiInmarsat(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiInmarsat(dataPayload));
    }

    @PostMapping("/cospas-sarsat-station")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiCospasSarsat(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiCospasSarsat(dataPayload));
    }

    @PostMapping("/lrit-station")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiLRIT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiLRIT(dataPayload));
    }

    @PostMapping("/maritime-station-hn")
    public ResponseEntity<DataSharingAggregationResponse> shareMaritimeStationHN(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareMaritimeStationHN(dataPayload));
    }

    @GetMapping
    public ResponseEntity<List<DataSharingAggregationResponse>> getRecords(
            @RequestParam(required = false) SharingStatus status) {
        if (status != null) {
            return ResponseEntity.ok(service.getStationSharingRecords(status));
        }
        return ResponseEntity.ok(service.getStationSharingRecords(null));
    }
}
