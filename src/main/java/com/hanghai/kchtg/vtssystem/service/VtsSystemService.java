package com.hanghai.kchtg.vtssystem.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VtsSystemService {

    private final VtsSystemRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @Value("${app.upload.attachment-path:uploads/vts-attachments}")
    private String attachmentUploadPath;

    public VtsSystemService(VtsSystemRepository repository,
                            ApprovalHistoryRepository historyRepository,
                            GisSpatialObjectService gisSpatialObjectService,
                            OrgUnitCacheService orgUnitCacheService,
                            InfrastructureAttachmentRepository attachmentRepository,
                            com.hanghai.kchtg.user.repository.UserRepository userRepository) {
        this.repository = repository;
        this.historyRepository = historyRepository;
        this.gisSpatialObjectService = gisSpatialObjectService;
        this.orgUnitCacheService = orgUnitCacheService;
        this.attachmentRepository = attachmentRepository;
        this.userRepository = userRepository;
    }

    public VtsSystemResponse create(VtsSystemCreateRequest request, UUID userId) {
        VtsSystem entity = VtsSystem.builder()
                .systemName(request.getSystemName())
                .location(request.getLocation())
                .conditionStatus(request.getConditionStatus())
                .responsibilityLevel(request.getResponsibilityLevel())
                .source(request.getSource())
                .partner(request.getPartner())
                .orgUnitId(request.getOrgUnitId())
                .scope(request.getScope())
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .build();

        VtsSystem saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    "Hệ thống VTS tại " + request.getLocation(),
                    "VTS_" + saved.getId(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    refId,
                    InfrastructureType.VTS_SYSTEM
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.VTS_SYSTEM)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.CREATED)
                .approvedBy(userId)
                .reason("Tạo mới hệ thống VTS")
                .changedField("Hệ thống VTS")
                .build());
        return toResponse(saved);
    }

    public VtsSystemResponse getById(UUID id) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return toResponse(entity);
    }

    public List<VtsSystemResponse> findByApprovalStatus(ApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndIsDeletedFalse(approvalStatus).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<VtsSystemResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus, int page, int size) {
        return findAllWithSearch(orgUnitId, keyword, conditionStatus, approvalStatus, null, page, size);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year, int page, int size) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        if (year == null) {
            return repository.search(orgUnitId, keywordLike, conditionStatus, approvalStatus, pageable).map(this::toResponse);
        }
        LocalDateTime fromDate = LocalDateTime.of(year, Month.JANUARY, 1, 0, 0);
        LocalDateTime toDate = fromDate.plusYears(1);
        return repository.searchByCreatedDateRange(orgUnitId, keywordLike, conditionStatus, approvalStatus, fromDate, toDate, pageable)
                .map(this::toResponse);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus, int page, int size) {
        return findAllWithSearchAndCounts(orgUnitId, keyword, conditionStatus, approvalStatus, null, page, size);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year, int page, int size) {
        Page<VtsSystemResponse> pageResult = findAllWithSearch(orgUnitId, keyword, conditionStatus, approvalStatus, year, page, size);
        return VtsSystemListResponse.builder()
                .items(pageResult.getContent())
                .total(pageResult.getTotalElements())
                .statusCounts(countByApprovalStatus())
                .build();
    }

    public VtsSystemResponse update(UUID id, VtsSystemUpdateRequest request, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new IllegalStateException("Hệ thống VTS đã được phê duyệt, không thể cập nhật trực tiếp. Vui lòng thực hiện quy trình sửa đổi và phê duyệt lại.");
        }

        boolean resubmission = entity.getApprovalStatus() == ApprovalStatus.REJECTED;
        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        Map<String, String> previousValues = new LinkedHashMap<>();
        if (request.getSystemName() != null && !java.util.Objects.equals(request.getSystemName(), entity.getSystemName())) previousValues.put("systemName", entity.getSystemName());
        if (request.getLocation() != null && !java.util.Objects.equals(request.getLocation(), entity.getLocation())) previousValues.put("location", entity.getLocation());
        if (request.getConditionStatus() != null && !java.util.Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) previousValues.put("conditionStatus", String.valueOf(entity.getConditionStatus()));
        if (request.getResponsibilityLevel() != null && !java.util.Objects.equals(request.getResponsibilityLevel(), entity.getResponsibilityLevel())) previousValues.put("responsibilityLevel", entity.getResponsibilityLevel());
        if (request.getSource() != null && !java.util.Objects.equals(request.getSource(), entity.getSource())) previousValues.put("source", entity.getSource());
        if (request.getPartner() != null && !java.util.Objects.equals(request.getPartner(), entity.getPartner())) previousValues.put("partner", entity.getPartner());
        if (request.getOrgUnitId() != null && !java.util.Objects.equals(request.getOrgUnitId(), entity.getOrgUnitId())) previousValues.put("orgUnitId", String.valueOf(entity.getOrgUnitId()));
        if (request.getScope() != null && !java.util.Objects.equals(request.getScope(), entity.getScope())) previousValues.put("scope", entity.getScope());

        if (request.getCoordinates() != null) {
            String oldCoords = null;
            if (entity.getSpatialId() != null) {
                oldCoords = gisSpatialObjectService.findById(entity.getSpatialId())
                        .map(com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject::getCoordinates)
                        .orElse(null);
            }
            if (!java.util.Objects.equals(request.getCoordinates(), oldCoords)) {
                previousValues.put("coordinates", oldCoords != null ? oldCoords : "Chưa có");
            }
        }
        if (request.getGeometryType() != null) {
            String oldGeom = null;
            if (entity.getSpatialId() != null) {
                oldGeom = gisSpatialObjectService.findById(entity.getSpatialId())
                        .map(o -> String.valueOf(o.getGeometryType()))
                        .orElse(null);
            }
            if (oldGeom != null && !java.util.Objects.equals(String.valueOf(request.getGeometryType()), oldGeom)) {
                previousValues.put("geometryType", oldGeom);
            }
        }

        if (request.getSystemName() != null) entity.setSystemName(request.getSystemName());
        if (request.getLocation() != null) entity.setLocation(request.getLocation());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());
        if (request.getResponsibilityLevel() != null) entity.setResponsibilityLevel(request.getResponsibilityLevel());
        if (request.getSource() != null) entity.setSource(request.getSource());
        if (request.getPartner() != null) entity.setPartner(request.getPartner());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
        if (request.getScope() != null) entity.setScope(request.getScope());

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = entity.getId();
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        "Hệ thống VTS tại " + (request.getLocation() != null ? request.getLocation() : entity.getLocation()),
                        "VTS_" + entity.getId(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        refId,
                        InfrastructureType.VTS_SYSTEM
                );
                entity.setSpatialId(spatialObj.getId());
            }
        } else if (entity.getSpatialId() != null && request.getLocation() != null) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                UUID refId = entity.getId();
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        "Hệ thống VTS tại " + request.getLocation(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        InfrastructureType.VTS_SYSTEM
                );
            });
        }

        if (resubmission) {
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setRejectionReason(null);
            entity.setApprovedLevel1(false);
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
            entity.setApprovedLevel2(false);
            entity.setApproverLevel2(null);
            entity.setApprovedDateLevel2(null);
        }

        entity.setUpdatedBy(userId);

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.VTS_SYSTEM)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.UPDATED)
                .approvedBy(userId)
                .reason("Cập nhật thông tin")
                .changedField(resubmission ? "approvalStatus, " + formatChangedFields(previousValues) : formatChangedFields(previousValues))
                .previousValue(resubmission ? "approvalStatus=" + previousApprovalStatus + (previousValues.isEmpty() ? "" : "; " + formatPreviousValues(previousValues)) : formatPreviousValues(previousValues))
                .newValue(resubmission ? "approvalStatus=PROPOSED" + (previousValues.isEmpty() ? "" : "; " + formatNewValues(saved, previousValues)) : formatNewValues(saved, previousValues))
                .build());


        return toResponse(saved);
    }

    public void delete(UUID id, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED)");
        }

        entity.softDelete(userId);
        repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.VTS_SYSTEM)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.DELETED)
                .approvedBy(userId)
                .reason("Xóa bản ghi")
                .changedField("deletedAt")
                .previousValue("null")
                .newValue("đã xóa mềm")
                .build());
    }

    public VtsSystemResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.PROPOSED) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Chờ duyệt (PROPOSED)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
            entity.setApprovedLevel1(false);
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
        } else {
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            entity.setRejectionReason(null);
            entity.setApprovedLevel1(true);
            entity.setApproverLevel1(userId);
            entity.setApprovedDateLevel1(LocalDateTime.now());
        }

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.VTS_SYSTEM)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.fromValue(request.getQuyetDinh()))
                .approvedBy(userId)
                .reason(request.getReason())
                .changedField("approvalStatus, approvedLevel1")
                .previousValue("PROPOSED")
                .newValue("REJECTED".equals(request.getQuyetDinh()) ? "REJECTED" : "UNDER_REVIEW")
                .build());

        return toResponse(saved);
    }

    public VtsSystemResponse approveC2(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Đang xem xét (UNDER_REVIEW)");
        }

        UUID c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(userId)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
            entity.setApprovedLevel2(false);
            entity.setApproverLevel2(null);
            entity.setApprovedDateLevel2(null);
        } else {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setRejectionReason(null);
            entity.setApprovedLevel2(true);
            entity.setApproverLevel2(userId);
            entity.setApprovedDateLevel2(LocalDateTime.now());
        }

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.VTS_SYSTEM)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(ApprovalHistoryStatus.fromValue(request.getQuyetDinh()))
                .approvedBy(userId)
                .reason(request.getReason())
                .changedField("approvalStatus, approvedLevel2")
                .previousValue("UNDER_REVIEW")
                .newValue("REJECTED".equals(request.getQuyetDinh()) ? "REJECTED" : "APPROVED")
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID id) {
        repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VTS_SYSTEM, id).stream()
                .map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                        .approvedBy(resolveUserName(h.getApprovedBy()))
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .changedField(h.getChangedField())
                        .previousValue(h.getPreviousValue())
                        .newValue(h.getNewValue())
                        .build())
                .collect(Collectors.toList());
    }

    public VtsSystemAttachmentResponse uploadAttachment(UUID vtsSystemId, MultipartFile file, UUID userId) {
        VtsSystem entity = repository.findById(vtsSystemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + vtsSystemId));
        ensureAttachmentEditable(entity);
        validateAttachment(file);

        String originalName = file.getOriginalFilename() == null ? "tai-lieu" : file.getOriginalFilename();
        String safeName = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"))
                + "_" + originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path directory = Paths.get(attachmentUploadPath, vtsSystemId.toString()).toAbsolutePath().normalize();
        Path target = directory.resolve(safeName).normalize();
        if (!target.startsWith(directory)) {
            throw new IllegalArgumentException("Tên tệp không hợp lệ");
        }

        try {
            Files.createDirectories(directory);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException ex) {
            throw new RuntimeException("Không thể lưu tài liệu đính kèm", ex);
        }

        InfrastructureAttachment saved = attachmentRepository.save(InfrastructureAttachment.builder()
                .refId(vtsSystemId)
                .refType(InfrastructureType.VTS_SYSTEM)
                .fileName(originalName)
                .filePath(target.toString())
                .fileSize(file.getSize())
                .fileType(AttachmentFileType.fromValue(file.getContentType()))
                .uploadedBy(userId)
                .uploadedDate(LocalDateTime.now())
                .build());
        return toAttachmentResponse(saved);
    }

    public void deleteAttachment(UUID vtsSystemId, UUID attachmentId) {
        VtsSystem entity = repository.findById(vtsSystemId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + vtsSystemId));
        ensureAttachmentEditable(entity);
        InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, vtsSystemId, InfrastructureType.VTS_SYSTEM)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu đính kèm"));
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException ex) {
            throw new RuntimeException("Không thể xóa tài liệu đính kèm", ex);
        }
        attachmentRepository.delete(attachment);
    }

    public InfrastructureAttachment getAttachment(UUID vtsSystemId, UUID attachmentId) {
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, vtsSystemId, InfrastructureType.VTS_SYSTEM)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu đính kèm"));
    }

    public List<VtsSystemResponse> search(UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus) {
        return search(orgUnitId, keyword, conditionStatus, approvalStatus, null);
    }

    public List<VtsSystemResponse> search(UUID orgUnitId, String keyword, ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        Pageable pageable = PageRequest.of(0, 100);
        Page<VtsSystem> pageResult;
        if (year == null) {
            pageResult = repository.search(orgUnitId, keywordLike, conditionStatus, approvalStatus, pageable);
        } else {
            LocalDateTime fromDate = LocalDateTime.of(year, Month.JANUARY, 1, 0, 0);
            LocalDateTime toDate = fromDate.plusYears(1);
            pageResult = repository.searchByCreatedDateRange(orgUnitId, keywordLike, conditionStatus, approvalStatus, fromDate, toDate, pageable);
        }
        return pageResult.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private VtsSystemResponse toResponse(VtsSystem entity) {
        List<VtsSystemAttachmentResponse> attachments = attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(), InfrastructureType.VTS_SYSTEM).stream()
                .map(this::toAttachmentResponse)
                .collect(Collectors.toList());

        GisGeometryType geomType = null;
        String coords = null;
        if (entity.getSpatialId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        String createdByName = null;
        if (entity.getCreatedBy() != null) {
            createdByName = userRepository.findById(entity.getCreatedBy())
                    .map(u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername())
                    .orElse(null);
        }

        return VtsSystemResponse.builder()
                .id(entity.getId())
                .systemName(entity.getSystemName())
                .location(entity.getLocation())
                .conditionStatus(entity.getConditionStatus())
                .responsibilityLevel(entity.getResponsibilityLevel())
                .source(entity.getSource())
                .partner(entity.getPartner())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .scope(entity.getScope())
                .approvalStatus(entity.getApprovalStatus())
                .approvedLevel1(entity.getApprovedLevel1())
                .approverLevel1(entity.getApproverLevel1())
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvedLevel2(entity.getApprovedLevel2())
                .approverLevel2(entity.getApproverLevel2())
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdDate(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedDate(entity.getUpdatedAt())
                .attachments(attachments)
                .spatialId(entity.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .build();
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment attachment) {
        return VtsSystemAttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .filePath("/api/v1/he-thong-vts/" + attachment.getRefId()
                        + "/attachments/" + attachment.getId() + "/download")
                .fileSize(attachment.getFileSize())
                .documentType(attachment.getFileType() != null ? attachment.getFileType().getCode() : "OTHER")
                .uploadedBy(attachment.getUploadedBy())
                .uploadedDate(attachment.getUploadedDate())
                .build();
    }

    private void ensureAttachmentEditable(VtsSystem entity) {
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new IllegalStateException("Không thể thay đổi tài liệu của hệ thống VTS đã được phê duyệt");
        }
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được để trống");
        }
        if (file.getSize() > 10 * 1024 * 1024) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được vượt quá 10MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        List<String> allowed = List.of(
                "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/jpeg", "image/png", "image/gif");
        if (!allowed.contains(contentType)) {
            throw new IllegalArgumentException("Định dạng tài liệu không được hỗ trợ");
        }
    }

    private void validateDecision(ApprovalRequest request) {
        if (request == null || request.getQuyetDinh() == null
                || !("APPROVED".equalsIgnoreCase(request.getQuyetDinh())
                || "REJECTED".equalsIgnoreCase(request.getQuyetDinh()))) {
            throw new IllegalArgumentException("Quyết định phê duyệt không hợp lệ");
        }
        if ("REJECTED".equalsIgnoreCase(request.getQuyetDinh())
                && (request.getReason() == null || request.getReason().trim().isEmpty())) {
            throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
        }
    }

    private String getFieldDisplayName(String field) {
        return switch (field) {
            case "systemName" -> "Tên hệ thống";
            case "location" -> "Vị trí";
            case "conditionStatus" -> "Tình trạng";
            case "responsibilityLevel" -> "Mức độ phụ trách";
            case "source" -> "Nguồn gốc";
            case "partner" -> "Đối tác";
            case "orgUnitId" -> "Đơn vị quản lý";
            case "scope" -> "Phạm vi áp dụng";
            case "approvalStatus" -> "Trạng thái phê duyệt";
            case "coordinates" -> "Tọa độ GIS";
            case "geometryType" -> "Loại đối tượng GIS";
            default -> field;
        };
    }

    private String formatChangedFields(Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(this::getFieldDisplayName)
                .collect(Collectors.joining(", "));
    }

    private String formatPreviousValues(Map<String, String> previousValues) {
        return previousValues.entrySet().stream()
                .map(entry -> getFieldDisplayName(entry.getKey()) + "=" + formatDisplayValue(entry.getKey(), entry.getValue()))
                .collect(Collectors.joining("; "));
    }

    private String formatNewValues(VtsSystem entity, Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(field -> getFieldDisplayName(field) + "=" + formatDisplayValue(field, currentFieldValue(entity, field)))
                .collect(Collectors.joining("; "));
    }

    private String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty()) return "";
        if ("orgUnitId".equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("conditionStatus".equals(field)) {
            return switch (rawValue) {
                case "GOOD" -> "Tốt";
                case "FAIR" -> "Trung bình";
                case "POOR" -> "Kém";
                case "UNUSABLE" -> "Không sử dụng được";
                default -> rawValue;
            };
        }
        if ("geometryType".equals(field)) {
            return switch (rawValue) {
                case "POINT" -> "Đối tượng điểm";
                case "LINE", "LINESTRING" -> "Đối tượng đường";
                case "POLYGON" -> "Đối tượng vùng";
                default -> rawValue;
            };
        }
        if ("coordinates".equals(field)) {
            if (rawValue == null || rawValue.trim().isEmpty() || "Chưa có".equals(rawValue)) {
                return "Chưa có";
            }
            if (rawValue.startsWith("POLYGON")) {
                int count = rawValue.split(",").length;
                return "Vùng bản đồ (" + count + " điểm tọa độ)";
            }
            if (rawValue.startsWith("LINESTRING") || rawValue.startsWith("LINE")) {
                int count = rawValue.split(",").length;
                return "Đường bản đồ (" + count + " điểm tọa độ)";
            }
            if (rawValue.startsWith("POINT")) {
                return rawValue.replace("POINT(", "Điểm tọa độ (").replace(")", ")");
            }
            return rawValue;
        }
        return rawValue;
    }

    private String currentFieldValue(VtsSystem entity, String field) {
        return switch (field) {
            case "systemName" -> String.valueOf(entity.getSystemName());
            case "location" -> String.valueOf(entity.getLocation());
            case "conditionStatus" -> String.valueOf(entity.getConditionStatus());
            case "responsibilityLevel" -> String.valueOf(entity.getResponsibilityLevel());
            case "source" -> String.valueOf(entity.getSource());
            case "partner" -> String.valueOf(entity.getPartner());
            case "orgUnitId" -> String.valueOf(entity.getOrgUnitId());
            case "scope" -> String.valueOf(entity.getScope());
            case "coordinates" -> {
                if (entity.getSpatialId() != null) {
                    yield gisSpatialObjectService.findById(entity.getSpatialId())
                            .map(com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject::getCoordinates)
                            .orElse("");
                }
                yield "";
            }
            case "geometryType" -> {
                if (entity.getSpatialId() != null) {
                    yield gisSpatialObjectService.findById(entity.getSpatialId())
                            .map(o -> String.valueOf(o.getGeometryType()))
                            .orElse("");
                }
                yield "";
            }
            default -> "";
        };
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> countByApprovalStatus() {
        java.util.Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (Object[] row : repository.countByApprovalStatus()) {
            counts.put(((ApprovalStatus) row[0]).name(), (Long) row[1]);
        }
        return counts;
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> (u.getFullName() != null && !u.getFullName().trim().isEmpty())
                        ? u.getFullName()
                        : u.getUsername())
                .orElse(userId.toString());
    }
}
