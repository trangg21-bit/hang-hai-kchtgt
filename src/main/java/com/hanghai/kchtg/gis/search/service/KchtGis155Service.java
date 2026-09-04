package com.hanghai.kchtg.gis.search.service;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.gis.search.dto.GisObjectType;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchPage;
import com.hanghai.kchtg.gis.search.dto.KchtGisSearchResult;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KchtGis155Service {

  private static final int MAX_PAGE_SIZE = 100;
  private static final int MAX_FETCH_SIZE = 1000;
  private static final Pattern WKT_COORDINATE_PATTERN = Pattern.compile(
      "(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)");
  private static final List<InfrastructureType> SEARCHABLE_TYPES = List.of(
      InfrastructureType.SEAPORT,
      InfrastructureType.PORT_TERMINAL,
      InfrastructureType.PIER,
      InfrastructureType.WATER_AREA,
      InfrastructureType.BUOY_BERTH,
      InfrastructureType.ANCHORAGE_AREA,
      InfrastructureType.TRANSSHIPMENT_AREA,
      InfrastructureType.STORM_SHELTER_AREA,
      InfrastructureType.SHIP_REPAIR_FACILITY,
      InfrastructureType.LIGHTHOUSE,
      InfrastructureType.BUOY_STATION,
      InfrastructureType.BUOY,
      InfrastructureType.VTS_SYSTEM,
      InfrastructureType.RADAR_STATION_LEGACY,
      InfrastructureType.DIKE_REVETMENT,
      InfrastructureType.NAVIGATION_CHANNEL,
      InfrastructureType.COASTAL_RADIO_STATION,
      InfrastructureType.INMARSAT_STATION,
      InfrastructureType.COSPAS_SARSAT_STATION,
      InfrastructureType.LRIT_STATION,
      InfrastructureType.HANOI_STATION,
      InfrastructureType.DRY_PORT);

  private final PortRepository portRepository;
  private final BerthRepository berthRepository;
  private final PierRepository pierRepository;
  private final DryPortRepository dryPortRepository;
  private final OrgUnitScopeService orgUnitScopeService;
  private final WaterZoneRepository waterZoneRepository;
  private final NavigationChannelRepository navigationChannelRepository;
  private final DikeRevetmentRepository dikeRevetmentRepository;
  private final ShipRepairFacilityRepository shipRepairFacilityRepository;
  private final BuoyStationRepository buoyStationRepository;
  private final VtsSystemRepository vtsSystemRepository;
  private final RadarStationRepository radarStationRepository;
  private final OrgUnitCacheService orgUnitCacheService;
  private final GisSpatialObjectRepository gisSpatialObjectRepository;
  private final BeaconStationRepository beaconStationRepository;
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
    String fullName = orgNameMap.getOrDefault(orgUnitId, "Cục Hàng hải Việt Nam");
    if (fullName != null && fullName.contains(" > ")) {
      String[] parts = fullName.split(" > ");
      return parts[parts.length - 1].trim();
    }
    return fullName;
  }

  private double[] parseFirstCoordinateFromWkt(String wkt) {
    if (wkt == null || wkt.trim().isEmpty()) {
      return null;
    }
    try {
      java.util.regex.Matcher m = java.util.regex.Pattern
          .compile("(-?\\d+\\.\\d+|-?\\d+)\\s+(-?\\d+\\.\\d+|-?\\d+)").matcher(wkt);
      if (m.find()) {
        double lon = Double.parseDouble(m.group(1));
        double lat = Double.parseDouble(m.group(2));
        return new double[] { lat, lon };
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
        "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_cau) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_cau) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) "
        +
        "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) "
        +
        "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
    try {
      jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
      query.setParameter("orgUnitId", orgUnitId);
      query.setParameter("search", search);
      query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
      query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
      List<?> result = query.getResultList();

      String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null,
          pd != null ? pd.ordinal() : null);
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
        "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_ben) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_ben) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) "
        +
        "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) "
        +
        "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
    try {
      jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
      query.setParameter("orgUnitId", orgUnitId);
      query.setParameter("search", search);
      query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
      query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
      List<?> result = query.getResultList();

      String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null,
          pd != null ? pd.ordinal() : null);
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
        "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_cang) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_cang) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) "
        +
        "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) "
        +
        "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
    try {
      jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
      query.setParameter("orgUnitId", orgUnitId);
      query.setParameter("search", search);
      query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
      query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
      List<?> result = query.getResultList();

      String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null,
          pd != null ? pd.ordinal() : null);
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
    String sql = "EXPLAIN ANALYZE SELECT id, ten_vung_nuoc, ma_vung_nuoc FROM public.vung_nuoc WHERE deleted_at IS NULL "
        +
        "AND (CAST(:orgUnitId AS uuid) IS NULL OR org_unit_id = CAST(:orgUnitId AS uuid)) " +
        "AND (CAST(:search AS text) IS NULL OR (LOWER(ma_vung_nuoc) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(ten_vung_nuoc) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')))) "
        +
        "AND (CAST(:operationalStatus AS integer) IS NULL OR trang_thai_hoat_dong = CAST(:operationalStatus AS integer)) "
        +
        "AND (CAST(:ApprovalStatus AS integer) IS NULL OR trang_thai_phe_duyet = CAST(:ApprovalStatus AS integer))";
    try {
      jakarta.persistence.Query query = entityManager.createNativeQuery(sql);
      query.setParameter("orgUnitId", orgUnitId);
      query.setParameter("search", search);
      query.setParameter("operationalStatus", hd != null ? hd.ordinal() : null);
      query.setParameter("ApprovalStatus", pd != null ? pd.ordinal() : null);
      List<?> result = query.getResultList();

      String execSql = getExecutableSql(sql, orgUnitId, search, hd != null ? hd.ordinal() : null,
          pd != null ? pd.ordinal() : null);
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

  private UUID firstNonNull(UUID... values) {
    for (UUID value : values) {
      if (value != null) {
        return value;
      }
    }
    return null;
  }

  private boolean isApproved(ApprovalStatus status) {
    return status == ApprovalStatus.APPROVED || status == ApprovalStatus.APPROVED_LEVEL2;
  }

  static double[] representativeCoordinate(String wkt, String geometryType) {
    if (wkt == null || wkt.trim().isEmpty()) {
      return null;
    }
    try {
      Matcher matcher = WKT_COORDINATE_PATTERN.matcher(wkt);
      List<double[]> coordinates = new ArrayList<>();
      while (matcher.find()) {
        coordinates.add(new double[] {
            Double.parseDouble(matcher.group(2)),
            Double.parseDouble(matcher.group(1))
        });
      }
      if (coordinates.isEmpty()) {
        return null;
      }
      if (!"POLYGON".equalsIgnoreCase(geometryType)) {
        return coordinates.get(0);
      }
      double minLat = coordinates.stream().mapToDouble(point -> point[0]).min().orElse(coordinates.get(0)[0]);
      double maxLat = coordinates.stream().mapToDouble(point -> point[0]).max().orElse(coordinates.get(0)[0]);
      double minLon = coordinates.stream().mapToDouble(point -> point[1]).min().orElse(coordinates.get(0)[1]);
      double maxLon = coordinates.stream().mapToDouble(point -> point[1]).max().orElse(coordinates.get(0)[1]);
      return new double[] { (minLat + maxLat) / 2, (minLon + maxLon) / 2 };
    } catch (NumberFormatException ignored) {
      return null;
    }
  }

  private void enrichRepresentativeCoordinate(KchtGisSearchResult result) {
    double[] coordinate = representativeCoordinate(result.getCoordinates(), result.getGeometryType());
    if (coordinate != null) {
      result.setLatitude(coordinate[0]);
      result.setLongitude(coordinate[1]);
    }
  }

  private void populateSpatialAndFilter(List<KchtGisSearchResult> results, KchtGisSearchResult result,
      UUID khongGianId, GisObjectType objectType, GisObjectType fallbackType) {
    if (khongGianId != null) {
      Optional<GisSpatialObject> spatialOpt = gisSpatialObjectRepository.findById(khongGianId);
      if (spatialOpt.isPresent()) {
        GisSpatialObject spatial = spatialOpt.get();
        String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name() : null;
        result.setGeometryType(geomTypeStr);
        result.setCoordinates(spatial.getCoordinates());
        enrichRepresentativeCoordinate(result);

        if (objectType != null && !objectType.name().equalsIgnoreCase(geomTypeStr)) {
          return;
        }
      } else if (objectType != null) {
        return;
      }
    } else if (objectType != null) {
      return;
    }
    results.add(result);
  }

  private void populateSpatialAndFilterFromMap(List<KchtGisSearchResult> results, KchtGisSearchResult result,
      UUID khongGianId, GisObjectType objectType, GisObjectType fallbackType,
      Map<UUID, GisSpatialObject> spatialMap) {
    if (khongGianId != null) {
      GisSpatialObject spatial = spatialMap.get(khongGianId);
      if (spatial != null) {
        String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name() : null;
        result.setGeometryType(geomTypeStr);
        result.setCoordinates(spatial.getCoordinates());
        enrichRepresentativeCoordinate(result);

        if (objectType != null && !objectType.name().equalsIgnoreCase(geomTypeStr)) {
          return;
        }
      } else if (objectType != null) {
        return;
      }
    } else if (objectType != null) {
      return;
    }
    results.add(result);
  }

  public KchtGisSearchPage search(
      UUID rawOrgUnitId,
      List<InfrastructureType> kchtTypes,
      Integer provinceId,
      String province,
      String search,
      GisObjectType objectType,
      int requestedPage,
      int requestedSize) {

    List<KchtGisSearchResult> results = new ArrayList<>();
    Map<String, UUID> spatialIdMap = new HashMap<>();
    List<InfrastructureType> types;
    if (kchtTypes == null || kchtTypes.isEmpty()) {
      types = SEARCHABLE_TYPES;
    } else {
      types = kchtTypes.stream()
          .filter(Objects::nonNull)
          .filter(SEARCHABLE_TYPES::contains)
          .distinct()
          .collect(Collectors.toList());
      if (types.isEmpty()) {
        return KchtGisSearchPage.builder()
            .content(List.of())
            .totalElements(0)
            .page(Math.max(0, requestedPage))
            .size(Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize)))
            .build();
      }
    }
    String searchLower = (search == null || search.trim().isEmpty()) ? null : search.toLowerCase().trim();
    String provinceLocal = null;

    Map<UUID, String> orgNameMap = new HashMap<>(orgUnitCacheService.getDirectory());
    OrgUnitScopeService.Scope userScope = orgUnitScopeService.currentUserScope();
    Set<UUID> effectiveOrgUnitIds = resolveEffectiveOrgUnitIds(rawOrgUnitId, userScope);

    // Các repository dùng null để lấy toàn bộ dữ liệu trong Hibernate DataScope
    // hiện tại.
    // Bộ lọc đơn vị người dùng chọn được áp dụng đồng nhất sau khi hợp nhất nhiều
    // loại entity.
    final UUID orgUnitId = null;

    for (InfrastructureType type : types) {
      long tStart = System.currentTimeMillis();

      switch (type) {
        case SEAPORT:
          List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
          List<Port> ports = portRepository.searchPorts(
              orgUnitId == null, orgUnitIds, null, null, provinceLocal, null,
              ApprovalStatus.APPROVED, null, null, null, null, searchLower, PageRequest.of(0, MAX_FETCH_SIZE))
              .getContent();
          Map<UUID, GisSpatialObject> cbSpatialMap = new HashMap<>();
          if (!ports.isEmpty()) {
            List<UUID> cbIds = ports.stream().map(Port::getId).collect(Collectors.toList());
            gisSpatialObjectRepository.findByRefIdInAndRefType(cbIds, InfrastructureType.SEAPORT)
                .forEach(so -> cbSpatialMap.put(so.getRefId(), so));
          }
          for (Port cb : ports) {
            GisSpatialObject spatial = cbSpatialMap.get(cb.getId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(cb.getId() != null ? cb.getId().toString() : null)
                .name(cb.getPortName())
                .code(cb.getPortCode())
                .orgUnitId(cb.getOrgUnitId())
                .orgName(getOrgName(cb.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Cảng biển")
                .mapSymbolId(cb.getMapSymbolId())
                .location(cb.getProvince() != null ? String.valueOf(cb.getProvince()) : "")
                .diaChiChiTiet("")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, cb.getId(), objectType, GisObjectType.POINT,
                  cbSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), cb.getId());
            }
          }
          break;

        case PORT_TERMINAL:
          List<Berth> berths = berthRepository.searchBerths(
              orgUnitId, searchLower, null, null, null, null, null, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> cbIds = berths.stream().map(Berth::getPortId).filter(Objects::nonNull).distinct()
              .collect(Collectors.toList());
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
            String parentProvince = (parent != null && parent.getProvince() != null)
                ? String.valueOf(parent.getProvince())
                : "";
            GisSpatialObject spatial = bcSpatialMap.get(bc.getId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(bc.getId() != null ? bc.getId().toString() : null)
                .name(bc.getBerthName())
                .code(bc.getBerthCode())
                .orgUnitId(bc.getOrgUnitId())
                .orgName(getOrgName(bc.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Bến cảng")
                .mapSymbolId(bc.getMapSymbolId())
                .provinceId(bc.getProvinceId())
                .location(parentProvince)
                .diaChiChiTiet(bc.getWaterway() != null ? bc.getWaterway() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, bc.getId(), objectType, GisObjectType.POINT,
                  bcSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), bc.getId());
            }
          }
          break;

        case PIER:
          List<Pier> piers = pierRepository.searchPiers(
              orgUnitId, searchLower, null, null, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> parentBerthIds = piers.stream().map(Pier::getBerthId).filter(Objects::nonNull).distinct()
              .collect(Collectors.toList());
          Map<UUID, Berth> berthMap = new HashMap<>();
          if (!parentBerthIds.isEmpty()) {
            berthRepository.findAllById(parentBerthIds).forEach(bc -> berthMap.put(bc.getId(), bc));
          }
          List<UUID> parentCbIds = berthMap.values().stream().map(Berth::getPortId).filter(Objects::nonNull)
              .distinct().collect(Collectors.toList());
          Map<UUID, Port> portMap = new HashMap<>();
          if (!parentCbIds.isEmpty()) {
            portRepository.findAllById(parentCbIds).forEach(cb -> portMap.put(cb.getId(), cb));
          }
          Map<UUID, GisSpatialObject> parentBerthSpatialMap = new HashMap<>();
          if (!parentBerthIds.isEmpty()) {
            gisSpatialObjectRepository
                .findByRefIdInAndRefType(parentBerthIds, InfrastructureType.PORT_TERMINAL)
                .forEach(so -> parentBerthSpatialMap.put(so.getRefId(), so));
          }
          Map<UUID, GisSpatialObject> spatialMap = new HashMap<>();
          if (objectType != null) {
            List<UUID> spatialIds = piers.stream().map(Pier::getSpatialId).filter(Objects::nonNull)
                .distinct().collect(Collectors.toList());
            if (!spatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(spatialIds)
                  .forEach(so -> spatialMap.put(so.getId(), so));
            }
          }
          for (Pier cc : piers) {
            Berth parentBerth = (cc.getBerthId() != null) ? berthMap.get(cc.getBerthId()) : null;
            Port parentCb = (parentBerth != null && parentBerth.getPortId() != null)
                ? portMap.get(parentBerth.getPortId())
                : null;
            String parentProvince = (parentCb != null && parentCb.getProvince() != null)
                ? String.valueOf(parentCb.getProvince())
                : "";

            GisSpatialObject parentBerthSpatial = (parentBerth != null)
                ? parentBerthSpatialMap.get(parentBerth.getId())
                : null;
            double[] coords = parentBerthSpatial != null
                ? parseFirstCoordinateFromWkt(parentBerthSpatial.getCoordinates())
                : null;
            Double latitude = coords != null ? coords[0] : null;
            Double longitude = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(cc.getId() != null ? cc.getId().toString() : null)
                .name(cc.getPierName())
                .code(cc.getPierCode())
                .orgUnitId(cc.getOrgUnitId())
                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Cầu cảng")
                .mapSymbolId(cc.getMapSymbolId())
                .location(parentProvince)
                .diaChiChiTiet(
                    parentBerth != null ? "Thuộc bến cảng: " + parentBerth.getBerthName() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, cc.getSpatialId(), objectType,
                  GisObjectType.LINE, spatialMap);
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
              orgUnitId, null, searchLower, null, ApprovalStatus.APPROVED,
              PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          Map<UUID, GisSpatialObject> ccSpatialMap = new HashMap<>();
          if (!cangCans.isEmpty()) {
            List<UUID> ccIds = cangCans.stream().map(DryPort::getId).collect(Collectors.toList());
            gisSpatialObjectRepository.findByRefIdInAndRefType(ccIds, InfrastructureType.DRY_PORT)
                .forEach(so -> ccSpatialMap.put(so.getRefId(), so));
          }
          for (DryPort cc : cangCans) {
            GisSpatialObject spatial = ccSpatialMap.get(cc.getId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(cc.getId() != null ? cc.getId().toString() : null)
                .name(cc.getDryPortName())
                .code(cc.getDryPortCode())
                .orgUnitId(cc.getOrgUnitId())
                .orgName(getOrgName(cc.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Cảng cạn")
                .mapSymbolId(cc.getMapSymbolId())
                .provinceId(cc.getProvinceId())
                .location("")
                .diaChiChiTiet("")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, cc.getId(), objectType, GisObjectType.POINT,
                  ccSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), cc.getId());
            }
          }
          break;

        case WATER_AREA:
          List<WaterZone> waterZones = waterZoneRepository.searchWaterZones(
              orgUnitId, null, searchLower, null, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> vnCbIds = waterZones.stream().map(WaterZone::getPortId).filter(Objects::nonNull)
              .distinct().collect(Collectors.toList());
          Map<UUID, Port> vnPortMap = new HashMap<>();
          if (!vnCbIds.isEmpty()) {
            portRepository.findAllById(vnCbIds).forEach(cb -> vnPortMap.put(cb.getId(), cb));
          }
          Map<UUID, GisSpatialObject> vnSpatialMap = new HashMap<>();
          if (!waterZones.isEmpty()) {
            List<UUID> vnSpatialIds = waterZones.stream().map(WaterZone::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!vnSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(vnSpatialIds)
                  .forEach(so -> vnSpatialMap.put(so.getId(), so));
            }
          }
          for (WaterZone vn : waterZones) {
            Port parent = (vn.getPortId() != null) ? vnPortMap.get(vn.getPortId()) : null;
            String parentProvince = (parent != null && parent.getProvince() != null)
                ? String.valueOf(parent.getProvince())
                : "";
            GisSpatialObject spatial = vnSpatialMap.get(vn.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double latitude = coords != null ? coords[0] : null;
            Double longitude = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(vn.getId() != null ? vn.getId().toString() : null)
                .name(vn.getWaterZoneName())
                .code(vn.getWaterZoneCode())
                .orgUnitId(vn.getOrgUnitId())
                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Vùng nước")
                .mapSymbolId(vn.getMapSymbolId())
                .provinceId(vn.getProvinceId())
                .location(parentProvince)
                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType,
                  GisObjectType.POLYGON, vnSpatialMap);
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
            List<UUID> spatialIds = ncList.stream().map(NavigationChannel::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!spatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(spatialIds)
                  .forEach(so -> ncSpatialMap.put(so.getId(), so));
            }
          }
          for (NavigationChannel nc : ncList) {
            GisSpatialObject spatial = ncSpatialMap.get(nc.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(String.valueOf(nc.getId()))
                .name(nc.getChannelName() != null && !nc.getChannelName().isEmpty()
                    ? nc.getChannelName()
                    : "Luồng hàng hải")
                .code(nc.getChannelCode())
                .orgUnitId(nc.getOrgUnitId())
                .orgName(getOrgName(nc.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Luồng hàng hải")
                .mapSymbolId(nc.getMapIconId())
                .location("")
                .diaChiChiTiet(nc.getDetailedLocation() != null ? nc.getDetailedLocation()
                    : (nc.getNotes() != null ? nc.getNotes() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, nc.getSpatialId(), objectType,
                  GisObjectType.LINE, ncSpatialMap);
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
              orgUnitId, searchLower, null, null, ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE))
              .getContent();
          Map<UUID, GisSpatialObject> dikeRevSpatialMap = new HashMap<>();
          if (!dikeRevList.isEmpty()) {
            List<UUID> spatialIds = dikeRevList.stream().map(DikeRevetment::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!spatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(spatialIds)
                  .forEach(so -> dikeRevSpatialMap.put(so.getId(), so));
            }
          }
          for (DikeRevetment dk : dikeRevList) {
            GisSpatialObject spatial = dikeRevSpatialMap.get(dk.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(String.valueOf(dk.getId()))
                .name(dk.getDikeRevetmentName())
                .code(dk.getCode())
                .orgUnitId(dk.getOrgUnitId())
                .orgName(getOrgName(dk.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đê kè")
                .mapSymbolId(dk.getSymbolId())
                .provinceId(dk.getProvinceId())
                .location("")
                .diaChiChiTiet(dk.getLocation() != null ? dk.getLocation() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, dk.getSpatialId(), objectType,
                  GisObjectType.LINE, dikeRevSpatialMap);
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
          List<ShipRepairFacility> csList = shipRepairFacilityRepository.searchFiltered(orgUnitId,
              csSearchParam).stream().filter(entity -> isApproved(entity.getApprovalStatus())).toList();
          Map<UUID, GisSpatialObject> csSpatialMap = new HashMap<>();
          if (!csList.isEmpty()) {
            List<UUID> csSpatialIds = csList.stream().map(ShipRepairFacility::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!csSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(csSpatialIds)
                  .forEach(so -> csSpatialMap.put(so.getId(), so));
            }
          }
          for (ShipRepairFacility cs : csList) {
            GisSpatialObject spatial = csSpatialMap.get(cs.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(String.valueOf(cs.getId()))
                .name(cs.getFacilityName())
                .orgUnitId(cs.getOrgUnitId())
                .orgName(getOrgName(cs.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Cơ sở sửa chữa")
                .provinceId(cs.getProvinceId())
                .location("")
                .diaChiChiTiet(cs.getAddress() != null ? cs.getAddress() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, cs.getSpatialId(), objectType,
                  GisObjectType.POINT, csSpatialMap);
            } else {
              results.add(r);
              if (cs.getSpatialId() != null) {
                spatialIdMap.put(r.getId(), cs.getSpatialId());
              }
            }
          }
          break;

        case LIGHTHOUSE:
          String denSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<BeaconStation> beaconList = beaconStationRepository.searchGis(orgUnitId, denSearchParam);
          Map<UUID, GisSpatialObject> beaconSpatialMap = new HashMap<>();
          if (!beaconList.isEmpty()) {
            List<UUID> beaconIds = beaconList.stream().map(BeaconStation::getId).collect(Collectors.toList());
            gisSpatialObjectRepository.findByRefIdInAndRefType(beaconIds, InfrastructureType.LIGHTHOUSE)
                .forEach(so -> beaconSpatialMap.put(so.getRefId(), so));
          }
          for (BeaconStation beacon : beaconList) {
            GisSpatialObject spatial = beaconSpatialMap.get(beacon.getId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(beacon.getId() != null ? beacon.getId().toString() : null)
                .name(beacon.getName())
                .code(beacon.getCode())
                .orgUnitId(firstNonNull(beacon.getOrgUnitId(), beacon.getUnitId()))
                .orgName(getOrgName(firstNonNull(beacon.getOrgUnitId(), beacon.getUnitId()), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đèn biển")
                .mapSymbolId(beacon.getMapSymbolId())
                .provinceId(beacon.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: " + (beacon.getLocation() != null ? beacon.getLocation() : "")
                    + ", Đặc tính ánh sáng: "
                    + (beacon.getPrimaryLightModel() != null ? beacon.getPrimaryLightModel() : "")
                    + ", Tầm hiệu lực: "
                    + (beacon.getLightRange() != null ? beacon.getLightRange() : "") + " hải lý")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, beacon.getId(), objectType, GisObjectType.POINT,
                  beaconSpatialMap);
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
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(buoy.getId() != null ? buoy.getId().toString() : null)
                .name(buoy.getName())
                .code(buoy.getCode())
                .orgUnitId(firstNonNull(buoy.getOrgUnitId(), buoy.getUnitId()))
                .orgName(getOrgName(firstNonNull(buoy.getOrgUnitId(), buoy.getUnitId()), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Phao, tiêu")
                .mapSymbolId(buoy.getMapSymbolId())
                .provinceId(buoy.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: " + (buoy.getDescription() != null ? buoy.getDescription() : "")
                    + ", Màu sắc: " + (buoy.getColor() != null ? buoy.getColor() : "")
                    + ", Hình dạng: " + (buoy.getShape() != null ? buoy.getShape() : "")
                    + ", Đặc tính ánh sáng: "
                    + (buoy.getLightCharacteristic() != null ? buoy.getLightCharacteristic() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, buoy.getId(), objectType, GisObjectType.POINT,
                  buoySpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), buoy.getId());
            }
          }
          break;

        case BUOY_STATION:
          String phaoSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<BuoyStation> phaoList = buoyStationRepository.searchGis(orgUnitId, phaoSearchParam).stream()
              .filter(entity -> isApproved(entity.getApprovalStatus())).toList();
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
                .orgUnitId(phao.getUnitId())
                .orgName(getOrgName(phao.getUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Nhà trạm phao tiêu")
                .provinceId(phao.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: " + (phao.getDescription() != null ? phao.getDescription() : "")
                    + ", Màu sắc: " + (phao.getColor() != null ? phao.getColor() : "")
                    + ", Hình dạng: " + (phao.getShape() != null ? phao.getShape() : "")
                    + ", Đặc tính ánh sáng: "
                    + (phao.getLightCharacteristic() != null ? phao.getLightCharacteristic() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, phao.getId(), objectType, GisObjectType.POINT,
                  phaoSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), phao.getId());
            }
          }
          break;

        case COASTAL_RADIO_STATION:
          String vtsStSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<CoastalStationVTS> vtsStationList = coastalStationVTSRepository.searchGis(orgUnitId,
              vtsStSearchParam);
          Map<UUID, GisSpatialObject> vtsStationSpatialMap = new HashMap<>();
          if (objectType != null && !vtsStationList.isEmpty()) {
            List<UUID> vtsStationIds = vtsStationList.stream().map(CoastalStationVTS::getId)
                .collect(Collectors.toList());
            gisSpatialObjectRepository
                .findByRefIdInAndRefType(vtsStationIds, InfrastructureType.COASTAL_RADIO_STATION)
                .forEach(so -> vtsStationSpatialMap.put(so.getRefId(), so));
          }
          for (CoastalStationVTS vtsStation : vtsStationList) {
            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(vtsStation.getId() != null ? vtsStation.getId().toString() : null)
                .name(vtsStation.getName())
                .code(vtsStation.getCode())
                .orgUnitId(vtsStation.getUnitId())
                .orgName(getOrgName(vtsStation.getUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đài TTDH")
                .provinceId(vtsStation.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: "
                    + (vtsStation.getDescription() != null ? vtsStation.getDescription() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vtsStation.getId(), objectType,
                  GisObjectType.POINT, vtsStationSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), vtsStation.getId());
            }
          }
          break;

        case INMARSAT_STATION:
          String inmarsatSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<CoastalStationInmarsat> inmarsatList = coastalStationInmarsatRepository.searchGis(orgUnitId,
              inmarsatSearchParam);
          Map<UUID, GisSpatialObject> inmarsatSpatialMap = new HashMap<>();
          if (objectType != null && !inmarsatList.isEmpty()) {
            List<UUID> inmarsatIds = inmarsatList.stream().map(CoastalStationInmarsat::getId)
                .collect(Collectors.toList());
            gisSpatialObjectRepository
                .findByRefIdInAndRefType(inmarsatIds, InfrastructureType.INMARSAT_STATION)
                .forEach(so -> inmarsatSpatialMap.put(so.getRefId(), so));
          }
          for (CoastalStationInmarsat inmarsat : inmarsatList) {
            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(inmarsat.getId() != null ? inmarsat.getId().toString() : null)
                .name(inmarsat.getName())
                .code(inmarsat.getCode())
                .orgUnitId(inmarsat.getUnitId())
                .orgName(getOrgName(inmarsat.getUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đài Thông tin Vệ tinh mặt đất Inmarsat Hải Phòng")
                .provinceId(inmarsat.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: "
                    + (inmarsat.getDescription() != null ? inmarsat.getDescription() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, inmarsat.getId(), objectType,
                  GisObjectType.POINT, inmarsatSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), inmarsat.getId());
            }
          }
          break;

        case COSPAS_SARSAT_STATION:
          String cospasSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<CoastalStationCospasSarsat> cospasSarsatList = coastalStationCospasSarsatRepository
              .searchGis(orgUnitId, cospasSearchParam);
          Map<UUID, GisSpatialObject> cospasSarsatSpatialMap = new HashMap<>();
          if (objectType != null && !cospasSarsatList.isEmpty()) {
            List<UUID> cospasSarsatIds = cospasSarsatList.stream().map(CoastalStationCospasSarsat::getId)
                .collect(Collectors.toList());
            gisSpatialObjectRepository
                .findByRefIdInAndRefType(cospasSarsatIds, InfrastructureType.COSPAS_SARSAT_STATION)
                .forEach(so -> cospasSarsatSpatialMap.put(so.getRefId(), so));
          }
          for (CoastalStationCospasSarsat cospasSarsat : cospasSarsatList) {
            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(cospasSarsat.getId() != null ? cospasSarsat.getId().toString() : null)
                .name(cospasSarsat.getName())
                .code(cospasSarsat.getCode())
                .orgUnitId(cospasSarsat.getUnitId())
                .orgName(getOrgName(cospasSarsat.getUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đài Thông tin vệ tinh mặt đất Cospas-Sarsat Việt Nam")
                .provinceId(cospasSarsat.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: "
                    + (cospasSarsat.getDescription() != null ? cospasSarsat.getDescription() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, cospasSarsat.getId(), objectType,
                  GisObjectType.POINT, cospasSarsatSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), cospasSarsat.getId());
            }
          }
          break;

        case LRIT_STATION:
          String lritSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<CoastalStationLRIT> lritList = coastalStationLRITRepository.searchGis(orgUnitId,
              lritSearchParam);
          Map<UUID, GisSpatialObject> lritSpatialMap = new HashMap<>();
          if (objectType != null && !lritList.isEmpty()) {
            List<UUID> lritIds = lritList.stream().map(CoastalStationLRIT::getId)
                .collect(Collectors.toList());
            gisSpatialObjectRepository.findByRefIdInAndRefType(lritIds, InfrastructureType.LRIT_STATION)
                .forEach(so -> lritSpatialMap.put(so.getRefId(), so));
          }
          for (CoastalStationLRIT lrit : lritList) {
            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(lrit.getId() != null ? lrit.getId().toString() : null)
                .name(lrit.getName())
                .code(lrit.getCode())
                .orgUnitId(lrit.getUnitId())
                .orgName(getOrgName(lrit.getUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đài Thông tin nhận dạng và truy theo tầm xa (LRIT)")
                .provinceId(lrit.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: " + (lrit.getDescription() != null ? lrit.getDescription() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, lrit.getId(), objectType, GisObjectType.POINT,
                  lritSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), lrit.getId());
            }
          }
          break;

        case HANOI_STATION:
          String haiphongSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<CoastalStationHaiphong> haiphongList = coastalStationHaiphongRepository.searchGis(orgUnitId,
              haiphongSearchParam);
          Map<UUID, GisSpatialObject> haiphongSpatialMap = new HashMap<>();
          if (objectType != null && !haiphongList.isEmpty()) {
            List<UUID> haiphongIds = haiphongList.stream().map(CoastalStationHaiphong::getId)
                .collect(Collectors.toList());
            gisSpatialObjectRepository
                .findByRefIdInAndRefType(haiphongIds, InfrastructureType.HANOI_STATION)
                .forEach(so -> haiphongSpatialMap.put(so.getRefId(), so));
          }
          for (CoastalStationHaiphong haiphong : haiphongList) {
            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(haiphong.getId() != null ? haiphong.getId().toString() : null)
                .name(haiphong.getName())
                .code(haiphong.getCode())
                .orgUnitId(haiphong.getOrgUnitId())
                .orgName(getOrgName(haiphong.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Đài Trung tâm xử lý thông tin hàng hải Hà Nội")
                .provinceId(haiphong.getProvinceId())
                .location("")
                .diaChiChiTiet("Mô tả: "
                    + (haiphong.getDescription() != null ? haiphong.getDescription() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, haiphong.getId(), objectType,
                  GisObjectType.POINT, haiphongSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), haiphong.getId());
            }
          }
          break;

        case VTS_SYSTEM:
          String vtsSearchParam = (searchLower == null) ? null : "%" + searchLower + "%";
          List<VtsSystem> vtsList = vtsSystemRepository.searchFiltered(orgUnitId, vtsSearchParam).stream()
              .filter(entity -> isApproved(entity.getApprovalStatus())).toList();
          Map<UUID, GisSpatialObject> vtsSpatialMap = new HashMap<>();
          if (!vtsList.isEmpty()) {
            List<UUID> vtsSpatialIds = vtsList.stream().map(VtsSystem::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!vtsSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(vtsSpatialIds)
                  .forEach(so -> vtsSpatialMap.put(so.getId(), so));
            }
          }
          for (VtsSystem vts : vtsList) {
            GisSpatialObject spatial = vtsSpatialMap.get(vts.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(String.valueOf(vts.getId()))
                .name(vts.getSystemName())
                .code(vts.getCode())
                .orgUnitId(vts.getOrgUnitId())
                .orgName(getOrgName(vts.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Hệ thống VTS")
                .provinceId(vts.getProvinceId())
                .location("")
                .diaChiChiTiet("Vị trí: "
                    + (vts.getAddress() != null ? vts.getAddress() : "")
                    + ", Tình trạng: "
                    + (vts.getConditionStatus() != null ? switch (vts.getConditionStatus()) {
                      case OPERATIONAL -> "Đang hoạt động";
                      case STOPPED -> "Dừng hoạt động";
                      case MAINTENANCE -> "Đang bảo trì";
                      case UNDER_CONSTRUCTION -> "Đang xây dựng";
                    } : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vts.getSpatialId(), objectType,
                  GisObjectType.POINT, vtsSpatialMap);
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
          List<RadarStation> radarList = radarStationRepository.searchFiltered(orgUnitId, radarSearchParam)
              .stream().filter(entity -> isApproved(entity.getApprovalStatus())).toList();
          Map<UUID, GisSpatialObject> radarSpatialMap = new HashMap<>();
          if (!radarList.isEmpty()) {
            List<UUID> radarIds = radarList.stream().map(RadarStation::getId).collect(Collectors.toList());
            gisSpatialObjectRepository
                .findByRefIdInAndRefType(radarIds, InfrastructureType.RADAR_STATION_LEGACY)
                .forEach(so -> radarSpatialMap.put(so.getRefId(), so));
          }
          for (RadarStation rs : radarList) {
            UUID dtoId = rs.getId();
            GisSpatialObject spatial = radarSpatialMap.get(dtoId);
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double lat = coords != null ? coords[0] : null;
            Double lng = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(String.valueOf(rs.getId()))
                .name(rs.getStationName())
                .code(rs.getCode())
                .orgUnitId(rs.getOrgUnitId())
                .orgName(getOrgName(rs.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Trạm radar")
                .provinceId(rs.getProvinceId())
                .location("")
                .diaChiChiTiet("Vị trí: " + (rs.getLocation() != null ? rs.getLocation() : "")
                    + ", Loại trạm: " + (rs.getStationType() != null ? rs.getStationType() : "")
                    + ", Tình trạng: "
                    + (rs.getConditionStatus() != null ? rs.getConditionStatus() : ""))
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, dtoId, objectType, GisObjectType.POINT,
                  radarSpatialMap);
            } else {
              results.add(r);
              spatialIdMap.put(r.getId(), dtoId);
            }
          }
          break;

        case BUOY_BERTH:
          List<WaterZone> benPhaos = waterZoneRepository.searchWaterZones(
              orgUnitId, null, searchLower, WaterZoneType.MOORING_BUOY, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> bpCbIds = benPhaos.stream().map(WaterZone::getPortId).filter(Objects::nonNull).distinct()
              .collect(Collectors.toList());
          Map<UUID, Port> bpPortMap = new HashMap<>();
          if (!bpCbIds.isEmpty()) {
            portRepository.findAllById(bpCbIds).forEach(cb -> bpPortMap.put(cb.getId(), cb));
          }
          Map<UUID, GisSpatialObject> bpSpatialMap = new HashMap<>();
          if (!benPhaos.isEmpty()) {
            List<UUID> bpSpatialIds = benPhaos.stream().map(WaterZone::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!bpSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(bpSpatialIds)
                  .forEach(so -> bpSpatialMap.put(so.getId(), so));
            }
          }
          for (WaterZone vn : benPhaos) {
            Port parent = (vn.getPortId() != null) ? bpPortMap.get(vn.getPortId()) : null;
            String parentProvince = (parent != null && parent.getProvince() != null)
                ? String.valueOf(parent.getProvince())
                : "";
            GisSpatialObject spatial = bpSpatialMap.get(vn.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double latitude = coords != null ? coords[0] : null;
            Double longitude = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(vn.getId() != null ? vn.getId().toString() : null)
                .name(vn.getWaterZoneName())
                .code(vn.getWaterZoneCode())
                .orgUnitId(vn.getOrgUnitId())
                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Bến phao")
                .mapSymbolId(vn.getMapSymbolId())
                .provinceId(vn.getProvinceId())
                .location(parentProvince)
                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType,
                  GisObjectType.POLYGON, bpSpatialMap);
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
              orgUnitId, null, searchLower, WaterZoneType.ANCHORAGE, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> knCbIds = anchorages.stream().map(WaterZone::getPortId).filter(Objects::nonNull)
              .distinct().collect(Collectors.toList());
          Map<UUID, Port> knPortMap = new HashMap<>();
          if (!knCbIds.isEmpty()) {
            portRepository.findAllById(knCbIds).forEach(cb -> knPortMap.put(cb.getId(), cb));
          }
          Map<UUID, GisSpatialObject> knSpatialMap = new HashMap<>();
          if (!anchorages.isEmpty()) {
            List<UUID> knSpatialIds = anchorages.stream().map(WaterZone::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!knSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(knSpatialIds)
                  .forEach(so -> knSpatialMap.put(so.getId(), so));
            }
          }
          for (WaterZone vn : anchorages) {
            Port parent = (vn.getPortId() != null) ? knPortMap.get(vn.getPortId()) : null;
            String parentProvince = (parent != null && parent.getProvince() != null)
                ? String.valueOf(parent.getProvince())
                : "";
            GisSpatialObject spatial = knSpatialMap.get(vn.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double latitude = coords != null ? coords[0] : null;
            Double longitude = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(vn.getId() != null ? vn.getId().toString() : null)
                .name(vn.getWaterZoneName())
                .code(vn.getWaterZoneCode())
                .orgUnitId(vn.getOrgUnitId())
                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Khu neo đậu")
                .mapSymbolId(vn.getMapSymbolId())
                .provinceId(vn.getProvinceId())
                .location(parentProvince)
                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType,
                  GisObjectType.POLYGON, knSpatialMap);
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
              orgUnitId, null, searchLower, WaterZoneType.TRANSSHIPMENT, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> kcCbIds = khuChuyens.stream().map(WaterZone::getPortId).filter(Objects::nonNull)
              .distinct().collect(Collectors.toList());
          Map<UUID, Port> kcPortMap = new HashMap<>();
          if (!kcCbIds.isEmpty()) {
            portRepository.findAllById(kcCbIds).forEach(cb -> kcPortMap.put(cb.getId(), cb));
          }
          Map<UUID, GisSpatialObject> kcSpatialMap = new HashMap<>();
          if (!khuChuyens.isEmpty()) {
            List<UUID> kcSpatialIds = khuChuyens.stream().map(WaterZone::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!kcSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(kcSpatialIds)
                  .forEach(so -> kcSpatialMap.put(so.getId(), so));
            }
          }
          for (WaterZone vn : khuChuyens) {
            Port parent = (vn.getPortId() != null) ? kcPortMap.get(vn.getPortId()) : null;
            String parentProvince = (parent != null && parent.getProvince() != null)
                ? String.valueOf(parent.getProvince())
                : "";
            GisSpatialObject spatial = kcSpatialMap.get(vn.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double latitude = coords != null ? coords[0] : null;
            Double longitude = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(vn.getId() != null ? vn.getId().toString() : null)
                .name(vn.getWaterZoneName())
                .code(vn.getWaterZoneCode())
                .orgUnitId(vn.getOrgUnitId())
                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Khu chuyển tải")
                .mapSymbolId(vn.getMapSymbolId())
                .provinceId(vn.getProvinceId())
                .location(parentProvince)
                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType,
                  GisObjectType.POLYGON, kcSpatialMap);
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
              orgUnitId, null, searchLower, WaterZoneType.STORM_SHELTER, null,
              ApprovalStatus.APPROVED, PageRequest.of(0, MAX_FETCH_SIZE)).getContent();
          List<UUID> ktCbIds = khuTranhs.stream().map(WaterZone::getPortId).filter(Objects::nonNull)
              .distinct().collect(Collectors.toList());
          Map<UUID, Port> ktPortMap = new HashMap<>();
          if (!ktCbIds.isEmpty()) {
            portRepository.findAllById(ktCbIds).forEach(cb -> ktPortMap.put(cb.getId(), cb));
          }
          Map<UUID, GisSpatialObject> ktSpatialMap = new HashMap<>();
          if (!khuTranhs.isEmpty()) {
            List<UUID> ktSpatialIds = khuTranhs.stream().map(WaterZone::getSpatialId)
                .filter(Objects::nonNull).distinct().collect(Collectors.toList());
            if (!ktSpatialIds.isEmpty()) {
              gisSpatialObjectRepository.findAllById(ktSpatialIds)
                  .forEach(so -> ktSpatialMap.put(so.getId(), so));
            }
          }
          for (WaterZone vn : khuTranhs) {
            Port parent = (vn.getPortId() != null) ? ktPortMap.get(vn.getPortId()) : null;
            String parentProvince = (parent != null && parent.getProvince() != null)
                ? String.valueOf(parent.getProvince())
                : "";
            GisSpatialObject spatial = ktSpatialMap.get(vn.getSpatialId());
            double[] coords = spatial != null ? parseFirstCoordinateFromWkt(spatial.getCoordinates())
                : null;
            Double latitude = coords != null ? coords[0] : null;
            Double longitude = coords != null ? coords[1] : null;

            KchtGisSearchResult r = KchtGisSearchResult.builder()
                .id(vn.getId() != null ? vn.getId().toString() : null)
                .name(vn.getWaterZoneName())
                .code(vn.getWaterZoneCode())
                .orgUnitId(vn.getOrgUnitId())
                .orgName(getOrgName(vn.getOrgUnitId(), orgNameMap))
                .infrastructureType(type)
                .kchtTypeLabel("Khu tránh trú bão")
                .mapSymbolId(vn.getMapSymbolId())
                .provinceId(vn.getProvinceId())
                .location(parentProvince)
                .diaChiChiTiet(parent != null ? "Thuộc cảng biển: " + parent.getPortName() : "")
                .build();
            if (objectType != null) {
              populateSpatialAndFilterFromMap(results, r, vn.getSpatialId(), objectType,
                  GisObjectType.POLYGON, ktSpatialMap);
            } else {
              results.add(r);
              if (vn.getSpatialId() != null) {
                spatialIdMap.put(r.getId(), vn.getSpatialId());
              }
            }
          }
          break;
      }
      log.info("PERF: Type {} took {} ms, results size {}", type, System.currentTimeMillis() - tStart,
          results.size());
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
            String geomTypeStr = spatial.getGeometryType() != null ? spatial.getGeometryType().name()
                : null;
            r.setGeometryType(geomTypeStr);
            r.setCoordinates(spatial.getCoordinates());

            enrichRepresentativeCoordinate(r);
          }
        }
      }
    }

    if (effectiveOrgUnitIds != null) {
      results = results.stream()
          .filter(result -> result.getOrgUnitId() != null
              && effectiveOrgUnitIds.contains(result.getOrgUnitId()))
          .collect(Collectors.toList());
    }

    if (provinceId != null || (province != null && !province.isBlank())) {
      final String targetProvince = province == null ? null : province.trim().toLowerCase(Locale.ROOT);
      results = results.stream()
          .filter(result -> (provinceId != null && Objects.equals(result.getProvinceId(), provinceId))
              || (targetProvince != null && result.getLocation() != null
                  && result.getLocation().toLowerCase(Locale.ROOT).contains(targetProvince)))
          .collect(Collectors.toList());
    }

    results.sort(Comparator
        .comparing(KchtGisSearchResult::getKchtTypeLabel,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
        .thenComparing(KchtGisSearchResult::getName,
            Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)));

    int page = Math.max(0, requestedPage);
    int size = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedSize));
    int fromIndex = Math.min(page * size, results.size());
    int toIndex = Math.min(fromIndex + size, results.size());

    return KchtGisSearchPage.builder()
        .content(new ArrayList<>(results.subList(fromIndex, toIndex)))
        .totalElements(results.size())
        .page(page)
        .size(size)
        .build();
  }

  private Set<UUID> resolveEffectiveOrgUnitIds(UUID selectedOrgUnitId, OrgUnitScopeService.Scope userScope) {
    Set<UUID> selectedIds = selectedOrgUnitId == null
        ? null
        : new LinkedHashSet<>(orgUnitScopeService.resolveSubtreeIds(selectedOrgUnitId));
    if (userScope.unrestricted()) {
      return selectedIds;
    }

    Set<UUID> scopedIds = new LinkedHashSet<>(userScope.orgUnitIds());
    if (selectedIds == null) {
      return scopedIds;
    }
    scopedIds.retainAll(selectedIds);
    return scopedIds;
  }
}
