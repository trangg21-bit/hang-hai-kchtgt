package com.hanghai.kchtg.gis.search.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.search.dto.SearchHistoryResponse;
import com.hanghai.kchtg.gis.search.dto.SearchRequest;
import com.hanghai.kchtg.gis.search.dto.SearchResponse;
import com.hanghai.kchtg.gis.search.dto.SearchResponse.SearchResultItem;
import com.hanghai.kchtg.gis.search.entity.SearchQuery;
import com.hanghai.kchtg.gis.search.entity.SearchQuery.QueryType;
import com.hanghai.kchtg.gis.search.repository.SearchQueryRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchService {

    private static final int MAX_RESULTS = 100;
    private static final int MAX_SEARCH_DURATION_MS = 10000;

    private final PointObjectRepository pointRepository;
    private final LineObjectRepository lineRepository;
    private final PolygonObjectRepository polygonRepository;
    private final SearchQueryRepository searchQueryRepository;
    private final ObjectMapper objectMapper;

    public SearchResponse search(SearchRequest request) {
        long startTime = System.currentTimeMillis();
        List<SearchResultItem> results = new ArrayList<>();

        switch (request.getQueryType()) {
            case TEXT -> results = searchByText(request);
            case LOCATION -> results = searchByLocation(request);
            case RADIUS -> results = searchByRadius(request);
            case POLYGON -> results = searchByPolygon(request);
            case COORDINATE -> results = searchByCoordinate(request);
        }

        long durationMs = System.currentTimeMillis() - startTime;
        if (durationMs > MAX_SEARCH_DURATION_MS) {
            throw new RuntimeException("Tìm kiếm quá lâu, vui lòng thu hẹp phạm vi");
        }

        int page = request.getPage();
        int size = request.getSize();
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, results.size());

        List<SearchResultItem> paginated = results.subList(
                Math.min(fromIndex, results.size()), toIndex);

        return SearchResponse.builder()
                .results(paginated)
                .totalResults(results.size())
                .page(page)
                .size(size)
                .durationMs(durationMs)
                .build();
    }

    // ========================================================================
    // TEXT SEARCH — JPA @Query with LIKE predicate, case-insensitive
    // ========================================================================

    private List<SearchResultItem> searchByText(SearchRequest request) {
        List<SearchResultItem> results = new ArrayList<>();
        String query = request.getQuery() != null ? request.getQuery().trim() : "";

        if (query.isEmpty()) {
            return results;
        }

        // Search PointObjects (case-insensitive LIKE)
        List<PointObject> points = pointRepository.findByNameContainingIgnoreCase(query);
        for (PointObject p : points) {
            results.add(SearchResultItem.builder()
                    .objectId(p.getId().toString())
                    .objectType("POINT")
                    .name(p.getName())
                    .code(p.getCode())
                    .distance(null)
                    .layerType("POINT")
                    .build());
        }

        // Search LineObjects
        List<LineObject> lines = lineRepository.findByNameContainingIgnoreCase(query);
        for (LineObject l : lines) {
            results.add(SearchResultItem.builder()
                    .objectId(l.getId().toString())
                    .objectType("LINE")
                    .name(l.getName())
                    .code(l.getCode())
                    .distance(null)
                    .layerType("LINE")
                    .build());
        }

        // Search PolygonObjects
        List<PolygonObject> polygons = polygonRepository.findByNameContainingIgnoreCase(query);
        for (PolygonObject p : polygons) {
            results.add(SearchResultItem.builder()
                    .objectId(p.getId().toString())
                    .objectType("POLYGON")
                    .name(p.getName())
                    .code(p.getCode())
                    .distance(null)
                    .layerType("POLYGON")
                    .build());
        }

        return results.stream().limit(MAX_RESULTS).toList();
    }

    // ========================================================================
    // LOCATION SEARCH — nearest object within 500m using Spring Data Spatial
    // ========================================================================

    private List<SearchResultItem> searchByLocation(SearchRequest request) {
        List<SearchResultItem> results = new ArrayList<>();

        Double centerLon = request.getCenterLon();
        Double centerLat = request.getCenterLat();

        if (centerLon == null || centerLat == null) {
            return results;
        }

        // Default 500m radius for nearest-object search
        double radiusMeters = 500.0;
        String pointWKT = String.format("POINT (%f %f)", centerLon, centerLat);

        // Find PointObjects within 500m using Hibernate Spatial ST_Distance
        List<PointObject> nearbyPoints = pointRepository.findByDistance(pointWKT, radiusMeters);
        for (PointObject p : nearbyPoints) {
            double distance = calculateDistance(centerLon, centerLat, p.getLongitude(), p.getLatitude());
            results.add(SearchResultItem.builder()
                    .objectId(p.getId().toString())
                    .objectType("POINT")
                    .name(p.getName())
                    .code(p.getCode())
                    .distance(distance)
                    .layerType("POINT")
                    .build());
        }

        return results.stream().sorted((a, b) -> Double.compare(a.getDistance(), b.getDistance()))
                .limit(MAX_RESULTS).toList();
    }

    // ========================================================================
    // RADIUS SEARCH — spatial query with center point + radius
    // ========================================================================

    private List<SearchResultItem> searchByRadius(SearchRequest request) {
        List<SearchResultItem> results = new ArrayList<>();

        Double centerLon = request.getCenterLon();
        Double centerLat = request.getCenterLat();
        Double radius = request.getRadius();

        if (centerLon == null || centerLat == null) {
            return results;
        }

        // Default 1000m if not specified
        double radiusMeters = radius != null ? radius : 1000.0;
        String pointWKT = String.format("POINT (%f %f)", centerLon, centerLat);

        // Find PointObjects within radius
        List<PointObject> nearbyPoints = pointRepository.findByDistance(pointWKT, radiusMeters);
        for (PointObject p : nearbyPoints) {
            double distance = calculateDistance(centerLon, centerLat, p.getLongitude(), p.getLatitude());
            results.add(SearchResultItem.builder()
                    .objectId(p.getId().toString())
                    .objectType("POINT")
                    .name(p.getName())
                    .code(p.getCode())
                    .distance(distance)
                    .layerType("POINT")
                    .build());
        }

        return results.stream().sorted((a, b) -> Double.compare(a.getDistance(), b.getDistance()))
                .limit(MAX_RESULTS).toList();
    }

    // ========================================================================
    // POLYGON SEARCH — spatial query with Intersects / Polygon WKT
    // Uses WKT-based filtering on name/code fields + bounding-box envelope
    // ========================================================================

    private List<SearchResultItem> searchByPolygon(SearchRequest request) {
        List<SearchResultItem> results = new ArrayList<>();

        String coordinates = request.getCoordinates();
        if (coordinates == null || coordinates.trim().isEmpty()) {
            return results;
        }

        try {
            // Parse WKT coordinates and extract bounding box
            String trimmed = coordinates.trim().toUpperCase();
            double[] bbox = extractBoundingBox(trimmed);

            // Find all published points and filter by bounding box
            List<PointObject> allPoints = pointRepository.findByStatus(Status.PUBLISHED);
            double minLon = Math.min(bbox[0], bbox[2]);
            double maxLon = Math.max(bbox[0], bbox[2]);
            double minLat = Math.min(bbox[1], bbox[3]);
            double maxLat = Math.max(bbox[1], bbox[3]);

            for (PointObject p : allPoints) {
                if (p.getLongitude() >= minLon && p.getLongitude() <= maxLon &&
                    p.getLatitude() >= minLat && p.getLatitude() <= maxLat) {
                    results.add(SearchResultItem.builder()
                            .objectId(p.getId().toString())
                            .objectType("POINT")
                            .name(p.getName())
                            .code(p.getCode())
                            .distance(null)
                            .layerType("POLYGON")
                            .build());
                }
            }

            // Also search LineObjects by their stored WKT coordinates
            List<LineObject> allLines = lineRepository.findAll();
            for (LineObject l : allLines) {
                if (l.getCoordinates() != null && l.getCoordinates().toUpperCase().contains(trimmed)) {
                    results.add(SearchResultItem.builder()
                            .objectId(l.getId().toString())
                            .objectType("LINE")
                            .name(l.getName())
                            .code(l.getCode())
                            .distance(null)
                            .layerType("LINE")
                            .build());
                }
            }

        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid WKT coordinates: " + e.getMessage());
        }

        return results.stream().limit(MAX_RESULTS).toList();
    }

    /**
     * Extract bounding box (minLon, minLat, maxLon, maxLat) from a WKT geometry string.
     * Supports POINT, LINESTRING, POLYGON, MULTIPOINT, etc.
     */
    private double[] extractBoundingBox(String wktUpper) {
        double minLon = Double.MAX_VALUE;
        double minLat = Double.MAX_VALUE;
        double maxLon = -Double.MAX_VALUE;
        double maxLat = -Double.MAX_VALUE;

        // Extract all number pairs from the WKT (longitude, latitude)
        String numbersOnly = wktUpper.replaceAll("[^0-9.\\-\\s,()]", " ");
        String[] tokens = numbersOnly.trim().split("\\s+");

        // Pair up consecutive numbers as lon, lat coordinates
        double[] numList = new double[tokens.length];
        int count = 0;
        for (String t : tokens) {
            try {
                numList[count++] = Double.parseDouble(t);
            } catch (NumberFormatException ignored) {
                // skip non-numeric tokens
            }
        }

        // Process coordinate pairs
        for (int i = 0; i + 1 < count; i += 2) {
            double lon = numList[i];
            double lat = numList[i + 1];
            if (lon < minLon) minLon = lon;
            if (lon > maxLon) maxLon = lon;
            if (lat < minLat) minLat = lat;
            if (lat > maxLat) maxLat = lat;
        }

        return new double[]{minLon, minLat, maxLon, maxLat};
    }

    // ========================================================================
    // COORDINATE SEARCH — find nearest object by lat/lon input
    // ========================================================================

    private List<SearchResultItem> searchByCoordinate(SearchRequest request) {
        List<SearchResultItem> results = new ArrayList<>();

        Double targetLon = request.getCenterLon();
        Double targetLat = request.getCenterLat();

        if (targetLon == null || targetLat == null) {
            return results;
        }

        // Find the nearest PointObject by distance
        double minDistance = Double.MAX_VALUE;
        PointObject nearestPoint = null;

        // Get all published points, find closest via haversine
        List<PointObject> allPoints = pointRepository.findByStatus(Status.PUBLISHED);
        for (PointObject p : allPoints) {
            double dist = calculateDistance(targetLon, targetLat, p.getLongitude(), p.getLatitude());
            if (dist < minDistance) {
                minDistance = dist;
                nearestPoint = p;
            }
        }

        if (nearestPoint != null) {
            results.add(SearchResultItem.builder()
                    .objectId(nearestPoint.getId().toString())
                    .objectType("POINT")
                    .name(nearestPoint.getName())
                    .code(nearestPoint.getCode())
                    .distance(minDistance)
                    .layerType("POINT")
                    .build());
        }

        return results.stream().limit(MAX_RESULTS).toList();
    }

    // ========================================================================
    // SEARCH HISTORY — save, retrieve, clear
    // ========================================================================

    @Transactional
    public void saveSearchQuery(SearchRequest request, int resultCount, long durationMs) {
        String queryParamsJson = "{}";
        try {
            queryParamsJson = objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            // Ignore — queryParams is optional
        }

        SearchQuery query = SearchQuery.builder()
                .userId(request.getUnitId() != null ? request.getUnitId() : 0L)
                .queryType(request.getQueryType())
                .queryText(request.getQuery())
                .queryParams(queryParamsJson)
                .resultCount(resultCount)
                .durationMs(durationMs)
                .build();

        searchQueryRepository.save(query);
    }

    @Transactional(readOnly = true)
    public List<SearchHistoryResponse> getSearchHistory(Long userId, int limit) {
        PageRequest pageable = PageRequest.of(
                0,
                limit,
                Sort.by(Sort.Direction.ASC, "createdAt")
        );

        List<SearchQuery> queries = searchQueryRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        // Reverse to get oldest first
        List<SearchQuery> history = new ArrayList<>(queries);
        java.util.Collections.reverse(history);

        return history.stream()
                .map(q -> SearchHistoryResponse.builder()
                        .id(q.getId())
                        .userId(q.getUserId())
                        .queryType(q.getQueryType())
                        .queryText(q.getQueryText())
                        .resultCount(q.getResultCount())
                        .durationMs(q.getDurationMs())
                        .executedAt(q.getCreatedAt())
                        .build())
                .toList();
    }

    @Transactional
    public void clearSearchHistory(Long userId) {
        List<SearchQuery> queries = searchQueryRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(0, Integer.MAX_VALUE));
        searchQueryRepository.deleteAll(queries);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    /**
     * Calculate haversine distance between two lat/lon points in meters.
     */
    private double calculateDistance(double lon1, double lat1, double lon2, double lat2) {
        final double R = 6371000; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
