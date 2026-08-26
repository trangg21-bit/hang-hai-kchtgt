package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.dto.CctvOptionResponse;
import com.hanghai.kchtg.cctv.dto.CreateCctvRequest;
import com.hanghai.kchtg.cctv.dto.UpdateCctvRequest;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for CCTV CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CctvService {

  private final CctvRepository cctvRepository;
  private final OrgUnitCacheService orgUnitCacheService;
  private final OrgUnitScopeService orgUnitScopeService;
  private final ChangeHistoryService changeHistoryService;
  private final UserResolverService userResolverService;
  private final VtsSystemRepository vtsSystemRepository;
  private final RadarStationRepository radarStationRepository;

  @Value("${app.upload-path:/tmp/cctv-attachments}")
  private String uploadPath;

  private final AttachmentRepository attachmentRepository;
  private final InfrastructureApprovalService approvalService;
  private final UserRepository userRepository;

  /**
   * Generate device code in format CCTV-NNNNNN.
   */
  public String generateCctvCode() {
    Optional<String> maxCode = cctvRepository.findMaxDeviceCode();

    int sequence = 1;
    if (maxCode.isPresent() && !maxCode.get().isBlank()) {
      String lastCode = maxCode.get();
      try {
        // Extract sequence from last code: CCTV-NNNNNN
        int lastDash = lastCode.lastIndexOf('-');
        if (lastDash > 0) {
          String seqPart = lastCode.substring(lastDash + 1);
          sequence = Integer.parseInt(seqPart) + 1;
        }
      } catch (NumberFormatException e) {
        log.warn("Could not parse sequence from device code: {}", lastCode);
      }
    }

    return String.format("CCTV-%06d", sequence);
  }

  /**
   * Create a new CCTV system.
   */
  @Transactional
  public CctvResponse create(CreateCctvRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();

    // Generate device code if not provided
    String deviceCode = request.getDeviceCode();
    if (deviceCode == null || deviceCode.isBlank()) {
      deviceCode = generateCctvCode();
    }

    // Validate uniqueness
    if (cctvRepository.existsByDeviceCode(deviceCode)) {
      throw new IllegalArgumentException("Mã thiết bị đã tồn tại: " + deviceCode);
    }

    // Validate org unit scope
    if (request.getOrgUnitId() != null) {
      orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
    }

    // Build entity
    Cctv entity = Cctv.builder()
      .deviceCode(deviceCode)
      .deviceName(request.getDeviceName())
      .detailedLocation(request.getDetailedLocation())
      .manufacturer(request.getManufacturer())
      .model(request.getModel())
      .quantity(request.getQuantity())
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
      .approvalStatus(resolveCreateApprovalStatus(request.getAction()))
      .specifications(request.getSpecifications())
      .maintenanceInformation(request.getMaintenanceInformation())
      .note(request.getNote())
      .objectType(request.getObjectType())
      .mapSymbolId(request.getMapSymbolId())
      .coordinateSystem(request.getCoordinateSystem())
      .displayRule(request.getDisplayRule())
      .spatialId(request.getSpatialId())
      .securityLevel(request.getSecurityLevel() != null
        ? request.getSecurityLevel()
        : RecordSecurityLevel.NORMAL)
      .build();

    Cctv saved = cctvRepository.save(entity);

    return toResponse(saved);
  }

  /**
   * Xác định trạng thái phê duyệt khi tạo mới theo action:
   * 'draft' → DRAFT, 'submit' → PENDING_APPROVAL, 'approve' → APPROVED.
   * Mặc định (action null/không hợp lệ) → DRAFT (Lưu tạm).
   */
  private ApprovalStatus resolveCreateApprovalStatus(String action) {
    if ("draft".equals(action)) {
      return ApprovalStatus.DRAFT;
    }
    if ("submit".equals(action)) {
      return ApprovalStatus.PENDING_APPROVAL;
    }
    if ("approve".equals(action)) {
      return ApprovalStatus.APPROVED;
    }
    return ApprovalStatus.DRAFT;
  }

  /**
   * Get CCTV by ID.
   */
  @Transactional(readOnly = true)
  public CctvResponse getById(UUID id) {
    Cctv entity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));
    return toResponse(entity);
  }

  /**
   * List all CCTV systems with filtering.
   */
  @Transactional(readOnly = true)
  public Page<CctvResponse> findAll(
    int page, int size,
    UUID orgUnitId,
    String deviceCode, String deviceName, String province,
    String operationalStatus, String approvalStatus,
    String vtsSystemId,
    Integer attachedInfrastructureType,
    UUID attachedInfrastructureId,
    Integer yearOfUse,
    String updatedFrom, String updatedTo,
    String search) {

    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    boolean includeAll = scope.unrestricted();
    Collection<UUID> orgUnitIds = scope.orgUnitIds();

    Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(size, 100), Sort.by(Sort.Direction.DESC, "updatedAt"));

    OperationalStatus opStatus = parseOperationalStatus(operationalStatus);
    ApprovalStatus apprStatus = parseApprovalStatus(approvalStatus);

    LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
    LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);

    Page<Cctv> result = cctvRepository.searchCctv(
      includeAll, orgUnitIds,
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
   * Update an existing CCTV system.
   */
  @Transactional
  public CctvResponse update(UpdateCctvRequest request) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    Cctv entity = cctvRepository.findById(request.getId())
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + request.getId()));

    // Capture snapshot for change history
    Cctv snapshot = Cctv.builder()
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

    // Khóa sửa khi hồ sơ đang chờ duyệt; hồ sơ đã duyệt khi sửa phải duyệt lại.
    ApprovalStatus currentStatus = entity.getApprovalStatus();
    if (currentStatus == ApprovalStatus.PENDING_APPROVAL || currentStatus == ApprovalStatus.APPROVED_LEVEL1) {
      throw new IllegalStateException("Hồ sơ đang chờ duyệt không được chỉnh sửa");
    }
    if (currentStatus == ApprovalStatus.APPROVED) {
      entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
    }

    Cctv saved = cctvRepository.save(entity);
    changeHistoryService.recordChanges("CCTV", saved.getId().toString(), currentUserId.toString(), snapshot, saved);

    return toResponse(saved);
  }

  /**
   * Soft-delete a CCTV system.
   */
  @Transactional
  public void softDelete(UUID id) {
    UUID currentUserId = SecurityUtils.getCurrentUserId();
    Cctv entity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));
    approvalService.deleteDraft(entity, InfrastructureType.CCTV, currentUserId);
    entity.softDelete(currentUserId);
    cctvRepository.save(entity);
    log.info("Soft-deleted CCTV: id={}", id);
  }

  /**
   * Restore a soft-deleted CCTV system.
   */
  @Transactional
  public CctvResponse restore(UUID id) {
    Cctv entity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

    int restored = cctvRepository.restoreCctvById(id);
    if (restored == 0) {
      throw new EntityNotFoundException("Không thể khôi phục hệ thống CCTV: " + id);
    }

    // Reload after restore to bypass @SQLRestriction on deletedAt
    Cctv restoredEntity = cctvRepository.findById(id)
      .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV đã khôi phục: " + id));
    return toResponse(restoredEntity);
  }

  /**
   * Get CCTV options for dropdowns.
   */
  @Transactional(readOnly = true)
  public List<CctvOptionResponse> getOptions() {
    OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();
    if (scope.unrestricted()) {
      return cctvRepository.findAllOptions();
    }
    return cctvRepository.findOptionsByOrgUnitIds(scope.orgUnitIds());
  }

  /**
   * Convert entity to response DTO.
   */
  public CctvResponse toResponse(Cctv entity) {
    String orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());
    String attachedInfrastructureName = resolveAttachedInfrastructureName(entity);

    return CctvResponse.builder()
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
      .specifications(entity.getSpecifications())
      .maintenanceInformation(entity.getMaintenanceInformation())
      .note(entity.getNote())
      .objectType(entity.getObjectType())
      .mapSymbolId(entity.getMapSymbolId())
      .coordinateSystem(entity.getCoordinateSystem())
      .displayRule(entity.getDisplayRule())
      .spatialId(entity.getSpatialId())
      .createdBy(entity.getCreatedBy())
      .updatedBy(entity.getUpdatedBy())
      .createdByName(userResolverService.resolveName(entity.getCreatedBy()))
      .updatedByName(userResolverService.resolveName(entity.getUpdatedBy()))
      .createdAt(entity.getCreatedAt())
      .updatedAt(entity.getUpdatedAt())
      .build();
  }

  // ── Helpers ───────────────────────────────────────────────────────

  private String resolveAttachedInfrastructureName(Cctv entity) {
    if (entity.getAttachedInfrastructureId() == null) return null;
    Integer type = entity.getAttachedInfrastructureType();
    if (type == null) return null;
    if (type == 1) {
      Optional<VtsSystem> vts = vtsSystemRepository.findById(entity.getAttachedInfrastructureId());
      return vts.map(VtsSystem::getSystemName).orElse(null);
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
      if ("HIEN_HANH".equals(upper) || "ACTIVE".equals(upper) || "OPERATIONAL".equals(upper)) {
        return OperationalStatus.OPERATIONAL;
      }
      if ("TAM_NGUNG".equals(upper) || "INACTIVE".equals(upper) || "SUSPENDED".equals(upper)) {
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
      if ("CHO_PHE_DUYET".equals(upper) || "PENDING".equals(upper)) {
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
      return LocalDateTime.parse(dateStr);
    } catch (Exception e) {
      return null;
    }
  }

  private UUID parseUUID(String uuidStr) {
    if (uuidStr == null || uuidStr.isBlank()) return null;
    try {
      return UUID.fromString(uuidStr);
    } catch (Exception e) {
      return null;
    }
  }

  // ── ATTACHMENTS (File đính kèm) ───────────────────────────────────

  @Transactional
  public List<AttachmentDto> uploadAttachments(UUID entityId, List<MultipartFile> files, UUID userId) {
    final String entityType = "CCTV";
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
    return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("CCTV", entityId)
        .stream().map(this::toAttachmentDto).toList();
  }

  @Transactional
  public void deleteAttachment(UUID entityId, UUID attachmentId) {
    Attachment attachment = attachmentRepository.findById(attachmentId)
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
    if (!attachment.getEntityId().equals(entityId)) {
      throw new IllegalArgumentException("File không thuộc hệ thống CCTV này");
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
