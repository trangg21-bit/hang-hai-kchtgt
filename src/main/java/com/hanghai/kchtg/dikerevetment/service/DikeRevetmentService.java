package com.hanghai.kchtg.dikerevetment.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.dikerevetment.entity.*;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import java.time.LocalDateTime;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentAttachmentRepository;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for DikeRevetment (F-044 to F-049).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DikeRevetmentService {

    private final DikeRevetmentRepository repo;
    private final DikeRevetmentAttachmentRepository attachmentRepo;
    private final ApprovalHistoryRepository approvalHistoryRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;

    @Transactional
    public DikeRevetmentResponse create(DikeRevetmentCreateRequest req, java.util.UUID userId) {
        FieldWriteGuard.validateObject(req);
        RecordSecurityLevel secLevel = req.getSecurityLevel() != null ? req.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "dikerevetment", SecurityUtils.getCurrentUserPermissions(),
                SecurityUtils.isElevatedAdministrator());

        DikeRevetment dr = DikeRevetment.builder()
                .securityLevel(secLevel)
                .dikeRevetmentType(req.getDikeRevetmentType())
                .location(req.getLocation())
                .dikeRevetmentName(req.getDikeRevetmentName())
                .length(req.getLength())
                .crestElevation(req.getCrestElevation())
                .commissioningDate(req.getCommissioningDate())
                .height(req.getHeight())
                .surfaceMaterial(req.getSurfaceMaterial())
                .status(req.getStatus())
                .note(req.getNote())
                .orgUnitId(req.getOrgUnitId())
                .approvalStatus(ApprovalStatus.PROPOSED)
                .isApprovedLevel1(false)
                .isApprovedLevel2(false)
                .createdBy(userId)
                .build();

        dr = repo.save(dr);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = dr.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    "Đê kè tại " + req.getLocation(),
                    "DIR_" + dr.getId(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    refId,
                    InfrastructureType.DIKE_REVETMENT);
            dr.setSpatialId(spatialObj.getId());
            dr = repo.save(dr);
        }

        // Save attachments if provided
        if (req.getAttachments() != null && !req.getAttachments().isEmpty()) {
            for (DikeRevetmentCreateRequest.DikeRevetmentAttachmentCreate attReq : req.getAttachments()) {
                DikeRevetmentAttachment att = DikeRevetmentAttachment.builder()
                        .dikeRevetment(dr)
                        .fileName(attReq.getFileName())
                        .filePath(attReq.getFilePath())
                        .fileSize(attReq.getFileSize())
                        .documentType(attReq.getDocumentType())
                        .uploadedBy(attReq.getUploadedBy())
                        .build();
                dr.getAttachments().add(att);
            }
            dr = repo.save(dr);
        }

        return toResponse(dr);
    }

    @Transactional(readOnly = true)
    public DikeRevetmentResponse getById(UUID id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id)));
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentResponse> findAll() {
        return repo.findByDeletedAtIsNull(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<DikeRevetmentResponse> findAll(int page, int size) {
        return repo
                .findByDeletedAtIsNull(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<DikeRevetmentResponse> search(UUID orgUnitId, String keyword, DikeRevetmentType dikeRevetmentType,
            String status,
            String approvalStatusStr, int page, int size) {
        Page<DikeRevetment> results;
        ApprovalStatus approvalStatus = null;
        if (approvalStatusStr != null && !approvalStatusStr.isEmpty()) {
            try {
                approvalStatus = ApprovalStatus.valueOf(approvalStatusStr);
            } catch (IllegalArgumentException e) {
                log.debug("Bỏ qua bộ lọc trạng thái không hợp lệ: {}", approvalStatusStr);
            }
        }
        if (orgUnitId != null || (keyword != null && !keyword.isEmpty()) || dikeRevetmentType != null || status != null
                || approvalStatus != null) {
            results = repo.searchDocuments(orgUnitId, keyword, dikeRevetmentType, status, approvalStatus,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)));
        } else {
            results = repo.findByDeletedAtIsNull(
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)));
        }
        return results.map(this::toResponse);
    }

    @Transactional
    public DikeRevetmentResponse update(UUID id, DikeRevetmentUpdateRequest req, java.util.UUID userId) {
        FieldWriteGuard.validateObject(req);
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        if (req.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(req.getSecurityLevel(), "dikerevetment",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            dr.setSecurityLevel(req.getSecurityLevel());
        }
        if (req.getDikeRevetmentType() != null)
            dr.setDikeRevetmentType(req.getDikeRevetmentType());
        if (req.getLocation() != null)
            dr.setLocation(req.getLocation());
        if (req.getDikeRevetmentName() != null)
            dr.setDikeRevetmentName(req.getDikeRevetmentName());
        if (req.getLength() != null)
            dr.setLength(req.getLength());
        if (req.getCrestElevation() != null)
            dr.setCrestElevation(req.getCrestElevation());
        if (req.getCommissioningDate() != null)
            dr.setCommissioningDate(req.getCommissioningDate());
        if (req.getHeight() != null)
            dr.setHeight(req.getHeight());
        if (req.getSurfaceMaterial() != null)
            dr.setSurfaceMaterial(req.getSurfaceMaterial());
        if (req.getStatus() != null)
            dr.setStatus(req.getStatus());
        if (req.getNote() != null)
            dr.setNote(req.getNote());
        if (req.getOrgUnitId() != null)
            dr.setOrgUnitId(req.getOrgUnitId());
        dr.setUpdatedBy(userId);

        if (req.getCoordinates() != null) {
            if (req.getCoordinates().trim().isEmpty()) {
                if (dr.getSpatialId() != null) {
                    gisSpatialObjectService.delete(dr.getSpatialId());
                    dr.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = dr.getId();
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        dr.getSpatialId(),
                        "Đê kè tại " + dr.getLocation(),
                        "DIR_" + dr.getId(),
                        geomType,
                        objType,
                        req.getCoordinates(),
                        refId,
                        InfrastructureType.DIKE_REVETMENT);
                dr.setSpatialId(spatialObj.getId());
            }
        } else if (dr.getSpatialId() != null && req.getLocation() != null) {
            gisSpatialObjectService.findById(dr.getSpatialId()).ifPresent(spatialObj -> {
                UUID refId = dr.getId();
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        "Đê kè tại " + req.getLocation(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        InfrastructureType.DIKE_REVETMENT);
            });
        }

        DikeRevetment saved = repo.save(dr);

        log.info("Updated DikeRevetment id={}, user={}", id, userId);
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        // Only approved records can be soft-deleted
        if (dr.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalStateException("Chi co de ke da duyet moi co the xoa mem");
        }

        dr.setDeletedAt(LocalDateTime.now());
        if (dr.getSpatialId() != null) {
            gisSpatialObjectService.delete(dr.getSpatialId());
        }
        repo.save(dr);
        log.info("Soft deleted de ke id={}", id);
    }

    @Transactional
    public ApprovalResponse approveC1(UUID id, ApprovalRequest req, java.util.UUID approvedBy) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        if (dr.getApprovalStatus() != ApprovalStatus.PROPOSED
                && dr.getApprovalStatus() != ApprovalStatus.REJECTED) {
            throw new IllegalStateException("Chi co the phe duyet C1 khi trang thai la PROPOSED hoac REJECTED");
        }

        dr.setIsApprovedLevel1(true);
        dr.setApproverLevel1(approvedBy);
        dr.setApprovedDateLevel1(LocalDate.now());

        String actor = approvedBy != null ? approvedBy.toString() : null;
        boolean autoApproved = false;

        if ("APPROVED".equalsIgnoreCase(req.getDecision())) {
            if (AdminAutoApproval.isAutoApprover()) {
                // Administrators clear both levels in one step.
                dr.setIsApprovedLevel2(true);
                dr.setApproverLevel2(approvedBy);
                dr.setApprovedDateLevel2(LocalDate.now());
                dr.setApprovalStatus(ApprovalStatus.APPROVED);
                autoApproved = true;
            } else {
                dr.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            }
        } else {
            dr.setApprovalStatus(ApprovalStatus.REJECTED);
            dr.setRejectionReason(req.getReason());
        }

        saveApprovalHistory(dr, 1, req.getDecision(), actor, req.getReason());
        if (autoApproved) {
            saveApprovalHistory(dr, 2, req.getDecision(), actor, req.getReason());
        }
        return buildApprovalResponse(dr, autoApproved ? 2 : 1);
    }

    @Transactional
    public ApprovalResponse approveC2(UUID id, ApprovalRequest req, java.util.UUID approvedBy) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        if (dr.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Chi co the phe duyet C2 khi trang thai la UNDER_REVIEW");
        }

        UUID c1Actor = dr.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1");
        }

        dr.setIsApprovedLevel2(true);
        dr.setApproverLevel2(approvedBy);
        dr.setApprovedDateLevel2(LocalDate.now());

        if ("APPROVED".equalsIgnoreCase(req.getDecision())) {
            dr.setApprovalStatus(ApprovalStatus.APPROVED);
        } else {
            dr.setApprovalStatus(ApprovalStatus.REJECTED);
            dr.setRejectionReason(req.getReason());
        }

        saveApprovalHistory(dr, 2, req.getDecision(), approvedBy != null ? approvedBy.toString() : null,
                req.getReason());
        return buildApprovalResponse(dr, 2);
    }

    @Transactional
    public ApprovalResponse reject(UUID id, ApprovalRequest req, java.util.UUID approvedBy) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        dr.setApprovalStatus(ApprovalStatus.REJECTED);
        dr.setRejectionReason(req.getReason());

        Integer cap = req.getApprovalLevel() != null ? req.getApprovalLevel().getValue() : 1;
        saveApprovalHistory(dr, cap, "REJECTED", approvedBy != null ? approvedBy.toString() : null, req.getReason());
        return buildApprovalResponse(dr, cap);
    }

    private void saveApprovalHistory(DikeRevetment dr, Integer cap, String status, String user, String reason) {
        ApprovalHistory hist = ApprovalHistory.builder()
                .refId(dr.getId())
                .refType(InfrastructureType.DIKE_REVETMENT)
                .approvalLevel(ApprovalLevel.fromInt(cap))
                .status(ApprovalHistoryStatus.fromValue(status))
                .approvedBy(user != null ? UUID.fromString(user) : null)
                .approvedDate(LocalDateTime.now())
                .reason(reason)
                .build();
        approvalHistoryRepo.save(hist);
    }

    private ApprovalResponse buildApprovalResponse(DikeRevetment dr, Integer cap) {
        return ApprovalResponse.builder()
                .id(String.valueOf(dr.getId()))
                .dikeRevetmentId(dr.getId())
                .approvalLevel(ApprovalLevel.fromInt(cap))
                .status(dr.getApprovalStatus().name())
                .approver(String.valueOf(cap == 1 ? dr.getApproverLevel1() : dr.getApproverLevel2()))
                .approvalDate(cap == 1 ? dr.getApprovedDateLevel1() : dr.getApprovedDateLevel2())
                .reason(dr.getRejectionReason())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getApprovalHistory(UUID id) {
        repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay de ke voi id: " + id));

        List<ApprovalHistory> history = approvalHistoryRepo
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, id);
        return history.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .dikeRevetmentId(h.getRefId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approver(h.getApprovedBy() != null ? h.getApprovedBy().toString() : null)
                .approvalDate(h.getApprovedDate() != null ? h.getApprovedDate().toLocalDate() : null)
                .reason(h.getReason())
                .build()).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentResponse> findByApprovalStatus(ApprovalStatus s) {
        return repo.findByApprovalStatusAndDeletedAtIsNull(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentResponse> searchByType(DikeRevetmentType dikeRevetmentType) {
        return repo.findByDikeRevetmentTypeAndDeletedAtIsNull(dikeRevetmentType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(UUID orgUnitId, String kw, DikeRevetmentType dikeRevetmentType,
            String status, String approvalStatusStr, int page, int size) {
        ApprovalStatus approvalStatus = null;
        if (approvalStatusStr != null && !approvalStatusStr.trim().isEmpty()) {
            try {
                approvalStatus = ApprovalStatus.valueOf(approvalStatusStr.trim());
            } catch (IllegalArgumentException e) {
                log.debug("Bỏ qua bộ lọc trạng thái không hợp lệ: {}", approvalStatusStr);
            }
        }
        String keywordLike = (kw != null && !kw.trim().isEmpty()) ? "%" + kw.trim().toLowerCase() + "%" : null;
        String statusVal = (status != null && !status.trim().isEmpty()) ? status.trim() : null;
        Page<DikeRevetment> r = repo.searchDocuments(orgUnitId, keywordLike, dikeRevetmentType, statusVal,
                approvalStatus, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)));
        return SearchResultResponse.builder()
                .results(r.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(r.getTotalElements())
                .totalPages(r.getTotalPages())
                .currentPage(r.getNumber())
                .pageSize(r.getSize())
                .build();
    }

    private DikeRevetmentResponse toResponse(DikeRevetment dr) {
        List<DikeRevetmentAttachmentResponse> atts = dr.getAttachments() != null
                ? dr.getAttachments().stream()
                        .map(a -> DikeRevetmentAttachmentResponse.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .filePath(a.getFilePath())
                                .fileSize(a.getFileSize())
                                .documentType(a.getDocumentType())
                                .uploadedBy(a.getUploadedBy())
                                .uploadDate(a.getUploadDate())
                                .build())
                        .collect(Collectors.toList())
                : new ArrayList<>();

        List<ApprovalHistory> histories = approvalHistoryRepo
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DIKE_REVETMENT, dr.getId());
        List<ApprovalResponse> hist = histories.stream()
                .map(h -> ApprovalResponse.builder()
                        .id(String.valueOf(h.getId()))
                        .dikeRevetmentId(h.getRefId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                        .approver(h.getApprovedBy() != null ? h.getApprovedBy().toString() : null)
                        .approvalDate(h.getApprovedDate() != null ? h.getApprovedDate().toLocalDate() : null)
                        .reason(h.getReason())
                        .build())
                .collect(Collectors.toList());

        GisGeometryType geomType = null;
        String coords = null;
        if (dr.getSpatialId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(dr.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        return DikeRevetmentResponse.builder()
                .id(dr.getId())
                .securityLevel(dr.getSecurityLevel())
                .dikeRevetmentType(dr.getDikeRevetmentType())
                .location(dr.getLocation())
                .dikeRevetmentName(dr.getDikeRevetmentName())
                .length(dr.getLength())
                .crestElevation(dr.getCrestElevation())
                .commissioningDate(dr.getCommissioningDate())
                .height(dr.getHeight())
                .surfaceMaterial(dr.getSurfaceMaterial())
                .status(dr.getStatus())
                .note(dr.getNote())
                .orgUnitId(dr.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(dr.getOrgUnitId()))
                .approvalStatus(dr.getApprovalStatus())
                .isApprovedLevel1(dr.getIsApprovedLevel1())
                .approverLevel1(dr.getApproverLevel1())
                .approvedDateLevel1(dr.getApprovedDateLevel1())
                .isApprovedLevel2(dr.getIsApprovedLevel2())
                .approverLevel2(dr.getApproverLevel2())
                .approvedDateLevel2(dr.getApprovedDateLevel2())
                .rejectionReason(dr.getRejectionReason())
                .createdAt(dr.getCreatedAt())
                .updatedAt(dr.getUpdatedAt())
                .createdBy(dr.getCreatedBy())
                .updatedBy(dr.getUpdatedBy())
                .deletedAt(dr.getDeletedAt())
                .deletedBy(dr.getDeletedBy())
                .attachments(atts)
                .approvalHistory(hist)
                .spatialId(dr.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .build();
    }

    private GisGeometryType parseGeometryType(String typeStr) {
        if (typeStr == null)
            return GisGeometryType.LINE;
        try {
            return GisGeometryType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return GisGeometryType.LINE;
        }
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON)
            return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }
}
