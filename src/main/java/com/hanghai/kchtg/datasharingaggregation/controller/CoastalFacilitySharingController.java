package com.hanghai.kchtg.datasharingaggregation.controller;

import com.hanghai.kchtg.datasharingaggregation.dto.DataSharingAggregationResponse;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import com.hanghai.kchtg.datasharingaggregation.service.CoastalFacilitySharingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sharing-aggregation/coastal")
public class CoastalFacilitySharingController {
    private final CoastalFacilitySharingService service;

    public CoastalFacilitySharingController(CoastalFacilitySharingService service) {
        this.service = service;
    }

    @PostMapping("/de-chan-song-de-chan-cat")
    public ResponseEntity<DataSharingAggregationResponse> shareDeChanSongDeChanCat(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDeChanSongDeChanCat(dataPayload));
    }

    @PostMapping("/navigation-channel")
    public ResponseEntity<DataSharingAggregationResponse> shareNavigationChannel(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareNavigationChannel(dataPayload));
    }

    @PostMapping("/dike-revetment")
    public ResponseEntity<DataSharingAggregationResponse> shareDikeRevetment(
            @RequestBody String dataPayload) {
        return ResponseEntity.ok(service.shareDikeRevetment(dataPayload));
    }

    @GetMapping
    public ResponseEntity<List<DataSharingAggregationResponse>> getRecords(
            @RequestParam(required = false) SharingStatus status) {
        if (status != null) {
            return ResponseEntity.ok(service.getCoastalFacilities(status));
        }
        return ResponseEntity.ok(service.getCoastalFacilities(null));
    }
}
