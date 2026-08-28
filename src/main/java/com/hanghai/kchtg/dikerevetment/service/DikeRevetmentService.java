package com.hanghai.kchtg.dikerevetment.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentAttachment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentAttachmentRepository;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for DikeRevetment (F-044 to F-049) complying with M-1006 2-level approval architecture.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DikeRevetmentService {

    private final DikeRevetmentRepository repo;
    private final DikeRevetmentAttachmentRepository attachmentRepo;
    private final InfrastructureHistoryRepository approvalHistoryRepo;
    private final InfrastructureApprovalService approvalService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final UserResolverService userResolverService;

    private Scope resolveEffectiveScope(UUID explicitOrgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (explicitOrgUnitId == null) {
            return userScope;
        }
        if (!userScope.allows(explicitOrgUnitId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập dữ liệu của đơn vị này");
        }
        return userScope;
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        if (orgUnitId != null && !orgUnitScopeService.currentUserScope().allows(orgUnitId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền thao tác trên đơn vị này");
        }
    }

    @Transactional
    public DikeRevetmentResponse create(DikeRevetmentCreateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);
        validateAllowedOrgUnit(req.getOrgUnitId());

        String code = req.getCode() != null && !req.getCode().trim().isEmpty()
                ? req.getCode().trim()
                : generateDikeRevetmentCode();

        DikeRevetment dr = DikeRevetment.builder()
                .dikeRevetmentType(req.getDikeRevetmentType())
                .location(req.getLocation())
                .dikeRevetmentName(req.getDikeRevetmentName())
                .code(code)
                .seaportId(req.getSeaportId())
                .length(req.getLength())
                .crestElevation(req.getCrestElevation())
                .commissioningDate(req.getCommissioningDate())
                .height(req.getHeight())
                .surfaceMaterial(req.getSurfaceMaterial())
                .status(req.getStatus() != null ? req.getStatus() : "1")
                .note(req.getNote())
                .orgUnitId(req.getOrgUnitId())
                .symbolId(req.getSymbolId())
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(userId)
                .build();

        dr = repo.save(dr);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    dr.getDikeRevetmentName(),
                    dr.getCode(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    dr.getId(),
                    InfrastructureType.DIKE_REVETMENT
            );
            dr.setSpatialId(spatialObj.getId());
            dr = repo.save(dr);
        }

        approvalHistoryRepo.save(InfrastructureHistory.builder()
                .refId(dr.getId())
                .refType(InfrastructureType.DIKE_REVETMENT)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedBy(userId)
                .reason("Tạo mới đê kè (Lưu tạm)")
                .build());

        return toResponse(dr);
    }

    @Transactional(readOnly = true)
    public DikeRevetmentResponse getById(UUID id) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        if (dr.getDeletedAt() != null || dr.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Đê kè đã bị xóa hoặc lưu trữ");
        }
        return toResponse(dr);
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentResponse> findAll(int page, int size) {
        Scope scope = resolveEffectiveScope(null);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return repo.searchPaged(!scope.unrestricted(), scope.orgUnitIds(), null, null, null, null, null, null, null, null, null, pageable)
                .map(this::toResponse)
                .getContent();
    }

    @Transactional(readOnly = true)
    public Page<DikeRevetmentResponse> searchPaged(UUID orgUnitId, String keyword, UUID seaportId,
                                                   DikeRevetmentType dikeRevetmentType, String conditionStatus,
                                                   ApprovalStatus approvalStatus, UUID updatedBy,
                                                   LocalDateTime updatedFrom, LocalDateTime updatedTo,
                                                   Pageable pageable) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        return repo.searchPaged(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern,
                seaportId, dikeRevetmentType, conditionStatus, approvalStatus,
                updatedBy, updatedFrom, updatedTo, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts(UUID orgUnitId, String keyword, String conditionStatus) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        List<Object[]> rows = repo.countByApprovalStatus(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern, conditionStatus);

        Map<String, Long> counts = new HashMap<>();
        counts.put("", 0L);
        counts.put("DRAFT", 0L);
        counts.put("PENDING_APPROVAL", 0L);
        counts.put("APPROVED_LEVEL1", 0L);
        counts.put("REJECTED", 0L);
        counts.put("APPROVED", 0L);

        long total = 0L;
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            ApprovalStatus st = (ApprovalStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            switch (st) {
                case DRAFT, PROPOSED -> counts.put("DRAFT", counts.get("DRAFT") + count);
                case PENDING_APPROVAL -> counts.put("PENDING_APPROVAL", counts.get("PENDING_APPROVAL") + count);
                case APPROVED_LEVEL1 -> counts.put("APPROVED_LEVEL1", counts.get("APPROVED_LEVEL1") + count);
                case REJECTED_LEVEL1, REJECTED_LEVEL2, REJECTED -> counts.put("REJECTED", counts.get("REJECTED") + count);
                case APPROVED, APPROVED_LEVEL2 -> counts.put("APPROVED", counts.get("APPROVED") + count);
                default -> {}
            }
        }
        counts.put("", total);
        return counts;
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentOptionResponse> getOptions(UUID orgUnitId) {
        return repo.findAllApprovedOptions(orgUnitId).stream()
                .map(dr -> DikeRevetmentOptionResponse.builder()
                        .id(dr.getId())
                        .code(dr.getCode())
                        .dikeRevetmentName(dr.getDikeRevetmentName())
                        .orgUnitId(dr.getOrgUnitId())
                        .seaportId(dr.getSeaportId())
                        .build())
                .toList();
    }

    @Transactional
    public DikeRevetmentResponse update(UUID id, DikeRevetmentUpdateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));

        if (dr.getDeletedAt() != null || dr.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Không thể chỉnh sửa đê kè đã bị xóa hoặc lưu trữ");
        }

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(dr);

        validateAllowedOrgUnit(dr.getOrgUnitId());
        if (req.getOrgUnitId() != null && !req.getOrgUnitId().equals(dr.getOrgUnitId())) {
            validateAllowedOrgUnit(req.getOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = dr.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        EntityUpdateUtils.copyPropertiesIfPresent(req, dr, Collections.emptyMap());

        if (wasApproved) {
            dr.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        if (req.getStatus() != null) {
            dr.setStatus(req.getStatus());
        }

        dr.setUpdatedBy(userId);
        DikeRevetment saved = repo.save(dr);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    dr.getSpatialId(),
                    dr.getDikeRevetmentName(),
                    dr.getCode(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    dr.getId(),
                    InfrastructureType.DIKE_REVETMENT
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repo.save(saved);
        }

        if (wasApproved) {
            approvalHistoryRepo.save(InfrastructureHistory.builder()
                    .refId(saved.getId())
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .reason("Cập nhật sau phê duyệt")
                    .build());
        }

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));

        validateAllowedOrgUnit(dr.getOrgUnitId());

        InfrastructureHistoryUtils.recordSoftDelete(approvalHistoryRepo, dr.getId(), InfrastructureType.DIKE_REVETMENT, userId, "Xóa đê kè");
        dr.setDeletedAt(LocalDateTime.now());
        dr.setDeletedBy(userId);
        dr.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repo.save(dr);
    }

    @Transactional
    public DikeRevetmentResponse submitForApproval(UUID id, UUID userId) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.DIKE_REVETMENT, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse approveLevel1(UUID id, UUID userId, String note) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.DIKE_REVETMENT, "APPROVED", note, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse approveLevel2(UUID id, UUID userId, String note) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.DIKE_REVETMENT, "APPROVED", note, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse rejectLevel1(UUID id, UUID userId, String reason) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.DIKE_REVETMENT, "REJECTED", reason, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse rejectLevel2(UUID id, UUID userId, String reason) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.DIKE_REVETMENT, "REJECTED", reason, userId);
        return toResponse(repo.save(entity));
    }

    public String generateDikeRevetmentCode() {
        String maxCode = repo.findMaxCode();
        if (maxCode == null || !maxCode.startsWith("DK-")) {
            return "DK-0001";
        }
        try {
            int seq = Integer.parseInt(maxCode.substring(3));
            return String.format("DK-%04d", seq + 1);
        } catch (NumberFormatException e) {
            return "DK-" + System.currentTimeMillis();
        }
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        return getHistory(id, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
        return getHistory(id, page, pageSize, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
            LocalDateTime fromDate, LocalDateTime toDate) {
        List<InfrastructureHistory> historyList;
        if (page != null && pageSize != null && pageSize > 0) {
            Pageable pageable = PageRequest.of(page, pageSize);
            String normalizedKeyword = normalizeSearchKeyword(keyword);
            if (normalizedKeyword == null && fromDate == null && toDate == null) {
                historyList = approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.DIKE_REVETMENT, id, pageable);
            } else {
                historyList = approvalHistoryRepo.searchHistory(InfrastructureType.DIKE_REVETMENT, id, normalizedKeyword,
                        fromDate, toDate, pageable);
            }
        } else {
            historyList = approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                    InfrastructureType.DIKE_REVETMENT, id);
        }
        Map<UUID, String> userNameMap = new HashMap<>();
        for (InfrastructureHistory h : historyList) {
            if (h.getApprovedBy() != null) {
                userNameMap.putIfAbsent(h.getApprovedBy(), userResolverService.resolveName(h.getApprovedBy()));
            }
        }
        return historyList.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approvedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null)
                .orgUnitName(null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .changedField(h.getChangedField())
                .previousValue(h.getPreviousValue())
                .newValue(h.getNewValue())
                .build())
                .toList();
    }

    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return null;
        return Normalizer.normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }

    private DikeRevetmentResponse toResponse(DikeRevetment dr) {
        String orgUnitName = dr.getOrgUnitId() != null
                ? orgUnitCacheService.getName(dr.getOrgUnitId())
                : null;
        String seaportName = dr.getSeaportId() != null
                ? portCacheService.getName(dr.getSeaportId())
                : null;
        String updatedByName = dr.getUpdatedBy() != null
                ? userResolverService.resolveName(dr.getUpdatedBy())
                : null;

        return DikeRevetmentResponse.builder()
                .id(dr.getId())
                .dikeRevetmentType(dr.getDikeRevetmentType())
                .location(dr.getLocation())
                .dikeRevetmentName(dr.getDikeRevetmentName())
                .code(dr.getCode())
                .seaportId(dr.getSeaportId())
                .seaportName(seaportName)
                .length(dr.getLength())
                .crestElevation(dr.getCrestElevation())
                .commissioningDate(dr.getCommissioningDate())
                .height(dr.getHeight())
                .surfaceMaterial(dr.getSurfaceMaterial())
                .status(dr.getStatus())
                .note(dr.getNote())
                .orgUnitId(dr.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .approvalStatus(dr.getApprovalStatus())
                .isApprovedLevel1(dr.getApprovedDateLevel1() != null)
                .approverLevel1(dr.getApproverLevel1())
                .approvedDateLevel1(dr.getApprovedDateLevel1() != null ? dr.getApprovedDateLevel1().toLocalDate() : null)
                .isApprovedLevel2(dr.getApprovedDateLevel2() != null)
                .approverLevel2(dr.getApproverLevel2())
                .approvedDateLevel2(dr.getApprovedDateLevel2() != null ? dr.getApprovedDateLevel2().toLocalDate() : null)
                .rejectionReason(dr.getRejectionReason())
                .isDeleted(dr.getDeletedAt() != null)
                .createdAt(dr.getCreatedAt())
                .updatedAt(dr.getUpdatedAt())
                .createdBy(dr.getCreatedBy())
                .updatedBy(dr.getUpdatedBy())
                .updatedByName(updatedByName)
                .deletedAt(dr.getDeletedAt())
                .deletedBy(dr.getDeletedBy())
                .spatialId(dr.getSpatialId())
                .symbolId(dr.getSymbolId())
                .build();
    }
}
