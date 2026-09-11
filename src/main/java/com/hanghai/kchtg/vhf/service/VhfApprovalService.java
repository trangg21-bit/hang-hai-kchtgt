package com.hanghai.kchtg.vhf.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.vhf.dto.ApprovalRequest;
import com.hanghai.kchtg.vhf.dto.VhfResponse;
import com.hanghai.kchtg.vhf.entity.Vhf;
import com.hanghai.kchtg.vhf.repository.VhfRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.access.AccessDeniedException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for 2-level approval workflow on VHF communication system.
 */
@Service
@Slf4j
public class VhfApprovalService {

  private final VhfRepository vhfRepository;
  private final VhfService vhfService;
  private final InfrastructureApprovalService infrastructureApprovalService;
  private final InfrastructureHistoryRepository historyRepository;
  private final UserRepository userRepository;
  private final OrgUnitCacheService orgUnitCacheService;
  private final OrgUnitScopeService orgUnitScopeService;
  private final JdbcTemplate jdbcTemplate;
  private final VtsOperationCenterRepository vtsOperationCenterRepository;
  private final RadarStationRepository radarStationRepository;
  private final PortRepository portRepository;

  public VhfApprovalService(
      VhfRepository vhfRepository,
      VhfService vhfService,
      InfrastructureApprovalService infrastructureApprovalService,
      InfrastructureHistoryRepository historyRepository,
      UserRepository userRepository) {
    this(vhfRepository, vhfService, infrastructureApprovalService, historyRepository, userRepository,
        null, null, null, null, null, null);
  }

  @Autowired
  public VhfApprovalService(
      VhfRepository vhfRepository,
      VhfService vhfService,
      InfrastructureApprovalService infrastructureApprovalService,
      InfrastructureHistoryRepository historyRepository,
      UserRepository userRepository,
      @Autowired(required = false) OrgUnitCacheService orgUnitCacheService,
      @Autowired(required = false) OrgUnitScopeService orgUnitScopeService,
      @Autowired(required = false) JdbcTemplate jdbcTemplate,
      @Autowired(required = false) VtsOperationCenterRepository vtsOperationCenterRepository,
      @Autowired(required = false) RadarStationRepository radarStationRepository,
      @Autowired(required = false) PortRepository portRepository) {
    this.vhfRepository = vhfRepository;
    this.vhfService = vhfService;
    this.infrastructureApprovalService = infrastructureApprovalService;
    this.historyRepository = historyRepository;
    this.userRepository = userRepository;
    this.orgUnitCacheService = orgUnitCacheService;
    this.orgUnitScopeService = orgUnitScopeService;
    this.jdbcTemplate = jdbcTemplate;
    this.vtsOperationCenterRepository = vtsOperationCenterRepository;
    this.radarStationRepository = radarStationRepository;
    this.portRepository = portRepository;
  }

  @Transactional
  public VhfResponse submit(UUID id, UUID userId) {
    return submit(id, null, userId);
  }

  @Transactional
  public VhfResponse submit(UUID id, String content, UUID operatorId) {
    Vhf vhf = vhfRepository.findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    validateAllowedOrgUnit(vhf.getOrgUnitId());
    infrastructureApprovalService.submit(vhf, InfrastructureType.VHF, operatorId, content);
    vhf.setSubmittedDate(LocalDateTime.now());
    vhf.setSubmittedBy(operatorId);
    vhf.setApprovalContentLevel1(content != null && !content.trim().isEmpty() ? content.trim() : null);
    vhf.setApprovalContentLevel2(null);

    Vhf saved = vhfRepository.save(vhf);
    return vhfService.mapToResponse(saved);
  }

  @Transactional
  public VhfResponse approveC1(UUID id, ApprovalRequest request, UUID operatorId) {
    validateDecision(request);
    Vhf vhf = vhfRepository.findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    validateAllowedOrgUnit(vhf.getOrgUnitId());
    infrastructureApprovalService.approveC1(vhf, InfrastructureType.VHF, request.getDecision(), request.getReason(), operatorId);
    vhf.setApprovalContentLevel1(request.getReason());

    Vhf saved = vhfRepository.save(vhf);
    return vhfService.mapToResponse(saved);
  }

