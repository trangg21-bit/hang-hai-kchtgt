package com.hanghai.kchtg.gis.layer;

import com.hanghai.kchtg.gis.layer.dto.*;
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
import com.hanghai.kchtg.gis.layer.service.MapLayerService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MapLayerServiceTest {

    @Mock
    private MapLayerRepository mapLayerRepository;

    @Mock
    private MapViewRepository mapViewRepository;

    @Mock
    private MapOverlayRepository mapOverlayRepository;

    @Mock
    private MapStyleRepository mapStyleRepository;

    @InjectMocks
    private MapLayerService service;

    private MapLayer testLayer;
    private MapView testView;
    private MapOverlay testOverlay;
    private MapStyle testStyle;

    @BeforeEach
    void setUp() {
        testLayer = MapLayer.builder()
                .name("Base Map")
                .code("BASE-MAP")
                .layerType(LayerType.POINT)
                .source("http://example.com/wms")
                .visible(true)
                .opacity(0.8)
                .order(1)
                .styleConfig("{\"color\":\"blue\"}")
                .status(Status.ACTIVE)
                .build();
        testLayer.setId(UUID.randomUUID());
        testLayer.setCreatedAt(LocalDateTime.now());
        testLayer.setUpdatedAt(LocalDateTime.now());

        testView = MapView.builder()
                .name("Default View")
                .userId(1L)
                .centerLon(106.6297)
                .centerLat(10.7769)
                .zoom(12)
                .visibleLayers("layer1,layer2")
                .layerOrder("1,2")
                .styleConfigs("{\"layer1\":\"default\"}")
                .build();
        testView.setId(UUID.randomUUID());
        testView.setCreatedAt(LocalDateTime.now());
        testView.setUpdatedAt(LocalDateTime.now());

        testOverlay = MapOverlay.builder()
                .name("Traffic Overlay")
                .url("http://example.com/overlay")
                .layerName("traffic")
                .format("image/png")
                .visible(true)
                .opacity(0.6)
                .zIndex(10)
                .build();
        testOverlay.setId(UUID.randomUUID());
        testOverlay.setCreatedAt(LocalDateTime.now());
        testOverlay.setUpdatedAt(LocalDateTime.now());

        testStyle = MapStyle.builder()
                .layerId("BASE-MAP")
                .fillColor("#3498db")
                .strokeColor("#2980b9")
                .strokeWidth(2.0)
                .pointRadius(5.0)
                .opacity(0.8)
                .minZoom(8)
                .maxZoom(18)
                .build();
        testStyle.setId(UUID.randomUUID());
        testStyle.setCreatedAt(LocalDateTime.now());
        testStyle.setUpdatedAt(LocalDateTime.now());
    }

    // ==================== MAPLAYER CRUD TESTS ====================

    @Nested
    @DisplayName("MapLayer CRUD")
    class MapLayerTests {

        @Test
        @DisplayName("Should find all layers")
        void findAll_success() {
            when(mapLayerRepository.findAll()).thenReturn(List.of(testLayer));

            List<MapLayerResponse> result = service.findAll();

            assertNotNull(result);
            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find layer by ID")
        void findById_success() {
            when(mapLayerRepository.findById(testLayer.getId())).thenReturn(Optional.of(testLayer));

            MapLayerResponse result = service.findById(testLayer.getId());

            assertNotNull(result);
            assertEquals(testLayer.getCode(), result.getCode());
        }

        @Test
        @DisplayName("Should throw when layer not found by ID")
        void findById_notFound_throws() {
            when(mapLayerRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.findById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find by LayerType")
        void findByLayerType_success() {
            when(mapLayerRepository.findByLayerType(LayerType.POINT)).thenReturn(List.of(testLayer));

            List<MapLayerResponse> result = service.findByLayerType(LayerType.POINT);

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find visible layers ordered by order")
        void findVisibleLayers_success() {
            when(mapLayerRepository.findByVisibleTrueOrderByOrderAsc()).thenReturn(List.of(testLayer));

            List<MapLayerResponse> result = service.findVisibleLayers();

            assertEquals(1, result.size());
            assertEquals(true, result.get(0).getVisible());
        }

        @Test
        @DisplayName("Should create layer with duplicate code check")
        void create_success() {
            CreateMapLayerRequest request = CreateMapLayerRequest.builder()
                    .name("New Layer")
                    .code("LAYER-001")
                    .layerType(LayerType.LINE)
                    .source("http://example.com/wfs")
                    .visible(true)
                    .opacity(0.9)
                    .order(2)
                    .styleConfig("{\"color\":\"red\"}")
                    .status(Status.ACTIVE)
                    .build();

            MapLayer savedLayer = MapLayer.builder()
                    .name("New Layer")
                    .code("LAYER-001")
                    .layerType(LayerType.LINE)
                    .source("http://example.com/wfs")
                    .visible(true)
                    .opacity(0.9)
                    .order(2)
                    .styleConfig("{\"color\":\"red\"}")
                    .status(Status.ACTIVE)
                    .build();
            savedLayer.setId(UUID.randomUUID());

            when(mapLayerRepository.existsByCode("LAYER-001")).thenReturn(false);
            when(mapLayerRepository.save(any(MapLayer.class))).thenReturn(savedLayer);

            MapLayerResponse result = service.create(request);

            assertNotNull(result);
            assertEquals("LAYER-001", result.getCode());
            verify(mapLayerRepository).save(any(MapLayer.class));
        }

        @Test
        @DisplayName("Should throw when layer code already exists")
        void create_duplicateCode_throws() {
            CreateMapLayerRequest request = CreateMapLayerRequest.builder()
                    .name("Dup Layer")
                    .code("BASE-MAP")
                    .layerType(LayerType.POINT)
                    .build();

            when(mapLayerRepository.existsByCode("BASE-MAP")).thenReturn(true);

            assertThrows(IllegalArgumentException.class, () -> service.create(request));
            verify(mapLayerRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should update layer")
        void update_success() {
            when(mapLayerRepository.findById(testLayer.getId())).thenReturn(Optional.of(testLayer));
            when(mapLayerRepository.save(any(MapLayer.class))).thenReturn(testLayer);

            UpdateMapLayerRequest request = UpdateMapLayerRequest.builder()
                    .name("Updated Layer")
                    .opacity(0.5)
                    .visible(false)
                    .build();

            MapLayerResponse result = service.update(testLayer.getId(), request);

            assertNotNull(result);
            verify(mapLayerRepository).save(any(MapLayer.class));
        }

        @Test
        @DisplayName("Should throw when updating nonexistent layer")
        void update_notFound_throws() {
            UpdateMapLayerRequest request = UpdateMapLayerRequest.builder()
                    .name("Nonexistent")
                    .build();

            when(mapLayerRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.update(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should soft delete layer")
        void delete_success() {
            when(mapLayerRepository.findById(testLayer.getId())).thenReturn(Optional.of(testLayer));
            when(mapLayerRepository.save(any(MapLayer.class))).thenReturn(testLayer);

            service.delete(testLayer.getId());

            verify(mapLayerRepository).save(testLayer);
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent layer")
        void delete_notFound_throws() {
            when(mapLayerRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.delete(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should update styleConfig")
        void update_styleConfig_success() {
            when(mapLayerRepository.findById(testLayer.getId())).thenReturn(Optional.of(testLayer));
            when(mapLayerRepository.save(any(MapLayer.class))).thenReturn(testLayer);

            UpdateMapLayerRequest request = UpdateMapLayerRequest.builder()
                    .styleConfig("{\"color\":\"green\",\"width\":3}")
                    .build();

            MapLayerResponse result = service.update(testLayer.getId(), request);

            assertNotNull(result);
            verify(mapLayerRepository).save(any(MapLayer.class));
        }
    }

    // ==================== MAPVIEW CRUD TESTS ====================

    @Nested
    @DisplayName("MapView CRUD")
    class MapViewTests {

        @Test
        @DisplayName("Should find all map views")
        void findAll_success() {
            when(mapViewRepository.findAll()).thenReturn(List.of(testView));

            List<MapViewResponse> result = service.findAllMapViews();

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find view by ID")
        void findById_success() {
            when(mapViewRepository.findById(testView.getId())).thenReturn(Optional.of(testView));

            MapViewResponse result = service.findMapViewById(testView.getId());

            assertNotNull(result);
            assertEquals(testView.getName(), result.getName());
        }

        @Test
        @DisplayName("Should throw when view not found")
        void findById_notFound_throws() {
            when(mapViewRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.findMapViewById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find views by userId")
        void findByUserId_success() {
            when(mapViewRepository.findByUserIdOrderByCreatedAtDesc(1L))
                    .thenReturn(List.of(testView));

            List<MapViewResponse> result = service.findMapViewsByUserId(1L);

            assertEquals(1, result.size());
            assertEquals(1L, result.get(0).getUserId());
        }

        @Test
        @DisplayName("Should create map view")
        void create_success() {
            CreateMapViewRequest request = CreateMapViewRequest.builder()
                    .name("Custom View")
                    .userId(2L)
                    .centerLon(106.7)
                    .centerLat(10.8)
                    .zoom(15)
                    .visibleLayers("layer1")
                    .build();

            when(mapViewRepository.save(any(MapView.class))).thenReturn(testView);

            MapViewResponse result = service.createMapView(request);

            assertNotNull(result);
            verify(mapViewRepository).save(any(MapView.class));
        }

        @Test
        @DisplayName("Should update map view")
        void update_success() {
            when(mapViewRepository.findById(testView.getId())).thenReturn(Optional.of(testView));
            when(mapViewRepository.save(any(MapView.class))).thenReturn(testView);

            UpdateMapViewRequest request = UpdateMapViewRequest.builder()
                    .name("Updated View")
                    .zoom(18)
                    .centerLon(106.8)
                    .centerLat(10.9)
                    .build();

            MapViewResponse result = service.updateMapView(testView.getId(), request);

            assertNotNull(result);
            verify(mapViewRepository).save(any(MapView.class));
        }

        @Test
        @DisplayName("Should throw when updating nonexistent view")
        void update_notFound_throws() {
            UpdateMapViewRequest request = UpdateMapViewRequest.builder()
                    .name("Nonexistent")
                    .build();

            when(mapViewRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.updateMapView(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should soft delete map view")
        void delete_success() {
            when(mapViewRepository.findById(testView.getId())).thenReturn(Optional.of(testView));
            when(mapViewRepository.save(any(MapView.class))).thenReturn(testView);

            service.deleteMapView(testView.getId());

            verify(mapViewRepository).save(testView);
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent view")
        void delete_notFound_throws() {
            when(mapViewRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.deleteMapView(UUID.randomUUID()));
        }
    }

    // ==================== MAPOVERLAY CRUD TESTS ====================

    @Nested
    @DisplayName("MapOverlay CRUD")
    class OverlayTests {

        @Test
        @DisplayName("Should find all overlays")
        void findAll_success() {
            when(mapOverlayRepository.findAll()).thenReturn(List.of(testOverlay));

            List<MapOverlayResponse> result = service.findAllOverlays();

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find overlay by ID")
        void findById_success() {
            when(mapOverlayRepository.findById(testOverlay.getId())).thenReturn(Optional.of(testOverlay));

            MapOverlayResponse result = service.findOverlayById(testOverlay.getId());

            assertNotNull(result);
            assertEquals(testOverlay.getName(), result.getName());
        }

        @Test
        @DisplayName("Should throw when overlay not found")
        void findById_notFound_throws() {
            when(mapOverlayRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.findOverlayById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find overlays by layerName")
        void findByLayerName_success() {
            when(mapOverlayRepository.findByLayerName("traffic"))
                    .thenReturn(List.of(testOverlay));

            List<MapOverlayResponse> result = service.findOverlaysByLayerName("traffic");

            assertEquals(1, result.size());
            assertEquals("traffic", result.get(0).getLayerName());
        }

        @Test
        @DisplayName("Should find visible overlays")
        void findVisible_success() {
            when(mapOverlayRepository.findByVisibleTrue()).thenReturn(List.of(testOverlay));

            List<MapOverlayResponse> result = service.findVisibleOverlays();

            assertEquals(1, result.size());
            assertEquals(true, result.get(0).getVisible());
        }

        @Test
        @DisplayName("Should create overlay")
        void create_success() {
            CreateMapOverlayRequest request = CreateMapOverlayRequest.builder()
                    .name("Weather Overlay")
                    .url("http://example.com/weather")
                    .layerName("weather")
                    .format("image/png")
                    .visible(true)
                    .opacity(0.7)
                    .zIndex(5)
                    .build();

            when(mapOverlayRepository.save(any(MapOverlay.class))).thenReturn(testOverlay);

            MapOverlayResponse result = service.createOverlay(request);

            assertNotNull(result);
            verify(mapOverlayRepository).save(any(MapOverlay.class));
        }

        @Test
        @DisplayName("Should update overlay")
        void update_success() {
            when(mapOverlayRepository.findById(testOverlay.getId())).thenReturn(Optional.of(testOverlay));
            when(mapOverlayRepository.save(any(MapOverlay.class))).thenReturn(testOverlay);

            UpdateMapOverlayRequest request = UpdateMapOverlayRequest.builder()
                    .name("Updated Overlay")
                    .opacity(0.5)
                    .zIndex(15)
                    .build();

            MapOverlayResponse result = service.updateOverlay(testOverlay.getId(), request);

            assertNotNull(result);
            verify(mapOverlayRepository).save(any(MapOverlay.class));
        }

        @Test
        @DisplayName("Should throw when updating nonexistent overlay")
        void update_notFound_throws() {
            UpdateMapOverlayRequest request = UpdateMapOverlayRequest.builder()
                    .name("Nonexistent")
                    .build();

            when(mapOverlayRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.updateOverlay(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should soft delete overlay")
        void delete_success() {
            when(mapOverlayRepository.findById(testOverlay.getId())).thenReturn(Optional.of(testOverlay));
            when(mapOverlayRepository.save(any(MapOverlay.class))).thenReturn(testOverlay);

            service.deleteOverlay(testOverlay.getId());

            verify(mapOverlayRepository).save(testOverlay);
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent overlay")
        void delete_notFound_throws() {
            when(mapOverlayRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.deleteOverlay(UUID.randomUUID()));
        }
    }

    // ==================== MAPSTYLE CRUD TESTS ====================

    @Nested
    @DisplayName("MapStyle CRUD")
    class StyleTests {

        @Test
        @DisplayName("Should find all styles")
        void findAll_success() {
            when(mapStyleRepository.findAll()).thenReturn(List.of(testStyle));

            List<MapStyleResponse> result = service.findAllStyles();

            assertEquals(1, result.size());
        }

        @Test
        @DisplayName("Should find style by ID")
        void findById_success() {
            when(mapStyleRepository.findById(testStyle.getId())).thenReturn(Optional.of(testStyle));

            MapStyleResponse result = service.findStyleById(testStyle.getId());

            assertNotNull(result);
            assertEquals(testStyle.getLayerId(), result.getLayerId());
        }

        @Test
        @DisplayName("Should throw when style not found")
        void findById_notFound_throws() {
            when(mapStyleRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.findStyleById(UUID.randomUUID()));
        }

        @Test
        @DisplayName("Should find styles by layerId")
        void findByLayerId_success() {
            when(mapStyleRepository.findByLayerId("BASE-MAP"))
                    .thenReturn(List.of(testStyle));

            List<MapStyleResponse> result = service.findStylesByLayerId("BASE-MAP");

            assertEquals(1, result.size());
            assertEquals("BASE-MAP", result.get(0).getLayerId());
        }

        @Test
        @DisplayName("Should create style")
        void create_success() {
            CreateMapStyleRequest request = CreateMapStyleRequest.builder()
                    .layerId("NEW-LAYER")
                    .fillColor("#e74c3c")
                    .strokeColor("#c0392b")
                    .strokeWidth(3.0)
                    .pointRadius(8.0)
                    .opacity(0.7)
                    .minZoom(6)
                    .maxZoom(16)
                    .build();

            when(mapStyleRepository.save(any(MapStyle.class))).thenReturn(testStyle);

            MapStyleResponse result = service.createStyle(request);

            assertNotNull(result);
            verify(mapStyleRepository).save(any(MapStyle.class));
        }

        @Test
        @DisplayName("Should update style")
        void update_success() {
            when(mapStyleRepository.findById(testStyle.getId())).thenReturn(Optional.of(testStyle));
            when(mapStyleRepository.save(any(MapStyle.class))).thenReturn(testStyle);

            UpdateMapStyleRequest request = UpdateMapStyleRequest.builder()
                    .fillColor("#2ecc71")
                    .strokeWidth(5.0)
                    .opacity(0.9)
                    .build();

            MapStyleResponse result = service.updateStyle(testStyle.getId(), request);

            assertNotNull(result);
            verify(mapStyleRepository).save(any(MapStyle.class));
        }

        @Test
        @DisplayName("Should throw when updating nonexistent style")
        void update_notFound_throws() {
            UpdateMapStyleRequest request = UpdateMapStyleRequest.builder()
                    .fillColor("#000")
                    .build();

            when(mapStyleRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.updateStyle(UUID.randomUUID(), request));
        }

        @Test
        @DisplayName("Should soft delete style")
        void delete_success() {
            when(mapStyleRepository.findById(testStyle.getId())).thenReturn(Optional.of(testStyle));
            when(mapStyleRepository.save(any(MapStyle.class))).thenReturn(testStyle);

            service.deleteStyle(testStyle.getId());

            verify(mapStyleRepository).save(testStyle);
        }

        @Test
        @DisplayName("Should throw when deleting nonexistent style")
        void delete_notFound_throws() {
            when(mapStyleRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

            assertThrows(EntityNotFoundException.class,
                    () -> service.deleteStyle(UUID.randomUUID()));
        }
    }
}
