package com.hanghai.kchtg.gis.layer;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.layer.controller.MapLayerController;
import com.hanghai.kchtg.gis.layer.dto.*;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.service.MapLayerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MapLayerControllerTest {

    @Mock
    private MapLayerService service;

    @InjectMocks
    private MapLayerController controller;

    private MapLayerResponse layerResponse;
    private MapViewResponse viewResponse;
    private MapOverlayResponse overlayResponse;
    private MapStyleResponse styleResponse;

    @BeforeEach
    void setUp() {
        layerResponse = MapLayerResponse.builder()
                .id(UUID.randomUUID())
                .name("Base Map")
                .code("BASE-MAP")
                .layerType(LayerType.POINT)
                .source("http://example.com/wms")
                .visible(true)
                .opacity(0.8)
                .order(1)
                .styleConfig("{\"color\":\"blue\"}")
                .status(com.hanghai.kchtg.gis.layer.entity.MapLayer.Status.ACTIVE)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        viewResponse = MapViewResponse.builder()
                .id(UUID.randomUUID())
                .name("Default View")
                .userId(1L)
                .centerLon(106.6297)
                .centerLat(10.7769)
                .zoom(12)
                .visibleLayers("layer1,layer2")
                .layerOrder("1,2")
                .styleConfigs("{\"layer1\":\"default\"}")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        overlayResponse = MapOverlayResponse.builder()
                .id(UUID.randomUUID())
                .name("Traffic Overlay")
                .url("http://example.com/overlay")
                .layerName("traffic")
                .format("image/png")
                .visible(true)
                .opacity(0.6)
                .zIndex(10)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        styleResponse = MapStyleResponse.builder()
                .id(UUID.randomUUID())
                .layerId("BASE-MAP")
                .fillColor("#3498db")
                .strokeColor("#2980b9")
                .strokeWidth(2.0)
                .pointRadius(5.0)
                .opacity(0.8)
                .minZoom(8)
                .maxZoom(18)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    // ==================== MAPLAYER ENDPOINTS ====================

    @Nested
    @DisplayName("MapLayer Endpoints")
    class LayerEndpoints {

        @Test
        @DisplayName("GET /api/map-layers returns 200")
        void findAll_returns200() {
            when(service.findAll()).thenReturn(List.of(layerResponse));

            ResponseEntity<ApiResponse<List<MapLayerResponse>>> response = controller.findAll();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertEquals(1, response.getBody().getData().size());
        }

        @Test
        @DisplayName("GET /api/map-layers/{id} returns 200")
        void findById_returns200() {
            when(service.findById(any(UUID.class))).thenReturn(layerResponse);

            ResponseEntity<ApiResponse<MapLayerResponse>> response = controller.findById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/map-layers/type/{layerType} returns 200")
        void findByLayerType_returns200() {
            when(service.findByLayerType(LayerType.POINT)).thenReturn(List.of(layerResponse));

            ResponseEntity<ApiResponse<List<MapLayerResponse>>> response =
                    controller.findByLayerType(LayerType.POINT);

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        @Test
        @DisplayName("GET /api/map-layers/visible returns 200")
        void findVisible_returns200() {
            when(service.findVisibleLayers()).thenReturn(List.of(layerResponse));

            ResponseEntity<ApiResponse<List<MapLayerResponse>>> response =
                    controller.findVisibleLayers();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST /api/map-layers creates with 201")
        void create_returns201() {
            CreateMapLayerRequest request = CreateMapLayerRequest.builder()
                    .name("New Layer")
                    .code("NEW-LAYER")
                    .layerType(LayerType.LINE)
                    .build();

            when(service.create(any(CreateMapLayerRequest.class))).thenReturn(layerResponse);

            ResponseEntity<ApiResponse<MapLayerResponse>> response = controller.create(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).create(any(CreateMapLayerRequest.class));
        }

        @Test
        @DisplayName("PUT /api/map-layers/{id} updates with 200")
        void update_returns200() {
            UpdateMapLayerRequest request = UpdateMapLayerRequest.builder()
                    .name("Updated Layer")
                    .build();

            when(service.update(any(UUID.class), any(UpdateMapLayerRequest.class)))
                    .thenReturn(layerResponse);

            ResponseEntity<ApiResponse<MapLayerResponse>> response =
                    controller.update(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("DELETE /api/map-layers/{id} deletes with 200")
        void delete_returns200() {
            doNothing().when(service).delete(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response = controller.delete(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(service).delete(any(UUID.class));
        }
    }

    // ==================== MAPVIEW ENDPOINTS ====================

    @Nested
    @DisplayName("MapView Endpoints")
    class MapViewEndpoints {

        @Test
        @DisplayName("GET /api/map-layers/map-views returns 200")
        void findAll_returns200() {
            when(service.findAllMapViews()).thenReturn(List.of(viewResponse));

            ResponseEntity<ApiResponse<List<MapViewResponse>>> response =
                    controller.findAllMapViews();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/map-layers/map-views/{id} returns 200")
        void findById_returns200() {
            when(service.findMapViewById(any(UUID.class))).thenReturn(viewResponse);

            ResponseEntity<ApiResponse<MapViewResponse>> response =
                    controller.findMapViewById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        @Test
        @DisplayName("GET /api/map-layers/map-views/user/{userId} returns 200")
        void findByUserId_returns200() {
            when(service.findMapViewsByUserId(1L)).thenReturn(List.of(viewResponse));

            ResponseEntity<ApiResponse<List<MapViewResponse>>> response =
                    controller.findMapViewsByUserId(1L);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST /api/map-layers/map-views creates with 201")
        void create_returns201() {
            CreateMapViewRequest request = CreateMapViewRequest.builder()
                    .name("Custom View")
                    .userId(1L)
                    .centerLon(106.7)
                    .centerLat(10.8)
                    .zoom(15)
                    .build();

            when(service.createMapView(any(CreateMapViewRequest.class))).thenReturn(viewResponse);

            ResponseEntity<ApiResponse<MapViewResponse>> response =
                    controller.createMapView(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("PUT /api/map-layers/map-views/{id} updates with 200")
        void update_returns200() {
            UpdateMapViewRequest request = UpdateMapViewRequest.builder()
                    .name("Updated View")
                    .build();

            when(service.updateMapView(any(UUID.class), any(UpdateMapViewRequest.class)))
                    .thenReturn(viewResponse);

            ResponseEntity<ApiResponse<MapViewResponse>> response =
                    controller.updateMapView(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("DELETE /api/map-layers/map-views/{id} deletes with 200")
        void delete_returns200() {
            doNothing().when(service).deleteMapView(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response =
                    controller.deleteMapView(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(service).deleteMapView(any(UUID.class));
        }
    }

    // ==================== MAPOVERLAY ENDPOINTS ====================

    @Nested
    @DisplayName("MapOverlay Endpoints")
    class OverlayEndpoints {

        @Test
        @DisplayName("GET /api/map-layers/overlays returns 200")
        void findAll_returns200() {
            when(service.findAllOverlays()).thenReturn(List.of(overlayResponse));

            ResponseEntity<ApiResponse<List<MapOverlayResponse>>> response =
                    controller.findAllOverlays();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/map-layers/overlays/{id} returns 200")
        void findById_returns200() {
            when(service.findOverlayById(any(UUID.class))).thenReturn(overlayResponse);

            ResponseEntity<ApiResponse<MapOverlayResponse>> response =
                    controller.findOverlayById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        @Test
        @DisplayName("GET /api/map-layers/overlays/layer/{layerName} returns 200")
        void findByLayerName_returns200() {
            when(service.findOverlaysByLayerName("traffic")).thenReturn(List.of(overlayResponse));

            ResponseEntity<ApiResponse<List<MapOverlayResponse>>> response =
                    controller.findOverlaysByLayerName("traffic");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/map-layers/overlays/visible returns 200")
        void findVisible_returns200() {
            when(service.findVisibleOverlays()).thenReturn(List.of(overlayResponse));

            ResponseEntity<ApiResponse<List<MapOverlayResponse>>> response =
                    controller.findVisibleOverlays();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST /api/map-layers/overlays creates with 201")
        void create_returns201() {
            CreateMapOverlayRequest request = CreateMapOverlayRequest.builder()
                    .name("Weather Overlay")
                    .url("http://example.com/weather")
                    .layerName("weather")
                    .build();

            when(service.createOverlay(any(CreateMapOverlayRequest.class))).thenReturn(overlayResponse);

            ResponseEntity<ApiResponse<MapOverlayResponse>> response =
                    controller.createOverlay(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("PUT /api/map-layers/overlays/{id} updates with 200")
        void update_returns200() {
            UpdateMapOverlayRequest request = UpdateMapOverlayRequest.builder()
                    .name("Updated Overlay")
                    .build();

            when(service.updateOverlay(any(UUID.class), any(UpdateMapOverlayRequest.class)))
                    .thenReturn(overlayResponse);

            ResponseEntity<ApiResponse<MapOverlayResponse>> response =
                    controller.updateOverlay(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("DELETE /api/map-layers/overlays/{id} deletes with 200")
        void delete_returns200() {
            doNothing().when(service).deleteOverlay(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response =
                    controller.deleteOverlay(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(service).deleteOverlay(any(UUID.class));
        }
    }

    // ==================== MAPSTYLE ENDPOINTS ====================

    @Nested
    @DisplayName("MapStyle Endpoints")
    class StyleEndpoints {

        @Test
        @DisplayName("GET /api/map-layers/styles returns 200")
        void findAll_returns200() {
            when(service.findAllStyles()).thenReturn(List.of(styleResponse));

            ResponseEntity<ApiResponse<List<MapStyleResponse>>> response =
                    controller.findAllStyles();

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("GET /api/map-layers/styles/{id} returns 200")
        void findById_returns200() {
            when(service.findStyleById(any(UUID.class))).thenReturn(styleResponse);

            ResponseEntity<ApiResponse<MapStyleResponse>> response =
                    controller.findStyleById(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
        }

        @Test
        @DisplayName("GET /api/map-layers/styles/layer/{layerId} returns 200")
        void findByLayerId_returns200() {
            when(service.findStylesByLayerId("BASE-MAP")).thenReturn(List.of(styleResponse));

            ResponseEntity<ApiResponse<List<MapStyleResponse>>> response =
                    controller.findStylesByLayerId("BASE-MAP");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("POST /api/map-layers/styles creates with 201")
        void create_returns201() {
            CreateMapStyleRequest request = CreateMapStyleRequest.builder()
                    .layerId("NEW-LAYER")
                    .fillColor("#e74c3c")
                    .build();

            when(service.createStyle(any(CreateMapStyleRequest.class))).thenReturn(styleResponse);

            ResponseEntity<ApiResponse<MapStyleResponse>> response =
                    controller.createStyle(request);

            assertEquals(HttpStatus.CREATED, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("PUT /api/map-layers/styles/{id} updates with 200")
        void update_returns200() {
            UpdateMapStyleRequest request = UpdateMapStyleRequest.builder()
                    .fillColor("#2ecc71")
                    .build();

            when(service.updateStyle(any(UUID.class), any(UpdateMapStyleRequest.class)))
                    .thenReturn(styleResponse);

            ResponseEntity<ApiResponse<MapStyleResponse>> response =
                    controller.updateStyle(UUID.randomUUID(), request);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
        }

        @Test
        @DisplayName("DELETE /api/map-layers/styles/{id} deletes with 200")
        void delete_returns200() {
            doNothing().when(service).deleteStyle(any(UUID.class));

            ResponseEntity<ApiResponse<Void>> response =
                    controller.deleteStyle(UUID.randomUUID());

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            verify(service).deleteStyle(any(UUID.class));
        }
    }
}