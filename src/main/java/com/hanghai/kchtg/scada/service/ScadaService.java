package com.hanghai.kchtg.scada.service;

import com.hanghai.kchtg.scada.dto.ScadaResponse;
import com.hanghai.kchtg.scada.dto.ScadaOptionResponse;
import com.hanghai.kchtg.scada.dto.CreateScadaRequest;
import com.hanghai.kchtg.scada.dto.UpdateScadaRequest;
import com.hanghai.kchtg.scada.entity.Scada;
import com.hanghai.kchtg.scada.repository.ScadaRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.web.multipart.MultipartFile;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for SCADA CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScadaService {

  private final ScadaRepository scadaRepository;
  private final OrgUnitCacheService orgUnitCacheService;
  private final OperatingOrganizationRepository operatingOrganizationRepository;
  private final OrgUnitScopeService orgUnitScopeService;
  private final ChangeHistoryService changeHistoryService;
  private final UserResolverService userResolverService;
  private final VtsOperationCenterRepository vtsOperationCenterRepository;
  private final RadarStationRepository radarStationRepository;
  private final GisSpatialObjectService gisSpatialObjectService;

  @Value("${app.upload-path:/tmp/scada-attachments}")
  private String uploadPath;

  private final AttachmentRepository attachmentRepository;
  private final InfrastructureApprovalService approvalService;
  private final UserRepository userRepository;

  /**
   * Generate device code in format SCA-NNNNNN.
   */
  public String generateScadaCode() {
    // MAX theo SỐ trên mọi bản ghi (kể cả đã xóa mềm) — tránh trùng mã đang chiếm unique index
    int sequence = scadaRepository.findMaxDeviceCodeSequence().orElse(0) + 1;
    return String.format("SCA-%06d", sequence);
  }

  /**
   * Create a new SCADA system.
   */
  @Transactional
  public ScadaResponse create(CreateScadaRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();

    // Generate device code if not provided
    String deviceCode = request.getDeviceCode();
    if (deviceCode == null || deviceCode.isBlank()) {
      deviceCode = generateScadaCode();
    }

    // Validate uniqueness — kể cả bản ghi đã xóa mềm (unique index device_code vẫn giữ)
    if (scadaRepository.existsDeviceCodeAnyState(deviceCode)) {
      throw new IllegalArgumentException("Mã thiết bị đã tồn tại: " + deviceCode);
    }

    // Validate org unit scope + fallback đơn vị tài khoản thao tác
    // (Data Scope convention — cấm cột org_unit_id NULL khi là dữ liệu nghiệp vụ)
    UUID orgUnitId = request.getOrgUnitId();
    if (orgUnitId != null) {
      orgUnitScopeService.requireOrganizationInScope(orgUnitId);
    } else {
      orgUnitId = userRepository.findById(currentUserId)
        .map(u -> u.getOrgUnit() != null ? u.getOrgUnit().getId() : null)
        .orElse(null);
    }

    // Build entity
    ApprovalStatus targetApprovalStatus = resolveCreateApprovalStatus(request.getAction());
    Scada entity = Scada.builder()
      .deviceCode(deviceCode)
      .deviceName(request.getDeviceName())
      .detailedLocation(request.getDetailedLocation())
      .manufacturer(request.getManufacturer())
      .model(request.getModel())
      .quantity(request.getQuantity())
      .orgUnitId(orgUnitId)
      .operatingUnitId(request.getOperatingUnitId())
      .provinceName(request.getProvinceName())
      .attachedInfrastructureType(request.getAttachedInfrastructureType())
      .attachedInfrastructureId(request.getAttachedInfrastructureId())
      .unitOfMeasure(request.getUnitOfMeasure())
      .yearOfUse(request.getYearOfUse())
      .operationalStatus(request.getOperationalStatus() != null
        ? request.getOperationalStatus()
        : OperationalStatus.OPERATIONAL)
      .approvalStatus(targetApprovalStatus)
      .specifications(request.getSpecifications())
      .maintenanceInformation(request.getMaintenanceInformation())
      .note(request.getNote())
      .objectType(request.getObjectType())
      .mapSymbolId(request.getMapSymbolId())
      .coordinateSystem(request.getCoordinateSystem())
      .displayRule(request.getDisplayRule())
      .spatialId(request.getSpatialId())
      // .securityLevel(request.getSecurityLevel() != null
      //         ? request.getSecurityLevel()
      //         : RecordSecurityLevel.NORMAL)
      .build();

    // Persist trước để entity.getId() có giá trị khi ghi infrastructure_history (ref_id NOT NULL).
    Scada saved = scadaRepository.save(entity);

    // Đồng bộ tọa độ GPS vào gis_spatial_objects (giống AIS) — lưu sau save để có entity id làm refId.
    if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
      UUID spatialId = gisSpatialObjectService.syncSpatialObject(
        null,
        "Hệ thống SCADA " + saved.getDeviceName(),
        saved.getDeviceCode(),
        request.getGeometryType(),
        request.getCoordinates(),
        saved.getId(),
        InfrastructureType.SCADA);
      saved.setSpatialId(spatialId);
      saved = scadaRepository.save(saved);
    }

    String action = request.getAction();
    if ("submit".equalsIgnoreCase(action)) {
      // "Lưu và gửi phê duyệt" khi tạo mới — đi qua approvalService.submit() để áp dụng
      // Rule 14 (người gửi cấp Cục → thẳng "Chờ Cục duyệt"; cấp dưới → "Chờ Cảng vụ / Chi cục duyệt")
      // và ghi vết phê duyệt vào infrastructure_history (giống endpoint POST /{id}/submit).
      approvalService.submit(saved, InfrastructureType.SCADA, currentUserId);
      saved.setSubmittedDate(java.time.LocalDateTime.now());
      saved.setSubmittedBy(currentUserId);
      saved.setApprovalContentLevel1(null);
      saved.setApprovalContentLevel2(null);
      saved = scadaRepository.save(saved);
    } else if ("approve".equalsIgnoreCase(action)) {
      // "Lưu và phê duyệt" khi tạo mới (T12) — ghi nhận người duyệt, ngày duyệt
      // và bản ghi lịch sử thay vì chỉ set trạng thái APPROVED.
      approvalService.recordSaveAndApprove(saved, InfrastructureType.SCADA,
          "Tạo mới và phê duyệt", currentUserId);
      saved = scadaRepository.save(saved);
    }

    return toResponse(saved);
  }

  /**
   * Xác định trạng thái phê duyệt khi tạo mới theo action:
   * 'draft' → DRAFT, 'submit' → DRAFT (rồi approvalService.submit() route theo Rule 14),
   * 'approve' → APPROVED. Mặc định (action null/không hợp lệ) → DRAFT (Lưu tạm).
   */
  private ApprovalStatus resolveCreateApprovalStatus(String action) {
    if ("draft".equals(action) || "submit".equals(action)) {
      return ApprovalStatus.DRAFT;
    }
    if ("approve".equals(action)) {
      return ApprovalStatus.APPROVED;
    }
    return ApprovalStatus.DRAFT;
  }

  /**
   * Get SCADA by ID.
   */
  @Transactional(readOnly = true)
  public ScadaResponse getById(UUID id) {
    Scada entity = scadaRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống SCADA với id: " + id));
    return toResponse(entity);
  }

  /**
   * List all SCADA systems with filtering.
   */
  @Transactional(readOnly = true)
  public Page<ScadaResponse> findAll(
    int page, int size,
    UUID orgUnitId,
    String deviceCode, String deviceName, String province,
    String operationalStatus, String approvalStatus,
    String vtsSystemId,
    Integer attachedInfrastructureType,
    UUID attachedInfrastructureId,
    Integer yearOfUse,
    String updatedFrom, String updatedTo,
    String search,
    String sortBy, String sortOrder) {

    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    boolean includeAll = scope.unrestricted();
    Collection<UUID> orgUnitIds = scope.orgUnitIds();

    Sort sort = buildSort(sortBy, sortOrder);
    Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(size, 100), sort);

    // Filter "Đơn vị quản lý": lọc theo đơn vị được chọn + subtree con (cha xem được con),
    // luôn nằm trong phạm vi scope của tài khoản (query vẫn AND với includeAll/orgUnitIds).
    boolean filterEnabled = orgUnitId != null;
    Collection<UUID> filterOrgUnitIds = filterEnabled
        ? orgUnitScopeService.resolveSubtreeIds(orgUnitId)
        : List.of();

    OperationalStatus opStatus = parseOperationalStatus(operationalStatus);
    ApprovalStatus apprStatus = parseApprovalStatus(approvalStatus);

    LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
    LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);

    Page<Scada> result = scadaRepository.searchScada(
      includeAll, orgUnitIds,
      filterEnabled, filterOrgUnitIds,
      deviceCode, deviceName,
      opStatus, apprStatus,
      yearOfUse,
      updatedFromDt, updatedToDt,
      province,
      attachedInfrastructureType != null ? attachedInfrastructureType : null,
      attachedInfrastructureId != null ? attachedInfrastructureId : null,
      search, pageable);

    return result.map(this::toResponse);
  }

  /**
   * Update an existing SCADA system.
   */
  @Transactional
  public ScadaResponse update(UpdateScadaRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    Scada entity = scadaRepository.findById(request.getId())
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống SCADA với id: " + request.getId()));

    // Capture snapshot for change history
    Scada snapshot = Scada.builder()
      .id(entity.getId())
      .deviceCode(entity.getDeviceCode())
      .deviceName(entity.getDeviceName())
      .detailedLocation(entity.getDetailedLocation())
      .manufacturer(entity.getManufacturer())
      .model(entity.getModel())
      .quantity(entity.getQuantity())
      .orgUnitId(entity.getOrgUnitId())
      .operatingUnitId(entity.getOperatingUnitId())
      .provinceName(entity.getProvinceName())
      .attachedInfrastructureType(entity.getAttachedInfrastructureType())
      .attachedInfrastructureId(entity.getAttachedInfrastructureId())
      .unitOfMeasure(entity.getUnitOfMeasure())
      .yearOfUse(entity.getYearOfUse())
      .operationalStatus(entity.getOperationalStatus())
      .approvalStatus(entity.getApprovalStatus())
      .specifications(entity.getSpecifications())
      .maintenanceInformation(entity.getMaintenanceInformation())
      .note(entity.getNote())
      .objectType(entity.getObjectType())
      .mapSymbolId(entity.getMapSymbolId())
      .coordinateSystem(entity.getCoordinateSystem())
      .displayRule(entity.getDisplayRule())
      .spatialId(entity.getSpatialId())
      .build();

    // Apply updates
    if (request.getDeviceName() != null) entity.setDeviceName(request.getDeviceName());
    if (request.getDetailedLocation() != null) entity.setDetailedLocation(request.getDetailedLocation());
    if (request.getManufacturer() != null) entity.setManufacturer(request.getManufacturer());
    if (request.getModel() != null) entity.setModel(request.getModel());
    if (request.getQuantity() != null) entity.setQuantity(request.getQuantity());
    if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
    if (request.getOperatingUnitId() != null) entity.setOperatingUnitId(request.getOperatingUnitId());
    if (request.getProvinceName() != null) entity.setProvinceName(request.getProvinceName());
    if (request.getAttachedInfrastructureType() != null)
      entity.setAttachedInfrastructureType(request.getAttachedInfrastructureType());
    if (request.getAttachedInfrastructureId() != null)
      entity.setAttachedInfrastructureId(request.getAttachedInfrastructureId());
    if (request.getUnitOfMeasure() != null) entity.setUnitOfMeasure(request.getUnitOfMeasure());
    if (request.getYearOfUse() != null) entity.setYearOfUse(request.getYearOfUse());
    if (request.getOperationalStatus() != null) entity.setOperationalStatus(request.getOperationalStatus());
    if (request.getSpecifications() != null) entity.setSpecifications(request.getSpecifications());
    if (request.getMaintenanceInformation() != null)
      entity.setMaintenanceInformation(request.getMaintenanceInformation());
    if (request.getNote() != null) entity.setNote(request.getNote());
    if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
    if (request.getMapSymbolId() != null) entity.setMapSymbolId(request.getMapSymbolId());
    if (request.getCoordinateSystem() != null) entity.setCoordinateSystem(request.getCoordinateSystem());
    if (request.getDisplayRule() != null) entity.setDisplayRule(request.getDisplayRule());
    if (request.getSpatialId() != null) entity.setSpatialId(request.getSpatialId());

    // Đồng bộ tọa độ GPS vào gis_spatial_objects (giống AIS): coordinates != null → upsert;
    // chuỗi rỗng → xóa spatial cũ (trả null). Không gửi coordinates → giữ nguyên spatial hiện tại.
    if (request.getCoordinates() != null) {
      GisGeometryType geomType = request.getGeometryType() != null
        ? request.getGeometryType() : GisGeometryType.POINT;
      UUID spatialId = gisSpatialObjectService.syncSpatialObject(
        entity.getSpatialId(),
        "Hệ thống SCADA " + (request.getDeviceName() != null ? request.getDeviceName() : entity.getDeviceName()),
        entity.getDeviceCode(),
        geomType,
        request.getCoordinates(),
        entity.getId(),
        InfrastructureType.SCADA);
      entity.setSpatialId(spatialId);
    }

    // Cho phép cập nhật bất kể trạng thái phê duyệt (yêu cầu nghiệp vụ 2026-08-26):
    // hồ sơ đang chờ duyệt được sửa và giữ nguyên trạng thái chờ duyệt.
    ApprovalStatus currentStatus = entity.getApprovalStatus();
    boolean approvedEdit = false;
    if (currentStatus == ApprovalStatus.APPROVED) {
      // T12 — "Lưu và phê duyệt": request có approvalStatus=APPROVED thì giữ trạng thái
      // Đã duyệt (nút phía FE chỉ hiển thị cho tài khoản có quyền duyệt) và ghi nhận
      // người duyệt/ngày duyệt/lịch sử; ngoài ra phải duyệt lại.
      if (request.getApprovalStatus() == ApprovalStatus.APPROVED) {
        approvalService.recordSaveAndApprove(entity, InfrastructureType.SCADA,
            "Cập nhật hồ sơ đã duyệt", currentUserId);
        approvedEdit = true;
      } else {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
      }
    }

    Scada saved = scadaRepository.save(entity);

    // UC-8 (tài liệu phê duyệt — Ca sử dụng 8): chỉ ghi nhật ký thay đổi khi hồ sơ
    // ĐÃ DUYỆT được chỉnh sửa thành công ("Lưu và phê duyệt") — bản nháp/lưu tạm,
    // hồ sơ đang chờ duyệt hoặc bị trả về KHÔNG ghi lịch sử.
    if (approvedEdit) {
      changeHistoryService.recordChanges("SCADA", saved.getId().toString(), currentUserId.toString(), snapshot, saved);
    }

    return toResponse(saved);
  }

  /**
   * Soft-delete a SCADA system.
   */
  @Transactional
  public void softDelete(UUID id) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    Scada entity = scadaRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống SCADA với id: " + id));
    approvalService.deleteDraft(entity, InfrastructureType.SCADA, currentUserId);
    entity.softDelete(currentUserId);
    scadaRepository.save(entity);
    log.info("Soft-deleted SCADA: id={}", id);
  }

  /**
   * Restore a soft-deleted SCADA system.
   */
  @Transactional
  public ScadaResponse restore(UUID id) {
    Scada entity = scadaRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống SCADA với id: " + id));

    int restored = scadaRepository.restoreScadaById(id);
    if (restored == 0) {
      throw new EntityNotFoundException("Không thể khôi phục hệ thống SCADA: " + id);
    }

    // Reload after restore to bypass @SQLRestriction on deletedAt
    Scada restoredEntity = scadaRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống SCADA đã khôi phục: " + id));
    return toResponse(restoredEntity);
  }

  /**
   * Get SCADA options for dropdowns.
   */
  @Transactional(readOnly = true)
  public List<ScadaOptionResponse> getOptions() {
    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    if (scope.unrestricted()) {
      return scadaRepository.findAllOptions();
    }
    return scadaRepository.findOptionsByOrgUnitIds(scope.orgUnitIds());
  }

  /**
   * Convert entity to response DTO.
   */
  public ScadaResponse toResponse(Scada entity) {
    String orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());
    String operatingUnitName = entity.getOperatingUnitId() != null
        ? operatingOrganizationRepository.findById(entity.getOperatingUnitId())
            .map(OperatingOrganization::getName)
            .orElseGet(() -> orgUnitCacheService.getName(entity.getOperatingUnitId()))
        : null;
    String attachedInfrastructureName = resolveAttachedInfrastructureName(entity);

    // Đọc tọa độ GIS từ bảng tập trung gis_spatial_objects qua spatial_id (giống AIS / VtsOperationCenter)
    String coordinates = null;
    GisGeometryType geometryType = null;
    if (entity.getSpatialId() != null) {
      Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
      if (spatialOpt.isPresent()) {
        coordinates = spatialOpt.get().getCoordinates();
        geometryType = spatialOpt.get().getGeometryType();
      }
    }

    return ScadaResponse.builder()
      .id(entity.getId())
      .securityLevel(entity.getSecurityLevel())
      .deviceCode(entity.getDeviceCode())
      .deviceName(entity.getDeviceName())
      .detailedLocation(entity.getDetailedLocation())
      .manufacturer(entity.getManufacturer())
      .model(entity.getModel())
      .quantity(entity.getQuantity())
      .orgUnitId(entity.getOrgUnitId())
      .orgUnitName(orgUnitName)
      .operatingUnitId(entity.getOperatingUnitId())
      .operatingUnitName(operatingUnitName)
      .provinceName(entity.getProvinceName())
      .attachedInfrastructureType(entity.getAttachedInfrastructureType())
      .attachedInfrastructureId(entity.getAttachedInfrastructureId())
      .attachedInfrastructureName(attachedInfrastructureName)
      .unitOfMeasure(entity.getUnitOfMeasure())
      .yearOfUse(entity.getYearOfUse())
      .operationalStatus(entity.getOperationalStatus())
      .approvalStatus(entity.getApprovalStatus())
      .approverLevel1(entity.getApproverLevel1())
      .approverLevel1Name(resolveUserName(entity.getApproverLevel1()))
      .approvedDateLevel1(entity.getApprovedDateLevel1())
      .approverLevel2(entity.getApproverLevel2())
      .approverLevel2Name(resolveUserName(entity.getApproverLevel2()))
      .approvedDateLevel2(entity.getApprovedDateLevel2())
      .rejectionReason(entity.getRejectionReason())
      .submittedDate(entity.getSubmittedDate())
      .submittedBy(entity.getSubmittedBy())
      .submittedByName(resolveUserName(entity.getSubmittedBy()))
      .approvalContentLevel1(entity.getApprovalContentLevel1())
      .approvalContentLevel2(entity.getApprovalContentLevel2())
      .specifications(entity.getSpecifications())
      .maintenanceInformation(entity.getMaintenanceInformation())
      .note(entity.getNote())
      .objectType(entity.getObjectType())
      .mapSymbolId(entity.getMapSymbolId())
      .coordinateSystem(entity.getCoordinateSystem())
      .displayRule(entity.getDisplayRule())
      .spatialId(entity.getSpatialId())
      .geometryType(geometryType)
      .coordinates(coordinates)
      .createdBy(entity.getCreatedBy())
      .updatedBy(entity.getUpdatedBy())
      .createdByName(userResolverService.resolveName(entity.getCreatedBy()))
      .updatedByName(userResolverService.resolveName(entity.getUpdatedBy()))
      .createdAt(entity.getCreatedAt())
      .updatedAt(entity.getUpdatedAt())
      .build();
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private String resolveAttachedInfrastructureName(Scada entity) {
    if (entity.getAttachedInfrastructureId() == null) return null;
    Integer type = entity.getAttachedInfrastructureType();
    if (type == null) return null;
    if (type == 1) {
      // Loại 1 = Trung tâm điều hành VTS (TTDH VTS)
      Optional<VtsOperationCenter> oc = vtsOperationCenterRepository
          .findByIdAndDeletedAtIsNull(entity.getAttachedInfrastructureId());
      return oc.map(VtsOperationCenter::getName).orElse(null);
    }
    if (type == 2) {
      Optional<RadarStation> radar = radarStationRepository.findById(entity.getAttachedInfrastructureId());
      return radar.map(RadarStation::getStationName).orElse(null);
    }
    return null;
  }

  private String resolveUserName(UUID userId) {
    if (userId == null) return null;
    return userRepository.findById(userId).map(this::formatUserIdentity).orElse(null);
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

  private OperationalStatus parseOperationalStatus(String status) {
    if (status == null || status.isBlank()) return null;
    try {
      String upper = status.trim().toUpperCase();
      // FE gửi số (0/1/2 — ordinal của enum) hoặc tên (OPERATIONAL...)
      if ("0".equals(upper) || "NOT_YET_OPERATIONAL".equals(upper) || "CHUA_KHAI_THAC".equals(upper)) {
        return OperationalStatus.NOT_YET_OPERATIONAL;
      }
      if ("1".equals(upper) || "HIEN_HANH".equals(upper) || "ACTIVE".equals(upper) || "OPERATIONAL".equals(upper)) {
        return OperationalStatus.OPERATIONAL;
      }
      if ("2".equals(upper) || "TAM_NGUNG".equals(upper) || "INACTIVE".equals(upper) || "SUSPENDED".equals(upper)) {
        return OperationalStatus.SUSPENDED;
      }
      return null;
    } catch (Exception e) {
      return null;
    }
  }

  private ApprovalStatus parseApprovalStatus(String status) {
    if (status == null || status.isBlank()) return null;
    try {
      String upper = status.trim().toUpperCase();
      if ("CHO_PHE_DUYET".equals(upper) || "PENDING".equals(upper) || "PENDING_APPROVAL".equals(upper)) {
        return ApprovalStatus.PENDING_APPROVAL;
      }
      if ("DA_PHE_DUYET".equals(upper) || "APPROVED".equals(upper)) {
        return ApprovalStatus.APPROVED;
      }
      if ("TU_CHOI".equals(upper) || "REJECTED".equals(upper)) {
        return ApprovalStatus.REJECTED;
      }
      if ("DRAFT".equals(upper)) {
        return ApprovalStatus.DRAFT;
      }
      if ("APPROVED_LEVEL1".equals(upper) || "APPROVED_L1".equals(upper)) {
        return ApprovalStatus.APPROVED_LEVEL1;
      }
      if ("APPROVED_LEVEL2".equals(upper) || "APPROVED_L2".equals(upper)) {
        return ApprovalStatus.APPROVED_LEVEL2;
      }
      if ("REJECTED_LEVEL1".equals(upper) || "REJECTED_L1".equals(upper)) {
        return ApprovalStatus.REJECTED_LEVEL1;
      }
      if ("REJECTED_LEVEL2".equals(upper) || "REJECTED_L2".equals(upper)) {
        return ApprovalStatus.REJECTED_LEVEL2;
      }
      return null;
    } catch (Exception e) {
      return null;
    }
  }

  private LocalDateTime parseLocalDateTime(String dateStr) {
    if (dateStr == null || dateStr.isBlank()) return null;
    try {
      // FE gửi "yyyy-MM-dd HH:mm:ss" (dấu cách) — chuẩn hóa sang ISO với 'T' (giống /port)
      return LocalDateTime.parse(dateStr.trim().replace(" ", "T"));
    } catch (Exception e) {
      return null;
    }
  }

  /**
   * Xây dựng sort an toàn cho danh sách: chỉ chấp nhận field trong allowlist
   * (chống injection / field không tồn tại), mặc định updatedAt DESC.
   */
  private Sort buildSort(String sortBy, String sortOrder) {
    String field = sortBy == null || sortBy.isBlank() ? "updatedAt" : sortBy.trim();
    switch (field) {
      case "deviceCode":
      case "deviceName":
      case "code":
      case "createdAt":
      case "updatedAt":
      case "yearOfUse":
      case "quantity":
      case "unitOfMeasure":
      case "provinceName":
      case "orgUnitId":
      case "approvalStatus":
      case "operationalStatus":
        break;
      case "updatedByName": // cột gộp "Cán bộ cập nhật/Ngày cập nhật" — sort theo ngày
        field = "updatedAt";
        break;
      default:
        field = "updatedAt";
    }
    Sort.Direction dir = "asc".equalsIgnoreCase(sortOrder)
        ? Sort.Direction.ASC
        : Sort.Direction.DESC;
    return Sort.by(dir, field).and(Sort.by(Sort.Direction.ASC, "id"));
  }

  // ── ATTACHMENTS (File đính kèm) ───────────────────────────────────

  @Transactional
  public List<AttachmentDto> uploadAttachments(UUID entityId, List<MultipartFile> files, UUID userId) {
    final String entityType = "SCADA";
    long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
    if (existingCount + files.size() > 10) {
      throw new IllegalArgumentException("Tối đa 10 file đính kèm");
    }
    List<Attachment> saved = new ArrayList<>();
    java.nio.file.Path basePath = java.nio.file.Paths.get(uploadPath).toAbsolutePath().normalize();
    for (MultipartFile file : files) {
      String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
      String storageFileName = System.currentTimeMillis() + "_" + originalFilename;
      try {
        java.nio.file.Path dir = basePath.resolve(entityType).resolve(entityId.toString());
        java.nio.file.Files.createDirectories(dir);
        file.transferTo(dir.resolve(storageFileName).toFile());
      } catch (Exception e) {
        throw new RuntimeException("Không thể lưu file: " + originalFilename);
      }
      String storagePath = basePath.resolve(entityType).resolve(entityId.toString()).resolve(storageFileName).toString();
      Attachment attachment = new Attachment();
      attachment.setEntityType(entityType);
      attachment.setEntityId(entityId);
      attachment.setFileName(originalFilename);
      attachment.setFilePath(storagePath);
      attachment.setFileSize(file.getSize());
      attachment.setContentType(file.getContentType());
      attachment.setUploadedBy(userId);
      saved.add(attachmentRepository.save(attachment));
    }
    return saved.stream().map(this::toAttachmentDto).toList();
  }

  public List<AttachmentDto> listAttachments(UUID entityId) {
    return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("SCADA", entityId)
        .stream().map(this::toAttachmentDto).toList();
  }

  @Transactional
  public void deleteAttachment(UUID entityId, UUID attachmentId) {
    Attachment attachment = attachmentRepository.findById(attachmentId)
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
    if (!attachment.getEntityId().equals(entityId)) {
      throw new IllegalArgumentException("File không thuộc hệ thống SCADA này");
    }
    try {
      java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
    } catch (Exception e) {
      // ignore file deletion failure; the DB record is still removed
    }
    attachmentRepository.delete(attachment);
  }

  private AttachmentDto toAttachmentDto(Attachment entity) {
    AttachmentDto dto = new AttachmentDto();
    dto.setId(entity.getId());
    dto.setEntityType(entity.getEntityType());
    dto.setEntityId(entity.getEntityId());
    dto.setFileName(entity.getFileName());
    dto.setFilePath(entity.getFilePath());
    dto.setFileSize(entity.getFileSize());
    dto.setContentType(entity.getContentType());
    dto.setUploadedBy(entity.getUploadedBy());
    dto.setUploadedAt(entity.getUploadedAt());
    return dto;
  }
}
