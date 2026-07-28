package com.hanghai.kchtg.dashboard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Per-entity KCHT counters (3 statuses), cached in Caffeine.
 * <p>
 * Cache keys: {entity}_pending, {entity}_operating, {entity}_suspended.
 * Total = pending + operating + suspended.
 * Atomic increment/decrement on CRUD — no DB recount.
 * </p>
 */
@Service
public class KchtAssetCountService {

    private static final Logger log = LoggerFactory.getLogger(KchtAssetCountService.class);

    static final String CACHE_NAME = "kchtCounts";

    private final JdbcTemplate jdbc;
    private final CacheManager cacheManager;

    public KchtAssetCountService(JdbcTemplate jdbc, CacheManager cacheManager) {
        this.jdbc = jdbc;
        this.cacheManager = cacheManager;
    }

    static final String[] KCHT_TABLES = {
            "ports", "berths", "piers", "dry_ports", "water_zones",
            "beacon_light", "buoy",
            "navigation_channel", "dike_revetment",
            "radar_station", "vts_system", "ship_repair_facility",
            "lighthouse_station", "buoy_station",
            "coastal_station_vts", "coastal_station_lrit",
            "coastal_station_inmarsat", "coastal_station_haiphong",
            "coastal_station_cospas_sarsat"
    };

    static final Map<String, String> LABELS = new LinkedHashMap<>();
    static {
        LABELS.put("ports", "Bến cảng");
        LABELS.put("berths", "Bến phao");
        LABELS.put("piers", "Cầu cảng");
        LABELS.put("dry_ports", "Cảng cạn");
        LABELS.put("water_zones", "Vùng nước");
        LABELS.put("beacon_light", "Đèn biển");
        LABELS.put("buoy", "Phao tiêu");
        LABELS.put("navigation_channel", "Luồng hàng hải");
        LABELS.put("dike_revetment", "Đê kè");
        LABELS.put("radar_station", "Trạm Radar");
        LABELS.put("vts_system", "Hệ thống VTS");
        LABELS.put("ship_repair_facility", "Cơ sở sửa chữa tàu");
        LABELS.put("lighthouse_station", "Trạm hải đăng");
        LABELS.put("buoy_station", "Trạm phao");
        LABELS.put("coastal_station_vts", "Đài VTS");
        LABELS.put("coastal_station_lrit", "Đài LRIT");
        LABELS.put("coastal_station_inmarsat", "Đài Inmarsat");
        LABELS.put("coastal_station_haiphong", "Đài Hải Phòng");
        LABELS.put("coastal_station_cospas_sarsat", "Đài Cospas-Sarsat");
    }

    // ─── init ────────────────────────────────────────────────

    @PostConstruct
    @Profile("!test")
    public void init() {
        log.info("Initializing KCHT per-entity cache (3 statuses × {} tables)...", KCHT_TABLES.length);
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) return;
        for (String table : KCHT_TABLES) {
            cache.put(key(table, "pending"), queryCount(table, "operational_status IS NULL AND deleted_at IS NULL"));
            cache.put(key(table, "operating"), queryCount(table, "operational_status = 1 AND deleted_at IS NULL"));
            cache.put(key(table, "suspended"), queryCount(table, "operational_status = 0 AND deleted_at IS NULL"));
        }
        log.info("KCHT cache ready — {} tables", KCHT_TABLES.length);
    }

    // ─── read ────────────────────────────────────────────────

    public long countTotal() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) return queryAll("deleted_at IS NULL");
        long sum = 0;
        for (String table : KCHT_TABLES) {
            for (String s : new String[]{"pending", "operating", "suspended"}) {
                Long v = cache.get(key(table, s), Long.class);
                if (v != null) sum += v;
            }
        }
        return sum;
    }

    public long countOperating() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) return queryAll("operational_status = 1 AND deleted_at IS NULL");
        long sum = 0;
        for (String table : KCHT_TABLES) {
            Long v = cache.get(key(table, "operating"), Long.class);
            if (v != null) sum += v;
        }
        return sum;
    }

    public List<Map<String, Object>> getInfraTableData() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        List<Map<String, Object>> rows = new ArrayList<>();
        int seq = 1;
        for (String table : KCHT_TABLES) {
            long pending = getCached(cache, table, "pending");
            long operating = getCached(cache, table, "operating");
            long suspended = getCached(cache, table, "suspended");
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("sequenceNo", seq++);
            row.put("type", LABELS.getOrDefault(table, table));
            row.put("total", pending + operating + suspended);
            row.put("pending", pending);
            row.put("operating", operating);
            row.put("suspended", suspended);
            rows.add(row);
        }
        return rows;
    }

    // ─── atomic CRUD hooks ───────────────────────────────────

    public void onEntityCreated(String table, Integer status) {
        adjust(table, statusToKey(status), 1);
    }

    public void onEntityDeleted(String table, Integer oldStatus) {
        adjust(table, statusToKey(oldStatus), -1);
    }

    public void onStatusChanged(String table, Integer oldStatus, Integer newStatus) {
        String oldKey = statusToKey(oldStatus);
        String newKey = statusToKey(newStatus);
        if (oldKey.equals(newKey)) return;
        adjust(table, oldKey, -1);
        adjust(table, newKey, 1);
    }

    private static String statusToKey(Integer status) {
        if (status == null) return "pending";
        return status == 1 ? "operating" : "suspended";
    }

    // ─── safety net ────────────────────────────────────────

    /** Full cache evict. Called by aspect as safety net on any KCHT mutation. */
    public void evictCache() {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache != null) cache.clear();
    }

    private void adjust(String table, String suffix, long delta) {
        Cache cache = cacheManager.getCache(CACHE_NAME);
        if (cache == null) return;
        String k = key(table, suffix);
        Long current = cache.get(k, Long.class);
        if (current == null) {
            cache.put(k, queryCount(table, suffixToWhere(suffix)));
            return;
        }
        cache.put(k, current + delta);
    }

    private long getCached(Cache cache, String table, String suffix) {
        if (cache == null) return queryCount(table, suffixToWhere(suffix));
        Long v = cache.get(key(table, suffix), Long.class);
        return v != null ? v : queryCount(table, suffixToWhere(suffix));
    }

    private static String key(String table, String suffix) {
        return table + "_" + suffix;
    }

    private static String suffixToWhere(String suffix) {
        return switch (suffix) {
            case "pending" -> "operational_status IS NULL AND deleted_at IS NULL";
            case "operating" -> "operational_status = 1 AND deleted_at IS NULL";
            case "suspended" -> "operational_status = 0 AND deleted_at IS NULL";
            default -> "deleted_at IS NULL";
        };
    }

    private long queryCount(String table, String where) {
        Long result = jdbc.queryForObject("SELECT COUNT(*) FROM " + table + " WHERE " + where, Long.class);
        return result != null ? result : 0;
    }

    private long queryAll(String where) {
        StringBuilder sql = new StringBuilder();
        for (int i = 0; i < KCHT_TABLES.length; i++) {
            if (i > 0) sql.append(" UNION ALL ");
            sql.append("SELECT COUNT(*) FROM ").append(KCHT_TABLES[i]).append(" WHERE ").append(where);
        }
        List<Long> results = jdbc.queryForList(sql.toString(), Long.class);
        return results.stream().mapToLong(Long::longValue).sum();
    }
}