  @Transactional
  public VhfResponse approveC2(UUID id, ApprovalRequest request, UUID operatorId) {
    validateDecision(request);
    Vhf vhf = vhfRepository.findByIdAndDeletedAtIsNull(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    validateAllowedOrgUnit(vhf.getOrgUnitId());
    infrastructureApprovalService.approveC2(vhf, InfrastructureType.VHF, request.getDecision(), request.getReason(), operatorId);
    vhf.setApprovalContentLevel2(request.getReason());

    Vhf saved = vhfRepository.save(vhf);
    return vhfService.mapToResponse(saved);
  }

  private void validateDecision(ApprovalRequest request) {
    if (request == null || request.getDecision() == null
      || !(ApprovalStatus.APPROVED.name().equalsIgnoreCase(request.getDecision())
      || ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision()))) {
      throw new IllegalArgumentException("Quyết định phê duyệt không hợp lệ");
    }
    if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
      && (request.getReason() == null || request.getReason().trim().isEmpty())) {
      throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
    }
  }

  public List<HistoryEntry> getHistory(UUID id) {
    return getHistory(id, null, null);
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
    return getHistory(id, page, pageSize, null, (String) null, (String) null);
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
      String fromDate, String toDate) {
    return getHistory(id, page, pageSize, keyword, parseFromDate(fromDate), parseToDate(toDate));
  }

  public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
      LocalDateTime fromDate, LocalDateTime toDate) {
    Vhf parent = vhfRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));
    validateAllowedOrgUnit(parent.getOrgUnitId());

    String normalizedKeyword = normalizeSearchKeyword(keyword);
    boolean paged = page != null && pageSize != null && pageSize > 0;
    List<InfrastructureHistory> list;
    if (normalizedKeyword == null && fromDate == null && toDate == null) {
      list = paged
          ? historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VHF, id, PageRequest.of(page, pageSize))
          : historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VHF, id);
    } else {
      list = historyRepository.searchHistory(InfrastructureType.VHF, id, normalizedKeyword, fromDate, toDate,
          paged ? PageRequest.of(page, pageSize) : Pageable.unpaged());
    }
    Set<UUID> userIds = list.stream()
        .map(InfrastructureHistory::getApprovedBy)
        .filter(Objects::nonNull)
        .collect(Collectors.toSet());
    Map<UUID, User> userMap = resolveUsers(userIds);

    return list.stream()
        .map(h -> {
          User u = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
          String userName = formatUserIdentity(u);
          String orgUnitName = null;
          if (u != null) {
            if (u.getOrgUnit() != null && u.getOrgUnit().getName() != null && !u.getOrgUnit().getName().isBlank()) {
              orgUnitName = u.getOrgUnit().getName();
            } else if (u.getDepartment() != null && !u.getDepartment().isBlank()) {
              orgUnitName = u.getDepartment();
            } else {
              orgUnitName = "Cục Hàng hải Việt Nam";
            }
          }
          if (orgUnitName == null) {
            orgUnitName = "Cục Hàng hải Việt Nam";
          }
          return HistoryEntry.builder()
              .id(h.getId())
              .approvalLevel(h.getApprovalLevel())
              .status(h.getStatus() != null ? h.getStatus().getCode() : null)
              .approvedBy(userName)
              .orgUnitName(orgUnitName)
              .approvedDate(h.getApprovedDate())
              .reason(h.getReason())
              .changedField(h.getChangedField())
              .previousValue(formatDisplayValue(h.getChangedField(), h.getPreviousValue()))
              .newValue(formatDisplayValue(h.getChangedField(), h.getNewValue()))
              .build();
        })
        .collect(Collectors.toList());
  }

  private void validateAllowedOrgUnit(UUID orgUnitId) {
    if (orgUnitId == null) {
      throw new AccessDeniedException("Bản ghi thiếu thông tin đơn vị quản lý");
    }
    if (orgUnitScopeService == null) return;
    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    if (scope == null || scope.unrestricted()) return;
    if (!scope.orgUnitIds().contains(orgUnitId)) {
      throw new AccessDeniedException("Không có quyền truy cập dữ liệu của đơn vị: " + orgUnitId);
    }
  }

  private LocalDateTime parseFromDate(String value) {
    if (value == null || value.trim().isEmpty()) return null;
    try {
      String v = value.trim();
      if (v.length() == 10) {
        return LocalDate.parse(v).atStartOfDay();
      }
      return LocalDateTime.parse(v.replace(" ", "T"));
    } catch (Exception e) {
      return null;
    }
  }

  private LocalDateTime parseToDate(String value) {
    if (value == null || value.trim().isEmpty()) return null;
    try {
      String v = value.trim();
      if (v.length() == 10) {
        return LocalDate.parse(v).atTime(LocalTime.MAX);
      }
      return LocalDateTime.parse(v.replace(" ", "T"));
    } catch (Exception e) {
      return null;
    }
  }

  public String formatDisplayValue(String field, String rawValue) {
    if (rawValue == null || rawValue.isEmpty() || "null".equalsIgnoreCase(rawValue) || "Chưa có".equals(rawValue)) {
      return "Chưa có";
    }
    if ("mapSymbolId".equals(field) || "Biểu tượng".equals(field) || "Biểu tượng bản đồ".equals(field) || "symbolId".equals(field)) {
      try {
        if (jdbcTemplate != null) {
          UUID symId = UUID.fromString(rawValue);
          List<String> names = jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, symId);
          return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
        }
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("orgUnitId".equals(field) || "Đơn vị quản lý".equals(field)) {
      try {
        if (orgUnitCacheService != null) {
          String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
          return name != null ? name : rawValue;
        }
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("seaportId".equals(field) || "Thuộc cảng biển".equals(field)) {
      try {
        UUID portId = UUID.fromString(rawValue);
        if (portRepository != null) {
          Optional<Port> p = portRepository.findById(portId);
          if (p.isPresent() && p.get().getPortName() != null) return p.get().getPortName();
        }
        if (jdbcTemplate != null) {
          List<String> names = jdbcTemplate.queryForList("SELECT port_name FROM ports WHERE id = ?", String.class, portId);
          if (!names.isEmpty() && names.get(0) != null) return names.get(0);
        }
        return rawValue;
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("operatingUnitId".equals(field) || "Đơn vị khai thác".equals(field) || "Đơn vị vận hành".equals(field)) {
      try {
        UUID uid = UUID.fromString(rawValue);
        if (orgUnitCacheService != null) {
          String name = orgUnitCacheService.getName(uid);
          if (name != null && !name.equals(rawValue)) {
            return name;
          }
        }
        if (jdbcTemplate != null) {
          List<String> names = jdbcTemplate.queryForList("SELECT name FROM operating_organizations WHERE id = ?", String.class, uid);
          if (!names.isEmpty() && names.get(0) != null) {
            return names.get(0);
          }
          names = jdbcTemplate.queryForList("SELECT name FROM operating_units WHERE id = ?", String.class, uid);
          if (!names.isEmpty() && names.get(0) != null) {
            return names.get(0);
          }
        }
        return rawValue;
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("attachedInfrastructureType".equals(field) || "Loại hạ tầng".equals(field) || "Thuộc loại hạ tầng".equals(field)) {
      if ("1".equals(rawValue) || "TTDH VTS".equalsIgnoreCase(rawValue)) return "TTDH VTS";
      if ("2".equals(rawValue) || "Trạm Radar".equalsIgnoreCase(rawValue)) return "Trạm Radar";
      return rawValue;
    }
    if ("attachedInfrastructureId".equals(field) || "Thuộc hạ tầng".equals(field) || "Hạ tầng phụ thuộc".equals(field)) {
      try {
        UUID infraId = UUID.fromString(rawValue);
        if (vtsOperationCenterRepository != null) {
          Optional<VtsOperationCenter> oc = vtsOperationCenterRepository.findByIdAndDeletedAtIsNull(infraId);
          if (oc.isPresent()) return oc.get().getName();
        }
        if (radarStationRepository != null) {
          Optional<RadarStation> rs = radarStationRepository.findById(infraId);
          if (rs.isPresent()) return rs.get().getStationName();
        }
        if (jdbcTemplate != null) {
          List<String> ocNames = jdbcTemplate.queryForList("SELECT name FROM vts_operation_centers WHERE id = ? AND deleted_at IS NULL", String.class, infraId);
          if (!ocNames.isEmpty() && ocNames.get(0) != null) return ocNames.get(0);
          List<String> rsNames = jdbcTemplate.queryForList("SELECT station_name FROM radar_stations WHERE id = ? AND deleted_at IS NULL", String.class, infraId);
          if (!rsNames.isEmpty() && rsNames.get(0) != null) return rsNames.get(0);
        }
        return rawValue;
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("provinceName".equals(field) || "provinceId".equals(field) || "Địa điểm (Tỉnh/TP)".equals(field) || "Tỉnh / Thành phố".equals(field) || "Tỉnh/Thành phố".equals(field)) {
      try {
        if (jdbcTemplate != null) {
          int pid = Integer.parseInt(rawValue);
          List<String> names = jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, pid);
          if (!names.isEmpty() && names.get(0) != null) return names.get(0);
        }
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("operationalStatus".equals(field) || "Trạng thái hoạt động".equals(field) || "Tình trạng hoạt động".equals(field) || "Tình trạng".equals(field)) {
      if ("0".equals(rawValue) || "NOT_YET_OPERATIONAL".equalsIgnoreCase(rawValue)) return "Chưa khai thác/vận hành";
      if ("1".equals(rawValue) || "OPERATIONAL".equalsIgnoreCase(rawValue)) return "Đang khai thác/vận hành";
      if ("2".equals(rawValue) || "SUSPENDED".equalsIgnoreCase(rawValue)) return "Dừng khai thác/vận hành";
      return rawValue;
    }
    if ("unitOfMeasure".equals(field) || "Đơn vị tính".equals(field)) {
      try {
        int uom = Integer.parseInt(rawValue);
        return formatUom(uom);
      } catch (Exception e) {
        return rawValue;
      }
    }
    if ("coordinateSystem".equals(field) || "Hệ quy chiếu".equals(field) || "Hệ tọa độ".equals(field)) {
      if ("1".equals(rawValue) || "4326".equals(rawValue)) return "WGS 84";
      if ("2".equals(rawValue)) return "VN-2000";
      return rawValue;
    }
    if ("objectType".equals(field) || "geometryType".equals(field) || "Loại đối tượng (GIS)".equals(field) || "Loại đối tượng GIS".equals(field) || "Loại đối tượng".equals(field)) {
      if ("POINT".equalsIgnoreCase(rawValue) || "1".equals(rawValue)) return "Đối tượng điểm";
      if ("LINE".equalsIgnoreCase(rawValue) || "LINESTRING".equalsIgnoreCase(rawValue) || "2".equals(rawValue)) return "Đối tượng đường";
      if ("POLYGON".equalsIgnoreCase(rawValue) || "3".equals(rawValue)) return "Đối tượng vùng";
      return rawValue;
    }
    if ("approvalStatus".equals(field) || "Trạng thái phê duyệt".equals(field)) {
      if (ApprovalStatus.DRAFT.name().equalsIgnoreCase(rawValue) || "DRAFT".equalsIgnoreCase(rawValue)) return "Lưu tạm";
      if (ApprovalStatus.PROPOSED.name().equalsIgnoreCase(rawValue) || ApprovalStatus.PENDING_APPROVAL.name().equalsIgnoreCase(rawValue) || "PENDING_APPROVAL".equalsIgnoreCase(rawValue)) return "Chờ Cảng vụ duyệt";
      if (ApprovalStatus.APPROVED_LEVEL1.name().equalsIgnoreCase(rawValue) || "APPROVED_LEVEL1".equalsIgnoreCase(rawValue)) return "Chờ Cục duyệt";
      if (ApprovalStatus.APPROVED.name().equalsIgnoreCase(rawValue) || ApprovalStatus.APPROVED_LEVEL2.name().equalsIgnoreCase(rawValue) || "APPROVED".equalsIgnoreCase(rawValue)) return "Đã duyệt";
      if (ApprovalStatus.REJECTED_LEVEL1.name().equalsIgnoreCase(rawValue) || "REJECTED_LEVEL1".equalsIgnoreCase(rawValue)) return "Bị Cảng vụ trả về";
      if (ApprovalStatus.REJECTED_LEVEL2.name().equalsIgnoreCase(rawValue) || ApprovalStatus.REJECTED.name().equalsIgnoreCase(rawValue) || "REJECTED".equalsIgnoreCase(rawValue)) return "Bị Cục trả về";
      return rawValue;
    }
    return rawValue;
  }

  private static String formatUom(int code) {
    return switch (code) {
      case 1 -> "Bộ";
      case 2 -> "Bến";
      case 3 -> "Bản quyền";
      case 4 -> "Chiếc";
      case 5 -> "Cổng";
      case 6 -> "Cái";
      case 7 -> "Cột";
      case 8 -> "Cầu";
      case 9 -> "Điểm";
      case 10 -> "Đoạn";
      case 11 -> "Hệ thống";
      case 12 -> "Hải lý";
      case 13 -> "Km";
      case 14 -> "Kho";
      case 15 -> "Khu";
      case 16 -> "Luồng";
      case 17 -> "Mét";
      case 18 -> "Quả";
      case 19 -> "Trạm";
      case 20 -> "Tuyến";
      case 21 -> "Vùng";
      default -> String.valueOf(code);
    };
  }

  private static String normalizeSearchKeyword(String keyword) {
    if (keyword == null || keyword.trim().isEmpty()) {
      return null;
    }
    return Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
        .replaceAll("\\p{M}+", "")
        .replace('đ', 'd');
  }

  private Map<UUID, User> resolveUsers(Collection<UUID> userIds) {
    if (userIds == null || userIds.isEmpty())
      return Collections.emptyMap();
    Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
    if (nonNullIds.isEmpty())
      return Collections.emptyMap();
    return userRepository.findAllByIdInWithOrgUnit(nonNullIds).stream()
        .collect(Collectors.toMap(User::getId, user -> user, (first, second) -> first));
  }

  private String formatUserIdentity(User user) {
    if (user == null) return null;
    if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
      return user.getFullName().trim();
    }
    if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
      return user.getUsername().trim();
    }
    return null;
  }

  public Map<String, Object> getAllHistory() {
    return null;
  }
}
