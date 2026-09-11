package com.hanghai.kchtg.dashboard.service;

import com.hanghai.kchtg.dashboard.entity.DashboardSnapshot;
import com.hanghai.kchtg.dashboard.entity.DashboardSnapshotDetail;
import com.hanghai.kchtg.dashboard.repository.DashboardSnapshotRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class KchtAssetCountService {

    private static final Logger log = LoggerFactory.getLogger(KchtAssetCountService.class);

    public static final String CACHE_NAME = "kchtCounts";

    private final JdbcTemplate jdbc;
    private final DashboardSnapshotRepository snapshotRepo;

    public KchtAssetCountService(JdbcTemplate jdbc, DashboardSnapshotRepository snapshotRepo) {
        this.jdbc = jdbc;
        this.snapshotRepo = snapshotRepo;
    }

    public static final String[] KCHT_TABLES = {
            "ports", "berths", "piers", "dry_ports",
            "anchorages", "transfer_areas", "storm_shelter_areas", "buoy_berths",
            "ship_repair_facility", "navigation_channel", "beacon_light", "buoy",
            "buoy_station", "dike_revetment", "vts_system", "vts_operation_center",
            "radar_station", "ais_system", "cctv", "scada",
            "transmission", "vts_assist", "dai_ttdh", "vhf",
            "coastal_station_inmarsat", "coastal_station_lrit",
            "coastal_station_cospas_sarsat", "coastal_station_haiphong"
    };

    static final Map<String, String> LABELS = new LinkedHashMap<>();
    static {
        LABELS.put("ports", "Cảng biển");
        LABELS.put("berths", "Bến cảng");
        LABELS.put("piers", "Cầu cảng");
        LABELS.put("dry_ports", "Cảng cạn");
        LABELS.put("anchorages", "Khu neo đậu");
        LABELS.put("transfer_areas", "Khu chuyển tải");
        LABELS.put("storm_shelter_areas", "Khu tránh, trú bão");
        LABELS.put("buoy_berths", "Bến phao");
        LABELS.put("ship_repair_facility", "Cơ sở sửa chữa, đóng tàu");
        LABELS.put("navigation_channel", "Luồng hàng hải");
        LABELS.put("beacon_light", "Đèn biển và nhà trạm gắn với Đèn biển");
        LABELS.put("buoy", "Phao, tiêu");
        LABELS.put("buoy_station", "Nhà trạm quản lý vận hành phao tiêu");
        LABELS.put("dike_revetment", "Đê chắn sóng, đê chắn cát, kè");
        LABELS.put("vts_system", "Hệ thống VTS");
        LABELS.put("vts_operation_center", "Trung tâm điều hành VTS");
        LABELS.put("radar_station", "Trạm Radar");
        LABELS.put("ais_system", "Hệ thống trạm bờ AIS");
        LABELS.put("cctv", "Hệ thống camera giám sát CCTV");
        LABELS.put("scada", "Hệ thống điều khiển SCADA");
        LABELS.put("transmission", "Hệ thống truyền dẫn");
        LABELS.put("vts_assist", "Hệ thống phụ trợ VTS");
        LABELS.put("dai_ttdh", "Đài Thông tin duyên hải");
        LABELS.put("vhf", "Hệ thống VHF");
        LABELS.put("coastal_station_inmarsat", "Đài Thông tin vệ tinh Inmarsat");
        LABELS.put("coastal_station_lrit", "Đài Nhận dạng và truy theo tầm xa (LRIT)");
        LABELS.put("coastal_station_cospas_sarsat", "Đài Thông tin vệ tinh Cospas-Sarsat");
        LABELS.put("coastal_station_haiphong", "Đài TTXL thông tin hàng hải Hà Nội / Hải Phòng");
    }

    private final Map<String, String> schemaCols = new ConcurrentHashMap<>();

    private Integer getWaterZoneType(String tableItem) {
        return switch (tableItem) {
            case "water_zones_anchorage" -> 1;
            case "water_zones_pilot_boarding" -> 2;
            case "water_zones_turning_basin" -> 3;
            case "water_zones_mooring_buoy" -> 4;
            case "water_zones_transshipment" -> 5;
            case "water_zones_storm_shelter" -> 6;
            default -> null;
        };
    }

    @PostConstruct
    public void initSchemaMap() {
        try {
            for (String tableItem : KCHT_TABLES) {
                String table = physicalTable(tableItem);
                List<String> cols = jdbc.queryForList("SELECT column_name FROM information_schema.columns WHERE table_name = ?", String.class, table);
                String created = cols.contains("created_at") ? "created_at" : (cols.contains("created_date") ? "created_date" : null);
                String deleted = cols.contains("deleted_at") ? "deleted_at" : (cols.contains("is_deleted") ? "is_deleted" : null);
                String opStatus = cols.contains("operational_status") ? "operational_status" :
                                  (cols.contains("condition_status") ? "condition_status" :
                                  (cols.contains("status") ? "status" : null));
                String approvalStatus = cols.contains("approval_status") ? "approval_status" : null;
                String provCol = cols.contains("province_id") ? "province_id" :
                                 (cols.contains("province_code") ? "province_code" :
                                 (cols.contains("province_name") ? "province_name" :
                                 (cols.contains("province") ? "province" : null)));

                schemaCols.put(tableItem + "_created", created != null ? created : "");
                schemaCols.put(tableItem + "_deleted", deleted != null ? deleted : "");
                schemaCols.put(tableItem + "_opStatus", opStatus != null ? opStatus : "");
                schemaCols.put(tableItem + "_approvalStatus", approvalStatus != null ? approvalStatus : "");
                schemaCols.put(tableItem + "_prov", provCol != null ? provCol : "");
            }
        } catch (Exception e) {
            log.warn("Failed to initialize schema columns map", e);
        }
    }

    @Transactional(readOnly = true)
    public Optional<DashboardSnapshot> getSnapshot(Integer year, Integer provinceId) {
        int currentYear = LocalDate.now().getYear();
        if (year != null && year < currentYear) {
            if (provinceId == null) {
                return snapshotRepo.findByYearNational(year);
            } else {
                return snapshotRepo.findByYearAndProvince(year, provinceId);
            }
        }
        return Optional.empty();
    }

    @Cacheable(value = CACHE_NAME, key = "#root.methodName + '_' + #year + '_' + #provinceId")
    public long countTotal(Integer year, Integer provinceId) {
        Optional<DashboardSnapshot> snap = getSnapshot(year, provinceId);
        if (snap.isPresent()) return snap.get().getTotalCount();
        return getInfraTableData(year, provinceId).stream()
                .map(row -> row.get("total"))
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .mapToLong(Number::longValue)
                .sum();
    }

    @Cacheable(value = CACHE_NAME, key = "#root.methodName + '_' + #year + '_' + #provinceId")
    public long countOperating(Integer year, Integer provinceId) {
        Optional<DashboardSnapshot> snap = getSnapshot(year, provinceId);
        if (snap.isPresent()) return snap.get().getOperatingCount();
        return getInfraTableData(year, provinceId).stream()
                .map(row -> row.get("operating"))
                .filter(Number.class::isInstance)
                .map(Number.class::cast)
                .mapToLong(Number::longValue)
                .sum();
    }

    /**
     * Counts approval states across all KCHT entity tables.
     *
     * <p>There are two ordinal conventions in the current schema:</p>
     * <ul>
     *     <li>Basic approval: PENDING=0, APPROVED=1, REJECTED=2.</li>
     *     <li>Workflow approval: proposed/pending=0, under-review/L1=1,
     *         approved/L2=2, rejected=3.</li>
     * </ul>
     *
     * <p>The result is cached together with the other KCHT dashboard counters and
     * is evicted by the existing KCHT mutation hooks.</p>
     */
    @Cacheable(value = CACHE_NAME, key = "#root.methodName + '_' + #year + '_' + #provinceId")
    public Map<String, Long> getApprovalStats(Integer year, Integer provinceId) {
        return queryApprovalStats(year, provinceId, Arrays.asList(KCHT_TABLES));
    }

    /**
     * Trả thống kê phê duyệt theo đúng loại KCHT được chọn.
     * Mã loại là tên bảng logic trong {@link #KCHT_TABLES}, không dùng nhãn hiển thị.
     */
    @Cacheable(value = CACHE_NAME, key = "#root.methodName + '_' + #year + '_' + #provinceId + '_' + #infraType")
    public Map<String, Long> getApprovalStats(Integer year, Integer provinceId, String infraType) {
        return queryApprovalStats(year, provinceId, resolveTableItems(infraType));
    }

    private Map<String, Long> queryApprovalStats(
            Integer year,
            Integer provinceId,
            Collection<String> tableItems
    ) {
        StringBuilder sql = new StringBuilder();
        List<Object> args = new ArrayList<>();
        List<String> selectedTables = new ArrayList<>(tableItems);

        for (int i = 0; i < selectedTables.size(); i++) {
            String tableItem = selectedTables.get(i);
            String approvalCol = schemaCols.getOrDefault(tableItem + "_approvalStatus", "");
            String deletedCol = schemaCols.getOrDefault(tableItem + "_deleted", "");
            String createdCol = schemaCols.getOrDefault(tableItem + "_created", "");
            String provCol = schemaCols.getOrDefault(tableItem + "_prov", "");

            sql.append("SELECT '").append(tableItem).append("' AS tbl_name, ");
            if (approvalCol.isEmpty()) {
                sql.append("0 AS approval_pending_cnt, 0 AS approval_approved_cnt, 0 AS approval_rejected_cnt ");
            } else {
                String normalizedStatus = "UPPER(CAST(" + approvalCol + " AS VARCHAR))";
                sql.append("SUM(CASE WHEN ").append(approvalCol).append(" IS NULL OR ")
                        .append(normalizedStatus).append(" IN ('0', '1', '2', '3', 'DRAFT', 'PROPOSED', 'PENDING', 'PENDING_APPROVAL', 'UNDER_REVIEW', 'APPROVED_L1', 'APPROVED_LEVEL1') THEN 1 ELSE 0 END) AS approval_pending_cnt, ");
                sql.append("SUM(CASE WHEN ").append(normalizedStatus).append(" IN ('4', '5', 'APPROVED', 'APPROVED_L2', 'APPROVED_LEVEL2', 'PUBLISHED') THEN 1 ELSE 0 END) AS approval_approved_cnt, ");
                sql.append("SUM(CASE WHEN ").append(normalizedStatus).append(" IN ('6', '8', '9', 'REJECTED', 'REJECTED_L1', 'REJECTED_LEVEL1', 'REJECTED_L2', 'REJECTED_LEVEL2') THEN 1 ELSE 0 END) AS approval_rejected_cnt ");
            }

            appendScopeFilters(sql, args, tableItem, deletedCol, createdCol, provCol, year, provinceId);

            if (i < selectedTables.size() - 1) {
                sql.append(" UNION ALL ");
            }
        }

        long pending = 0;
        long approved = 0;
        long rejected = 0;
        if (!selectedTables.isEmpty()) {
            for (Map<String, Object> row : jdbc.queryForList(sql.toString(), args.toArray())) {
                pending += numberValue(row.get("approval_pending_cnt"));
                approved += numberValue(row.get("approval_approved_cnt"));
                rejected += numberValue(row.get("approval_rejected_cnt"));
            }
        }

        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", pending + approved + rejected);
        stats.put("approved", approved);
        stats.put("pending", pending);
        stats.put("rejected", rejected);
        return stats;
    }

    @Cacheable(value = CACHE_NAME, key = "#root.methodName + '_' + #year + '_' + #provinceId")
    public List<Map<String, Object>> getInfraTableData(Integer year, Integer provinceId) {
        Optional<DashboardSnapshot> snap = getSnapshot(year, provinceId);
        if (snap.isPresent()) {
            List<Map<String, Object>> rows = new ArrayList<>();
            List<DashboardSnapshotDetail> details = snap.get().getDetails();
            details.sort(Comparator.comparing(DashboardSnapshotDetail::getSequenceNo));
            for (DashboardSnapshotDetail d : details) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("sequenceNo", d.getSequenceNo());
                row.put("code", codeForLabel(d.getKchtType()));
                row.put("type", d.getKchtType());
                row.put("total", d.getTotalCount());
                row.put("pending", d.getPendingCount());
                row.put("operating", d.getOperatingCount());
                row.put("suspended", d.getSuspendedCount());
                rows.add(row);
            }
            return rows;
        }

        return getInfraTableDataFromDb(year, provinceId);
    }

    /**
     * Lọc breakdown theo mã loại KCHT và cache riêng theo đủ ba điều kiện lọc.
     */
    @Cacheable(value = CACHE_NAME, key = "#root.methodName + '_' + #year + '_' + #provinceId + '_' + #infraType")
    public List<Map<String, Object>> getInfraTableData(Integer year, Integer provinceId, String infraType) {
        Set<String> selectedTables = new HashSet<>(resolveTableItems(infraType));
        if (selectedTables.isEmpty()) {
            return List.of();
        }
        return getInfraTableData(year, provinceId).stream()
                .filter(row -> selectedTables.contains(String.valueOf(row.get("code"))))
                .toList();
    }

    private List<Map<String, Object>> getInfraTableDataFromDb(Integer year, Integer provinceId) {
        List<Map<String, Object>> rows = new ArrayList<>();
        StringBuilder sql = new StringBuilder();
        List<Object> args = new ArrayList<>();

        for (int i = 0; i < KCHT_TABLES.length; i++) {
            String tableItem = KCHT_TABLES[i];
            String deletedCol = schemaCols.getOrDefault(tableItem + "_deleted", "");
            String opCol = schemaCols.getOrDefault(tableItem + "_opStatus", "");
            String createdCol = schemaCols.getOrDefault(tableItem + "_created", "");
            String provCol = schemaCols.getOrDefault(tableItem + "_prov", "");

            sql.append("SELECT '").append(tableItem).append("' as tbl_name, ");

            if (!opCol.isEmpty()) {
                sql.append("SUM(CASE WHEN ").append(opCol).append(" IS NULL OR UPPER(CAST(").append(opCol).append(" AS VARCHAR)) IN ('2', 'PENDING', 'INACTIVE') THEN 1 ELSE 0 END) as pending_cnt, ");
                sql.append("SUM(CASE WHEN UPPER(CAST(").append(opCol).append(" AS VARCHAR)) IN ('1', 'PUBLISHED', 'OPERATIONAL', 'ACTIVE') THEN 1 ELSE 0 END) as operating_cnt, ");
                sql.append("SUM(CASE WHEN UPPER(CAST(").append(opCol).append(" AS VARCHAR)) = '0' THEN 1 ELSE 0 END) as suspended_cnt ");
            } else {
                sql.append("COUNT(*) as pending_cnt, 0 as operating_cnt, 0 as suspended_cnt ");
            }

            appendScopeFilters(sql, args, tableItem, deletedCol, createdCol, provCol, year, provinceId);

            if (i < KCHT_TABLES.length - 1) {
                sql.append(" UNION ALL ");
            }
        }

        String finalSql = sql.toString();
        log.info("Executing KCHT Dashboard Query: {}", finalSql);
        log.info("With arguments: {}", args);

        List<Map<String, Object>> dbResults = jdbc.queryForList(finalSql, args.toArray());
        Map<String, Map<String, Object>> rsMap = new LinkedHashMap<>();
        for (Map<String, Object> dbRow : dbResults) {
            String tbl = (String) dbRow.get("tbl_name");
            rsMap.put(tbl, dbRow);
        }

        int seq = 1;
        for (String table : KCHT_TABLES) {
            Map<String, Object> dbRow = rsMap.get(table);
            long pending = dbRow != null && dbRow.get("pending_cnt") != null ? ((Number) dbRow.get("pending_cnt")).longValue() : 0;
            long operating = dbRow != null && dbRow.get("operating_cnt") != null ? ((Number) dbRow.get("operating_cnt")).longValue() : 0;
            long suspended = dbRow != null && dbRow.get("suspended_cnt") != null ? ((Number) dbRow.get("suspended_cnt")).longValue() : 0;
            long total = pending + operating + suspended;

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("sequenceNo", seq++);
            row.put("code", table);
            row.put("type", LABELS.getOrDefault(table, table));
            row.put("total", total);
            row.put("pending", pending);
            row.put("operating", operating);
            row.put("suspended", suspended);
            rows.add(row);
        }
        return rows;
    }

    private String physicalTable(String tableItem) {
        return tableItem.startsWith("water_zones_") ? "water_zones" : tableItem;
    }

    private List<String> resolveTableItems(String infraType) {
        if (infraType == null || infraType.isBlank()) {
            return Arrays.asList(KCHT_TABLES);
        }
        String normalizedType = infraType.trim();
        if ("water_zones".equals(normalizedType)) {
            return List.of("anchorages", "transfer_areas", "storm_shelter_areas", "buoy_berths");
        }
        return Arrays.stream(KCHT_TABLES)
                .filter(normalizedType::equals)
                .toList();
    }

    private String codeForLabel(String label) {
        return LABELS.entrySet().stream()
                .filter(entry -> Objects.equals(entry.getValue(), label))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse("");
    }

    private void appendScopeFilters(
            StringBuilder sql,
            List<Object> args,
            String tableItem,
            String deletedCol,
            String createdCol,
            String provCol,
            Integer year,
            Integer provinceId
    ) {
        sql.append("FROM ").append(physicalTable(tableItem)).append(" WHERE 1=1 ");

        if (tableItem.startsWith("water_zones_")) {
            Integer type = getWaterZoneType(tableItem);
            if (type != null) {
                sql.append("AND water_zone_type = ").append(type).append(" ");
            }
        }
        if (!deletedCol.isEmpty()) {
            sql.append("AND ").append(deletedCol).append(" IS NULL ");
        }
        if (year != null && !createdCol.isEmpty()) {
            sql.append("AND EXTRACT(YEAR FROM ").append(createdCol).append(") <= ? ");
            args.add(year);
        }
        if (provinceId != null && !provCol.isEmpty()) {
            if ("province_id".equals(provCol) || "province_code".equals(provCol)) {
                sql.append("AND ").append(provCol).append(" = ? ");
                args.add(provinceId);
            } else {
                sql.append("AND ").append(provCol).append(" = (SELECT name FROM provinces WHERE id = ?) ");
                args.add(provinceId);
            }
        }
    }

    private long numberValue(Object value) {
        return value instanceof Number number ? number.longValue() : 0;
    }

    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void evictCache() {
        log.info("Evicting all KCHT cache entries due to entity mutation");
    }

    /**
     * Adjust cache for a specific entity type mutation.
     * If the table is in KCHT_TABLES, evict all entries.
     */
    @CacheEvict(value = CACHE_NAME, allEntries = true)
    public void adjustCacheForEntity(String entityType) {
        for (String table : KCHT_TABLES) {
            if (table.equals(entityType) || (entityType != null && entityType.toLowerCase().contains(table))) {
                log.info("Evicting cache due to entity mutation for: {}", entityType);
                return;
            }
        }
        log.info("No KCHT cache adjustment needed for entity type: {}", entityType);
    }
}
