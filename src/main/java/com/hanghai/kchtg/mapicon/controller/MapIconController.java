package com.hanghai.kchtg.mapicon.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.mapicon.dto.CreateMapIconRequest;
import com.hanghai.kchtg.mapicon.dto.MapIconResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapIconRequest;
import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.service.MapIconService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/map-icons")
@RequiredArgsConstructor
public class MapIconController {

    private final MapIconService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MapIconResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MapIconResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<MapIconResponse>>> findByCategory(
            @PathVariable MapIcon.Category category) {
        return ResponseEntity.ok(ApiResponse.success(service.findByCategory(category)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MapIconResponse>> create(
            @Valid @RequestBody CreateMapIconRequest request) {
        MapIconResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("MapIcon created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MapIconResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapIconRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("MapIcon updated successfully", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("MapIcon deleted successfully", null));
    }
}
