package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.integration.dto.AssetStatusDto;
import com.hanghai.kchtg.integration.dto.CargoInventoryDto;
import com.hanghai.kchtg.integration.dto.ComprehensiveInfoDto;
import com.hanghai.kchtg.integration.dto.MaintenanceInfoDto;
import com.hanghai.kchtg.integration.entity.CargoAggregate;
import com.hanghai.kchtg.integration.entity.PortStatus;
import com.hanghai.kchtg.integration.repository.CargoAggregateRepository;
import com.hanghai.kchtg.integration.repository.PortStatusRepository;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Controller for sharing port status and cargo aggregation statistics.
 * Request header token check is applied via IntegrationTokenAdvice.
 */
@RestController
@RequestMapping("/api/v1/integration/share")
public class PortCargoShareController {

    private final PointObjectRepository pointRepository;
    private final LineObjectRepository lineRepository;
    private final PolygonObjectRepository polygonRepository;
    private final PortStatusRepository portStatusRepository;
    private final CargoAggregateRepository cargoAggregateRepository;
    private final DataConnectionRepository connectionRepository;
    private final SyncLogRepository syncLogRepository;

    public PortCargoShareController(PointObjectRepository pointRepository,
                                    LineObjectRepository lineRepository,
                                    PolygonObjectRepository polygonRepository,
                                    PortStatusRepository portStatusRepository,
                                    CargoAggregateRepository cargoAggregateRepository,
                                    DataConnectionRepository connectionRepository,
                                    SyncLogRepository syncLogRepository) {
        this.pointRepository = pointRepository;
        this.lineRepository = lineRepository;
        this.polygonRepository = polygonRepository;
        this.portStatusRepository = portStatusRepository;
        this.cargoAggregateRepository = cargoAggregateRepository;
        this.connectionRepository = connectionRepository;
        this.syncLogRepository = syncLogRepository;
    }

