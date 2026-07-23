package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.cangben.entity.*;
import com.hanghai.kchtg.cangben.repository.*;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentApprovalStatus;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.cosuachua.entity.CoSuaChuaDongTau;
import com.hanghai.kchtg.cosuachua.repository.CoSuaChuaDongTauRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramPhaoRepository;
import com.hanghai.kchtg.vts.entity.HeThongVTS;
import com.hanghai.kchtg.vts.repository.HeThongVTSRepository;
import com.hanghai.kchtg.tramradar.entity.TramRadar;
import com.hanghai.kchtg.tramradar.repository.TramRadarRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.entity.BeaconApprovalStatus;
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

    private final CangBienRepository cangBienRepository;
    private final BenCangRepository benCangRepository;
    private final CauCangRepository cauCangRepository;
    private final CangCanRepository cangCanRepository;
    private final VungNuocRepository vungNuocRepository;
    private final NavigationChannelRepository navigationChannelRepository;
    private final DikeRevetmentRepository dikeRevetmentRepository;
    private final CoSuaChuaDongTauRepository coSuaChuaDongTauRepository;
    private final NhaTramDenRepository nhaTramDenRepository;
    private final NhaTramPhaoRepository nhaTramPhaoRepository;
    private final HeThongVTSRepository heThongVTSRepository;
    private final TramRadarRepository tramRadarRepository;
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

    private void explainAndLogCauCangQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
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

    private void explainAndLogBenCangQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
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

    private void explainAndLogCangBienQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
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

    private void explainAndLogVungNuocQuery(UUID orgUnitId, String search, TrangThaiHoatDong hd, TrangThaiPheDuyet pd) {
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
                    List<CangBien> cangBiens = cangBienRepository.searchCangBien(
                            orgUnitId, null, null, tinhThanhStr, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, searchLower, PageRequest.of(0, 10000)).getContent();
                    Map<UUID, GisSpatialObject> cbSpatialMap = new HashMap<>();
                    if (!cangBiens.isEmpty()) {
                        List<UUID> cbIds = cangBiens.stream().map(CangBien::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(cbIds, KchtType.CANGBIEN)
                                .forEach(so -> cbSpatialMap.put(so.getRefId(), so));
                    }
                    for (CangBien cb : cangBiens) {
                        GisSpatialObject spatial = cbSpatialMap.get(cb.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cb.getId() != null ? cb.getId().toString() : null)
                                .name(cb.getTenCang())
                                .ma(cb.getMaCang())
                                .orgName(getOrgName(cb.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cảng biển")
                                .diaDiem(cb.getTinhThanhPho() != null ? cb.getTinhThanhPho() : "")
                                .diaChiChiTiet("")
                                .latitude(lat)
                                .longitude(lng)
                                .bieuTuongId(cb.getBieuTuongId())
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
                    List<BenCang> benCangs = benCangRepository.searchBenCang(
                            orgUnitId, searchLower, null, null, null, null, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> cbIds = benCangs.stream().map(BenCang::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> bcCangBienMap = new HashMap<>();
                    if (!cbIds.isEmpty()) {
                        cangBienRepository.findAllById(cbIds).forEach(cb -> bcCangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> bcSpatialMap = new HashMap<>();
                    if (!benCangs.isEmpty()) {
                        List<UUID> bcIds = benCangs.stream().map(BenCang::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(bcIds, KchtType.BENCANG)
                                .forEach(so -> bcSpatialMap.put(so.getRefId(), so));
                    }
                    for (BenCang bc : benCangs) {
                        CangBien parent = (bc.getCangBienId() != null) ? bcCangBienMap.get(bc.getCangBienId()) : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        GisSpatialObject spatial = bcSpatialMap.get(bc.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(bc.getId() != null ? bc.getId().toString() : null)
                                .name(bc.getTenBen())
                                .ma(bc.getMaBen())
                                .orgName(getOrgName(bc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Bến cảng")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(bc.getTuyenDuongThuy() != null ? bc.getTuyenDuongThuy() : "")
                                .latitude(lat)
                                .longitude(lng)
                                .bieuTuongId(bc.getBieuTuongId())
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
                    List<CauCang> cauCangs = cauCangRepository.searchCauCang(
                            orgUnitId, searchLower, null, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> parentBenIds = cauCangs.stream().map(CauCang::getBenCangId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, BenCang> benCangMap = new HashMap<>();
                    if (!parentBenIds.isEmpty()) {
                        benCangRepository.findAllById(parentBenIds).forEach(bc -> benCangMap.put(bc.getId(), bc));
                    }
                    List<UUID> parentCbIds = benCangMap.values().stream().map(BenCang::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> cangBienMap = new HashMap<>();
                    if (!parentCbIds.isEmpty()) {
                        cangBienRepository.findAllById(parentCbIds).forEach(cb -> cangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> parentBenSpatialMap = new HashMap<>();
                    if (!parentBenIds.isEmpty()) {
                        gisSpatialObjectRepository.findByRefIdInAndRefType(parentBenIds, KchtType.BENCANG)
                                .forEach(so -> parentBenSpatialMap.put(so.getRefId(), so));
                    }
                    Map<UUID, GisSpatialObject> spatialMap = new HashMap<>();
                    if (objectType != null) {
                        List<UUID> spatialIds = cauCangs.stream().map(CauCang::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!spatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> spatialMap.put(so.getId(), so));
                        }
                    }
                    for (CauCang cc : cauCangs) {
                        BenCang parentBen = (cc.getBenCangId() != null) ? benCangMap.get(cc.getBenCangId()) : null;
                        CangBien parentCb = (parentBen != null && parentBen.getCangBienId() != null) ? cangBienMap.get(parentBen.getCangBienId()) : null;
                        String parentProvince = (parentCb != null && parentCb.getTinhThanhPho() != null) ? parentCb.getTinhThanhPho() : "";
                        
                        GisSpatialObject parentBenSpatial = (parentBen != null) ? parentBenSpatialMap.get(parentBen.getId()) : null;
                        double[] coords = parentBenSpatial != null ? parseFirstCoordinateFromWkt(parentBenSpatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cc.getId() != null ? cc.getId().toString() : null)
                                .name(cc.getTenCau())
                                .ma(cc.getMaCau())
                                .orgName(getOrgName(cc.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Cầu cảng")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parentBen != null ? "Thuộc bến cảng: " + parentBen.getTenBen() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(cc.getBieuTuongId())
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cc.getKhongGianId(), objectType, GisObjectType.LINE, spatialMap);
                        } else {
                            results.add(r);
                            if (cc.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), cc.getKhongGianId());
                            }
                        }
                    }
                    break;

                case CANGCAN:
                    List<CangCan> cangCans = cangCanRepository.searchCangCan(
                            orgUnitId, searchLower, TrangThaiHoatDong.HIEN_HANH, TrangThaiPheDuyet.DUOC_PHE_DUYET,
                            PageRequest.of(0, 10000)).getContent();
                    Map<UUID, GisSpatialObject> ccSpatialMap = new HashMap<>();
                    if (!cangCans.isEmpty()) {
                        List<UUID> ccIds = cangCans.stream().map(CangCan::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(ccIds, KchtType.CANGCAN)
                                .forEach(so -> ccSpatialMap.put(so.getRefId(), so));
                    }
                    for (CangCan cc : cangCans) {
                        GisSpatialObject spatial = ccSpatialMap.get(cc.getId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(cc.getId() != null ? cc.getId().toString() : null)
                                .name(cc.getTenCangCan())
                                .ma(cc.getMaCangCan())
                                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cảng cạn")
                                .diaDiem(cc.getTinhThanhPho() != null ? cc.getTinhThanhPho() : "")
                                .diaChiChiTiet("")
                                .latitude(lat)
                                .longitude(lng)
                                .bieuTuongId(cc.getBieuTuongId())
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
                    List<VungNuoc> vungNuocs = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, null, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> vnCbIds = vungNuocs.stream().map(VungNuoc::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> vnCangBienMap = new HashMap<>();
                    if (!vnCbIds.isEmpty()) {
                        cangBienRepository.findAllById(vnCbIds).forEach(cb -> vnCangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> vnSpatialMap = new HashMap<>();
                    if (!vungNuocs.isEmpty()) {
                        List<UUID> vnSpatialIds = vungNuocs.stream().map(VungNuoc::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!vnSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(vnSpatialIds).forEach(so -> vnSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VungNuoc vn : vungNuocs) {
                        CangBien parent = (vn.getCangBienId() != null) ? vnCangBienMap.get(vn.getCangBienId()) : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        GisSpatialObject spatial = vnSpatialMap.get(vn.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Vùng nước")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getTenCang() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getKhongGianId(), objectType, GisObjectType.POLYGON, vnSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), vn.getKhongGianId());
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
                    List<CoSuaChuaDongTau> csList = coSuaChuaDongTauRepository.searchFiltered(orgUnitId, csSearchParam);
                    Map<UUID, GisSpatialObject> csSpatialMap = new HashMap<>();
                    if (!csList.isEmpty()) {
                        List<UUID> csSpatialIds = csList.stream().map(CoSuaChuaDongTau::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!csSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(csSpatialIds).forEach(so -> csSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (CoSuaChuaDongTau cs : csList) {
                        GisSpatialObject spatial = csSpatialMap.get(cs.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(cs.getId()))
                                .name(cs.getTenCoSo())
                                .ma("COSO_" + cs.getId())
                                .orgName(getOrgName(cs.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Cơ sở sửa chữa")
                                .diaDiem(cs.getTinhThanh() != null ? cs.getTinhThanh() : "")
                                .diaChiChiTiet(cs.getDiaChi() != null ? cs.getDiaChi() : "")
                                .latitude(lat)
                                .longitude(lng)
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, cs.getKhongGianId(), objectType, GisObjectType.POINT, csSpatialMap);
                        } else {
                            results.add(r);
                            if (cs.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), cs.getKhongGianId());
                            }
                        }
                    }
                    break;

                case DENBIEN:
                    // 1. Fetch from NhaTramDen
                    String denSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
                    List<NhaTramDen> denList = nhaTramDenRepository.searchGis(orgUnitId, denSearchParam);
                    Map<UUID, GisSpatialObject> denSpatialMap = new HashMap<>();
                    if (objectType != null && !denList.isEmpty()) {
                        List<UUID> denIds = denList.stream().map(NhaTramDen::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(denIds, KchtType.DENBIEN)
                                .forEach(so -> denSpatialMap.put(so.getRefId(), so));
                    }
                    for (NhaTramDen den : denList) {
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
                                .diaChiChiTiet("Mô tả: " + (beacon.getDescription() != null ? beacon.getDescription() : "") + ", Đặc tính ánh sáng: " + (beacon.getLightCharacteristic() != null ? beacon.getLightCharacteristic() : "") + ", Tầm hiệu lực: " + (beacon.getLightRange() != null ? beacon.getLightRange() : "") + " hải lý")
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
                    List<NhaTramPhao> phaoList = nhaTramPhaoRepository.searchGis(orgUnitId, phaoSearchParam);
                    Map<UUID, GisSpatialObject> phaoSpatialMap = new HashMap<>();
                    if (objectType != null && !phaoList.isEmpty()) {
                        List<UUID> phaoIds = phaoList.stream().map(NhaTramPhao::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(phaoIds, KchtType.NHATRAM_PHAO)
                                .forEach(so -> phaoSpatialMap.put(so.getRefId(), so));
                    }
                    for (NhaTramPhao phao : phaoList) {
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
                    List<HeThongVTS> vtsList = heThongVTSRepository.searchFiltered(orgUnitId, vtsSearchParam);
                    Map<UUID, GisSpatialObject> vtsSpatialMap = new HashMap<>();
                    if (!vtsList.isEmpty()) {
                        List<UUID> vtsSpatialIds = vtsList.stream().map(HeThongVTS::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!vtsSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(vtsSpatialIds).forEach(so -> vtsSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (HeThongVTS vts : vtsList) {
                        GisSpatialObject spatial = vtsSpatialMap.get(vts.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(vts.getId()))
                                .name(vts.getTenHeThong())
                                .ma("VTS_" + vts.getId())
                                .orgName(getOrgName(vts.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Hệ thống VTS")
                                .diaDiem("")
                                .diaChiChiTiet("Vị trí: " + (vts.getViTri() != null ? vts.getViTri() : "") + ", Tình trạng: " + (vts.getTinhTrang() != null ? (vts.getTinhTrang() == com.hanghai.kchtg.vts.entity.TinhTrangVTS.TOT ? "Tốt" : vts.getTinhTrang() == com.hanghai.kchtg.vts.entity.TinhTrangVTS.XUONG_CAP ? "Xuống cấp" : "Hư hỏng") : "") + ", Mức độ phụ trách: " + (vts.getMucDoPhuTrach() != null ? vts.getMucDoPhuTrach() : ""))
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
                    List<TramRadar> radarList = tramRadarRepository.searchFiltered(orgUnitId, radarSearchParam);
                    Map<UUID, GisSpatialObject> radarSpatialMap = new HashMap<>();
                    if (!radarList.isEmpty()) {
                        List<UUID> radarIds = radarList.stream().map(TramRadar::getId).collect(Collectors.toList());
                        gisSpatialObjectRepository.findByRefIdInAndRefType(radarIds, KchtType.TRAM_RADAR)
                                .forEach(so -> radarSpatialMap.put(so.getRefId(), so));
                    }
                    for (TramRadar tr : radarList) {
                        UUID dtoId = tr.getId();
                        GisSpatialObject spatial = radarSpatialMap.get(dtoId);
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double lat = coords != null ? coords[0] : null;
                        Double lng = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(String.valueOf(tr.getId()))
                                .name(tr.getTenTram())
                                .ma("RADAR_" + tr.getId())
                                .orgName(getOrgName(tr.getOrgUnitId(), orgNameMap))
                                .kchtTypeLabel("Trạm radar")
                                .diaDiem("")
                                .diaChiChiTiet("Vị trí: " + (tr.getViTri() != null ? tr.getViTri() : "") + ", Loại trạm: " + (tr.getLoaiTram() != null ? tr.getLoaiTram() : "") + ", Tình trạng: " + (tr.getTinhTrang() != null ? tr.getTinhTrang() : ""))
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
                    List<VungNuoc> benPhaos = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.BEN_PHAO, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> bpCbIds = benPhaos.stream().map(VungNuoc::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> bpCangBienMap = new HashMap<>();
                    if (!bpCbIds.isEmpty()) {
                        cangBienRepository.findAllById(bpCbIds).forEach(cb -> bpCangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> bpSpatialMap = new HashMap<>();
                    if (!benPhaos.isEmpty()) {
                        List<UUID> bpSpatialIds = benPhaos.stream().map(VungNuoc::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!bpSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(bpSpatialIds).forEach(so -> bpSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VungNuoc vn : benPhaos) {
                        CangBien parent = (vn.getCangBienId() != null) ? bpCangBienMap.get(vn.getCangBienId()) : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        GisSpatialObject spatial = bpSpatialMap.get(vn.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Bến phao")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getTenCang() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getKhongGianId(), objectType, GisObjectType.POLYGON, bpSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), vn.getKhongGianId());
                            }
                        }
                    }
                    break;

                case KHUNEO_DAU:
                    List<VungNuoc> khuNeos = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.NEO_DAU, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> knCbIds = khuNeos.stream().map(VungNuoc::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> knCangBienMap = new HashMap<>();
                    if (!knCbIds.isEmpty()) {
                        cangBienRepository.findAllById(knCbIds).forEach(cb -> knCangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> knSpatialMap = new HashMap<>();
                    if (!khuNeos.isEmpty()) {
                        List<UUID> knSpatialIds = khuNeos.stream().map(VungNuoc::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!knSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(knSpatialIds).forEach(so -> knSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VungNuoc vn : khuNeos) {
                        CangBien parent = (vn.getCangBienId() != null) ? knCangBienMap.get(vn.getCangBienId()) : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        GisSpatialObject spatial = knSpatialMap.get(vn.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Khu neo đậu")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getTenCang() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getKhongGianId(), objectType, GisObjectType.POLYGON, knSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), vn.getKhongGianId());
                            }
                        }
                    }
                    break;

                case KHUCHUYEN_TAI:
                    List<VungNuoc> khuChuyens = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.CHUYEN_TAI, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> kcCbIds = khuChuyens.stream().map(VungNuoc::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> kcCangBienMap = new HashMap<>();
                    if (!kcCbIds.isEmpty()) {
                        cangBienRepository.findAllById(kcCbIds).forEach(cb -> kcCangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> kcSpatialMap = new HashMap<>();
                    if (!khuChuyens.isEmpty()) {
                        List<UUID> kcSpatialIds = khuChuyens.stream().map(VungNuoc::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!kcSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(kcSpatialIds).forEach(so -> kcSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VungNuoc vn : khuChuyens) {
                        CangBien parent = (vn.getCangBienId() != null) ? kcCangBienMap.get(vn.getCangBienId()) : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        GisSpatialObject spatial = kcSpatialMap.get(vn.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Khu chuyển tải")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getTenCang() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getKhongGianId(), objectType, GisObjectType.POLYGON, kcSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), vn.getKhongGianId());
                            }
                        }
                    }
                    break;

                case KHUTRANH_TRU_BAO:
                    List<VungNuoc> khuTranhs = vungNuocRepository.searchVungNuoc(
                            orgUnitId, null, searchLower, LoaiVungNuoc.TRANH_BAO, TrangThaiHoatDong.HIEN_HANH,
                            TrangThaiPheDuyet.DUOC_PHE_DUYET, PageRequest.of(0, 10000)).getContent();
                    List<UUID> ktCbIds = khuTranhs.stream().map(VungNuoc::getCangBienId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                    Map<UUID, CangBien> ktCangBienMap = new HashMap<>();
                    if (!ktCbIds.isEmpty()) {
                        cangBienRepository.findAllById(ktCbIds).forEach(cb -> ktCangBienMap.put(cb.getId(), cb));
                    }
                    Map<UUID, GisSpatialObject> ktSpatialMap = new HashMap<>();
                    if (!khuTranhs.isEmpty()) {
                        List<UUID> ktSpatialIds = khuTranhs.stream().map(VungNuoc::getKhongGianId).filter(Objects::nonNull).distinct().collect(Collectors.toList());
                        if (!ktSpatialIds.isEmpty()) {
                            gisSpatialObjectRepository.findAllById(ktSpatialIds).forEach(so -> ktSpatialMap.put(so.getId(), so));
                        }
                    }
                    for (VungNuoc vn : khuTranhs) {
                        CangBien parent = (vn.getCangBienId() != null) ? ktCangBienMap.get(vn.getCangBienId()) : null;
                        String parentProvince = (parent != null && parent.getTinhThanhPho() != null)
                                ? parent.getTinhThanhPho()
                                : "";
                        GisSpatialObject spatial = ktSpatialMap.get(vn.getKhongGianId());
                        double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates()) : null;
                        Double viDo = coords != null ? coords[0] : null;
                        Double kinhDo = coords != null ? coords[1] : null;

                        KchtGisSearchResult r = KchtGisSearchResult.builder()
                                .id(vn.getId() != null ? vn.getId().toString() : null)
                                .name(vn.getTenVungNuoc())
                                .ma(vn.getMaVungNuoc())
                                .orgName(getOrgName(vn.getDonViId(), orgNameMap))
                                .kchtTypeLabel("Khu tránh trú bão")
                                .diaDiem(parentProvince)
                                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getTenCang() : "")
                                .latitude(viDo)
                                .longitude(kinhDo)
                                .bieuTuongId(vn.getBieuTuongId())
                                .build();
                        if (objectType != null) {
                            populateSpatialAndFilterFromMap(results, r, vn.getKhongGianId(), objectType, GisObjectType.POLYGON, ktSpatialMap);
                        } else {
                            results.add(r);
                            if (vn.getKhongGianId() != null) {
                                spatialIdMap.put(r.getId(), vn.getKhongGianId());
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
                        if (spatial.getBieuTuongId() != null) {
                            r.setBieuTuongId(spatial.getBieuTuongId());
                        }

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
