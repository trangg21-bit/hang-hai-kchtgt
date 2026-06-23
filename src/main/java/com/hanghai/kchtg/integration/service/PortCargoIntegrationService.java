package com.hanghai.kchtg.integration.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.integration.entity.IntegrationDlq;
import com.hanghai.kchtg.integration.entity.IntegrationSyncJob;
import com.hanghai.kchtg.integration.entity.PortStatus;
import com.hanghai.kchtg.integration.entity.CargoAggregate;
import com.hanghai.kchtg.integration.repository.IntegrationDlqRepository;
import com.hanghai.kchtg.integration.repository.IntegrationSyncJobRepository;
import com.hanghai.kchtg.integration.repository.PortStatusRepository;
import com.hanghai.kchtg.integration.repository.CargoAggregateRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PortCargoIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(PortCargoIntegrationService.class);

    private final DataConnectionRepository connectionRepository;
    private final IntegrationSyncJobRepository syncJobRepository;
    private final IntegrationDlqRepository dlqRepository;
    private final PointObjectRepository pointRepository;
    private final LineObjectRepository lineRepository;
    private final PolygonObjectRepository polygonRepository;
    private final PortStatusRepository portStatusRepository;
    private final CargoAggregateRepository cargoAggregateRepository;
    private final ObjectMapper objectMapper;

    public PortCargoIntegrationService(DataConnectionRepository connectionRepository,
                                       IntegrationSyncJobRepository syncJobRepository,
                                       IntegrationDlqRepository dlqRepository,
                                       PointObjectRepository pointRepository,
                                       LineObjectRepository lineRepository,
                                       PolygonObjectRepository polygonRepository,
                                       PortStatusRepository portStatusRepository,
                                       CargoAggregateRepository cargoAggregateRepository,
                                       ObjectMapper objectMapper) {
        this.connectionRepository = connectionRepository;
        this.syncJobRepository = syncJobRepository;
        this.dlqRepository = dlqRepository;
        this.pointRepository = pointRepository;
        this.lineRepository = lineRepository;
        this.polygonRepository = polygonRepository;
        this.portStatusRepository = portStatusRepository;
        this.cargoAggregateRepository = cargoAggregateRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Executes inbound synchronization for a physical infrastructure feature.
     *
     * @param featureCode the code identifying the feature (F-227 to F-236)
     * @param connectionId optional ID of the connection to pull from. If null, lookup is performed using featureCode
     * @return the created IntegrationSyncJob
     */
    public IntegrationSyncJob executeSync(String featureCode, UUID connectionId) {
        DataConnection connection;
        if (connectionId != null) {
            connection = connectionRepository.findById(connectionId)
                    .orElseThrow(() -> new EntityNotFoundException("Connection not found: id=" + connectionId));
        } else {
            connection = connectionRepository.findByCode(featureCode)
                    .or(() -> connectionRepository.findByCode("DEFAULT_SYNC"))
                    .or(() -> connectionRepository.findAll().stream().findFirst())
                    .orElseThrow(() -> new EntityNotFoundException("No suitable DataConnection found for feature: " + featureCode));
        }

        IntegrationSyncJob job = IntegrationSyncJob.builder()
                .featureCode(featureCode)
                .sourceUrl(connection.getEndpointUrl())
                .status(IntegrationSyncJob.SyncStatus.RUNNING)
                .startedAt(LocalDateTime.now())
                .retryCount(0)
                .build();
        job = syncJobRepository.save(job);

        return runSync(job, connection);
    }

    /**
     * Retries a previously failed synchronization job.
     *
     * @param jobId the ID of the job to retry
     * @return the updated IntegrationSyncJob
     */
    public IntegrationSyncJob retrySyncJob(UUID jobId) {
        IntegrationSyncJob job = syncJobRepository.findById(jobId)
                .orElseThrow(() -> new EntityNotFoundException("Sync job not found: id=" + jobId));

        if (job.getRetryCount() != null && job.getRetryCount() >= 3) {
            throw new IllegalStateException("Max retry limit (3) reached for job: " + jobId);
        }

        job.setRetryCount((job.getRetryCount() == null ? 0 : job.getRetryCount()) + 1);
        job.setStatus(IntegrationSyncJob.SyncStatus.RUNNING);
        job.setStartedAt(LocalDateTime.now());
        job.setErrorMessage(null);
        final IntegrationSyncJob savedJob = syncJobRepository.save(job);

        // Find connection by sourceUrl or featureCode
        DataConnection connection = connectionRepository.findAll().stream()
                .filter(c -> savedJob.getSourceUrl() != null && savedJob.getSourceUrl().equals(c.getEndpointUrl()))
                .findFirst()
                .orElseGet(() -> connectionRepository.findByCode(savedJob.getFeatureCode())
                        .or(() -> connectionRepository.findByCode("DEFAULT_SYNC"))
                        .or(() -> connectionRepository.findAll().stream().findFirst())
                        .orElse(null));

        if (connection == null) {
            savedJob.setStatus(IntegrationSyncJob.SyncStatus.FAILED);
            savedJob.setErrorMessage("DataConnection not found for URL: " + savedJob.getSourceUrl());
            savedJob.setCompletedAt(LocalDateTime.now());
            return syncJobRepository.save(savedJob);
        }

        return runSync(savedJob, connection);
    }

    private IntegrationSyncJob runSync(IntegrationSyncJob job, DataConnection connection) {
        String urlStr = connection.getEndpointUrl();
        if (urlStr == null || urlStr.isBlank()) {
            job.setStatus(IntegrationSyncJob.SyncStatus.FAILED);
            job.setErrorMessage("Endpoint URL is empty");
            job.setCompletedAt(LocalDateTime.now());
            return syncJobRepository.save(job);
        }

        int processed = 0;
        int failed = 0;

        try {
            log.info("Starting integration sync for feature={}, job={}, url={}", job.getFeatureCode(), job.getId(), urlStr);
            URL url = validateUrl(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            conn.setRequestProperty("Accept", "application/json");

            int responseCode = conn.getResponseCode();
            if (responseCode != HttpURLConnection.HTTP_OK) {
                throw new RuntimeException("HTTP response code: " + responseCode);
            }

            StringBuilder content = new StringBuilder();
            try (BufferedReader in = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                String line;
                while ((line = in.readLine()) != null) {
                    content.append(line);
                }
            }
            conn.disconnect();

            JsonNode root = objectMapper.readTree(content.toString());
            if (root.isArray()) {
                for (JsonNode node : root) {
                    try {
                        syncNode(node, job.getFeatureCode());
                        processed++;
                    } catch (Exception e) {
                        log.error("Failed to sync node in job {}: {}", job.getId(), node, e);
                        failed++;
                        saveDlqRecord(job.getId(), node, e);
                    }
                }
            } else {
                try {
                    syncNode(root, job.getFeatureCode());
                    processed++;
                } catch (Exception e) {
                    log.error("Failed to sync root node in job {}: {}", job.getId(), root, e);
                    failed++;
                    saveDlqRecord(job.getId(), root, e);
                }
            }

            job.setRecordsSuccess(processed);
            job.setRecordsFailed(failed);
            job.setRecordsTotal(processed + failed);
            job.setStatus(IntegrationSyncJob.SyncStatus.COMPLETED);
            job.setCompletedAt(LocalDateTime.now());
            log.info("Integration sync completed for job {}: processed={}, failed={}", job.getId(), processed, failed);

        } catch (Exception e) {
            log.error("Sync failed for job: {}", job.getId(), e);
            job.setStatus(IntegrationSyncJob.SyncStatus.FAILED);
            job.setErrorMessage(e.getMessage());
            job.setCompletedAt(LocalDateTime.now());
        }

        return syncJobRepository.save(job);
    }

    private void saveDlqRecord(UUID jobId, JsonNode node, Exception e) {
        try {
            IntegrationDlq dlq = IntegrationDlq.builder()
                    .syncJobId(jobId)
                    .sourceRecord(node.toString())
                    .errorType(e.getClass().getSimpleName())
                    .errorDetail(e.getMessage())
                    .resolved(false)
                    .build();
            dlqRepository.save(dlq);
        } catch (Exception ex) {
            log.error("Failed to write to DLQ for job {}: {}", jobId, ex.getMessage(), ex);
        }
    }

    private static URL validateUrl(String urlStr) {
        try {
            URI uri = URI.create(urlStr);
            String scheme = uri.getScheme();
            if (scheme == null) {
                throw new IllegalArgumentException("URL missing scheme: " + urlStr);
            }
            String lowerScheme = scheme.toLowerCase();
            if (!"http".equals(lowerScheme) && !"https".equals(lowerScheme)) {
                throw new IllegalArgumentException(
                        "URL scheme not allowed: " + scheme + " (only http and https are permitted)");
            }
            return uri.toURL();
        } catch (java.net.MalformedURLException e) {
            throw new IllegalArgumentException("Invalid URL format: " + urlStr, e);
        }
    }

    private void syncNode(JsonNode node, String featureCode) {
        String code = node.get("code").asText();
        String name = node.get("name").asText();
        String desc = node.has("description") ? node.get("description").asText() : "";
        String statusStr = node.has("status") ? node.get("status").asText() : "DRAFT";

        switch (featureCode) {
            case "F-227": // Berth
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.PORT, node);
                break;
            case "F-228": // Wharf
                saveLineObject(code, name, desc, statusStr, LineObject.ObjectType.WATERWAY, node);
                break;
            case "F-229": // Buoy
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.BUOY, node);
                break;
            case "F-230": // Danger Zone
                savePolygonObject(code, name, desc, statusStr, PolygonObject.ObjectType.RESTRICTED_AREA, node);
                break;
            case "F-231": // Transport Zone
                savePolygonObject(code, name, desc, statusStr, PolygonObject.ObjectType.WATER_ZONE, node);
                break;
            case "F-232": // Anchorage
                savePolygonObject(code, name, desc, statusStr, PolygonObject.ObjectType.ANCHORAGE, node);
                break;
            case "F-233": // Repair Facility
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-234": // Beacon Info
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.BEACON, node);
                break;
            case "F-235": // Buoy Signal
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.BUOY, node);
                break;
            case "F-236": // VTS
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.PORT, node);
                break;
            case "F-237": // VTS Operations
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.PORT, node);
                break;
            case "F-238": // Radar
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-239": // AIS
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-240": // CCTV
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-241": // SCADA
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-242": // VHF Info
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-243": // Transmission
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-244": // VTS Support
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-245": // Breakwater
                saveLineObject(code, name, desc, statusStr, LineObject.ObjectType.WATERWAY, node);
                break;
            case "F-246": // Cargo / Shipping Route
                saveLineObject(code, name, desc, statusStr, LineObject.ObjectType.SHIPPING_ROUTE, node);
                break;
            case "F-247": // TTDH
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-248": // Inmarsat
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-249": // Cospas-Sarsat
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-250": // LRIT
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-251": // Haiphong Center
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-252": // Port Status / Dry Port
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.PORT, node);
                break;
            case "F-253": // Electronic Chart
                savePolygonObject(code, name, desc, statusStr, PolygonObject.ObjectType.OTHER, node);
                break;
            case "F-254": // Vessel Inbound/Outbound
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-255": // Vessel Inland
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-256": // Vessel Foreign
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-257": // Vessel International
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-258": // Cargo Passenger Volume
                saveCargoAggregate(code, "CARGO_PASSENGER", node);
                break;
            case "F-259": // Vessel Traffic
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-260": // Cargo Domestic Volume
                saveCargoAggregate(code, "DOMESTIC", node);
                break;
            case "F-261": // Cargo Managed Area Volume
                saveCargoAggregate(code, "MANAGED_AREA", node);
                break;
            case "F-262": // Pilot Data
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-263": // Vessel Vietnamese Flagged
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-264": // Vessel Pilot Boat
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-265": // Dock Repair Capacity
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            case "F-266": // Berth Capacity
                savePortStatus(code, name, statusStr, node, "F-266");
                break;
            case "F-267": // Port Capacity
                savePortStatus(code, name, statusStr, node, "F-267");
                break;
            case "F-268": // Cargo Monthly Summary
                saveCargoAggregate(code, "MONTHLY", node);
                break;
            case "F-269": // Cargo Annual Summary
                saveCargoAggregate(code, "ANNUAL", node);
                break;
            case "F-270": // Transport Service Capacity
                savePointObject(code, name, desc, statusStr, PointObject.ObjectType.OTHER, node);
                break;
            default:
                throw new IllegalArgumentException("Unsupported feature code for sync: " + featureCode);
        }
    }

    private void savePointObject(String code, String name, String desc, String statusStr, PointObject.ObjectType objectType, JsonNode node) {
        if (!node.has("latitude") || !node.has("longitude")) {
            throw new IllegalArgumentException("Missing latitude or longitude for PointObject");
        }
        double lat = node.get("latitude").asDouble();
        double lon = node.get("longitude").asDouble();

        Optional<PointObject> existingOpt = pointRepository.findByCode(code);
        PointObject point = existingOpt.orElseGet(PointObject::new);
        point.setCode(code);
        point.setName(name);
        point.setDescription(desc);
        point.setLatitude(lat);
        point.setLongitude(lon);
        point.setObjectType(objectType);
        point.setStatus(PointObject.Status.valueOf(statusStr.toUpperCase()));
        point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
        pointRepository.save(point);
    }

    private void saveLineObject(String code, String name, String desc, String statusStr, LineObject.ObjectType objectType, JsonNode node) {
        if (!node.has("coordinates")) {
            throw new IllegalArgumentException("Missing coordinates for LineObject");
        }
        String coords = node.get("coordinates").asText();

        Optional<LineObject> existingOpt = lineRepository.findByCode(code);
        LineObject line = existingOpt.orElseGet(LineObject::new);
        line.setCode(code);
        line.setName(name);
        line.setDescription(desc);
        line.setCoordinates(coords);
        line.setObjectType(objectType);
        line.setStatus(LineObject.Status.valueOf(statusStr.toUpperCase()));
        line.setApprovalStatus(LineObject.ApprovalStatus.APPROVED);
        lineRepository.save(line);
    }

    private void savePolygonObject(String code, String name, String desc, String statusStr, PolygonObject.ObjectType objectType, JsonNode node) {
        if (!node.has("coordinates")) {
            throw new IllegalArgumentException("Missing coordinates for PolygonObject");
        }
        String coords = node.get("coordinates").asText();

        Optional<PolygonObject> existingOpt = polygonRepository.findByCode(code);
        PolygonObject polygon = existingOpt.orElseGet(PolygonObject::new);
        polygon.setCode(code);
        polygon.setName(name);
        polygon.setDescription(desc);
        polygon.setCoordinates(coords);
        polygon.setObjectType(objectType);
        polygon.setStatus(PolygonObject.Status.valueOf(statusStr.toUpperCase()));
        polygon.setApprovalStatus(PolygonObject.ApprovalStatus.APPROVED);
        polygonRepository.save(polygon);
    }

    private void saveCargoAggregate(String portCode, String periodType, JsonNode node) {
        java.time.LocalDate start = node.has("periodStart") ? java.time.LocalDate.parse(node.get("periodStart").asText()) : java.time.LocalDate.now().withDayOfMonth(1);
        java.time.LocalDate end = node.has("periodEnd") ? java.time.LocalDate.parse(node.get("periodEnd").asText()) : java.time.LocalDate.now();
        java.math.BigDecimal tons = node.has("totalTons") ? new java.math.BigDecimal(node.get("totalTons").asText()) : java.math.BigDecimal.ZERO;

        Page<CargoAggregate> page = cargoAggregateRepository.findByPortCodeAndPeriodType(portCode, periodType, PageRequest.of(0, 1));
        CargoAggregate aggregate = page.hasContent() ? page.getContent().get(0) : new CargoAggregate();
        aggregate.setPortCode(portCode);
        aggregate.setPeriodType(periodType);
        aggregate.setPeriodStart(start);
        aggregate.setPeriodEnd(end);
        aggregate.setTotalTons(tons);
        cargoAggregateRepository.save(aggregate);
    }

    private void savePortStatus(String portCode, String name, String statusStr, JsonNode node, String featureCode) {
        Optional<PortStatus> existing = portStatusRepository.findByPortCode(portCode);
        PortStatus portStatus = existing.orElseGet(PortStatus::new);
        portStatus.setPortCode(portCode);
        portStatus.setPortName(name != null && !name.isBlank() ? name : "PORT_" + portCode);
        portStatus.setOperationalStatus(statusStr != null ? statusStr.toUpperCase() : "ACTIVE");

        if (featureCode.equals("F-266")) {
            int berthCount = node.has("berthCount") ? node.get("berthCount").asInt() : 0;
            portStatus.setBerthCount(berthCount);
        } else if (featureCode.equals("F-267")) {
            double capacity = node.has("currentCapacityTons") ? node.get("currentCapacityTons").asDouble() : (node.has("capacity") ? node.get("capacity").asDouble() : 0.0);
            portStatus.setCurrentCapacityTons(capacity);
        }
        portStatusRepository.save(portStatus);
    }
}
