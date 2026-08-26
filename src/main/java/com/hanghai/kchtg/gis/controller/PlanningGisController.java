package com.hanghai.kchtg.gis.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/gis/planning")
@RequiredArgsConstructor
@Slf4j
public class PlanningGisController {

    private static final Set<String> GEOMETRY_TYPES = Set.of("point", "line", "area");

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/features")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPlanningFeatures(
            @RequestParam(required = false) Double minLon,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLon,
            @RequestParam(required = false) Double maxLat,
            @RequestParam(defaultValue = "5") Integer zoom) {
        
        List<Map<String, Object>> result = new ArrayList<>();
        boolean hasBbox = minLon != null && minLat != null && maxLon != null && maxLat != null;
        String[] types = {"point", "line", "area"};
        double simplifyTolerance = getSimplifyTolerance(zoom);

        for (String type : types) {
            String sql;
            Object[] args;
            if (hasBbox) {
                sql = "SELECT schema_name, table_name, fid, name, province, color, type, length, area, " +
                      "status, data_source, notes, agency, " +
                      "ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_CurveToLine(geom), ?)) as geojson, " +
                      "ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon " +
                      "FROM qhcb_all." + type + " " +
                      "WHERE geom && ST_MakeEnvelope(?, ?, ?, ?, 4326)";
                args = new Object[]{simplifyTolerance, minLon, minLat, maxLon, maxLat};
            } else {
                sql = "SELECT schema_name, table_name, fid, name, province, color, type, length, area, " +
                      "status, data_source, notes, agency, " +
                      "ST_AsGeoJSON(ST_SimplifyPreserveTopology(ST_CurveToLine(geom), ?)) as geojson, " +
                      "ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon " +
                      "FROM qhcb_all." + type;
                args = new Object[]{simplifyTolerance};
            }
            
            try {
                List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    long fid = rs.getLong("fid");
                    String schemaName = rs.getString("schema_name");
                    String tableName = rs.getString("table_name");
                    map.put("fid", fid);
                    map.put("schemaName", schemaName);
                    map.put("tableName", tableName);
                    map.put("featureKey", type + ":" + schemaName + ":" + tableName + ":" + fid);
                    map.put("geomType", type.toUpperCase());
                    map.put("name", rs.getString("name"));
                    map.put("province", rs.getString("province"));
                    map.put("color", rs.getInt("color"));
                    map.put("type", rs.getString("type"));
                    
                    double length = rs.getDouble("length");
                    map.put("length", rs.wasNull() ? null : length);
                    
                    double area = rs.getDouble("area");
                    map.put("area", rs.wasNull() ? null : area);
                    
                    map.put("status", rs.getString("status"));
                    map.put("source", rs.getString("data_source"));
                    map.put("notes", rs.getString("notes"));
                    map.put("agency", rs.getString("agency"));
                    map.put("geojson", rs.getString("geojson"));
                    map.put("lat", rs.getDouble("lat"));
                    map.put("lon", rs.getDouble("lon"));
                    return map;
                }, args);
                
                result.addAll(rows);
            } catch (Exception e) {
                log.error("Failed to query planning features for type: " + type, e);
            }
        }
        
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PutMapping("/features/{type}/{fid}/status")
    public ResponseEntity<ApiResponse<Void>> updateFeatureStatus(
            @PathVariable String type,
            @PathVariable Long fid,
            @RequestParam String schemaName,
            @RequestParam String tableName,
            @RequestParam String status,
            @RequestParam Integer color) {
        String normalizedType = type.toLowerCase();
        if (!GEOMETRY_TYPES.contains(normalizedType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Loại hình học quy hoạch không hợp lệ");
        }

        log.info("Updating planning feature status: type={}, schema={}, table={}, fid={}, status={}, color={}",
                normalizedType, schemaName, tableName, fid, status, color);
        String sql = "UPDATE qhcb_all." + normalizedType + " " +
                     "SET status = ?, color = ? " +
                     "WHERE schema_name = ? AND table_name = ? AND fid = ?";
        int updatedRows = jdbcTemplate.update(sql, status, color, schemaName, tableName, fid);
        if (updatedRows == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy đối tượng quy hoạch cần cập nhật");
        }
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái quy hoạch thành công", null));
    }

    @GetMapping("/features/at-point")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFeaturesAtPoint(
            @RequestParam Double lat,
            @RequestParam Double lon) {
        log.info("Querying planning features at point: lat={}, lon={}", lat, lon);
        List<Map<String, Object>> result = new ArrayList<>();
        String[] types = {"point", "line", "area"};

        for (String type : types) {
            String sql = "SELECT schema_name, table_name, fid, name, province, color, type, length, area, " +
                         "status, data_source, notes, agency, ST_AsGeoJSON(ST_CurveToLine(geom)) as geojson, " +
                         "ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon " +
                         "FROM qhcb_all." + type + " " +
                         "WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326), 0.001) " +
                         "ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) ASC";
            try {
                List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    long fid = rs.getLong("fid");
                    String schemaName = rs.getString("schema_name");
                    String tableName = rs.getString("table_name");
                    map.put("fid", fid);
                    map.put("schemaName", schemaName);
                    map.put("tableName", tableName);
                    map.put("featureKey", type + ":" + schemaName + ":" + tableName + ":" + fid);
                    map.put("geomType", type.toUpperCase());
                    map.put("name", rs.getString("name"));
                    map.put("province", rs.getString("province"));
                    map.put("color", rs.getInt("color"));
                    map.put("type", rs.getString("type"));
                    
                    double length = rs.getDouble("length");
                    map.put("length", rs.wasNull() ? null : length);
                    
                    double area = rs.getDouble("area");
                    map.put("area", rs.wasNull() ? null : area);
                    
                    map.put("status", rs.getString("status"));
                    map.put("source", rs.getString("data_source"));
                    map.put("notes", rs.getString("notes"));
                    map.put("agency", rs.getString("agency"));
                    map.put("geojson", rs.getString("geojson"));
                    map.put("lat", rs.getDouble("lat"));
                    map.put("lon", rs.getDouble("lon"));
                    return map;
                }, lon, lat, lon, lat);
                result.addAll(rows);
            } catch (Exception e) {
                log.error("Failed to query features at point for type: " + type, e);
            }
        }
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    private double getSimplifyTolerance(Integer zoom) {
        int resolvedZoom = zoom == null ? 5 : zoom;
        if (resolvedZoom <= 6) return 0.01;
        if (resolvedZoom <= 9) return 0.005;
        if (resolvedZoom <= 12) return 0.001;
        return 0.0001;
    }
}
