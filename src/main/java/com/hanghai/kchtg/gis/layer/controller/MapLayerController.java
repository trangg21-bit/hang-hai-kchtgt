package com.hanghai.kchtg.gis.layer.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.layer.dto.CreateMapLayerRequest;
import com.hanghai.kchtg.gis.layer.dto.CreateMapOverlayRequest;
import com.hanghai.kchtg.gis.layer.dto.CreateMapViewRequest;
import com.hanghai.kchtg.gis.layer.dto.CreateMapStyleRequest;
import com.hanghai.kchtg.gis.layer.dto.MapLayerResponse;
import com.hanghai.kchtg.gis.layer.dto.MapOverlayResponse;
import com.hanghai.kchtg.gis.layer.dto.MapStyleResponse;
import com.hanghai.kchtg.gis.layer.dto.MapViewResponse;
import com.hanghai.kchtg.gis.layer.dto.UpdateMapLayerRequest;
import com.hanghai.kchtg.gis.layer.dto.UpdateMapOverlayRequest;
import com.hanghai.kchtg.gis.layer.dto.UpdateMapViewRequest;
import com.hanghai.kchtg.gis.layer.dto.UpdateMapStyleRequest;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.service.MapLayerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/map-layers")
@RequiredArgsConstructor
public class MapLayerController {

    private final MapLayerService service;

    // ========================================================================
    // MapLayer endpoints
    // ========================================================================

    @GetMapping
    public ResponseEntity<ApiResponse<List<MapLayerResponse>>> findAll() {
        return ResponseEntity.ok(ApiResponse.success(service.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MapLayerResponse>> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findById(id)));
    }

    @GetMapping("/type/{layerType}")
    public ResponseEntity<ApiResponse<List<MapLayerResponse>>> findByLayerType(
            @PathVariable LayerType layerType) {
        return ResponseEntity.ok(ApiResponse.success(service.findByLayerType(layerType)));
    }

    @GetMapping("/visible")
    public ResponseEntity<ApiResponse<List<MapLayerResponse>>> findVisibleLayers() {
        return ResponseEntity.ok(ApiResponse.success(service.findVisibleLayers()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MapLayerResponse>> create(
            @Valid @RequestBody CreateMapLayerRequest request) {
        MapLayerResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("MapLayer created successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MapLayerResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapLayerRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("MapLayer updated successfully", service.update(id, request)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.success("MapLayer deleted successfully", null));
    }

    // ========================================================================
    // MapView endpoints
    // ========================================================================

    @GetMapping("/map-views")
    public ResponseEntity<ApiResponse<List<MapViewResponse>>> findAllMapViews() {
        return ResponseEntity.ok(ApiResponse.success(service.findAllMapViews()));
    }

    @GetMapping("/map-views/{id}")
    public ResponseEntity<ApiResponse<MapViewResponse>> findMapViewById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findMapViewById(id)));
    }

    @GetMapping("/map-views/user/{userId}")
    public ResponseEntity<ApiResponse<List<MapViewResponse>>> findMapViewsByUserId(
            @PathVariable Long userId) {
        return ResponseEntity.ok(ApiResponse.success(service.findMapViewsByUserId(userId)));
    }

    @PostMapping("/map-views")
    public ResponseEntity<ApiResponse<MapViewResponse>> createMapView(
            @Valid @RequestBody CreateMapViewRequest request) {
        MapViewResponse response = service.createMapView(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("MapView created successfully", response));
    }

    @PutMapping("/map-views/{id}")
    public ResponseEntity<ApiResponse<MapViewResponse>> updateMapView(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapViewRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("MapView updated successfully", service.updateMapView(id, request)));
    }

    @DeleteMapping("/map-views/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMapView(@PathVariable UUID id) {
        service.deleteMapView(id);
        return ResponseEntity.ok(ApiResponse.success("MapView deleted successfully", null));
    }

    // ========================================================================
    // MapOverlay endpoints
    // ========================================================================

    @GetMapping("/overlays")
    public ResponseEntity<ApiResponse<List<MapOverlayResponse>>> findAllOverlays() {
        return ResponseEntity.ok(ApiResponse.success(service.findAllOverlays()));
    }

    @GetMapping("/overlays/{id}")
    public ResponseEntity<ApiResponse<MapOverlayResponse>> findOverlayById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findOverlayById(id)));
    }

    @GetMapping("/overlays/layer/{layerName}")
    public ResponseEntity<ApiResponse<List<MapOverlayResponse>>> findOverlaysByLayerName(
            @PathVariable String layerName) {
        return ResponseEntity.ok(ApiResponse.success(service.findOverlaysByLayerName(layerName)));
    }

    @GetMapping("/overlays/visible")
    public ResponseEntity<ApiResponse<List<MapOverlayResponse>>> findVisibleOverlays() {
        return ResponseEntity.ok(ApiResponse.success(service.findVisibleOverlays()));
    }

    @PostMapping("/overlays")
    public ResponseEntity<ApiResponse<MapOverlayResponse>> createOverlay(
            @Valid @RequestBody CreateMapOverlayRequest request) {
        MapOverlayResponse response = service.createOverlay(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("MapOverlay created successfully", response));
    }

    @PutMapping("/overlays/{id}")
    public ResponseEntity<ApiResponse<MapOverlayResponse>> updateOverlay(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapOverlayRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("MapOverlay updated successfully", service.updateOverlay(id, request)));
    }

    @DeleteMapping("/overlays/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOverlay(@PathVariable UUID id) {
        service.deleteOverlay(id);
        return ResponseEntity.ok(ApiResponse.success("MapOverlay deleted successfully", null));
    }

    // ========================================================================
    // MapStyle endpoints
    // ========================================================================

    @GetMapping("/styles")
    public ResponseEntity<ApiResponse<List<MapStyleResponse>>> findAllStyles() {
        return ResponseEntity.ok(ApiResponse.success(service.findAllStyles()));
    }

    @GetMapping("/styles/{id}")
    public ResponseEntity<ApiResponse<MapStyleResponse>> findStyleById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(service.findStyleById(id)));
    }

    @GetMapping("/styles/layer/{layerId}")
    public ResponseEntity<ApiResponse<List<MapStyleResponse>>> findStylesByLayerId(
            @PathVariable String layerId) {
        return ResponseEntity.ok(ApiResponse.success(service.findStylesByLayerId(layerId)));
    }

    @PostMapping("/styles")
    public ResponseEntity<ApiResponse<MapStyleResponse>> createStyle(
            @Valid @RequestBody CreateMapStyleRequest request) {
        MapStyleResponse response = service.createStyle(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("MapStyle created successfully", response));
    }

    @PutMapping("/styles/{id}")
    public ResponseEntity<ApiResponse<MapStyleResponse>> updateStyle(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMapStyleRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success("MapStyle updated successfully", service.updateStyle(id, request)));
    }

    @DeleteMapping("/styles/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStyle(@PathVariable UUID id) {
        service.deleteStyle(id);
        return ResponseEntity.ok(ApiResponse.success("MapStyle deleted successfully", null));
    }
}