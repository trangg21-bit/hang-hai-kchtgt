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

    @PostMapping("/dai-ttdh")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiTTDH(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiTTDH(dataPayload));
    }

    @PostMapping("/dai-inmarsat")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiInmarsat(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiInmarsat(dataPayload));
    }

    @PostMapping("/dai-cospas-sarsat")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiCospasSarsat(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiCospasSarsat(dataPayload));
    }

    @PostMapping("/dai-lrit")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiLRIT(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiLRIT(dataPayload));
    }

    @PostMapping("/dai-hang-hai-hn")
    public ResponseEntity<DataSharingAggregationResponse> shareDaiHangHaiHN(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDaiHangHaiHN(dataPayload));
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
