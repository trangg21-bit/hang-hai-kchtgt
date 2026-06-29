package com.hanghai.kchtg.datasharingaggregation.controller;

import com.hanghai.kchtg.datasharingaggregation.dto.*;
import com.hanghai.kchtg.datasharingaggregation.service.DataSharingAggregationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/data-sharing-aggregation")
public class DataSharingAggregationController {
    private final DataSharingAggregationService service;

    public DataSharingAggregationController(DataSharingAggregationService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<DataSharingAggregationResponse> create(
            @Valid @RequestBody CreateDataSharingAggregationRequest req) {
        return ResponseEntity.ok(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DataSharingAggregationResponse> update(
            @PathVariable String id,
            @Valid @RequestBody UpdateDataSharingAggregationRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DataSharingAggregationResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<List<DataSharingAggregationResponse>> getAll() {
        return ResponseEntity.ok(service.getAll());
    }

    @PostMapping("/filter")
    public ResponseEntity<List<DataSharingAggregationResponse>> filter(
            @Valid @RequestBody DataSharingAggregationFilter filter) {
        return ResponseEntity.ok(service.filter(filter));
    }

    @GetMapping("/summary")
    public ResponseEntity<DataSharingAggregationSummary> getSummary() {
        return ResponseEntity.ok(service.getSummary());
    }
}
