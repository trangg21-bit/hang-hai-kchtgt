package com.hanghai.kchtg.vhf.service;

import com.hanghai.kchtg.vhf.dto.VhfResponse;
import com.hanghai.kchtg.vhf.dto.VhfOptionResponse;
import com.hanghai.kchtg.vhf.dto.CreateVhfRequest;
import com.hanghai.kchtg.vhf.dto.UpdateVhfRequest;
import com.hanghai.kchtg.vhf.entity.Vhf;
import com.hanghai.kchtg.vhf.repository.VhfRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
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
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for VHF communication system CRUD operations.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class VhfService {

  private final VhfRepository vhfRepository;
  private final OrgUnitScopeService orgUnitScopeService;
  private final OrgUnitCacheService orgUnitCacheService;
  private final OperatingOrganizationRepository operatingOrganizationRepository;
  private final GisSpatialObjectService gisSpatialObjectService;
  private final AttachmentRepository attachmentRepository;
  private final InfrastructureApprovalService approvalService;
  private final InfrastructureHistoryRepository historyRepository;
  private final ChangeHistoryService changeHistoryService;
  private final UserRepository userRepository;
  private final VtsOperationCenterRepository vtsOperationCenterRepository;
  private final RadarStationRepository radarStationRepository;
  private final PortRepository portRepository;

  @Value("${app.upload.dir:uploads}")
  private String uploadPath;

  /**
   * Create a new VHF system.
   */
  @Transactional
  public VhfResponse create(CreateVhfRequest request) {
    String deviceCode = request.getDeviceCode();
    if (deviceCode == null || deviceCode.trim().isEmpty()) {
      deviceCode = generateDeviceCode();
    } else {
      deviceCode = deviceCode.trim();
    }

    if (vhfRepository.existsDeviceCodeAnyState(deviceCode)) {
      throw new IllegalArgumentException("Mã thiết bị VHF đã tồn tại trong hệ thống: " + deviceCode);
    }

    Vhf entity = Vhf.builder()
      .deviceCode(deviceCode)
      .deviceName(request.getDeviceName().trim())
      .detailedLocation(request.getDetailedLocation())
      .manufacturer(request.getManufacturer())
      .model(request.getModel())
      .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
      .seaportId(request.getSeaportId())
      .orgUnitId(request.getOrgUnitId())
      .operatingUnitId(request.getOperatingUnitId())
      .provinceName(request.getProvinceName())
      .attachedInfrastructureType(request.getAttachedInfrastructureType())
      .attachedInfrastructureId(request.getAttachedInfrastructureId())
      .unitOfMeasure(request.getUnitOfMeasure())
      .yearOfUse(request.getYearOfUse())
      .operationalStatus(request.getOperationalStatus() != null
        ? request.getOperationalStatus()
        : OperationalStatus.OPERATIONAL)
      .approvalStatus(ApprovalStatus.DRAFT)
      .specifications(request.getSpecifications())
      .maintenanceInformation(request.getMaintenanceInformation())
      .note(request.getNote())
      .objectType(request.getObjectType())
      .mapSymbolId(request.getMapSymbolId())
      .coordinateSystem(request.getCoordinateSystem())
      .displayRule(request.getDisplayRule())
      .spatialId(request.getSpatialId())
      .build();

    Vhf saved = vhfRepository.save(entity);

    // Đồng bộ tọa độ GIS vào gis_spatial_objects
    if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
      UUID spatialId = gisSpatialObjectService.syncSpatialObject(
        null,
        "Hệ thống VHF " + saved.getDeviceName(),
        saved.getDeviceCode(),
        request.getGeometryType(),
        request.getCoordinates(),
        saved.getId(),
        InfrastructureType.VHF);
      saved.setSpatialId(spatialId);
      saved = vhfRepository.save(saved);
    }

    log.info("Created VHF system: id={}, deviceCode={}", saved.getId(), saved.getDeviceCode());
    return toResponse(saved);
  }

  /**
   * Find VHF system by ID.
   */
  @Transactional(readOnly = true)
  public VhfResponse findById(UUID id) {
    Vhf entity = vhfRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));
    return toResponse(entity);
  }

  /**
   * Find all VHF systems with filter criteria.
   */
  @Transactional(readOnly = true)
  public Page<VhfResponse> findAll(
    int page, int size,
    UUID orgUnitId,
    UUID seaportId,
    String deviceCode, String deviceName, String province,
    String operationalStatus, String approvalStatus,
    String vtsSystemId,
    Integer attachedInfrastructureType,
    UUID attachedInfrastructureId,
    Integer yearOfUse,
    String updatedFrom, String updatedTo,
    String search,
    String sortBy, String sortOrder) {

    Sort sort = buildSort(sortBy, sortOrder);
    Pageable pageable = PageRequest.of(page, size, sort);

    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    boolean includeAll = scope.unrestricted();
    Collection<UUID> orgUnitIds = scope.orgUnitIds();

    boolean filterEnabled = orgUnitId != null;
    Collection<UUID> filterOrgUnitIds = filterEnabled
        ? orgUnitScopeService.resolveSubtreeIds(orgUnitId)
        : List.of();

    OperationalStatus opStatus = parseOperationalStatus(operationalStatus);
    ApprovalStatus apprStatus = parseApprovalStatus(approvalStatus);

    LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
    LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);

    Page<Vhf> result = vhfRepository.searchVhf(
      includeAll, orgUnitIds,
      filterEnabled, filterOrgUnitIds,
      seaportId,
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
   * Update an existing VHF system.
   */
  @Transactional
  public VhfResponse update(UpdateVhfRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    Vhf entity = vhfRepository.findById(request.getId())
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + request.getId()));

    Vhf snapshot = Vhf.builder()
      .id(entity.getId())
      .deviceCode(entity.getDeviceCode())
      .deviceName(entity.getDeviceName())
      .detailedLocation(entity.getDetailedLocation())
      .manufacturer(entity.getManufacturer())
      .model(entity.getModel())
      .quantity(entity.getQuantity())
      .seaportId(entity.getSeaportId())
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

    String oldCoordinates = null;
    String oldGeometryType = null;
    if (entity.getSpatialId() != null) {
      Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
      if (spatialOpt.isPresent()) {
        oldCoordinates = spatialOpt.get().getCoordinates();
        oldGeometryType = spatialOpt.get().getGeometryType() != null ? spatialOpt.get().getGeometryType().name() : null;
      }
    }

    if (request.getDeviceName() != null) entity.setDeviceName(request.getDeviceName().trim());
    if (request.getDetailedLocation() != null) entity.setDetailedLocation(request.getDetailedLocation());
    if (request.getManufacturer() != null) entity.setManufacturer(request.getManufacturer());
    if (request.getModel() != null) entity.setModel(request.getModel());
    if (request.getQuantity() != null) entity.setQuantity(request.getQuantity());
    if (request.getSeaportId() != null) entity.setSeaportId(request.getSeaportId());
    if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
    if (request.getOperatingUnitId() != null) entity.setOperatingUnitId(request.getOperatingUnitId());
    if (request.getProvinceName() != null) entity.setProvinceName(request.getProvinceName());
    if (request.getAttachedInfrastructureType() != null) entity.setAttachedInfrastructureType(request.getAttachedInfrastructureType());
    if (request.getAttachedInfrastructureId() != null) entity.setAttachedInfrastructureId(request.getAttachedInfrastructureId());
    if (request.getUnitOfMeasure() != null) entity.setUnitOfMeasure(request.getUnitOfMeasure());
    if (request.getYearOfUse() != null) entity.setYearOfUse(request.getYearOfUse());
    if (request.getOperationalStatus() != null) entity.setOperationalStatus(request.getOperationalStatus());
    if (request.getSpecifications() != null) entity.setSpecifications(request.getSpecifications());
    if (request.getMaintenanceInformation() != null) entity.setMaintenanceInformation(request.getMaintenanceInformation());
    if (request.getNote() != null) entity.setNote(request.getNote());
    if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
    if (request.getMapSymbolId() != null) entity.setMapSymbolId(request.getMapSymbolId());
    if (request.getCoordinateSystem() != null) entity.setCoordinateSystem(request.getCoordinateSystem());
    if (request.getDisplayRule() != null) entity.setDisplayRule(request.getDisplayRule());

    if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
      UUID spatialId = gisSpatialObjectService.syncSpatialObject(
        entity.getSpatialId(),
        "Hệ thống VHF " + entity.getDeviceName(),
        entity.getDeviceCode(),
        request.getGeometryType(),
        request.getCoordinates(),
        entity.getId(),
        InfrastructureType.VHF);
      entity.setSpatialId(spatialId);
    }

    boolean approvedEdit = false;
    if (snapshot.getApprovalStatus() == ApprovalStatus.APPROVED) {
      if (request.getApprovalStatus() == ApprovalStatus.APPROVED) {
        approvalService.recordSaveAndApprove(entity, InfrastructureType.VHF,
            "Cập nhật hồ sơ đã duyệt", currentUserId);
        approvedEdit = true;
      } else {
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
      }
    }

    Vhf saved = vhfRepository.save(entity);

    if (approvedEdit) {
      changeHistoryService.recordChanges("VHF", saved.getId().toString(), currentUserId.toString(), snapshot, saved);
      if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()
          && !request.getCoordinates().trim().equals(oldCoordinates != null ? oldCoordinates.trim() : "")) {
        historyRepository.save(InfrastructureHistory.builder()
            .refId(saved.getId())
            .refType(InfrastructureType.VHF)
            .approvalLevel(ApprovalLevel.LEVEL_2)
            .status(InfrastructureHistoryStatus.UPDATED)
            .approvedBy(currentUserId)
            .changedField("Tọa độ GIS")
            .previousValue(oldCoordinates != null ? oldCoordinates.trim() : "Chưa có")
            .newValue(request.getCoordinates().trim())
            .reason("Cập nhật thông tin Tọa độ GIS")
            .build());
      }
      String oldGeomKey = oldGeometryType != null ? oldGeometryType : "";
      if (request.getGeometryType() != null && !request.getGeometryType().name().equals(oldGeomKey)) {
        historyRepository.save(InfrastructureHistory.builder()
            .refId(saved.getId())
            .refType(InfrastructureType.VHF)
            .approvalLevel(ApprovalLevel.LEVEL_2)
            .status(InfrastructureHistoryStatus.UPDATED)
            .approvedBy(currentUserId)
            .changedField("Loại đối tượng GIS")
            .previousValue(oldGeometryType != null ? oldGeometryType : "Chưa có")
            .newValue(request.getGeometryType().name())
            .reason("Cập nhật thông tin Loại đối tượng GIS")
            .build());
      }
    }

    return toResponse(saved);
  }

  /**
   * Soft-delete a VHF system.
   */
  @Transactional
  public void softDelete(UUID id) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    Vhf entity = vhfRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));
    approvalService.deleteDraft(entity, InfrastructureType.VHF, currentUserId);
    entity.softDelete(currentUserId);
    vhfRepository.save(entity);
    log.info("Soft-deleted VHF: id={}", id);
  }

  /**
   * Restore a soft-deleted VHF system.
   */
  @Transactional
  public VhfResponse restore(UUID id) {
    Vhf entity = vhfRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF với id: " + id));

    int restored = vhfRepository.restoreVhfById(id);
    if (restored == 0) {
      throw new EntityNotFoundException("Không thể khôi phục hệ thống VHF: " + id);
    }

    Vhf restoredEntity = vhfRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống VHF đã khôi phục: " + id));
    return toResponse(restoredEntity);
  }

  /**
   * Get VHF options for dropdowns.
   */
  @Transactional(readOnly = true)
  public List<VhfOptionResponse> getOptions() {
    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    if (scope.unrestricted()) {
      return vhfRepository.findAllOptions();
    }
    return vhfRepository.findOptionsByOrgUnitIds(scope.orgUnitIds());
  }

  /**
   * Convert entity to response DTO.
   */
  public VhfResponse toResponse(Vhf entity) {
    String orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());
    String seaportName = entity.getSeaportId() != null
        ? portRepository.findById(entity.getSeaportId()).map(Port::getPortName).orElse(null)
        : null;
    String operatingUnitName = entity.getOperatingUnitId() != null
        ? operatingOrganizationRepository.findById(entity.getOperatingUnitId())
            .map(OperatingOrganization::getName)
            .orElseGet(() -> orgUnitCacheService.getName(entity.getOperatingUnitId()))
        : null;
    String attachedInfrastructureName = resolveAttachedInfrastructureName(entity);

    String coordinates = null;
    GisGeometryType geometryType = null;
    if (entity.getSpatialId() != null) {
      Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
      if (spatialOpt.isPresent()) {
        coordinates = spatialOpt.get().getCoordinates();
        geometryType = spatialOpt.get().getGeometryType();
      }
    }

    return VhfResponse.builder()
      .id(entity.getId())
      .deviceCode(entity.getDeviceCode())
      .deviceName(entity.getDeviceName())
      .detailedLocation(entity.getDetailedLocation())
      .manufacturer(entity.getManufacturer())
      .model(entity.getModel())
      .quantity(entity.getQuantity())
      .seaportId(entity.getSeaportId())
      .seaportName(seaportName)
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
      .approverLevel1Name(entity.getApproverLevel1() != null
        ? userRepository.findById(entity.getApproverLevel1()).map(User::getFullName).orElse(null)
        : null)
      .approvedDateLevel1(entity.getApprovedDateLevel1())
      .approverLevel2(entity.getApproverLevel2())
      .approverLevel2Name(entity.getApproverLevel2() != null
        ? userRepository.findById(entity.getApproverLevel2()).map(User::getFullName).orElse(null)
        : null)
      .approvedDateLevel2(entity.getApprovedDateLevel2())
      .rejectionReason(entity.getRejectionReason())
      .submittedDate(entity.getSubmittedDate())
      .submittedBy(entity.getSubmittedBy())
      .submittedByName(entity.getSubmittedBy() != null
        ? userRepository.findById(entity.getSubmittedBy()).map(User::getFullName).orElse(null)
        : null)
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
      .createdByName(entity.getCreatedBy() != null
        ? userRepository.findById(entity.getCreatedBy()).map(User::getFullName).orElse(null)
        : null)
      .updatedByName(entity.getUpdatedBy() != null
        ? userRepository.findById(entity.getUpdatedBy()).map(User::getFullName).orElse(null)
        : null)
      .createdAt(entity.getCreatedAt())
      .updatedAt(entity.getUpdatedAt())
      .build();
  }

  public VhfResponse mapToResponse(Vhf entity) {
    return toResponse(entity);
  }

  private String resolveAttachedInfrastructureName(Vhf entity) {
    if (entity.getAttachedInfrastructureType() == null || entity.getAttachedInfrastructureId() == null) {
      return null;
    }
    Integer type = entity.getAttachedInfrastructureType();
    UUID targetId = entity.getAttachedInfrastructureId();
    if (type == 1) {
      return vtsOperationCenterRepository.findById(targetId)
          .map(VtsOperationCenter::getName)
          .orElse(null);
    }
    if (type == 2) {
      return radarStationRepository.findById(targetId)
          .map(RadarStation::getStationName)
          .orElse(null);
    }
    return null;
  }

  public String generateDeviceCode() {
    int maxNumber = vhfRepository.findMaxDeviceCodeNumber();
    int nextNumber = maxNumber + 1;
    String candidate = String.format("VHF-%04d", nextNumber);
    while (vhfRepository.existsDeviceCodeAnyState(candidate)) {
      nextNumber++;
      candidate = String.format("VHF-%04d", nextNumber);
    }
    return candidate;
  }

  private OperationalStatus parseOperationalStatus(String status) {
    if (status == null || status.isBlank()) return null;
    try {
      int val = Integer.parseInt(status.trim());
      for (OperationalStatus st : OperationalStatus.values()) {
        if (st.getValue() == val) return st;
      }
    } catch (NumberFormatException ignored) {}
    try {
      return OperationalStatus.fromString(status);
    } catch (Exception e) {
      return null;
    }
  }

  private ApprovalStatus parseApprovalStatus(String status) {
    if (status == null || status.isBlank()) return null;
    try {
      int val = Integer.parseInt(status.trim());
      for (ApprovalStatus s : ApprovalStatus.values()) {
        if (s.ordinal() == val) return s;
      }
    } catch (NumberFormatException ignored) {}
    try {
      String upper = status.trim().toUpperCase();
      if ("CHO_PHE_DUYET".equals(upper) || "PENDING".equals(upper) || "PENDING_APPROVAL".equals(upper)) return ApprovalStatus.PENDING_APPROVAL;
      if ("DA_PHE_DUYET".equals(upper) || "APPROVED".equals(upper)) return ApprovalStatus.APPROVED;
      if ("TU_CHOI".equals(upper) || "REJECTED".equals(upper)) return ApprovalStatus.REJECTED;
      if ("DRAFT".equals(upper)) return ApprovalStatus.DRAFT;
      if ("APPROVED_LEVEL1".equals(upper) || "APPROVED_L1".equals(upper)) return ApprovalStatus.APPROVED_LEVEL1;
      if ("APPROVED_LEVEL2".equals(upper) || "APPROVED_L2".equals(upper)) return ApprovalStatus.APPROVED_LEVEL2;
      if ("REJECTED_LEVEL1".equals(upper) || "REJECTED_L1".equals(upper)) return ApprovalStatus.REJECTED_LEVEL1;
      if ("REJECTED_LEVEL2".equals(upper) || "REJECTED_L2".equals(upper)) return ApprovalStatus.REJECTED_LEVEL2;
      return null;
    } catch (Exception e) {
      return null;
    }
  }

  private LocalDateTime parseLocalDateTime(String dateStr) {
    if (dateStr == null || dateStr.isBlank()) return null;
    try {
      return LocalDateTime.parse(dateStr.trim().replace(" ", "T"));
    } catch (Exception e) {
      return null;
    }
  }

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
      case "updatedByName":
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
    final String entityType = "VHF";
    long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
    if (existingCount + files.size() > 10) {
      throw new IllegalArgumentException("Tối đa 10 file đính kèm");
    }
    List<Attachment> saved = new ArrayList<>();
    java.nio.file.Path basePath = java.nio.file.Paths.get(uploadPath).toAbsolutePath().normalize();
    Vhf entity = vhfRepository.findById(entityId).orElse(null);
    boolean wasApproved = entity != null
        && (ApprovalStatus.APPROVED.equals(entity.getApprovalStatus())
            || ApprovalStatus.APPROVED_LEVEL2.equals(entity.getApprovalStatus()));
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
      if (wasApproved) {
        historyRepository.save(InfrastructureHistory.builder()
            .refId(entityId)
            .refType(InfrastructureType.VHF)
            .approvalLevel(ApprovalLevel.LEVEL_2)
            .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
            .approvedBy(userId)
            .changedField("Tài liệu đính kèm")
            .previousValue(null)
            .newValue(originalFilename)
            .reason("Tải lên tài liệu đính kèm: " + originalFilename)
            .build());
      }
    }
    return saved.stream().map(this::toAttachmentDto).toList();
  }

  @Transactional(readOnly = true)
  public List<AttachmentDto> getAttachments(UUID entityId) {
    return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("VHF", entityId)
        .stream().map(this::toAttachmentDto).toList();
  }

  @Transactional(readOnly = true)
  public Attachment getAttachment(UUID entityId, UUID attachmentId) {
    return attachmentRepository.findById(attachmentId)
        .filter(a -> "VHF".equalsIgnoreCase(a.getEntityType()) && entityId.equals(a.getEntityId()))
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file đính kèm với id: " + attachmentId));
  }

  @Transactional
  public void deleteAttachment(UUID entityId, UUID attachmentId, UUID userId) {
    Attachment attachment = attachmentRepository.findById(attachmentId)
        .filter(a -> "VHF".equalsIgnoreCase(a.getEntityType()) && entityId.equals(a.getEntityId()))
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file đính kèm với id: " + attachmentId));
    try {
      java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
    } catch (Exception ignored) {}
    attachmentRepository.delete(attachment);
    Vhf entity = vhfRepository.findById(entityId).orElse(null);
    boolean wasApproved = entity != null
        && (ApprovalStatus.APPROVED.equals(entity.getApprovalStatus())
            || ApprovalStatus.APPROVED_LEVEL2.equals(entity.getApprovalStatus()));
    if (wasApproved) {
      historyRepository.save(InfrastructureHistory.builder()
          .refId(entityId)
          .refType(InfrastructureType.VHF)
          .approvalLevel(ApprovalLevel.LEVEL_2)
          .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
          .approvedBy(userId)
          .changedField("Tài liệu đính kèm")
          .previousValue(attachment.getFileName())
          .newValue(null)
          .reason("Xóa tài liệu đính kèm: " + attachment.getFileName())
          .build());
    }
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
