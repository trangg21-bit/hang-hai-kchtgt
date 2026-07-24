package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.cangben.entity.*;
import com.hanghai.kchtg.cangben.repository.*;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacility;
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.station.entity.LighthouseStation;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.LighthouseStationRepository;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.station.entity.*;
import com.hanghai.kchtg.station.repository.*;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchResult;
import com.hanghai.kchtg.gis.search.dto.KchtType;
import com.hanghai.kchtg.gis.search.dto.TinhThanhPho;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import lombok.extern.slf4j.Slf4j;
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
            .replace(":trangThaiHoatDong", s3)
            .replace(":trangThaiPheDuyet", s4);
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

    private void explainAndLogPierQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_cau, ma_cau FROM public.cau_cang WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_cau) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_cau) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:trangThaiHoatDong AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:trangThaiHoatDong AS integer)) " +
                "AND (CAST(:trangThaiPheDuyet AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:trangThaiPheDuyet AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("trangThaiHoatDong", hd != null ? hd.ordinal() : null);
            query.setParameter("trangThaiPheDuyet", pd != null ? pd.ordinal() : null);
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

    private void explainAndLogBerthQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_ben, ma_ben FROM public.ben_cang WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_ben) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_ben) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:trangThaiHoatDong AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:trangThaiHoatDong AS integer)) " +
                "AND (CAST(:trangThaiPheDuyet AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:trangThaiPheDuyet AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("trangThaiHoatDong", hd != null ? hd.ordinal() : null);
            query.setParameter("trangThaiPheDuyet", pd != null ? pd.ordinal() : null);
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

    private void explainAndLogPortQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_cang, ma_cang FROM public.cang_bien WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_cang) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_cang) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:trangThaiHoatDong AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:trangThaiHoatDong AS integer)) " +
                "AND (CAST(:trangThaiPheDuyet AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:trangThaiPheDuyet AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("trangThaiHoatDong", hd != null ? hd.ordinal() : null);
            query.setParameter("trangThaiPheDuyet", pd != null ? pd.ordinal() : null);
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

    private void explainAndLogWaterZoneQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
        String sql = "EXPLAIN ANALYZE SELECT id, ten_vung_nuoc, ma_vung_nuoc FROM public.vung_nuoc WHERE deleted_at IS NULL " +
                "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
                "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_vung_nuoc) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_vung_nuoc) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) " +
                "AND (CAST(:trangThaiHoatDong AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:trangThaiHoatDong AS integer)) " +
                "AND (CAST(:trangThaiPheDuyet AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:trangThaiPheDuyet AS integer))";
        try {
            jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
            query.setParameter("orgUnitId", orgUnitId);
            query.setParameter("search", search);
            query.setParameter("trangThaiHoatDong", hd != null ? hd.ordinal() : null);
            query.setParameter("trangThaiPheDuyet", pd != null ? pd.ordinal() : null);
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
                result.setLoaiHinhHoc(geomTypeStr);
                result.setToaDo(spatial.getCoordinates());

                double[] coords = parseFirstCoordinateFromWkt(spatial.getCoordinates());
                if (coords != null) {
                    result.setLatitude(coords[0]);
                    result.setLongitude(coords[1]);
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
                result.setLoaiHinhHoc(fallbackType.name());
            } else {
                result.setLoaiHinhHoc(fallbackType.name());
            }
        } else {
            if (objectType != null) {
                if (objectType != fallbackType) {
                    return;
                }
            }
            result.setLoaiHinhHoc(fallbackType.name());
        }
        results.add(result);
    }

    private void populateSpatialAndFilterFromMap(List<KchtGisSearchResult> results, KchtGisSearchResult result, UUID khongGianId, GisObjectType objectType, GisObjectType fallbackType, Map<UUID, GisSpatialObject> spatialMap) {
        if (khongGianId != null) {
            GisSpatialObject spatial = spatialMap.get(khongGianId);
            if (spatial != null) {
                String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name() : null;
                result.setLoaiHinhHoc(geomTypeStr);
                result.setToaDo(spatial.getCoordinates());

                double[] coords = parseFirstCoordinateFromWkt(spatial.getCoordinates());
                if (coords != null) {
                    result.setLatitude(coords[0]);
                    result.setLongitude(coords[1]);
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
                result.setLoaiHinhHoc(fallbackType.name());
            } else {
                result.setLoaiHinhHoc(fallbackType.name());
            }
        } else {
            if (objectType != null) {
                if (objectType != fallbackType) {
                    return;
                }
            }
            result.setLoaiHinhHoc(fallbackType.name());
        }
        results.add(result);
    }

    public List<KchtGisSearchResult> search(
            UUID rawOrgUnitId,
            List<KchtType> kchtTypes,
            TinhThanhPho tinhThanhPho,
            String search,
            GisObjectType objectType) {

        List<KchtGisSearchResult> results = new ArrayList<>();
        Map<String, UUID> spatialIdMap = new HashMap<>();
        List<KchtType> types;
        if (kchtTypes == null || kchtTypes.isEmpty()) {
            types = Arrays.asList(KchtType.values());
        } else {
            types = kchtTypes.stream().filter(t -> t != null).collect(Collectors.toList());
            if (types.isEmpty()) {
                types = Arrays.asList(KchtType.values());
            }
        }
        String searchLower = (search == null || search.trim().isEmpty()) ? null : search.toLowerCase().trim();
        String tinhThanhStr = (tinhThanhPho != null) ? tinhThanhPho.getDisplayName() : null;

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



        for (KchtType type : types) {
            long tStart = System.currentTimeMillis();

            switch (type) {
                case CANGBIEN:
                    List<Port> cangBiens = portRepository.searchPorts(
                            orgUnitId, null, null, tinhThanhStr, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, searchLower, PageRequest.of(0, 10000)).getContent();
                    Map<UUID, GisSpatialObject> cbSpatialMap = new HashMap<>();
                    if (!cangBiens.isEmpty()) {
                        List<UUID> cbIds = cangBiens.stream().map(Port::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(cbIds, KchtType.CANGBIEN)
                                .forEach(so -> cbSpatialMap.put(so.getRefId(), so));
                    }
                    for (Port cb : cangBiens) {
                        GisSpatialObject spatial = cbSpatialMap.get(cb.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cb.getId() != null ? cb.getId().toString() : null)
                                .name(cb.getPortName())
                                .ma(cb.getPortCode())
                                .orgName(getOrgName(cb.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cảng biển")
                                .diaDiem(cb.getProvince() != null ? cb.getProvince() : "")
                                .diaChiChiTiet("")
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cb.getId(), objectType, GisObjectType.POINT, cbSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), cb.getId());
                        }
                    }
                    break;

                case BENCANG:
                    List<Berth> benCangs = berthRepository.searchBerths(
                            orgUnitId, searchLower, null, null, null, null, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> cbIds = benCangs.stream().map(Berth::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> bcPortMap = new HashMap<>();
                    if (!cbIds.isEmpty()) {
                        portRepository.findAllById(cbIds).forEach(cb -> bcPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> bcSpatialMap = new HashMap<>();
                    if (!benCangs.isEmpty()) {
                        List<UUID> bcIds = benCangs.stream().map(Berth::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(bcIds, KchtType.BENCANG)
                                .forEach(so -> bcSpatialMap.put(so.getRefId(), so));
                    }
                    for (Berth bc : benCangs) {
                        Port parent = (bc.getPortId() != null) ? bcPortMap.get(bc.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvince() != null)
                                ? parent.getProvince()
                                : "";
                        GisSpatialObject spatial = bcSpatialMap.get(bc.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(bc.getId() != null ? bc.getId().toString() : null)
                                .name(bc.getBerthName())
                                .ma(bc.getBerthCode())
                                .orgName(getOrgName(bc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Bến cảng")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(bc.getWaterway() != null ? bc.getWaterway() : "")
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, bc.getId(), objectType, GisObjectType.POINT, bcSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), bc.getId());
                        }
                    }
                    break;

                case CAUCANG:
                    List<Pier> cauCangs = pierRepository.searchPiers(
                            orgUnitId, searchLower, null, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> parentBenIds = cauCangs.stream().map(Pier::getBerthId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Berth> benCangMap = new HashMap<>();
                    if (!parentBenIds.isEmpty()) {
                        berthRepository.findAllById(parentBenIds).forEach(bc -> benCangMap.put(bc.getId(), bc));
                    }
                    List<UUID> parentCbIds = benCangMap.values().stream().map(Berth::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> cangBienMap = new HashMap<>();
                    if (!parentCbIds.isEmpty()) {
                        portRepository.findAllById(parentCbIds).forEach(cb -> cangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> parentBenSpatialMap = new HashMap<>();
                    if (!parentBenIds.isEmpty()) {
                        gisSpatialObjectRepository.findByRefIdInAndRefType(parentBenIds, KchtType.BENCANG)
                                .forEach(so -> parentBenSpatialMap.put(so.getRefId(), so));
                    }
                    Map<UUID, GisSpatialObject> spatialMap = new HashMap<>();
                    if (objectType != null) {
                        List<UUID> spatialIds = cauCangs.stream().map(Pier::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!spatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> spatialMap.put(so.getId(), so));
                        }
                    }
                    for (Pier cc : cauCangs) {
                        Berth parentBen = (cc.getBerthId() != null) ? benCangMap.get(cc.getBerthId()) : null;
                        Port parentCb = (parentBen != null && parentBen.getPortId() != null) ? cangBienMap.get(parentBen.getPortId()) : null;
                        String parentProvince = (parentCb != null && parentCb.getProvince() != null) ? parentCb.getProvince() : "";
                        
                        GisSpatialObject parentBenSpatial = (parentBen != null) ? parentBenSpatialMap.get(parentBen.getId()) : null;
                        double[] coords = parentBenSpatial != null ? parseFirstCoordinateFromWkt(parentBenSpatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cc.getId() != null ? cc.getId().toString() : null)
                                .name(cc.getPierName())
                                .ma(cc.getPierCode())
                                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cầu cảng")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parentBen != null ? "Thuộc bến cảng: " + parentBen.getBerthName() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
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

                case CANGCAN:
                    List<DryPort> cangCans = dryPortRepository.searchDryPorts(
                            orgUnitId, searchLower, TrangThaiHoatDong.HIEN_HANH, TrangThaiPheDuyet.DUOC_PHE_DUYET,
                            PageRequest.of(0, 10000)).getContent();
                    Map<UUID, GisSpatialObject> ccSpatialMap = new HashMap<>();
                    if (!cangCans.isEmpty()) {
                        List<UUID> ccIds = cangCans.stream().map(DryPort::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(ccIds, KchtType.CANGCAN)
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
                                .ma(cc.getDryPortCode())
                                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cảng cạn")
                                .diaDiem(cc.getProvince() != null ? cc.getProvince() : "")
                                .diaChiChiTiet("")
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cc.getId(), objectType, GisObjectType.POINT, ccSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), cc.getId());
                        }
                    }
                    break;

                case VUNGNUOC:
                    List<WaterZone> vungNuocs = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> vnCbIds = vungNuocs.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> vnPortMap = new HashMap<>();
                    if (!vnCbIds.isEmpty()) {
                        portRepository.findAllById(vnCbIds).forEach(cb -> vnPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> vnSpatialMap = new HashMap<>();
                    if (!vungNuocs.isEmpty()) {
                        List<UUID> vnSpatialIds = vungNuocs.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!vnSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(vnSpatialIds).forEach(so -> vnSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : vungNuocs) {
                        Port parent = (vn.getPortId() != null) ? vnPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvince() != null)
                                ? parent.getProvince()
                                : "";
                        GisSpatialObject spatial = vnSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .ma(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Vùng nước")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
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
                                .ma("NC_" + nc.getId())
                                .orgName(getOrgName(nc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Luồng hàng hải")
                                .diaDiem("")
                                .diaChiChiTiet(nc.getNote() != null ? nc.getNote() : "")
                                .latitude(lat)
                                .longitude(lng)
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
                        List<UUID> spatialIds = dikeRevList.stream().map(DikeRevetment::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!spatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> dikeRevSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (DikeRevetment dk : dikeRevList) {
                        GisSpatialObject spatial = dikeRevSpatialMap.get(dk.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(dk.getId()))
                                .name(dk.getDikeRevetmentName() != null && !dk.getDikeRevetmentName().isEmpty() ? dk.getDikeRevetmentName() : "Đê kè")
                                .ma("DIR_" + dk.getId())
                                .orgName(getOrgName(dk.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Đê kè")
                                .diaDiem("")
                                .diaChiChiTiet(dk.getLocation() != null ? dk.getLocation() : "")
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, dk.getKhongGianId(), objectType, GisObjectType.LINE, dikeRevSpatialMap);
                        } else {
                            results.add(r);
                            if (dk.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), dk.getKhongGianId());
                            }
                        }
                    }
                    break;
 
                case COSO_SUACHUA:
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
                                .ma("COSO_" + cs.getId())
                                .orgName(getOrgName(cs.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cơ sở sửa chữa")
                                .diaDiem(cs.getProvince() != null ? cs.getProvince() : "")
                                .diaChiChiTiet(cs.getAddress() != null ? cs.getAddress() : "")
                                .latitude(lat)
                                .longitude(lng)
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

                case DENBIEN:
                    // 1. Fetch from LighthouseStation
                    String denSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<LighthouseStation> denList = lighthouseStationRepository.searchGis(orgUnitId, denSearchParam);
                    Map<UUID, GisSpatialObject> denSpatialMap = new HashMap<>();
                    if (objectType != null && !denList.isEmpty()) {
                        List<UUID> denIds = denList.stream().map(LighthouseStation::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(denIds, KchtType.DENBIEN)
                                .forEach(so -> denSpatialMap.put(so.getRefId(), so));
                    }
                    for (LighthouseStation den : denList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(den.getId() != null ? den.getId().toString() : null)
                                .name(den.getName())
                                .ma(den.getCode())
                                .orgName(getOrgName(den.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Nhà trạm đèn biển")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (den.getDescription() != null ? den.getDescription() : "") + ", Đặc tính ánh sáng: " + (den.getLightCharacteristic() != null ? den.getLightCharacteristic() : "") + ", Tầm hiệu lực: " + (den.getLightRange() != null ? den.getLightRange() : "") + " hải lý")
                                .latitude(den.getLatitude() != null ? den.getLatitude() : null)
                                .longitude(den.getLongitude() != null ? den.getLongitude() : null)
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
                        gisSpatialObjectRepository.findByRefIdInAndRefType(beaconIds, KchtType.DENBIEN)
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
                                .ma(beacon.getCode())
                                .orgName(getOrgName(beacon.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đèn biển")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (beacon.getLocation() != null ? beacon.getLocation() : "") + ", Đặc tính ánh sáng: " + (beacon.getPrimaryLightModel() != null ? beacon.getPrimaryLightModel() : "") + ", Tầm hiệu lực: " + (beacon.getLightRange() != null ? beacon.getLightRange() : "") + " hải lý")
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, beacon.getId(), objectType, GisObjectType.POINT, beaconSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), beacon.getId());
                        }
                    }
                    break;

                case PHAOTIEU:
                    String buoySearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<Buoy> buoyList = buoyRepository.searchGis(orgUnitId, buoySearchParam);
                    Map<UUID, GisSpatialObject> buoySpatialMap = new HashMap<>();
                    if (!buoyList.isEmpty()) {
                        List<UUID> buoyIds = buoyList.stream().map(Buoy::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(buoyIds, KchtType.PHAOTIEU)
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
                                .ma(buoy.getCode())
                                .orgName(getOrgName(buoy.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Phao, tiêu")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (buoy.getDescription() != null ? buoy.getDescription() : "") + ", Màu sắc: " + (buoy.getColor() != null ? buoy.getColor() : "") + ", Hình dạng: " + (buoy.getShape() != null ? buoy.getShape() : "") + ", Đặc tính ánh sáng: " + (buoy.getLightCharacteristic() != null ? buoy.getLightCharacteristic() : ""))
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, buoy.getId(), objectType, GisObjectType.POINT, buoySpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), buoy.getId());
                        }
                    }
                    break;

                case NHATRAM_PHAO:
                    String phaoSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<BuoyStation> phaoList = buoyStationRepository.searchGis(orgUnitId, phaoSearchParam);
                    Map<UUID, GisSpatialObject> phaoSpatialMap = new HashMap<>();
                    if (objectType != null && !phaoList.isEmpty()) {
                        List<UUID> phaoIds = phaoList.stream().map(BuoyStation::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(phaoIds, KchtType.NHATRAM_PHAO)
                                .forEach(so -> phaoSpatialMap.put(so.getRefId(), so));
                    }
                    for (BuoyStation phao : phaoList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(phao.getId() != null ? phao.getId().toString() : null)
                                .name(phao.getName())
                                .ma(phao.getCode())
                                .orgName(getOrgName(phao.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Nhà trạm phao tiêu")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (phao.getDescription() != null ? phao.getDescription() : "") + ", Màu sắc: " + (phao.getColor() != null ? phao.getColor() : "") + ", Hình dạng: " + (phao.getShape() != null ? phao.getShape() : "") + ", Đặc tính ánh sáng: " + (phao.getLightCharacteristic() != null ? phao.getLightCharacteristic() : ""))
                                .latitude(phao.getLatitude() != null ? phao.getLatitude() : null)
                                .longitude(phao.getLongitude() != null ? phao.getLongitude() : null)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, phao.getId(), objectType, GisObjectType.POINT, phaoSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), phao.getId());
                        }
                    }
                    break;

                case DAI_TTDH:
                    String vtsStSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationVTS> vtsStationList = coastalStationVTSRepository.searchGis(orgUnitId, vtsStSearchParam);
                    Map<UUID, GisSpatialObject> vtsStationSpatialMap = new HashMap<>();
                    if (objectType != null && !vtsStationList.isEmpty()) {
                        List<UUID> vtsStationIds = vtsStationList.stream().map(CoastalStationVTS::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(vtsStationIds, KchtType.DAI_TTDH)
                                .forEach(so -> vtsStationSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationVTS vtsStation : vtsStationList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vtsStation.getId() != null ? vtsStation.getId().toString() : null)
                                .name(vtsStation.getName())
                                .ma(vtsStation.getCode())
                                .orgName(getOrgName(vtsStation.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài TTDH")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (vtsStation.getDescription() != null ? vtsStation.getDescription() : ""))
                                .latitude(vtsStation.getLatitude() != null ? vtsStation.getLatitude() : null)
                                .longitude(vtsStation.getLongitude() != null ? vtsStation.getLongitude() : null)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vtsStation.getId(), objectType, GisObjectType.POINT, vtsStationSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), vtsStation.getId());
                        }
                    }
                    break;

                case DAI_INMARSAT:
                    String inmarsatSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationInmarsat> inmarsatList = coastalStationInmarsatRepository.searchGis(orgUnitId, inmarsatSearchParam);
                    Map<UUID, GisSpatialObject> inmarsatSpatialMap = new HashMap<>();
                    if (objectType != null && !inmarsatList.isEmpty()) {
                        List<UUID> inmarsatIds = inmarsatList.stream().map(CoastalStationInmarsat::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(inmarsatIds, KchtType.DAI_INMARSAT)
                                .forEach(so -> inmarsatSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationInmarsat inmarsat : inmarsatList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(inmarsat.getId() != null ? inmarsat.getId().toString() : null)
                                .name(inmarsat.getName())
                                .ma(inmarsat.getCode())
                                .orgName(getOrgName(inmarsat.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (inmarsat.getDescription() != null ? inmarsat.getDescription() : ""))
                                .latitude(inmarsat.getLatitude() != null ? inmarsat.getLatitude() : null)
                                .longitude(inmarsat.getLongitude() != null ? inmarsat.getLongitude() : null)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, inmarsat.getId(), objectType, GisObjectType.POINT, inmarsatSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), inmarsat.getId());
                        }
                    }
                    break;

                case DAI_COSPAS_SARSAT:
                    String cospasSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationCospasSarsat> cospasSarsatList = coastalStationCospasSarsatRepository.searchGis(orgUnitId, cospasSearchParam);
                    Map<UUID, GisSpatialObject> cospasSarsatSpatialMap = new HashMap<>();
                    if (objectType != null && !cospasSarsatList.isEmpty()) {
                        List<UUID> cospasSarsatIds = cospasSarsatList.stream().map(CoastalStationCospasSarsat::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(cospasSarsatIds, KchtType.DAI_COSPAS_SARSAT)
                                .forEach(so -> cospasSarsatSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationCospasSarsat cospasSarsat : cospasSarsatList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cospasSarsat.getId() != null ? cospasSarsat.getId().toString() : null)
                                .name(cospasSarsat.getName())
                                .ma(cospasSarsat.getCode())
                                .orgName(getOrgName(cospasSarsat.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (cospasSarsat.getDescription() != null ? cospasSarsat.getDescription() : ""))
                                .latitude(cospasSarsat.getLatitude() != null ? cospasSarsat.getLatitude() : null)
                                .longitude(cospasSarsat.getLongitude() != null ? cospasSarsat.getLongitude() : null)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cospasSarsat.getId(), objectType, GisObjectType.POINT, cospasSarsatSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), cospasSarsat.getId());
                        }
                    }
                    break;

                case DAI_LRIT:
                    String lritSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationLRIT> lritList = coastalStationLRITRepository.searchGis(orgUnitId, lritSearchParam);
                    Map<UUID, GisSpatialObject> lritSpatialMap = new HashMap<>();
                    if (objectType != null && !lritList.isEmpty()) {
                        List<UUID> lritIds = lritList.stream().map(CoastalStationLRIT::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(lritIds, KchtType.DAI_LRIT)
                                .forEach(so -> lritSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationLRIT lrit : lritList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(lrit.getId() != null ? lrit.getId().toString() : null)
                                .name(lrit.getName())
                                .ma(lrit.getCode())
                                .orgName(getOrgName(lrit.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (lrit.getDescription() != null ? lrit.getDescription() : ""))
                                .latitude(lrit.getLatitude() != null ? lrit.getLatitude() : null)
                                .longitude(lrit.getLongitude() != null ? lrit.getLongitude() : null)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, lrit.getId(), objectType, GisObjectType.POINT, lritSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), lrit.getId());
                        }
                    }
                    break;

                case DAI_HANOI:
                    String haiphongSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<CoastalStationHaiphong> haiphongList = coastalStationHaiphongRepository.searchGis(orgUnitId, haiphongSearchParam);
                    Map<UUID, GisSpatialObject> haiphongSpatialMap = new HashMap<>();
                    if (objectType != null && !haiphongList.isEmpty()) {
                        List<UUID> haiphongIds = haiphongList.stream().map(CoastalStationHaiphong::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(haiphongIds, KchtType.DAI_HANOI)
                                .forEach(so -> haiphongSpatialMap.put(so.getRefId(), so));
                    }
                    for (CoastalStationHaiphong haiphong : haiphongList) {
                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(haiphong.getId() != null ? haiphong.getId().toString() : null)
                                .name(haiphong.getName())
                                .ma(haiphong.getCode())
                                .orgName(getOrgName(haiphong.getUnitId(), orgNameMap))
                                .kchtTypeLabel("Đài Trung tâm xử lý thông tin hàng hải Hà Nội")
                                .diaDiem("")
                                .diaChiChiTiet("Mô tả: " + (haiphong.getDescription() != null ? haiphong.getDescription() : ""))
                                .latitude(haiphong.getLatitude() != null ? haiphong.getLatitude() : null)
                                .longitude(haiphong.getLongitude() != null ? haiphong.getLongitude() : null)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, haiphong.getId(), objectType, GisObjectType.POINT, haiphongSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), haiphong.getId());
                        }
                    }
                    break;

                case HE_THONG_VTS:
                    String vtsSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<VtsSystem> vtsList = vtsSystemRepository.searchFiltered(orgUnitId, vtsSearchParam);
                    Map<UUID, GisSpatialObject> vtsSpatialMap = new HashMap<>();
                    if (!vtsList.isEmpty()) {
                        List<UUID> vtsSpatialIds = vtsList.stream().map(VtsSystem::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!vtsSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(vtsSpatialIds).forEach(so -> vtsSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VtsSystem vts : vtsList) {
                        GisSpatialObject spatial = vtsSpatialMap.get(vts.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(vts.getId()))
                                .name(vts.getSystemName())
                                .ma("VTS_" + vts.getId())
                                .orgName(getOrgName(vts.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Hệ thống VTS")
                                .diaDiem("")
                                .diaChiChiTiet("Vị trí: " + (vts.getLocation() != null ? vts.getLocation() : "") + ", Tình trạng: " + (vts.getConditionStatus() != null ? ("TOT".equals(vts.getConditionStatus()) ? "Tốt" : "XUONG_CAP".equals(vts.getConditionStatus()) ? "Xuống cấp" : "Hư hỏng") : "") + ", Mức độ phụ trách: " + (vts.getResponsibilityLevel() != null ? vts.getResponsibilityLevel() : ""))
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vts.getKhongGianId(), objectType, GisObjectType.POINT, vtsSpatialMap);
                        } else {
                            results.add(r);
                            if (vts.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), vts.getKhongGianId());
                            }
                        }
                    }
                    break;

                case TRAM_RADAR:
                    String radarSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<RadarStation> radarList = radarStationRepository.searchFiltered(orgUnitId, radarSearchParam);
                    Map<UUID, GisSpatialObject> radarSpatialMap = new HashMap<>();
                    if (!radarList.isEmpty()) {
                        List<UUID> radarIds = radarList.stream().map(RadarStation::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(radarIds, KchtType.TRAM_RADAR)
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
                                .ma("RADAR_" + rs.getId())
                                .orgName(getOrgName(rs.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Trạm radar")
                                .diaDiem("")
                                .diaChiChiTiet("Vị trí: " + (rs.getLocation() != null ? rs.getLocation() : "") + ", Loại trạm: " + (rs.getStationType() != null ? rs.getStationType() : "") + ", Tình trạng: " + (rs.getConditionStatus() != null ? rs.getConditionStatus() : ""))
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, dtoId, objectType, GisObjectType.POINT, radarSpatialMap);
                        } else {
                            results.add(r);
                            spatialIdMap.put(r.getId(), dtoId);
                        }
                    }
                    break;

                case BENPHAO:
                    List<WaterZone> benPhaos = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, LoaiVungNuoc.BEN_PHAO, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
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
                        String parentProvince = (parent != null && parent.getProvince() != null)
                                ? parent.getProvince()
                                : "";
                        GisSpatialObject spatial = bpSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .ma(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Bến phao")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
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

                case KHUNEO_DAU:
                    List<WaterZone> khuNeos = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, LoaiVungNuoc.NEO_DAU, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> knCbIds = khuNeos.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, Port> knPortMap = new HashMap<>();
                    if (!knCbIds.isEmpty()) {
                        portRepository.findAllById(knCbIds).forEach(cb -> knPortMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> knSpatialMap = new HashMap<>();
                    if (!khuNeos.isEmpty()) {
                        List<UUID> knSpatialIds = khuNeos.stream().map(WaterZone::getSpatialId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!knSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(knSpatialIds).forEach(so -> knSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (WaterZone vn : khuNeos) {
                        Port parent = (vn.getPortId() != null) ? knPortMap.get(vn.getPortId()) : null;
                        String parentProvince = (parent != null && parent.getProvince() != null)
                                ? parent.getProvince()
                                : "";
                        GisSpatialObject spatial = knSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .ma(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Khu neo đậu")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
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

                case KHUCHUYEN_TAI:
                    List<WaterZone> khuChuyens = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, LoaiVungNuoc.CHUYEN_TAI, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
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
                        String parentProvince = (parent != null && parent.getProvince() != null)
                                ? parent.getProvince()
                                : "";
                        GisSpatialObject spatial = kcSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .ma(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Khu chuyển tải")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
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

                case KHUTRANH_TRU_BAO:
                    List<WaterZone> khuTranhs = waterZoneRepository.searchWaterZones(
                            orgUnitId, null, searchLower, LoaiVungNuoc.TRANH_BAO, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
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
                        String parentProvince = (parent != null && parent.getProvince() != null)
                                ? parent.getProvince()
                                : "";
                        GisSpatialObject spatial = ktSpatialMap.get(vn.getSpatialId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getWaterZoneName())
                                .ma(vn.getWaterZoneCode())
                                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Khu tránh trú bão")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
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
                        r.setLoaiHinhHoc(geomTypeStr);
                        r.setToaDo(spatial.getCoordinates());

                        double[] coords = parseFirstCoordinateFromWkt(spatial.getCoordinates());
                        if (coords != null) {
                            r.setLatitude(coords[0]);
                            r.setLongitude(coords[1]);
                        }
                    }
                }
            }
        }

        // Apply location/province filter post-collection
        if (tinhThanhStr != null && !tinhThanhStr.isEmpty()) {
            final String targetProv = tinhThanhStr.toLowerCase();
            results = results.stream()
                    .filter(r -> (r.getDiaDiem() != null && r.getDiaDiem().toLowerCase().contains(targetProv)) ||
                                 (r.getOrgName() != null && r.getOrgName().toLowerCase().contains(targetProv)))
                    .collect(Collectors.toList());
        }

        return results;
    }
}
