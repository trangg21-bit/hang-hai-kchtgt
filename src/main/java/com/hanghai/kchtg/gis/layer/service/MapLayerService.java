package com.hanghai.kchtg.gis.layer.service;

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
import com.hanghai.kchtg.gis.layer.entity.MapLayer;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.Status;
import com.hanghai.kchtg.gis.layer.entity.MapOverlay;
import com.hanghai.kchtg.gis.layer.entity.MapStyle;
import com.hanghai.kchtg.gis.layer.entity.MapView;
import com.hanghai.kchtg.gis.layer.repository.MapLayerRepository;
import com.hanghai.kchtg.gis.layer.repository.MapOverlayRepository;
import com.hanghai.kchtg.gis.layer.repository.MapStyleRepository;
import com.hanghai.kchtg.gis.layer.repository.MapViewRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MapLayerService {

    private final MapLayerRepository mapLayerRepository;
    private final MapViewRepository mapViewRepository;
    private final MapOverlayRepository mapOverlayRepository;
    private final MapStyleRepository mapStyleRepository;

    // ========================================================================
    // MapLayer CRUD
    // ========================================================================

    public List<MapLayerResponse> findAll() {
        return mapLayerRepository.findAll().stream()
                .map(this::toLayerResponse)
                .toList();
    }

    public MapLayerResponse findById(UUID id) {
        MapLayer entity = mapLayerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapLayer not found with id: " + id));
        return toLayerResponse(entity);
    }

    public List<MapLayerResponse> findByLayerType(LayerType layerType) {
        return mapLayerRepository.findByLayerType(layerType).stream()
                .map(this::toLayerResponse)
                .toList();
    }

    public List<MapLayerResponse> findVisibleLayers() {
        return mapLayerRepository.findByVisibleTrueOrderByOrderAsc().stream()
                .map(this::toLayerResponse)
                .toList();
    }

    @Transactional
    public MapLayerResponse create(CreateMapLayerRequest request) {
        if (mapLayerRepository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã lớp bản đồ đã tồn tại: " + request.getCode());
        }

        MapLayer entity = MapLayer.builder()
                .name(request.getName())
                .code(request.getCode())
                .layerType(request.getLayerType())
                .source(request.getSource())
                .visible(request.getVisible())
                .opacity(request.getOpacity())
                .order(request.getOrder())
                .styleConfig(request.getStyleConfig())
                .status(request.getStatus())
                .build();

        entity = mapLayerRepository.save(entity);
        return toLayerResponse(entity);
    }

    @Transactional
    public MapLayerResponse update(UUID id, UpdateMapLayerRequest request) {
        MapLayer entity = mapLayerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapLayer not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCode() != null) entity.setCode(request.getCode());
        if (request.getLayerType() != null) entity.setLayerType(request.getLayerType());
        if (request.getSource() != null) entity.setSource(request.getSource());
        if (request.getVisible() != null) entity.setVisible(request.getVisible());
        if (request.getOpacity() != null) entity.setOpacity(request.getOpacity());
        if (request.getOrder() != null) entity.setOrder(request.getOrder());
        if (request.getStyleConfig() != null) entity.setStyleConfig(request.getStyleConfig());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        entity = mapLayerRepository.save(entity);
        return toLayerResponse(entity);
    }

    @Transactional
    public void delete(UUID id) {
        MapLayer entity = mapLayerRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapLayer not found with id: " + id));
        entity.softDelete();
        mapLayerRepository.save(entity);
    }

    // ========================================================================
    // MapView CRUD
    // ========================================================================

    public List<MapViewResponse> findAllMapViews() {
        return mapViewRepository.findAll().stream()
                .map(this::toMapViewResponse)
                .toList();
    }

    public MapViewResponse findMapViewById(UUID id) {
        MapView entity = mapViewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapView not found with id: " + id));
        return toMapViewResponse(entity);
    }

    public List<MapViewResponse> findMapViewsByUserId(Long userId) {
        return mapViewRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toMapViewResponse)
                .toList();
    }

    @Transactional
    public MapViewResponse createMapView(CreateMapViewRequest request) {
        MapView entity = MapView.builder()
                .name(request.getName())
                .userId(request.getUserId())
                .centerLon(request.getCenterLon())
                .centerLat(request.getCenterLat())
                .zoom(request.getZoom())
                .visibleLayers(request.getVisibleLayers())
                .layerOrder(request.getLayerOrder())
                .styleConfigs(request.getStyleConfigs())
                .build();

        entity = mapViewRepository.save(entity);
        return toMapViewResponse(entity);
    }

    @Transactional
    public MapViewResponse updateMapView(UUID id, UpdateMapViewRequest request) {
        MapView entity = mapViewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapView not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCenterLon() != null) entity.setCenterLon(request.getCenterLon());
        if (request.getCenterLat() != null) entity.setCenterLat(request.getCenterLat());
        if (request.getZoom() != null) entity.setZoom(request.getZoom());
        if (request.getVisibleLayers() != null) entity.setVisibleLayers(request.getVisibleLayers());
        if (request.getLayerOrder() != null) entity.setLayerOrder(request.getLayerOrder());
        if (request.getStyleConfigs() != null) entity.setStyleConfigs(request.getStyleConfigs());

        entity = mapViewRepository.save(entity);
        return toMapViewResponse(entity);
    }

    @Transactional
    public void deleteMapView(UUID id) {
        MapView entity = mapViewRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapView not found with id: " + id));
        entity.softDelete();
        mapViewRepository.save(entity);
    }

    // ========================================================================
    // MapOverlay CRUD
    // ========================================================================

    public List<MapOverlayResponse> findAllOverlays() {
        return mapOverlayRepository.findAll().stream()
                .map(this::toOverlayResponse)
                .toList();
    }

    public MapOverlayResponse findOverlayById(UUID id) {
        MapOverlay entity = mapOverlayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapOverlay not found with id: " + id));
        return toOverlayResponse(entity);
    }

    public List<MapOverlayResponse> findOverlaysByLayerName(String layerName) {
        return mapOverlayRepository.findByLayerName(layerName).stream()
                .map(this::toOverlayResponse)
                .toList();
    }

    public List<MapOverlayResponse> findVisibleOverlays() {
        return mapOverlayRepository.findByVisibleTrue().stream()
                .map(this::toOverlayResponse)
                .toList();
    }

    @Transactional
    public MapOverlayResponse createOverlay(CreateMapOverlayRequest request) {
        MapOverlay entity = MapOverlay.builder()
                .name(request.getName())
                .url(request.getUrl())
                .layerName(request.getLayerName())
                .format(request.getFormat())
                .visible(request.getVisible())
                .opacity(request.getOpacity())
                .zIndex(request.getZIndex())
                .build();

        entity = mapOverlayRepository.save(entity);
        return toOverlayResponse(entity);
    }

    @Transactional
    public MapOverlayResponse updateOverlay(UUID id, UpdateMapOverlayRequest request) {
        MapOverlay entity = mapOverlayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapOverlay not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getUrl() != null) entity.setUrl(request.getUrl());
        if (request.getLayerName() != null) entity.setLayerName(request.getLayerName());
        if (request.getFormat() != null) entity.setFormat(request.getFormat());
        if (request.getVisible() != null) entity.setVisible(request.getVisible());
        if (request.getOpacity() != null) entity.setOpacity(request.getOpacity());
        if (request.getZIndex() != null) entity.setZIndex(request.getZIndex());

        entity = mapOverlayRepository.save(entity);
        return toOverlayResponse(entity);
    }

    @Transactional
    public void deleteOverlay(UUID id) {
        MapOverlay entity = mapOverlayRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapOverlay not found with id: " + id));
        entity.softDelete();
        mapOverlayRepository.save(entity);
    }

    // ========================================================================
    // MapStyle CRUD
    // ========================================================================

    public List<MapStyleResponse> findAllStyles() {
        return mapStyleRepository.findAll().stream()
                .map(this::toStyleResponse)
                .toList();
    }

    public MapStyleResponse findStyleById(UUID id) {
        MapStyle entity = mapStyleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapStyle not found with id: " + id));
        return toStyleResponse(entity);
    }

    public List<MapStyleResponse> findStylesByLayerId(String layerId) {
        return mapStyleRepository.findByLayerId(layerId).stream()
                .map(this::toStyleResponse)
                .toList();
    }

    @Transactional
    public MapStyleResponse createStyle(CreateMapStyleRequest request) {
        MapStyle entity = MapStyle.builder()
                .layerId(request.getLayerId())
                .fillColor(request.getFillColor())
                .strokeColor(request.getStrokeColor())
                .strokeWidth(request.getStrokeWidth())
                .pointRadius(request.getPointRadius())
                .opacity(request.getOpacity())
                .minZoom(request.getMinZoom())
                .maxZoom(request.getMaxZoom())
                .build();

        entity = mapStyleRepository.save(entity);
        return toStyleResponse(entity);
    }

    @Transactional
    public MapStyleResponse updateStyle(UUID id, UpdateMapStyleRequest request) {
        MapStyle entity = mapStyleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapStyle not found with id: " + id));

        if (request.getLayerId() != null) entity.setLayerId(request.getLayerId());
        if (request.getFillColor() != null) entity.setFillColor(request.getFillColor());
        if (request.getStrokeColor() != null) entity.setStrokeColor(request.getStrokeColor());
        if (request.getStrokeWidth() != null) entity.setStrokeWidth(request.getStrokeWidth());
        if (request.getPointRadius() != null) entity.setPointRadius(request.getPointRadius());
        if (request.getOpacity() != null) entity.setOpacity(request.getOpacity());
        if (request.getMinZoom() != null) entity.setMinZoom(request.getMinZoom());
        if (request.getMaxZoom() != null) entity.setMaxZoom(request.getMaxZoom());

        entity = mapStyleRepository.save(entity);
        return toStyleResponse(entity);
    }

    @Transactional
    public void deleteStyle(UUID id) {
        MapStyle entity = mapStyleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapStyle not found with id: " + id));
        entity.softDelete();
        mapStyleRepository.save(entity);
    }

    // ========================================================================
    // TO-RESPONSE MAPPERS
    // ========================================================================

    private MapLayerResponse toLayerResponse(MapLayer entity) {
        return MapLayerResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .layerType(entity.getLayerType())
                .source(entity.getSource())
                .visible(entity.getVisible())
                .opacity(entity.getOpacity())
                .order(entity.getOrder())
                .styleConfig(entity.getStyleConfig())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private MapViewResponse toMapViewResponse(MapView entity) {
        return MapViewResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .userId(entity.getUserId())
                .centerLon(entity.getCenterLon())
                .centerLat(entity.getCenterLat())
                .zoom(entity.getZoom())
                .visibleLayers(entity.getVisibleLayers())
                .layerOrder(entity.getLayerOrder())
                .styleConfigs(entity.getStyleConfigs())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private MapOverlayResponse toOverlayResponse(MapOverlay entity) {
        return MapOverlayResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .url(entity.getUrl())
                .layerName(entity.getLayerName())
                .format(entity.getFormat())
                .visible(entity.getVisible())
                .opacity(entity.getOpacity())
                .zIndex(entity.getZIndex())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private MapStyleResponse toStyleResponse(MapStyle entity) {
        return MapStyleResponse.builder()
                .id(entity.getId())
                .layerId(entity.getLayerId())
                .fillColor(entity.getFillColor())
                .strokeColor(entity.getStrokeColor())
                .strokeWidth(entity.getStrokeWidth())
                .pointRadius(entity.getPointRadius())
                .iconSize(entity.getIconSize())
                .opacity(entity.getOpacity())
                .minZoom(entity.getMinZoom())
                .maxZoom(entity.getMaxZoom())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}