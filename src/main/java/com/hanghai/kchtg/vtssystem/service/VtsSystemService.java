package com.hanghai.kchtg.vtssystem.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.vtssystem.entity.ApprovalHistory;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VtsSystemService {

    private final VtsSystemRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;

    public VtsSystemService(VtsSystemRepository repository,
                            ApprovalHistoryRepository historyRepository,
                            GisSpatialObjectService gisSpatialObjectService) {
        this.repository = repository;
        this.historyRepository = historyRepository;
        this.gisSpatialObjectService = gisSpatialObjectService;
    }

    public VtsSystemResponse create(VtsSystemCreateRequest request, UUID username) {
        VtsSystem entity = VtsSystem.builder()
                .systemName(request.getSystemName())
                .location(request.getLocation())
                .conditionStatus(request.getConditionStatus())
                .responsibilityLevel(request.getResponsibilityLevel())
                .source(request.getSource())
                .partner(request.getPartner())
                .orgUnitId(request.getOrgUnitId())
                .scope(request.getScope())
                .approvalStatus("PROPOSED")
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy(username)
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
                .vtsSystemId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("CREATED")
                .approvedBy(username)
                .reason("Tạo mới hệ thống VTS")
                .build());

        return toResponse(saved);
    }

    public VtsSystemResponse getById(UUID id) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return toResponse(entity);
    }

    /**
     * List records sitting at a given approval status, mirroring the endpoint the
     * other infrastructure modules expose.
     */
    public List<VtsSystemResponse> findByApprovalStatus(String approvalStatus) {
        return repository.findByApprovalStatusAndIsDeletedFalse(approvalStatus).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public Page<VtsSystemResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatus, int page, int size) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String trimmedConditionStatus = (conditionStatus != null && !conditionStatus.trim().isEmpty()) ? conditionStatus.trim() : null;
        String trimmedApprovalStatus = (approvalStatus != null && !approvalStatus.trim().isEmpty()) ? approvalStatus.trim() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return repository.search(orgUnitId, keywordLike, trimmedConditionStatus, trimmedApprovalStatus, pageable).map(this::toResponse);
    }

    public VtsSystemResponse update(UUID id, VtsSystemUpdateRequest request, UUID username) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        boolean wasApproved = "APPROVED".equals(entity.getApprovalStatus());

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

        entity.setUpdatedBy(username);

        if (wasApproved) {
            entity.setApprovalStatus("UNDER_REVIEW");
        }

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("UPDATED")
                .approvedBy(username)
                .reason("Cập nhật thông tin")
                .build());

        return toResponse(saved);
    }

    public void delete(UUID id, UUID username) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (!"APPROVED".equals(entity.getApprovalStatus())) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED)");
        }

        // softDelete() only stamps deletedAt/deletedBy on BaseEntity; the isDeleted
        // flag is this entity's own and is what the queries filter on, so it has to
        // be set too or the record keeps showing up in listings.
        entity.setIsDeleted(true);
        entity.softDelete(username);
        entity.setUpdatedBy(username);
        repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(entity.getId())
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("DELETED")
                .approvedBy(username)
                .reason("Xóa bản ghi")
                .build());
    }

    public VtsSystemResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (!"PROPOSED".equals(entity.getApprovalStatus())) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Chờ duyệt (PROPOSED)");
        }

        boolean autoApproved = false;

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus("REJECTED");
            entity.setRejectionReason(request.getReason());
        } else if (AdminAutoApproval.isAutoApprover()) {
            // Administrators clear both levels in one step.
            entity.setApprovedLevel2(true);
            entity.setApproverLevel2(userId != null ? userId.toString() : null);
            entity.setApprovedDateLevel2(LocalDateTime.now());
            entity.setApprovalStatus("APPROVED");
            autoApproved = true;
        } else {
            entity.setApprovalStatus("UNDER_REVIEW");
        }

        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(userId);
        entity.setApprovedDateLevel1(LocalDateTime.now());

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(request.getQuyetDinh())
                .approvedBy(userId)
                .reason(request.getReason())
                .build());

        if (autoApproved) {
            historyRepository.save(ApprovalHistory.builder()
                    .vtsSystemId(saved.getId())
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(request.getQuyetDinh())
                    .approvedBy(userId)
                    .reason(request.getReason())
                    .build());
        }

        return toResponse(saved);
    }

    public VtsSystemResponse approveC2(UUID id, ApprovalRequest request, java.util.UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (!"UNDER_REVIEW".equals(entity.getApprovalStatus())) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Đang xem xét (UNDER_REVIEW)");
        }

        UUID c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(userId)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus("REJECTED");
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus("APPROVED");
        }

        entity.setApprovedLevel2(true);
        entity.setApproverLevel2(userId.toString());
        entity.setApprovedDateLevel2(LocalDateTime.now());

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(request.getQuyetDinh())
                .approvedBy(userId)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID id) {
        repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return historyRepository.findByVtsSystemIdOrderByApprovedDateDesc(id).stream()
                .map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus())
                        .approvedBy(h.getApprovedBy())
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .build())
                .collect(Collectors.toList());
    }

    public List<VtsSystemResponse> search(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatus) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String trimmedConditionStatus = (conditionStatus != null && !conditionStatus.trim().isEmpty()) ? conditionStatus.trim() : null;
        String trimmedApprovalStatus = (approvalStatus != null && !approvalStatus.trim().isEmpty()) ? approvalStatus.trim() : null;
        Pageable pageable = PageRequest.of(0, 100);
        Page<VtsSystem> pageResult = repository.search(orgUnitId, keywordLike, trimmedConditionStatus, trimmedApprovalStatus, pageable);
        return pageResult.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private VtsSystemResponse toResponse(VtsSystem entity) {
        List<VtsSystemAttachmentResponse> attachments = entity.getAttachments().stream()
                .map(a -> VtsSystemAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .filePath(a.getFilePath())
                        .fileSize(a.getFileSize())
                        .documentType(a.getDocumentType())
                        .uploadedBy(a.getUploadedBy())
                        .uploadedDate(a.getUploadedDate())
                        .build())
                .collect(Collectors.toList());

        GisGeometryType geomType = null;
        String coords = null;
        UUID symbolId = null;
        if (entity.getSpatialId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
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
}

