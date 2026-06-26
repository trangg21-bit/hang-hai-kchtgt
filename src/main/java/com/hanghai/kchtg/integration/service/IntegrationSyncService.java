package com.hanghai.kchtg.integration.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.dataconnection.entity.DataConnection;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.repository.DataConnectionRepository;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.Optional;
import java.util.UUID;

/**
 * Executes integration sync jobs to pull data from external connections,
 * parse the payload, and update Point/Line/Polygon GIS tables.
 */
@Service
@Transactional
public class IntegrationSyncService {

    private static final Logger log = LoggerFactory.getLogger(IntegrationSyncService.class);

    private final DataConnectionRepository connectionRepository;
    private final SyncLogRepository syncLogRepository;
    private final PointObjectRepository pointRepository;
    private final LineObjectRepository lineRepository;
    private final ObjectMapper objectMapper;

    public IntegrationSyncService(DataConnectionRepository connectionRepository,
                                  SyncLogRepository syncLogRepository,
                                  PointObjectRepository pointRepository,
                                  LineObjectRepository lineRepository,
                                  ObjectMapper objectMapper) {
        this.connectionRepository = connectionRepository;
        this.syncLogRepository = syncLogRepository;
        this.pointRepository = pointRepository;
        this.lineRepository = lineRepository;
        this.objectMapper = objectMapper;
    }

    public SyncLog executeSync(UUID connectionId) {
        DataConnection connection = connectionRepository.findById(connectionId)
                .orElseThrow(() -> new EntityNotFoundException("Connection not found: id=" + connectionId));

        SyncLog syncLog = SyncLog.createPending(connectionId);
        syncLog.setStatus(SyncLog.SyncStatus.RUNNING);
        syncLog = syncLogRepository.save(syncLog);

        String urlStr = connection.getEndpointUrl();
        if (urlStr == null || urlStr.isBlank()) {
            syncLog.fail("Endpoint URL is empty");
            return syncLogRepository.save(syncLog);
        }

        int processed = 0;
        int failed = 0;

        try {
            log.info("Starting integration sync for connection id={}, url={}", connectionId, urlStr);
            // SSRF mitigation: validate URL scheme - only allow http: and https:
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
                        syncNode(node);
                        processed++;
                    } catch (Exception e) {
                        log.error("Failed to sync node: {}", node, e);
                        failed++;
                    }
                }
            } else {
                try {
                    syncNode(root);
                    processed++;
                } catch (Exception e) {
                    log.error("Failed to sync root node: {}", root, e);
                    failed++;
                }
            }

            syncLog.complete(processed, failed);
            log.info("Integration sync completed: connection={}, processed={}, failed={}", connectionId, processed, failed);

        } catch (Exception e) {
            log.error("Sync failed for connection: {}", connectionId, e);
            syncLog.fail(e.getMessage());
        }

        return syncLogRepository.save(syncLog);
    }

    /**
     * Validates and converts a URL string into a {@link URL}, rejecting dangerous
     * schemes (file:, gopher:, ftp:, etc.) to prevent SSRF attacks.
     *
     * @param urlStr the raw URL string from the data connection
     * @return a validated {@link URL} ready for HTTP connection
     * @throws IllegalArgumentException if the URL is malformed or has a disallowed scheme
     */
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

    private void syncNode(JsonNode node) {
        String code = node.get("code").asText();
        String name = node.get("name").asText();
        String desc = node.has("description") ? node.get("description").asText() : "";
        String statusStr = node.has("status") ? node.get("status").asText() : "DRAFT";

        if (node.has("latitude") && node.has("longitude")) {
            double lat = node.get("latitude").asDouble();
            double lon = node.get("longitude").asDouble();
            String typeStr = node.has("objectType") ? node.get("objectType").asText() : "PORT";

            Optional<PointObject> existingOpt = pointRepository.findByCode(code);
            PointObject point = existingOpt.orElseGet(PointObject::new);
            point.setCode(code);
            point.setName(name);
            point.setDescription(desc);
            point.setLatitude(lat);
            point.setLongitude(lon);
            point.setObjectType(PointObject.ObjectType.valueOf(typeStr.toUpperCase()));
            point.setStatus(PointObject.Status.valueOf(statusStr.toUpperCase()));
            point.setApprovalStatus(PointObject.ApprovalStatus.APPROVED);
            pointRepository.save(point);
        } else if (node.has("coordinates")) {
            String coords = node.get("coordinates").asText();
            String typeStr = node.has("objectType") ? node.get("objectType").asText() : "CHANNEL";

            Optional<LineObject> existingOpt = lineRepository.findByCode(code);
            LineObject line = existingOpt.orElseGet(LineObject::new);
            line.setCode(code);
            line.setName(name);
            line.setDescription(desc);
            line.setCoordinates(coords);
            line.setObjectType(LineObject.ObjectType.valueOf(typeStr.toUpperCase()));
            line.setStatus(LineObject.Status.valueOf(statusStr.toUpperCase()));
            line.setApprovalStatus(LineObject.ApprovalStatus.APPROVED);
            lineRepository.save(line);
        } else {
            throw new IllegalArgumentException("Unsupported JSON node format for sync");
        }
    }
}
