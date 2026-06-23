package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.integration.dto.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes endpoints for sharing published GIS data to external systems.
 * Requests are validated globally via IntegrationTokenAdvice using pre-shared token.
 * All endpoints support Spring Data pagination.
 */
@RestController
@RequestMapping("/api/v1/integration/share")
public class IntegrationShareController {

    private final PointObjectRepository pointRepository;
    private final LineObjectRepository lineRepository;
    private final PolygonObjectRepository polygonRepository;

    public IntegrationShareController(PointObjectRepository pointRepository,
                                      LineObjectRepository lineRepository,
                                      PolygonObjectRepository polygonRepository) {
        this.pointRepository = pointRepository;
        this.lineRepository = lineRepository;
        this.polygonRepository = polygonRepository;
    }

    // ══════════════════════════════════════════════════════════════
    //  Wave 0 — generic endpoints with pagination
    // ══════════════════════════════════════════════════════════════

    @GetMapping("/points")
    public ResponseEntity<ApiResponse<Page<PointObject>>> sharePoints(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByStatus(PointObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/lines")
    public ResponseEntity<ApiResponse<Page<LineObject>>> shareLines(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<LineObject> page = lineRepository.findByStatus(LineObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/polygons")
    public ResponseEntity<ApiResponse<Page<PolygonObject>>> sharePolygons(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PolygonObject> page = polygonRepository.findByStatus(PolygonObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    // ══════════════════════════════════════════════════════════════
    //  Wave 1 — filtered endpoints by objectType with pagination
    // ══════════════════════════════════════════════════════════════

    /**
     * GET /points/ports — Pier/Dock (Bến cảng) — PointObject with ObjectType=PORT.
     */
    @GetMapping("/points/ports")
    public ResponseEntity<ApiResponse<Page<PierDto>>> sharePointsPorts(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.PORT, PointObject.Status.PUBLISHED, pageable);
        Page<PierDto> dtoPage = page.map(PierDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /points/buoys — Buoy berth (Bến phao) — PointObject with ObjectType=BUOY.
     */
    @GetMapping("/points/buoys")
    public ResponseEntity<ApiResponse<Page<BuoyBerthDto>>> sharePointsBuoys(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.BUOY, PointObject.Status.PUBLISHED, pageable);
        Page<BuoyBerthDto> dtoPage = page.map(BuoyBerthDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /points/beacons — Beacon (Đèn biển) — PointObject with ObjectType=BEACON.
     */
    @GetMapping("/points/beacons")
    public ResponseEntity<ApiResponse<Page<BeaconDto>>> sharePointsBeacons(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.BEACON, PointObject.Status.PUBLISHED, pageable);
        Page<BeaconDto> dtoPage = page.map(BeaconDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /lines/waterways — Bridge (Cầu cảng) — LineObject with ObjectType=WATERWAY.
     */
    @GetMapping("/lines/waterways")
    public ResponseEntity<ApiResponse<Page<BridgeDto>>> shareLinesWaterways(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<LineObject> page = lineRepository.findByObjectTypeAndStatus(
                LineObject.ObjectType.WATERWAY, LineObject.Status.PUBLISHED, pageable);
        Page<BridgeDto> dtoPage = page.map(BridgeDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /lines/shipping-routes — Transport route (Chuyển tải) — LineObject with ObjectType=SHIPPING_ROUTE.
     */
    @GetMapping("/lines/shipping-routes")
    public ResponseEntity<ApiResponse<Page<TransportRouteDto>>> shareLinesShippingRoutes(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<LineObject> page = lineRepository.findByObjectTypeAndStatus(
                LineObject.ObjectType.SHIPPING_ROUTE, LineObject.Status.PUBLISHED, pageable);
        Page<TransportRouteDto> dtoPage = page.map(TransportRouteDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /polygons/anchorage — Anchorage area (Khu neo đậu) — PolygonObject with ObjectType=ANCHORAGE.
     */
    @GetMapping("/polygons/anchorage")
    public ResponseEntity<ApiResponse<Page<AnchorageDto>>> sharePolygonsAnchorage(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PolygonObject> page = polygonRepository.findByObjectTypeAndStatus(
                PolygonObject.ObjectType.ANCHORAGE, PolygonObject.Status.PUBLISHED, pageable);
        Page<AnchorageDto> dtoPage = page.map(AnchorageDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /polygons/storm-shelter — Storm shelter zone (Khu tránh bão) — PolygonObject with ObjectType=STORM_SHELTER.
     */
    @GetMapping("/polygons/storm-shelter")
    public ResponseEntity<ApiResponse<Page<StormShelterDto>>> sharePolygonsStormShelter(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PolygonObject> page = polygonRepository.findByObjectTypeAndStatus(
                PolygonObject.ObjectType.STORM_SHELTER, PolygonObject.Status.PUBLISHED, pageable);
        Page<StormShelterDto> dtoPage = page.map(StormShelterDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    // ══════════════════════════════════════════════════════════════
    //  Wave 2 — New endpoints (F-196, F-198, F-199) with pagination
    // ══════════════════════════════════════════════════════════════

    /**
     * GET /points/repair-facilities — Repair facility (Cơ sở sửa chữa) — PointObject with ObjectType=OTHER.
     */
    @GetMapping("/points/repair-facilities")
    public ResponseEntity<ApiResponse<Page<RepairFacilityDto>>> sharePointsRepairFacilities(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.OTHER, PointObject.Status.PUBLISHED, pageable);
        Page<RepairFacilityDto> dtoPage = page.map(RepairFacilityDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /points/buoy-markers — Buoy marker (Phao tiêu) — PointObject with ObjectType=BUOY.
     */
    @GetMapping("/points/buoy-markers")
    public ResponseEntity<ApiResponse<Page<BuoyMarkerDto>>> sharePointsBuoyMarkers(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.BUOY, PointObject.Status.PUBLISHED, pageable);
        Page<BuoyMarkerDto> dtoPage = page.map(BuoyMarkerDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }

    /**
     * GET /points/vts-systems — VTS system (Hệ thống VTS) — PointObject with ObjectType=PORT.
     */
    @GetMapping("/points/vts-systems")
    public ResponseEntity<ApiResponse<Page<VtsSystemDto>>> sharePointsVtsSystems(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.PORT, PointObject.Status.PUBLISHED, pageable);
        Page<VtsSystemDto> dtoPage = page.map(VtsSystemDto::from);
        return ResponseEntity.ok(ApiResponse.success(dtoPage));
    }
}
