package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchResult;
import com.hanghai.kchtg.gis.search.dto.TinhThanhPho;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.port.entity.*;
import com.hanghai.kchtg.port.repository.*;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacility;
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityRepository;
import com.hanghai.kchtg.station.entity.*;
import com.hanghai.kchtg.station.repository.*;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KchtGis155Service {

    private final PortRepository portRepository;
    private final BerthRepository berthRepository;
    private final PierRepository pierRepository;
    private final DryPortRepository dryPortRepository;
    private final WaterZoneRepository waterZoneRepository;
    private final NavigationChannelRepository navigationChannelRepository;
    private final DikeRevetmentRepository dikeRevetmentRepository;
    private final ShipRepairFacilityRepository shipRepairFacilityRepository;
    private final LighthouseStationRepository lighthouseStationRepository;
    private final BuoyStationRepository buoyStationRepository;
    private final VtsSystemRepository vtsSystemRepository;
    private final RadarStationRepository radarStationRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final GisSpatialObjectRepository gisSpatialObjectRepository;
    private final BeaconLightRepository beaconLightRepository;
    private final BuoyRepository buoyRepository;
    private final CoastalStationVTSRepository coastalStationVTSRepository;
    private final CoastalStationInmarsatRepository coastalStationInmarsatRepository;
    private final CoastalStationCospasSarsatRepository coastalStationCospasSarsatRepository;
    private final CoastalStationLRITRepository coastalStationLRITRepository;
    private final CoastalStationHaiphongRepository coastalStationHaiphongRepository;
    private final jakarta.persistence.EntityManager entityManager;

    /**
     * Tra cứu tên đơn vị từ Map đã batch pre-load (tránh N+1 query).
     * Map được nạp 1 lần duy nhất ở đầu method search().
     */
    private String getOrgName(UUID orgUnitId, Map<UUID, String> orgNameMap) {
        if (orgUnitId == null) {
            return "Cục Hàng hải Việt Nam";
        }
        return orgNameMap.getOrDefault(orgUnitId, "Cục Hàng hải Việt Nam");
    }

    private double[] parseFirstCoordinateFromWkt(String wkt) {
        if (wkt == null || wkt.trim().isEmpty()) {
            return null;
        }
        try {
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("(-?\\d+\\.\\d+|-?\\d+)\\s+(-?\\d+\\.\\d+|-?\\d+)").matcher(wkt);
            if (m.find()) {
                double lon = Double.parseDouble(m.group(1));
                double lat = Double.parseDouble(m.group(2));
                return new double[]{lat, lon};
            }
        } catch (Exception e) {
            // ignore
        }
        return null;
    }

    private String getExecutableSql(String sql, Object orgUnitId, Object search, Object hd, Object pd) {
        String s1 = formatValueForSql(orgUnitId);
        String s2 = formatValueForSql(search);
        String s3 = formatValueForSql(hd);
        String s4 = formatValueForSql(pd);
        return sql
            .replace(":orgUnitId", s1)
            .replace(":search", s2)
            .replace(":operationalStatus", s3)
            .replace(":ApprovalStatus", s4);
    }

    private String formatValueForSql(Object val) {
        if (val == null) {
            return "NULL";
        }
        if (val instanceof String) {
            return "'" + ((String) val).replace("'", "''") + "'";
        }
        if (val instanceof UUID) {
            return "'" + val.toString() + "'";
        }
        return val.toString();
    }

    private void explainAndLogPierQuery(UUID orgUnitId, String search, OperationalStatus hd, ApprovalStatus pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_cau, ma_cau FROM public.cau_cang WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_cau) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_cau) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) " +
                "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
            query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
            List<?> result = query.getResultList();

            String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null, pd != null ? pd.ordinal() : null);
            StringBuilder sb = new StringBuilder();
            sb.append("\n=================== EXPLAIN ANALYZE CAU_CANG ===================\n");
            sb.append("--- [COPY-PASTE SELECT QUERY] ---\n")
              .append(execSql.substring(16)).append(";\n\n")
              .append("--- [COPY-PASTE EXPLAIN QUERY] ---\n")
              .append(execSql).append(";\n\n");
            sb.append("Plan:\n");
            for (Object line : result) {
                sb.append("  ").append(line).append("\n");
            }
            sb.append("===============================================================");
            log.info(sb.toString());
        } catch (Exception e) {
            log.warn("Could not execute EXPLAIN ANALYZE for CAU_CANG: {}", e.getMessage());
        }
    }

    private void explainAndLogBerthQuery(UUID orgUnitId, String search, OperationalStatus hd, ApprovalStatus pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_ben, ma_ben FROM public.ben_cang WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_ben) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_ben) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) " +
                "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
            query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
            List<?> result = query.getResultList();

            String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null, pd != null ? pd.ordinal() : null);
            StringBuilder sb = new StringBuilder();
            sb.append("\n=================== EXPLAIN ANALYZE BEN_CANG ===================\n");
            sb.append("--- [COPY-PASTE SELECT QUERY] ---\n")
              .append(execSql.substring(16)).append(";\n\n")
              .append("--- [COPY-PASTE EXPLAIN QUERY] ---\n")
              .append(execSql).append(";\n\n");
            sb.append("Plan:\n");
            for (Object line : result) {
                sb.append("  ").append(line).append("\n");
            }
            sb.append("===============================================================");
            log.info(sb.toString());
        } catch (Exception e) {
            log.warn("Could not execute EXPLAIN ANALYZE for BEN_CANG: {}", e.getMessage());
        }
    }

    private void explainAndLogPortQuery(UUID orgUnitId, String search, OperationalStatus hd, ApprovalStatus pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_cang, ma_cang FROM public.cang_bien WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_cang) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_cang) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) " +
                "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
            query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
            List<?> result = query.getResultList();

            String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null, pd != null ? pd.ordinal() : null);
            StringBuilder sb = new StringBuilder();
            sb.append("\n=================== EXPLAIN ANALYZE CANG_BIEN ===================\n");
            sb.append("--- [COPY-PASTE SELECT QUERY] ---\n")
              .append(execSql.substring(16)).append(";\n\n")
              .append("--- [COPY-PASTE EXPLAIN QUERY] ---\n")
              .append(execSql).append(";\n\n");
            sb.append("Plan:\n");
            for (Object line : result) {
                sb.append("  ").append(line).append("\n");
            }
            sb.append("===============================================================");
            log.info(sb.toString());
        } catch (Exception e) {
            log.warn("Could not execute EXPLAIN ANALYZE for CANG_BIEN: {}", e.getMessage());
        }
    }

    private void explainAndLogWaterZoneQuery(UUID orgUnitId, String search, OperationalStatus hd, ApprovalStatus pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_vung_nuoc, ma_vung_nuoc FROM public.vung_nuoc WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_vung_nuoc) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_vung_nuoc) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) " +
                "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
            query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
            List<?> result = query.getResultList();

            String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null, pd != null ? pd.ordinal() : null);
            StringBuilder sb = new StringBuilder();
            sb.append("\n=================== EXPLAIN ANALYZE VUNG_NUOC ===================\n");
            sb.append("--- [COPY-PASTE SELECT QUERY] ---\n")
              .append(execSql.substring(16)).append(";\n\n")
              .append("--- [COPY-PASTE EXPLAIN QUERY] ---\n")
              .append(execSql).append(";\n\n");
            sb.append("Plan:\n");
            for (Object line : result) {
                sb.append("  ").append(line).append("\n");
            }
            sb.append("===============================================================");
            log.info(sb.toString());
        } catch (Exception e) {
            log.warn("Could not execute EXPLAIN ANALYZE for VUNG_NUOC: {}", e.getMessage());
        }
    }

    private void populateSpatialAndFilter(List<KchtGisSearchResult> results, KchtGisSearchResult result, UUID khongGianId, GisObjectType objectType, GisObjectType fallbackType) {
        if (khongGianId != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectRepository.findById(khongGianId);
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name() : null;
                result.setGeometryType(geomTypeStr);
                result.setCoordinates(spatial.getCoordinates());

                double[] coords = parseFirstCoordinateFromWkt(spatial.getCoordinates());
                if (coords != null) {
                }

                if (objectType != null && geomTypeStr != null) {
                    if (objectType == GisObjectType.POINT && !"POINT".equalsIgnoreCase(geomTypeStr)) {
                        return;
                    }
                    if (objectType == GisObjectType.LINE && !"LINE".equalsIgnoreCase(geomTypeStr)) {
                        return;
                    }
                    if (objectType == GisObjectType.POLYGON && !"POLYGON".equalsIgnoreCase(geomTypeStr)) {
                        return;
                    }
                }
            } else if (objectType != null) {
                if (objectType != fallbackType) {
                    return;
                }
                result.setGeometryType(fallbackType.name());
            } else {
                result.setGeometryType(fallbackType.name());
            }
        } else {
            if (objectType != null) {
                if (objectType != fallbackType) {
                    return;
                }
            }
            result.setGeometryType(fallbackType.name());
        }
        results.add(result);
    }

    private void populateSpatialAndFilterFromMap(List<KchtGisSearchResult> results, KchtGisSearchResult result, UUID khongGianId, GisObjectType objectType, GisObjectType fallbackType, Map<UUID, GisSpatialObject> spatialMap) {
        if (khongGianId != null) {
            GisSpatialObject spatial = spatialMap.get(khongGianId);
            if (spatial != null) {
                String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name() : null;
                result.setGeometryType(geomTypeStr);
                result.setCoordinates(spatial.getCoordinates());

                double[] coords = parseFirstCoordinateFromWkt(spatial.getCoordinates());
                if (coords != null) {
                }

                if (objectType != null && geomTypeStr != null) {
                    if (objectType == GisObjectType.POINT && !"POINT".equalsIgnoreCase(geomTypeStr)) {
                        return;
                    }
                    if (objectType == GisObjectType.LINE && !"LINE".equalsIgnoreCase(geomTypeStr)) {
                        return;
                    }
                    if (objectType == GisObjectType.POLYGON && !"POLYGON".equalsIgnoreCase(geomTypeStr)) {
                        return;
                    }
                }
            } else if (objectType != null) {
                if (objectType != fallbackType) {
                    return;
                }
                result.setGeometryType(fallbackType.name());
            } else {
                result.setGeometryType(fallbackType.name());
            }
        } else {
            if (objectType != null) {
                if (objectType != fallbackType) {
                    return;
                }
            }
            result.setGeometryType(fallbackType.name());
        }
        results.add(result);
    }

    public List<KchtGisSearchResult> search(
            UUID rawOrgUnitId,
            List<InfrastructureType> kchtTypes,
            TinhThanhPho tinhThanhPho,
            String search,
            GisObjectType objectType) {

        List<KchtGisSearchResult> results = new ArrayList<>();
        Map<String, UUID> spatialIdMap = new HashMap<>();
        List<InfrastructureType> types;
        if (kchtTypes == null || kchtTypes.isEmpty()) {
            types = Arrays.asList(InfrastructureType.values());
        } else {
            types = kchtTypes.stream().filter(t -> t != null).collect(Collectors.toList());
            if (types.isEmpty()) {
                types = Arrays.asList(InfrastructureType.values());
            }
        }
        String searchLower = (search == null || search.trim().isEmpty()) ? null : search.toLowerCase().trim();
        String tinhThanhStr = (tinhThanhPho != null) ? tinhThanhPho.getDisplayName() : null;
        Integer provinceIdLocal = null; // Temporary fix for provinceId

        // Batch pre-load tất cả OrgUnit vào Map 1 lần (tránh N+1 query khi gọi getOrgName)
        Map<UUID, String> orgNameMap = new HashMap<>();
        try {
            orgUnitRepository.findAll().forEach(org -> {
                if (org.getId() != null && org.getName() != null) {
                    orgNameMap.put(org.getId(), org.getName());
                }
            });
        } catch (Exception e) {
            log.warn("Không thể nạp danh sách OrgUnit: {}", e.getMessage());
        }

        boolean isRootOrg = false;
        if (rawOrgUnitId == null) {
            isRootOrg = true;
        } else {
            String orgName = orgNameMap.getOrDefault(rawOrgUnitId, "");
            if (orgName.contains("Cục Hàng hải Việt Nam")) {
                isRootOrg = true;
            }
        }
        final UUID orgUnitId = isRootOrg ? null : rawOrgUnitId;



        for (InfrastructureType type : types) {
            long tStart = System.currentTimeMillis();

            switch (type) {
                case SEAPORT:
                    List<Port> ports = portRepository.searchPorts(
                            orgUnitId, null, null, provinceIdLocal, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, searchLower, PageRequest.of(0, 10000)).getContent();
                    Map<UUID, GisSpatialObject> cbSpatialMap = new HashMap<>();
                    if (!ports.isEmpty()) {
                        List<UUID> cbIds = ports.stream().map(Port::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(cbIds, InfrastructureType.SEAPORT)
                                .forEach(so -> cbSpatialMap.put(so.getRefId(), so));
                    }
                    for (Port cb : ports) {
                        GisSpatialObject spatial = cbSpatialMap.get(cb.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cb.getId() != null ? cb.getId().toString() : null)
                                .name(cb.getPortName())
                                .code(cb.getPortCode())
                                .orgName(getOrgName(cb.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cảng biển")
                                .location(cb.getProvinceId() != null ? String.valueOf(cb.getProvinceId()) : "")
                                .diaChiChiTiet("")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cb.getId(), objectType, GisObjectType.POINT, cbSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), cb.getId());
                        }
                    }
                    break;

                case PORT_TERMINAL:
                    List<Berth> berths = berthRepository.searchBerths(
                            orgUnitId, searchLower, null, null, null, null, null, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> cbIds = berths.stream().map(Berth::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> bcPortMap = new HashMap<>();
                    if (!cbIds.isEmpty()) {
                        portRepository.findAllById(cbIds).forEach(cb -> bcPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> bcSpatialMap = new HashMap<>();
                    if (!berths.isEmpty()) {
                        List<UUID> bcIds = berths.stream().map(Berth::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(bcIds, InfrastructureType.PORT_TERMINAL)
                                .forEach(so -> bcSpatialMap.put(so.getRefId(), so));
                    }
                    for (Berth bc : berths) {
                        Port parent = (bc.getPortId() != null) ? bcPortMap.get(bc.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvinceId() != null)
                                ? String.valueOf(parent.getProvinceId()) : "";
                        GisSpatialObject spatial = bcSpatialMap.get(bc.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(bc.getId() != null ? bc.getId().toString() : null)
                                .name(bc.getBerthName())
                                .code(bc.getBerthCode())
                                .orgName(getOrgName(bc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Bến cảng")
                                .location(parentProvince)
                                .diaChiChiTiet(bc.getWaterway() != null ? bc.getWaterway() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, bc.getId(), objectType, GisObjectType.POINT, bcSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), bc.getId());
                        }
                    }
                    break;

                case PIER:
                    List<Pier> piers = pierRepository.searchPiers(
                            orgUnitId, searchLower, null, null, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> parentBerthIds = piers.stream().map(Pier::getBerthId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Berth> berthMap = new HashMap<>();
                    if (!parentBerthIds.isEmpty()) {
                        berthRepository.findAllById(parentBerthIds).forEach(bc -> berthMap.put(bc.getId(), bc));
                    }
                    List<UUID> parentCbIds = berthMap.values().stream().map(Berth::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> portMap = new HashMap<>();
                    if (!parentCbIds.isEmpty()) {
                        portRepository.findAllById(parentCbIds).forEach(cb -> portMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> parentBerthSpatialMap = new HashMap<>();
                    if (!parentBerthIds.isEmpty()) {
                        gisSpatialObjectRepository.findByRefIdInAndRefType(parentBerthIds, InfrastructureType.PORT_TERMINAL)
                                .forEach(so -> parentBerthSpatialMap.put(so.getRefId(), so));
                    }
                    Map<UUID, GisSpatialObject> spatialMap = new HashMap<>();
                    if (objectType != null) {
                        List<UUID> spatialIds = piers.stream().map(Pier::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!spatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> spatialMap.put(so.getId(), so));
                        }
                    }
                    for (Pier cc : piers) {
                        Berth parentBerth = (cc.getBerthId() != null) ? berthMap.get(cc.getBerthId()) : null;
                        Port parentCb = (parentBerth != null && parentBerth.getPortId() != null) ? portMap.get(parentBerth.getPortId()) : null;
                        String parentProvince = (parentCb != null && parentCb.getProvinceId() != null) ? String.valueOf(parentCb.getProvinceId()) : "";

                        GisSpatialObject parentBerthSpatial = (parentBerth != null) ? parentBerthSpatialMap.get(parentBerth.getId()) : null;
                        double[] coords = parentBerthSpatial != null ? parseFirstCoordinateFromWkt(parentBerthSpatial.getCoordinates()) : null;
                        Double latitude = coords != null ? coords[0] : null;
                        Double longitude = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cc.getId() != null ? cc.getId().toString() : null)
                                .name(cc.getPierName())
                                .code(cc.getPierCode())
                                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cầu cảng")
                                .location(parentProvince)
                                .diaChiChiTiet(parentBerth != null ? "Thuộc bến cảng: " + parentBerth.getBerthName() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cc.getSpatialId(), objectType, GisObjectType.LINE, spatialMap);
                        } else {
                            results.add(r);
                            if (cc.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), cc.getSpatialId());
                            }
                        }
                    }
                    break;

                case DRY_PORT:
                    List<DryPort> cangCans = dryPortRepository.searchDryPorts(
                            orgUnitId, searchLower, OperationalStatus.OPERATIONAL, ApprovalStatus.APPROVED,
                            PageRequest.of(0, 10000)).getContent();
                    Map<UUID, GisSpatialObject> ccSpatialMap = new HashMap<>();
                    if (!cangCans.isEmpty()) {
                        List<UUID> ccIds = cangCans.stream().map(DryPort::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(ccIds, InfrastructureType.DRY_PORT)
                                .forEach(so -> ccSpatialMap.put(so.getRefId(), so));
                    }
                    for (DryPort cc : cangCans) {
                        GisSpatialObject spatial = ccSpatialMap.get(cc.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cc.getId() != null ? cc.getId().toString() : null)
                                .name(cc.getDryPortName())
                                .code(cc.getDryPortCode())
                                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cảng cạn")
                                .location(cc.getProvinceId() != null ? String.valueOf(cc.getProvinceId()) : "")
                                .diaChiChiTiet("")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cc.getId(), objectType, GisObjectType.POINT, ccSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), cc.getId());
                        }
                    }
                    break;

                case WATER_AREA:
                    List<WaterZone> waterZones = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, null, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> vnCbIds = waterZones.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> vnPortMap = new HashMap<>();
                    if (!vnCbIds.isEmpty()) {
                        portRepository.findAllById(vnCbIds).forEach(cb -> vnPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> vnSpatialMap = new HashMap<>();
                    if (!waterZones.isEmpty()) {
                        List<UUID> vnSpatialIds = waterZones.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!vnSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(vnSpatialIds).forEach(so -> vnSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : waterZones) {
                        Port parent = (vn.getPortId() != null) ? vnPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvinceId() != null)
                                ? String.valueOf(parent.getProvinceId()) : "";
                        GisSpatialObject spatial = vnSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double latitude = coords != null ? coords[0] : null;
                        Double longitude = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .code(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Vùng nước")
                                .location(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType, GisObjectType.POLYGON, vnSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), vn.getSpatialId());
                            }
                        }
                    }
                    break;

                case NAVIGATION_CHANNEL:
                    String searchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<NavigationChannel> ncList = navigationChannelRepository.searchFiltered(orgUnitId, searchParam);
                    Map<UUID, GisSpatialObject> ncSpatialMap = new HashMap<>();
                    if (!ncList.isEmpty()) {
                        List<UUID> spatialIds = ncList.stream().map(NavigationChannel::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!spatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> ncSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (NavigationChannel nc : ncList) {
                        GisSpatialObject spatial = ncSpatialMap.get(nc.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(nc.getId()))
                                .name(nc.getChannelName() != null && !nc.getChannelName().isEmpty() ? nc.getChannelName() : "Luồng hàng hải")
                                .code("NC_" + nc.getId())
                                .orgName(getOrgName(nc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Luồng hàng hải")
                                .location("")
                                .diaChiChiTiet(nc.getNote() != null ? nc.getNote() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, nc.getSpatialId(), objectType, GisObjectType.LINE, ncSpatialMap);
                        } else {
                            results.add(r);
                            if (nc.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), nc.getSpatialId());
                            }
                        }
                    }
                    break;

                case DIKE_REVETMENT:
                    List<DikeRevetment> dikeRevList = dikeRevetmentRepository.searchDocuments(
                            orgUnitId, searchLower, null, null, DikeRevetmentApprovalStatus.APPROVED, PageRequest.of(0, 10000))
                            .getContent();
                    Map<UUID, GisSpatialObject> dikeRevSpatialMap = new HashMap<>();
                    if (!dikeRevList.isEmpty()) {
                        List<UUID> spatialIds = dikeRevList.stream().map(DikeRevetment::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!spatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> dikeRevSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (DikeRevetment dk : dikeRevList) {
                        GisSpatialObject spatial = dikeRevSpatialMap.get(dk.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(dk.getId()))
                                .name(dk.getDikeRevetmentName() != null && !dk.getDikeRevetmentName().isEmpty() ? dk.getDikeRevetmentName() : "Đê kè")
                                .code("DIR_" + dk.getId())
                                .orgName(getOrgName(dk.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Đê kè")
                                .location("")
                                .diaChiChiTiet(dk.getLocation() != null ? dk.getLocation() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, dk.getSpatialId(), objectType, GisObjectType.LINE, dikeRevSpatialMap);
                        } else {
                            results.add(r);
                            if (dk.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), dk.getSpatialId());
                            }
                        }
                    }
                    break;

                case SHIP_REPAIR_FACILITY:
                    String csSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<ShipRepairFacility> csList = shipRepairFacilityRepository.searchFiltered(orgUnitId, csSearchParam);
                    Map<UUID, GisSpatialObject> csSpatialMap = new HashMap<>();
                    if (!csList.isEmpty()) {
                        List<UUID> csSpatialIds = csList.stream().map(ShipRepairFacility::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!csSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(csSpatialIds).forEach(so -> csSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (ShipRepairFacility cs : csList) {
                        GisSpatialObject spatial = csSpatialMap.get(cs.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(cs.getId()))
                                .name(cs.getFacilityName())
                                .code("COSO_" + cs.getId())
                                .orgName(getOrgName(cs.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cơ sở sửa chữa")
                                .location(cs.getProvinceId() != null ? String.valueOf(cs.getProvinceId()) : "")
                                .diaChiChiTiet(cs.getAddress() != null ? cs.getAddress() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cs.getSpatialId(), objectType, GisObjectType.POINT, csSpatialMap);
                        } else {
                            results.add(r);
                            if (cs.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), cs.getSpatialId());
                            }
                        }
                    }
                    break;

                case LIGHTHOUSE:
                    // 1. Fetch from LighthouseStation
                    String denSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<LighthouseStation> denList = lighthouseStationRepository.searchGis(orgUnitId, denSearchParam);
                    Map<UUID, GisSpatialObject> denSpatialMap = new HashMap<>();
                    if (objectType != null && !denList.isEmpty()) {
                        List<UUID> denIds = denList.stream().map(LighthouseStation::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(denIds, InfrastructureType.LIGHTHOUSE)
                                .forEach(so -> denSpatialMap.put(so.getRefId(), so));
                    }
                    for (LighthouseStation den : denList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(den.getId() != null ? den.getId().toString() : null)
                                .name(den.getName())
                                .code(den.getCode())
                                .orgName(getOrgName(den.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Nhà trạm đèn biển")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (den.getDescription() != null ? den.getDescription() : "") + ", Đặc tính ánh sáng: " + (den.getLightCharacteristic() != null ? den.getLightCharacteristic() : "") + ", Tầm hiệu lực: " + (den.getLightRange() != null ? den.getLightRange() : "") + " hải lý")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, den.getId(), objectType, GisObjectType.POINT, denSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), den.getId());
                        }
                    }

                    // 2. Fetch from BeaconLight
                    List<BeaconLight> beaconList = beaconLightRepository.searchGis(orgUnitId, denSearchParam);
                    Map<UUID, GisSpatialObject> beaconSpatialMap = new HashMap<>();
                    if (!beaconList.isEmpty()) {
                        List<UUID> beaconIds = beaconList.stream().map(BeaconLight::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(beaconIds, InfrastructureType.LIGHTHOUSE)
                                .forEach(so -> beaconSpatialMap.put(so.getRefId(), so));
                    }
                    for (BeaconLight beacon : beaconList) {
                        GisSpatialObject spatial = beaconSpatialMap.get(beacon.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(beacon.getId() != null ? beacon.getId().toString() : null)
                                .name(beacon.getName())
                                .code(beacon.getCode())
                                .orgName(getOrgName(beacon.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đèn biển")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (beacon.getLocation() != null ? beacon.getLocation() : "") + ", Đặc tính ánh sáng: " + (beacon.getPrimaryLightModel() != null ? beacon.getPrimaryLightModel() : "") + ", Tầm hiệu lực: " + (beacon.getLightRange() != null ? beacon.getLightRange() : "") + " hải lý")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, beacon.getId(), objectType, GisObjectType.POINT, beaconSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), beacon.getId());
                        }
                    }
                    break;

                case BUOY:
                    String buoySearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<Buoy> buoyList = buoyRepository.searchGis(orgUnitId, buoySearchParam);
                    Map<UUID, GisSpatialObject> buoySpatialMap = new HashMap<>();
                    if (!buoyList.isEmpty()) {
                        List<UUID> buoyIds = buoyList.stream().map(Buoy::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(buoyIds, InfrastructureType.BUOY)
                                .forEach(so -> buoySpatialMap.put(so.getRefId(), so));
                    }
                    for (Buoy buoy : buoyList) {
                        GisSpatialObject spatial = buoySpatialMap.get(buoy.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(buoy.getId() != null ? buoy.getId().toString() : null)
                                .name(buoy.getName())
                                .code(buoy.getCode())
                                .orgName(getOrgName(buoy.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Phao, tiêu")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (buoy.getDescription() != null ? buoy.getDescription() : "") + ", Màu sắc: " + (buoy.getColor() != null ? buoy.getColor() : "") + ", Hình dạng: " + (buoy.getShape() != null ? buoy.getShape() : "") + ", Đặc tính ánh sáng: " + (buoy.getLightCharacteristic() != null ? buoy.getLightCharacteristic() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, buoy.getId(), objectType, GisObjectType.POINT, buoySpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), buoy.getId());
                        }
                    }
                    break;

                case BUOY_STATION:
                    String phaoSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<BuoyStation> phaoList = buoyStationRepository.searchGis(orgUnitId, phaoSearchParam);
                    Map<UUID, GisSpatialObject> phaoSpatialMap = new HashMap<>();
                    if (objectType != null && !phaoList.isEmpty()) {
                        List<UUID> phaoIds = phaoList.stream().map(BuoyStation::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(phaoIds, InfrastructureType.BUOY_STATION)
                                .forEach(so -> phaoSpatialMap.put(so.getRefId(), so));
                    }
                    for (BuoyStation phao : phaoList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(phao.getId() != null ? phao.getId().toString() : null)
                                .name(phao.getName())
                                .code(phao.getCode())
                                .orgName(getOrgName(phao.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Nhà trạm phao tiêu")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (phao.getDescription() != null ? phao.getDescription() : "") + ", Màu sắc: " + (phao.getColor() != null ? phao.getColor() : "") + ", Hình dạng: " + (phao.getShape() != null ? phao.getShape() : "") + ", Đặc tính ánh sáng: " + (phao.getLightCharacteristic() != null ? phao.getLightCharacteristic() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, phao.getId(), objectType, GisObjectType.POINT, phaoSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), phao.getId());
                        }
                    }
                    break;

                case COASTAL_RADIO_STATION:
                    String vtsStSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationVTS> vtsStationList = coastalStationVTSRepository.searchGis(orgUnitId, vtsStSearchParam);
                    Map<UUID, GisSpatialObject> vtsStationSpatialMap = new HashMap<>();
                    if (objectType != null && !vtsStationList.isEmpty()) {
                        List<UUID> vtsStationIds = vtsStationList.stream().map(CoastalStationVTS::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(vtsStationIds, InfrastructureType.COASTAL_RADIO_STATION)
                                .forEach(so -> vtsStationSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationVTS vtsStation : vtsStationList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vtsStation.getId() != null ? vtsStation.getId().toString() : null)
                                .name(vtsStation.getName())
                                .code(vtsStation.getCode())
                                .orgName(getOrgName(vtsStation.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài TTDH")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (vtsStation.getDescription() != null ? vtsStation.getDescription() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vtsStation.getId(), objectType, GisObjectType.POINT, vtsStationSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), vtsStation.getId());
                        }
                    }
                    break;

                case INMARSAT_STATION:
                    String inmarsatSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationInmarsat> inmarsatList = coastalStationInmarsatRepository.searchGis(orgUnitId, inmarsatSearchParam);
                    Map<UUID, GisSpatialObject> inmarsatSpatialMap = new HashMap<>();
                    if (objectType != null && !inmarsatList.isEmpty()) {
                        List<UUID> inmarsatIds = inmarsatList.stream().map(CoastalStationInmarsat::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(inmarsatIds, InfrastructureType.INMARSAT_STATION)
                                .forEach(so -> inmarsatSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationInmarsat inmarsat : inmarsatList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(inmarsat.getId() != null ? inmarsat.getId().toString() : null)
                                .name(inmarsat.getName())
                                .code(inmarsat.getCode())
                                .orgName(getOrgName(inmarsat.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (inmarsat.getDescription() != null ? inmarsat.getDescription() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, inmarsat.getId(), objectType, GisObjectType.POINT, inmarsatSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), inmarsat.getId());
                        }
                    }
                    break;

                case COSPAS_SARSAT_STATION:
                    String cospasSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationCospasSarsat> cospasSarsatList = coastalStationCospasSarsatRepository.searchGis(orgUnitId, cospasSearchParam);
                    Map<UUID, GisSpatialObject> cospasSarsatSpatialMap = new HashMap<>();
                    if (objectType != null && !cospasSarsatList.isEmpty()) {
                        List<UUID> cospasSarsatIds = cospasSarsatList.stream().map(CoastalStationCospasSarsat::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(cospasSarsatIds, InfrastructureType.COSPAS_SARSAT_STATION)
                                .forEach(so -> cospasSarsatSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationCospasSarsat cospasSarsat : cospasSarsatList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cospasSarsat.getId() != null ? cospasSarsat.getId().toString() : null)
                                .name(cospasSarsat.getName())
                                .code(cospasSarsat.getCode())
                                .orgName(getOrgName(cospasSarsat.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (cospasSarsat.getDescription() != null ? cospasSarsat.getDescription() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cospasSarsat.getId(), objectType, GisObjectType.POINT, cospasSarsatSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), cospasSarsat.getId());
                        }
                    }
                    break;

                case LRIT_STATION:
                    String lritSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationLRIT> lritList = coastalStationLRITRepository.searchGis(orgUnitId, lritSearchParam);
                    Map<UUID, GisSpatialObject> lritSpatialMap = new HashMap<>();
                    if (objectType != null && !lritList.isEmpty()) {
                        List<UUID> lritIds = lritList.stream().map(CoastalStationLRIT::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(lritIds, InfrastructureType.LRIT_STATION)
                                .forEach(so -> lritSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationLRIT lrit : lritList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(lrit.getId() != null ? lrit.getId().toString() : null)
                                .name(lrit.getName())
                                .code(lrit.getCode())
                                .orgName(getOrgName(lrit.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (lrit.getDescription() != null ? lrit.getDescription() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, lrit.getId(), objectType, GisObjectType.POINT, lritSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), lrit.getId());
                        }
                    }
                    break;

                case HANOI_STATION:
                    String haiphongSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationHaiphong> haiphongList = coastalStationHaiphongRepository.searchGis(orgUnitId, haiphongSearchParam);
                    Map<UUID, GisSpatialObject> haiphongSpatialMap = new HashMap<>();
                    if (objectType != null && !haiphongList.isEmpty()) {
                        List<UUID> haiphongIds = haiphongList.stream().map(CoastalStationHaiphong::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(haiphongIds, InfrastructureType.HANOI_STATION)
                                .forEach(so -> haiphongSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationHaiphong haiphong : haiphongList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(haiphong.getId() != null ? haiphong.getId().toString() : null)
                                .name(haiphong.getName())
                                .code(haiphong.getCode())
                                .orgName(getOrgName(haiphong.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Trung tâm xử lý thông tin hàng hải Hà Nội")
                                .location("")
                                .diaChiChiTiet("Mô tả: " + (haiphong.getDescription() != null ? haiphong.getDescription() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, haiphong.getId(), objectType, GisObjectType.POINT, haiphongSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), haiphong.getId());
                        }
                    }
                    break;

                case VTS_SYSTEM:
                    String vtsSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<VtsSystem> vtsList = vtsSystemRepository.searchFiltered(orgUnitId, vtsSearchParam);
                    Map<UUID, GisSpatialObject> vtsSpatialMap = new HashMap<>();
                    if (!vtsList.isEmpty()) {
                        List<UUID> vtsSpatialIds = vtsList.stream().map(VtsSystem::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!vtsSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(vtsSpatialIds).forEach(so -> vtsSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VtsSystem vts : vtsList) {
                        GisSpatialObject spatial = vtsSpatialMap.get(vts.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(vts.getId()))
                                .name(vts.getSystemName())
                                .code("VTS_" + vts.getId())
                                .orgName(getOrgName(vts.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Hệ thống VTS")
                                .location("")
                                .diaChiChiTiet("Vị trí: " + (vts.getLocation() != null ? vts.getLocation() : "") + ", Tình trạng: " + (vts.getConditionStatus() != null ? ("TOT".equals(vts.getConditionStatus()) ? "Tốt" : "XUONG_CAP".equals(vts.getConditionStatus()) ? "Xuống cấp" : "Hư hỏng") : "") + ", Mức độ phụ trách: " + (vts.getResponsibilityLevel() != null ? vts.getResponsibilityLevel() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vts.getSpatialId(), objectType, GisObjectType.POINT, vtsSpatialMap);
                        } else {
                            results.add(r);
                            if (vts.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), vts.getSpatialId());
                            }
                        }
                    }
                    break;

                case RADAR_STATION_LEGACY:
                    String radarSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<RadarStation> radarList = radarStationRepository.searchFiltered(orgUnitId, radarSearchParam);
                    Map<UUID, GisSpatialObject> radarSpatialMap = new HashMap<>();
                    if (!radarList.isEmpty()) {
                        List<UUID> radarIds = radarList.stream().map(RadarStation::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(radarIds, InfrastructureType.RADAR_STATION_LEGACY)
                                .forEach(so -> radarSpatialMap.put(so.getRefId(), so));
                    }
                    for (RadarStation rs : radarList) {
                        UUID dtoId = rs.getId();
                        GisSpatialObject spatial = radarSpatialMap.get(dtoId);
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(rs.getId()))
                                .name(rs.getStationName())
                                .code("RADAR_" + rs.getId())
                                .orgName(getOrgName(rs.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Trạm radar")
                                .location("")
                                .diaChiChiTiet("Vị trí: " + (rs.getLocation() != null ? rs.getLocation() : "") + ", Loại trạm: " + (rs.getStationType() != null ? rs.getStationType() : "") + ", Tình trạng: " + (rs.getConditionStatus() != null ? rs.getConditionStatus() : ""))
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, dtoId, objectType, GisObjectType.POINT, radarSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), dtoId);
                        }
                    }
                    break;

                case BUOY_BERTH:
                    List<WaterZone> benPhaos = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, WaterZoneType.MOORING_BUOY, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> bpCbIds = benPhaos.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> bpPortMap = new HashMap<>();
                    if (!bpCbIds.isEmpty()) {
                        portRepository.findAllById(bpCbIds).forEach(cb -> bpPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> bpSpatialMap = new HashMap<>();
                    if (!benPhaos.isEmpty()) {
                        List<UUID> bpSpatialIds = benPhaos.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!bpSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(bpSpatialIds).forEach(so -> bpSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : benPhaos) {
                        Port parent = (vn.getPortId() != null) ? bpPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvinceId() != null)
                                ? String.valueOf(parent.getProvinceId()) : "";
                        GisSpatialObject spatial = bpSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double latitude = coords != null ? coords[0] : null;
                        Double longitude = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .code(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Bến phao")
                                .location(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType, GisObjectType.POLYGON, bpSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), vn.getSpatialId());
                            }
                        }
                    }
                    break;

                case ANCHORAGE_AREA:
                    List<WaterZone> anchorages = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, WaterZoneType.ANCHORAGE, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> knCbIds = anchorages.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> knPortMap = new HashMap<>();
                    if (!knCbIds.isEmpty()) {
                        portRepository.findAllById(knCbIds).forEach(cb -> knPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> knSpatialMap = new HashMap<>();
                    if (!anchorages.isEmpty()) {
                        List<UUID> knSpatialIds = anchorages.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!knSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(knSpatialIds).forEach(so -> knSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : anchorages) {
                        Port parent = (vn.getPortId() != null) ? knPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvinceId() != null)
                                ? String.valueOf(parent.getProvinceId()) : "";
                        GisSpatialObject spatial = knSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double latitude = coords != null ? coords[0] : null;
                        Double longitude = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .code(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Khu neo đậu")
                                .location(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType, GisObjectType.POLYGON, knSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), vn.getSpatialId());
                            }
                        }
                    }
                    break;

                case TRANSSHIPMENT_AREA:
                    List<WaterZone> khuChuyens = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, WaterZoneType.TRANSSHIPMENT, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> kcCbIds = khuChuyens.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> kcPortMap = new HashMap<>();
                    if (!kcCbIds.isEmpty()) {
                        portRepository.findAllById(kcCbIds).forEach(cb -> kcPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> kcSpatialMap = new HashMap<>();
                    if (!khuChuyens.isEmpty()) {
                        List<UUID> kcSpatialIds = khuChuyens.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!kcSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(kcSpatialIds).forEach(so -> kcSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : khuChuyens) {
                        Port parent = (vn.getPortId() != null) ? kcPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvinceId() != null)
                                ? String.valueOf(parent.getProvinceId()) : "";
                        GisSpatialObject spatial = kcSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double latitude = coords != null ? coords[0] : null;
                        Double longitude = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .code(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Khu chuyển tải")
                                .location(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType, GisObjectType.POLYGON, kcSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), vn.getSpatialId());
                            }
                        }
                    }
                    break;

                case STORM_SHELTER_AREA:
                    List<WaterZone> khuTranhs = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, WaterZoneType.STORM_SHELTER, OperationalStatus.OPERATIONAL,
                            ApprovalStatus.APPROVED, PageRequest.of(0, 10000)).getContent();
                    List<UUID> ktCbIds = khuTranhs.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> ktPortMap = new HashMap<>();
                    if (!ktCbIds.isEmpty()) {
                        portRepository.findAllById(ktCbIds).forEach(cb -> ktPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> ktSpatialMap = new HashMap<>();
                    if (!khuTranhs.isEmpty()) {
                        List<UUID> ktSpatialIds = khuTranhs.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!ktSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(ktSpatialIds).forEach(so -> ktSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : khuTranhs) {
                        Port parent = (vn.getPortId() != null) ? ktPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvinceId() != null)
                                ? String.valueOf(parent.getProvinceId()) : "";
                        GisSpatialObject spatial = ktSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double latitude = coords != null ? coords[0] : null;
                        Double longitude = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .code(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Khu tránh trú bão")
                                .location(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType, GisObjectType.POLYGON, ktSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getSpatialId() != null) {
                                spatialIdMap.put(r.getId(), vn.getSpatialId());
                            }
                        }
                    }
                    break;
            }
            log.info("PERF: Type {} took {} ms, results size {}", type, System.currentTimeMillis() - tStart, results.size());
        }

        // Populate spatial data for all results
        if (objectType == null && !results.isEmpty()) {
            List<UUID> targetIds = results.stream()
                    .map(r -> spatialIdMap.get(r.getId()))
                    .filter(Objects::nonNull)
                    .distinct()
                    .collect(Collectors.toList());
            Map<UUID, GisSpatialObject> pageSpatialMap = new HashMap<>();
            if (!targetIds.isEmpty()) {
                gisSpatialObjectRepository.findAllById(targetIds).forEach(so -> {
                    pageSpatialMap.put(so.getId(), so);
                    if (so.getRefId() != null) {
                        pageSpatialMap.put(so.getRefId(), so);
                    }
                });
                gisSpatialObjectRepository.findByRefIdIn(targetIds).forEach(so -> {
                    pageSpatialMap.put(so.getId(), so);
                    if (so.getRefId() != null) {
                        pageSpatialMap.put(so.getRefId(), so);
                    }
                });
            }
            for (KchtGisSearchResult r : results) {
                UUID lookupId = spatialIdMap.get(r.getId());
                if (lookupId != null) {
                    GisSpatialObject spatial = pageSpatialMap.get(lookupId);
                    if (spatial != null) {
                        String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name() : null;
                        r.setGeometryType(geomTypeStr);
                        r.setCoordinates(spatial.getCoordinates());

                        double[] coords = parseFirstCoordinateFromWkt(spatial.getCoordinates());
                        if (coords != null) {
                        }
                    }
                }
            }
        }

        // Apply location/province filter post-collection
        if (tinhThanhStr != null && !tinhThanhStr.isEmpty()) {
            final String targetProv = tinhThanhStr.toLowerCase();
            results = results.stream()
                    .filter(r -> (r.getLocation() != null && r.getLocation().toLowerCase().contains(targetProv)) ||
                                 (r.getOrgName() != null && r.getOrgName().toLowerCase().contains(targetProv)))
                    .collect(Collectors.toList());
        }

        return results;
    }
}