    /**
     * GET /ports/status (F-215) -> Returns paginated port operational statuses.
     */
    @GetMapping("/ports/status")
    public ResponseEntity<ApiResponse<Page<PortStatus>>> getPortStatuses(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PortStatus> page = portStatusRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /assets/status (F-216) -> Returns summary counts of Points, Lines, Polygons.
     */
    @GetMapping("/assets/status")
    public ResponseEntity<ApiResponse<AssetStatusDto>> getAssetStatus() {
        List<PointObject> points = pointRepository.findAll();
        List<LineObject> lines = lineRepository.findAll();
        List<PolygonObject> polygons = polygonRepository.findAll();

        long totalPoints = points.size();
        long totalLines = lines.size();
        long totalPolygons = polygons.size();
        long totalAssets = totalPoints + totalLines + totalPolygons;

        Map<String, Long> pointsByType = points.stream()
                .collect(Collectors.groupingBy(p -> p.getObjectType().name(), Collectors.counting()));
        Map<String, Long> linesByType = lines.stream()
                .collect(Collectors.groupingBy(l -> l.getObjectType().name(), Collectors.counting()));
        Map<String, Long> polygonsByType = polygons.stream()
                .collect(Collectors.groupingBy(p -> p.getObjectType().name(), Collectors.counting()));

        // Group status counts from all assets
        Map<String, Long> assetsByStatus = Stream.of(
                points.stream().map(p -> p.getStatus().name()),
                lines.stream().map(l -> l.getStatus().name()),
                polygons.stream().map(p -> p.getStatus().name())
        ).flatMap(s -> s)
         .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

        AssetStatusDto dto = AssetStatusDto.builder()
                .totalPoints(totalPoints)
                .totalLines(totalLines)
                .totalPolygons(totalPolygons)
                .totalAssets(totalAssets)
                .pointsByType(pointsByType)
                .linesByType(linesByType)
                .polygonsByType(polygonsByType)
                .assetsByStatus(assetsByStatus)
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * GET /info/comprehensive (F-217) -> Returns global system stats.
     */
    @GetMapping("/info/comprehensive")
    public ResponseEntity<ApiResponse<ComprehensiveInfoDto>> getComprehensiveInfo() {
        long totalAssets = pointRepository.count() + lineRepository.count() + polygonRepository.count();
        List<DataConnection> connections = connectionRepository.findAll();
        long totalConns = connections.size();
        Map<String, Long> connsByStatus = connections.stream()
                .collect(Collectors.groupingBy(c -> c.getStatus() != null ? c.getStatus().name() : "UNKNOWN", Collectors.counting()));

        List<SyncLog> logs = syncLogRepository.findAll();
        long totalLogs = logs.size();
        Map<String, Long> logsByStatus = logs.stream()
                .collect(Collectors.groupingBy(l -> l.getStatus() != null ? l.getStatus().name() : "UNKNOWN", Collectors.counting()));

        ComprehensiveInfoDto dto = ComprehensiveInfoDto.builder()
                .totalAssets(totalAssets)
                .totalDataConnections(totalConns)
                .connectionsByStatus(connsByStatus)
                .totalSyncJobsRun(totalLogs)
                .syncJobsByStatus(logsByStatus)
                .systemTime(LocalDateTime.now())
                .build();

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    /**
     * GET /info/maintenance (F-218) -> Returns paginated list of non-published assets.
     */
    @GetMapping("/info/maintenance")
    public ResponseEntity<ApiResponse<Page<MaintenanceInfoDto>>> getMaintenanceInfo(
            @PageableDefault(size = 20, sort = "updatedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        List<MaintenanceInfoDto> maintenanceList = new ArrayList<>();

        // Fetch PointObjects under review or draft
        pointRepository.findAll().stream()
                .filter(p -> p.getStatus() != PointObject.Status.PUBLISHED)
                .forEach(p -> maintenanceList.add(MaintenanceInfoDto.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .assetType("POINT")
                        .objectSubtype(p.getObjectType().name())
                        .description(p.getDescription())
                        .status(p.getStatus().name())
                        .lastUpdated(p.getUpdatedAt() != null ? p.getUpdatedAt() : LocalDateTime.now())
                        .build()));

        // Fetch LineObjects under review or draft
        lineRepository.findAll().stream()
                .filter(l -> l.getStatus() != LineObject.Status.PUBLISHED)
                .forEach(l -> maintenanceList.add(MaintenanceInfoDto.builder()
                        .code(l.getCode())
                        .name(l.getName())
                        .assetType("LINE")
                        .objectSubtype(l.getObjectType().name())
                        .description(l.getDescription())
                        .status(l.getStatus().name())
                        .lastUpdated(l.getUpdatedAt() != null ? l.getUpdatedAt() : LocalDateTime.now())
                        .build()));

        // Fetch PolygonObjects under review or draft
        polygonRepository.findAll().stream()
                .filter(p -> p.getStatus() != PolygonObject.Status.PUBLISHED)
                .forEach(p -> maintenanceList.add(MaintenanceInfoDto.builder()
                        .code(p.getCode())
                        .name(p.getName())
                        .assetType("POLYGON")
                        .objectSubtype(p.getObjectType().name())
                        .description(p.getDescription())
                        .status(p.getStatus().name())
                        .lastUpdated(p.getUpdatedAt() != null ? p.getUpdatedAt() : LocalDateTime.now())
                        .build()));

        // Sort by lastUpdated descending (in-memory)
        maintenanceList.sort(Comparator.comparing(MaintenanceInfoDto::getLastUpdated).reversed());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), maintenanceList.size());
        Page<MaintenanceInfoDto> page = new PageImpl<>(
                start <= end ? maintenanceList.subList(start, end) : Collections.emptyList(),
                pageable,
                maintenanceList.size()
        );

        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /ports/cargo-total (F-219) -> Returns annual cargo totals.
     */
    @GetMapping("/ports/cargo-total")
    public ResponseEntity<ApiResponse<Page<CargoAggregate>>> getPortCargoTotal(
            @PageableDefault(size = 20, sort = "periodStart", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CargoAggregate> page = cargoAggregateRepository.findByPeriodType("ANNUAL", pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /ports/berth-wharf-summary (F-220) -> Returns cargo aggregate categories.
     */
    @GetMapping("/ports/berth-wharf-summary")
    public ResponseEntity<ApiResponse<Page<CargoAggregate>>> getBerthWharfSummary(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<CargoAggregate> page = cargoAggregateRepository.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /cargo/summary (F-221) -> Filtered cargo aggregate summaries.
     */
    @GetMapping("/cargo/summary")
    public ResponseEntity<ApiResponse<Page<CargoAggregate>>> getCargoSummary(
            @RequestParam(required = false) String portCode,
            @RequestParam(required = false) String periodType,
            @PageableDefault(size = 20, sort = "periodStart", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<CargoAggregate> page;
        if (portCode != null && !portCode.isBlank() && periodType != null && !periodType.isBlank()) {
            page = cargoAggregateRepository.findByPortCodeAndPeriodType(portCode, periodType, pageable);
        } else if (portCode != null && !portCode.isBlank()) {
            page = cargoAggregateRepository.findByPortCode(portCode, pageable);
        } else if (periodType != null && !periodType.isBlank()) {
            page = cargoAggregateRepository.findByPeriodType(periodType, pageable);
        } else {
            page = cargoAggregateRepository.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /transport-anchorage-summary (F-222) -> Summarizes active anchorages.
     */
    @GetMapping("/transport-anchorage-summary")
    public ResponseEntity<ApiResponse<Page<PolygonObject>>> getTransportAnchorageSummary(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PolygonObject> page = polygonRepository.findByObjectTypeAndStatus(
                PolygonObject.ObjectType.ANCHORAGE, PolygonObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /buoy-signal-summary (F-223) -> Summarizes buoy marker locations.
     */
    @GetMapping("/buoy-signal-summary")
    public ResponseEntity<ApiResponse<Page<PointObject>>> getBuoySignalSummary(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.BUOY, PointObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /beacons/system-summary (F-224) -> Summarizes beacon points.
     */
    @GetMapping("/beacons/system-summary")
    public ResponseEntity<ApiResponse<Page<PointObject>>> getBeaconSystemSummary(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PointObject> page = pointRepository.findByObjectTypeAndStatus(
                PointObject.ObjectType.BEACON, PointObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /breakwaters/summary (F-225) -> Summarizes breakwater line structures.
     */
    @GetMapping("/breakwaters/summary")
    public ResponseEntity<ApiResponse<Page<LineObject>>> getBreakwatersSummary(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<LineObject> page = lineRepository.findByObjectTypeAndStatus(
                LineObject.ObjectType.WATERWAY, LineObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /break-seas/summary (F-227) -> Summarizes storm shelters.
     */
    @GetMapping("/break-seas/summary")
    public ResponseEntity<ApiResponse<Page<PolygonObject>>> getBreakSeasSummary(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<PolygonObject> page = polygonRepository.findByObjectTypeAndStatus(
                PolygonObject.ObjectType.STORM_SHELTER, PolygonObject.Status.PUBLISHED, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * GET /cargo/inventory (F-226) -> Returns paginated cargo inventory check results.
     * Implements the feature "chieu-kiem-hang-hoa" (cargo inventory check) for sharing
     * aggregated cargo data through the integration bus.
     */
    @GetMapping("/cargo/inventory")
    public ResponseEntity<ApiResponse<Page<CargoInventoryDto>>> getCargoInventory(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {

        List<CargoAggregate> all = cargoAggregateRepository.findAll();

        List<CargoInventoryDto> inventoryList = all.stream()
                .map(c -> CargoInventoryDto.builder()
                        .id(c.getId() != null ? c.getId().toString() : null)
                        .cargoName(c.getPortCode())
                        .quantity(c.getVesselCount() != null ? Long.valueOf(c.getVesselCount()) : 0L)
                        .unit("vessels")
                        .lastCheckedAt(c.getPeriodEnd())
                        .status(c.getPeriodType())
                        .build())
                .collect(Collectors.toList());

        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), inventoryList.size());
        Page<CargoInventoryDto> page = new PageImpl<>(
                start <= end ? inventoryList.subList(start, end) : Collections.emptyList(),
                pageable,
                inventoryList.size()
        );

        return ResponseEntity.ok(ApiResponse.success(page));
    }
}