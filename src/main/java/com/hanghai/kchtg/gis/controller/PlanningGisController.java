package com.hanghai.kchtg.gis.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gis/planning")
@RequiredArgsConstructor
@Slf4j
public class PlanningGisController {

    private final JdbcTemplate jdbcTemplate;

    @GetMapping("/features")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPlanningFeatures(
            @RequestParam(required = false) Double minLon,
            @RequestParam(required = false) Double minLat,
            @RequestParam(required = false) Double maxLon,
            @RequestParam(required = false) Double maxLat) {
        
        List<Map<String, Object>> result = new ArrayList<>();
        boolean hasBbox = minLon != null && minLat != null && maxLon != null && maxLat != null;
        String[] types = {"point", "line", "area"};
        
        for (String type : types) {
            String sql;
            Object[] args;
            if (hasBbox) {
                sql = "SELECT fid, name, provinceId, color, type, length, area, " +
                      "status, data_source, notes, agency, ST_AsGeoJSON(geom) as geojson, " +
                      "ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon " +
                      "FROM qhcb_all." + type + " " +
                      "WHERE geom && ST_MakeEnvelope(?, ?, ?, ?, 4326)";
                args = new Object[]{minLon, minLat, maxLon, maxLat};
            } else {
                sql = "SELECT fid, name, provinceId, color, type, length, area, " +
                      "status, data_source, notes, agency, ST_AsGeoJSON(geom) as geojson, " +
                      "ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon " +
                      "FROM qhcb_all." + type;
                args = new Object[]{};
            }
            
            try {
                List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("fid", rs.getLong("fid"));
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
            @RequestParam String status,
            @RequestParam Integer color) {
        log.info("Updating planning feature status: type={}, fid={}, status={}, color={}", type, fid, status, color);
        String sql = "UPDATE qhcb_all.\"" + type.toLowerCase() + "\" " +
                     "SET status = ?, color = ? " +
                     "WHERE fid = ?";
        jdbcTemplate.update(sql, status, color, fid);
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
            String sql = "SELECT fid, name, provinceId, color, type, length, area, " +
                         "status, data_source, notes, agency, ST_AsGeoJSON(geom) as geojson, " +
                         "ST_Y(ST_Centroid(geom)) as lat, ST_X(ST_Centroid(geom)) as lon " +
                         "FROM qhcb_all." + type + " " +
                         "WHERE ST_DWithin(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326), 0.001) " +
                         "ORDER BY ST_Distance(geom, ST_SetSRID(ST_MakePoint(?, ?), 4326)) ASC";
            try {
                List<Map<String, Object>> rows = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("fid", rs.getLong("fid"));
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
}
