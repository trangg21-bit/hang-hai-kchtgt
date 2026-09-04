package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperatingUnit;
import com.hanghai.kchtg.common.repository.OperatingUnitRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.daittdh.AttachmentDto;
import com.hanghai.kchtg.port.dto.daittdh.CreateDaiTtdhRequest;
import com.hanghai.kchtg.port.dto.daittdh.DaiTtdhResponse;
import com.hanghai.kchtg.port.dto.daittdh.UpdateDaiTtdhRequest;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.DaiTtdh;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.DaiTtdhRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.SecurityUtils;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service cho Đài Thông tin Duyên hải (Đài TTDH) — parity với BuoyBerth.
 * Mã tự sinh {@code DTTDH-{seq}}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DaiTtdhService {

    private final DaiTtdhRepository daiTtdhRepository;
    private final OperatingUnitRepository operatingUnitRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final AttachmentRepository attachmentRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final ChangeHistoryService changeHistoryService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public DaiTtdhResponse create(CreateDaiTtdhRequest request) {
        // RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
        //         : RecordSecurityLevel.NORMAL;
        // RecordSecurityLevel.validateAssignment(secLevel, "daittdh", SecurityUtils.getCurrentUserPermissions(),
        //         SecurityUtils.isElevatedAdministrator());

        // Validate đơn vị quản lý trong phạm vi user (chiều GHI — Data Scope Convention)
        if (request.getOrgUnitId() != null) {
            orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
        }

        String code = generateDaiTtdhCode();

        DaiTtdh entity = DaiTtdh.builder()
        // .securityLevel(secLevel)
                .daiTtdhCode(code)
                .daiTtdhName(request.getDaiTtdhName())
                .orgUnitId(request.getOrgUnitId())
                .operatingUnitId(request.getOperatingUnitId())
                .stationLevel(request.getStationLevel())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .operationalStatus(request.getOperationalStatus())
                .coverageArea(request.getCoverageArea())
                .servicesProvided(request.getServicesProvided())
                .remarks(request.getRemarks())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .build();

        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        DaiTtdh saved = daiTtdhRepository.save(entity);
        persistGis(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude());
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public DaiTtdhResponse update(UpdateDaiTtdhRequest request) {
        DaiTtdh entity = daiTtdhRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài TTDH với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // ── Lịch sử thay đổi (chuẩn Cảng biển PortService/BuoyBerthService) ──
        // Chụp GIS cũ (WKT + loại hình) và trạng thái phê duyệt TRƯỚC khi mutate,
        // để sau persistGis so sánh và ghi dòng "Tọa độ GIS"/"Loại đối tượng GIS".
        GisGeometryType oldGeomType = null;
        String oldWkt = null;
        if (entity.getSpatialId() != null) {
            GisSpatialObject oldSpatial = gisSpatialObjectService.findById(entity.getSpatialId()).orElse(null);
            if (oldSpatial != null) {
                oldWkt = oldSpatial.getCoordinates();
                oldGeomType = oldSpatial.getGeometryType();
            }
        }
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "daittdh",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
        if (request.getDaiTtdhName() != null)
            entity.setDaiTtdhName(request.getDaiTtdhName());
        if (request.getOrgUnitId() != null) {
            orgUnitScopeService.requireOrganizationInScope(request.getOrgUnitId());
            entity.setOrgUnitId(request.getOrgUnitId());
        }
        if (request.getOperatingUnitId() != null)
            entity.setOperatingUnitId(request.getOperatingUnitId());
        if (request.getStationLevel() != null)
            entity.setStationLevel(request.getStationLevel());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.getCoverageArea() != null)
            entity.setCoverageArea(request.getCoverageArea());
        if (request.getServicesProvided() != null)
            entity.setServicesProvided(request.getServicesProvided());
        if (request.getRemarks() != null)
            entity.setRemarks(request.getRemarks());
        entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());

        if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        } else if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            // Khi chỉnh sửa: "Được phê duyệt" → quay về "Chờ cảng vụ duyệt" (APPROVED_LEVEL1)
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        }

        DaiTtdh saved = daiTtdhRepository.save(entity);
        persistGis(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude());
        // Lịch sử GIS — chỉ khi hồ sơ ĐÃ duyệt bị sửa (chuẩn Cảng biển)
        recordGisHistory(saved, wasApproved, oldGeomType, oldWkt,
                request.getGeometryType(), coordinates);
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public DaiTtdhResponse getById(UUID id) {
        DaiTtdh entity = daiTtdhRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài TTDH với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<DaiTtdhResponse> findAll(int page, int size, UUID orgUnitId,
                                         String search, String daiTtdhCode, String daiTtdhName,
                                         Integer stationLevel, Integer provinceId,
                                         String operationalStatus, String approvalStatus,
                                         String updatedFrom, String updatedTo) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("submittedForApprovalAt"),
                Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả đài TTDH của toàn bộ đơn vị con (hậu duệ)
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = search != null ? search.trim() : null;
        Page<DaiTtdh> result = daiTtdhRepository.searchDaiTtdh(
                includeAll, orgUnitIds,
                searchTrim, daiTtdhCode, daiTtdhName, stationLevel, provinceId,
                approvalEnum, statusEnum, false,
                updatedFromDt, updatedToDt,
                pageable);

        return result.map(this::toResponse);
    }

    @Transactional
    public void softDelete(UUID id) {
        DaiTtdh entity = daiTtdhRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài TTDH với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa đài TTDH ở trạng thái Nháp");
        }
        entity.softDelete(SecurityUtils.getCurrentUserId());
        daiTtdhRepository.save(entity);
        // Lịch sử xóa mềm (chuẩn Cảng biển): changedField "Trạng thái" → "Đã xóa", actor = user thật
        String deleteActorId = currentActorId(null);
        if (deleteActorId != null) {
            changeHistoryService.insertChangeRecord("DAI_TTDH", entity.getId(), "Trạng thái",
                    null, "Đã xóa", deleteActorId);
        }
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted DaiTtdh [{}] code={}", entity.getId(), entity.getDaiTtdhCode());
    }

    /** Mã tự sinh {@code DTTDH-{seq}} — không phụ thuộc cảng biển (CSV Đài TTDH). */
    public String generateDaiTtdhCode() {
        Integer maxSeq = daiTtdhRepository.findMaxDaiTtdhSeq();
        int next = (maxSeq == null ? 0 : maxSeq) + 1;
        return "DTTDH-" + String.format("%03d", next);
    }

    // ── Attachment methods ──────────────────────────────────────────────

    @Transactional
    public List<AttachmentDto> uploadAttachments(String entityType, UUID entityId, List<MultipartFile> files, UUID userId) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Không có file nào được chọn để tải lên");
        }
        long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }

        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
        List<Attachment> savedAttachments = new java.util.ArrayList<>();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;

            try {
                java.nio.file.Path dir = basePath.resolve(entityType).resolve(entityId.toString());
                java.nio.file.Files.createDirectories(dir);
                java.nio.file.Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                log.error("Failed to save file: {}/{}/{}/{}", basePath, entityType, entityId, storageFileName, e);
                throw new RuntimeException("Không thể lưu file: " + originalFilename);
            }

            String storagePath = basePath.resolve(entityType).resolve(entityId.toString()).resolve(storageFileName)
                    .toString();

            Attachment attachment = new Attachment();
            attachment.setEntityType(entityType);
            attachment.setEntityId(entityId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(storagePath);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedBy(userId);
            savedAttachments.add(attachmentRepository.save(attachment));
            // Lịch sử "Tài liệu đính kèm" — chỉ khi hồ sơ đã duyệt (chuẩn Cảng biển)
            recordAttachmentHistory(entityType, entityId, originalFilename, true);
        }
        return savedAttachments.stream().map(this::toAttachmentDto).collect(Collectors.toList());
    }

    public List<AttachmentDto> listAttachments(String entityType, UUID entityId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId)
                .stream().map(this::toAttachmentDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc entity này");
        }
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file: {}", attachment.getFilePath(), e);
        }
        attachmentRepository.delete(attachment);
        // Lịch sử "Tài liệu đính kèm" — chỉ khi hồ sơ đã duyệt (chuẩn Cảng biển)
        recordAttachmentHistory(entityType, entityId, attachment.getFileName(), false);
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

    // ── Lịch sử thay đổi (infrastructure_history, refType DAI_TTDH) ────────

    /** Nhãn hiển thị loại hình GIS theo chuẩn VTS CHK (dùng cho lịch sử thay đổi). */
    private static String geometryTypeLabel(GisGeometryType type) {
        if (type == null) return "Chưa có";
        return switch (type) {
            case POINT -> "Đối tượng điểm";
            case LINE -> "Đối tượng đường";
            case POLYGON -> "Đối tượng vùng";
        };
    }

    /**
     * Actor thật từ SecurityContext — không bao giờ trả về chuỗi "system"
     * (approvedBy null → drawer hiện "—").
     */
    private String currentActorId(UUID fallbackUserId) {
        UUID current = SecurityUtils.getCurrentUserId();
        if (current != null) {
            return current.toString();
        }
        return fallbackUserId != null ? fallbackUserId.toString() : null;
    }

    /**
     * Lịch sử GIS theo chuẩn Cảng biển (PortService/BuoyBerthService): ghi 2 dòng
     * "Tọa độ GIS" + "Loại đối tượng GIS" (refType DAI_TTDH) chỉ khi hồ sơ ĐÃ duyệt
     * bị sửa vị trí/loại hình. Với bản ghi mới tạo (create) wasApproved luôn false
     * nên không có dòng nào được ghi — giống hệt PortService/BuoyBerthService.
     */
    private void recordGisHistory(DaiTtdh saved, boolean wasApproved,
                                  GisGeometryType oldGeomType, String oldWkt,
                                  GisGeometryType requestGeomType, String coordinates) {
        if (!wasApproved) return;
        if (coordinates == null || coordinates.trim().isEmpty()) return;
        String actorId = currentActorId(null);
        if (actorId == null) return;

        String newWkt = coordinates.trim();
        if (oldWkt == null || !newWkt.equals(oldWkt.trim())) {
            changeHistoryService.insertChangeRecord("DAI_TTDH", saved.getId(), "Tọa độ GIS",
                    (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                    newWkt, actorId);
        }
        GisGeometryType newGeomType = requestGeomType != null ? requestGeomType : GisGeometryType.POINT;
        if (requestGeomType != null && oldGeomType != newGeomType) {
            changeHistoryService.insertChangeRecord("DAI_TTDH", saved.getId(), "Loại đối tượng GIS",
                    oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                    geometryTypeLabel(newGeomType), actorId);
        }
    }

    /**
     * Lịch sử "Tài liệu đính kèm" (chuẩn Cảng biển ShipRepairYardService) — chỉ
     * khi hồ sơ đã duyệt (APPROVED/APPROVED_LEVEL2). Actor = user thật.
     */
    private void recordAttachmentHistory(String entityType, UUID entityId, String fileName, boolean uploaded) {
        try {
            if (entityType == null || !InfrastructureType.DAI_TTDH.name().equalsIgnoreCase(entityType)) {
                return;
            }
            DaiTtdh daiTtdh = daiTtdhRepository.findById(entityId).orElse(null);
            if (daiTtdh == null) {
                return;
            }
            boolean wasApproved = daiTtdh.getApprovalStatus() == ApprovalStatus.APPROVED
                    || daiTtdh.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
            if (!wasApproved) {
                return;
            }
            String actorId = currentActorId(null);
            if (actorId == null) {
                return;
            }
            String name = fileName != null ? fileName : "không rõ tên";
            changeHistoryService.insertChangeRecord("DAI_TTDH", entityId, "Tài liệu đính kèm",
                    uploaded ? "—" : name,
                    uploaded ? name : "—",
                    actorId);
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử file đính kèm DaiTtdh (entityType={}, entityId={}): {}",
                    entityType, entityId, e.getMessage());
        }
    }

    // ── GIS ─────────────────────────────────────────────────────────────

    private void persistGis(DaiTtdh saved, GisGeometryType geometryType, String coordinates,
                            BigDecimal longitude, BigDecimal latitude) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getDaiTtdhName(), "DAI_TTDH_" + saved.getDaiTtdhCode(),
                    geomType, GisSpatialObjectType.POINT_DAI_TTDH, wkt, saved.getId(),
                    InfrastructureType.DAI_TTDH);
            saved.setSpatialId(spatialObj.getId());
            daiTtdhRepository.save(saved);
        }
    }

    private void applySaveAction(DaiTtdh entity, String action) {
        switch (action) {
            case "DRAFT":
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
                break;
            case "SUBMIT":
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
                entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId().toString());
                break;
            case "APPROVED":
            case "SAVE_AND_APPROVE":
                entity.setApprovalStatus(ApprovalStatus.APPROVED);
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
                entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId().toString());
                entity.setPortAuthorityApprovedAt(LocalDateTime.now());
                entity.setPortAuthorityApprovedBy(SecurityUtils.getCurrentUserId().toString());
                entity.setDepartmentApprovedAt(LocalDateTime.now());
                entity.setDepartmentApprovedBy(SecurityUtils.getCurrentUserId().toString());
                break;
            default:
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
        }
    }

    public void evictAfterCommit() {
        orgUnitCacheService.evictAfterCommit();
    }

    // ── Conversion ─────────────────────────────────────────────────────

    public DaiTtdhResponse toResponse(DaiTtdh entity) {
        if (entity == null) return null;

        DaiTtdhResponse response = DaiTtdhResponse.builder()
                .id(entity.getId())
                // .securityLevel(entity.getSecurityLevel())
                .daiTtdhCode(entity.getDaiTtdhCode())
                .daiTtdhName(entity.getDaiTtdhName())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .operatingUnitId(entity.getOperatingUnitId())
                .operatingUnitName(resolveOperatingUnitName(entity.getOperatingUnitId()))
                .stationLevel(entity.getStationLevel())
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .coverageArea(entity.getCoverageArea())
                .servicesProvided(entity.getServicesProvided())
                .remarks(entity.getRemarks())
                .mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(entity.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(entity.getPortAuthorityApprovedBy())
                .portAuthorityApprovalContent(entity.getPortAuthorityApprovalContent())
                .departmentApprovedAt(entity.getDepartmentApprovedAt())
                .departmentApprovedBy(entity.getDepartmentApprovedBy())
                .departmentApprovalContent(entity.getDepartmentApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();

        if (entity.getSpatialId() != null) {
            response.setSpatialId(entity.getSpatialId());
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                if (spatialObj.getGeometryType() != null) {
                    response.setGeometryType(spatialObj.getGeometryType());
                }
                response.setCoordinates(spatialObj.getCoordinates());
                parseLatLng(spatialObj.getCoordinates(), response);
            });
        }

        return response;
    }

    private String resolveOperatingUnitName(UUID operatingUnitId) {
        if (operatingUnitId == null) return null;
        return operatingUnitRepository.findById(operatingUnitId)
                .map(OperatingUnit::getName)
                .orElse(null);
    }

    private void parseLatLng(String coordinates, DaiTtdhResponse response) {
        if (coordinates == null || !coordinates.startsWith("POINT(")) return;
        try {
            String inner = coordinates.substring(6, coordinates.length() - 1).trim();
            String[] parts = inner.split("\\s+");
            if (parts.length == 2) {
                response.setLongitude(new BigDecimal(parts[0]));
                response.setLatitude(new BigDecimal(parts[1]));
            }
        } catch (Exception ignored) { }
    }

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        try { return LocalDateTime.parse(dt); }
        catch (Exception e) { return null; }
    }
}
