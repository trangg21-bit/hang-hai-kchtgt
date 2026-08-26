package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for NavigationChannel (F-038 to F-043) complying with M-1006 2-level approval architecture.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NavigationChannelService {

    private final NavigationChannelRepository repo;
    private final InfrastructureHistoryRepository approvalHistoryRepo;
    private final InfrastructureApprovalService approvalService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final UserResolverService userResolverService;
    private final InfrastructureAttachmentRepository attachmentRepository;

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
    public NavigationChannelResponse create(NavigationChannelCreateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);
        validateAllowedOrgUnit(req.getOrgUnitId());

        String channelCode = req.getChannelCode();
        if (channelCode == null || channelCode.trim().isEmpty()) {
            channelCode = generateChannelCode();
        }

        RecordSecurityLevel secLevel = req.getSecurityLevel() != null ? req.getSecurityLevel() : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "navigationchannel", SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        NavigationChannel nc = NavigationChannel.builder()
                .securityLevel(secLevel)
                .channelName(req.getChannelName())
                .channelCode(channelCode)
                .stationAmountt(req.getStationAmountt())
                .latestStationRepairDate(req.getLatestStationRepairDate())
                .stationArea(req.getStationArea())
                .note(req.getNote())
                .seaportId(req.getSeaportId())
                .operatingUnitId(req.getOperatingUnitId())
                .location(req.getLocation())
                .detailedLocation(req.getDetailedLocation())
                .channelManagementStation(req.getChannelManagementStation())
                .stationStaffAmount(req.getStationStaffAmount())
                .latestMaintenanceYear(req.getLatestMaintenanceYear())
                .dredgingVolume(req.getDredgingVolume())
                .buoyAmount(req.getBuoyAmount())
                .beaconAmount(req.getBeaconAmount())
                .status(req.getStatus() != null ? req.getStatus() : 1)
                .orgUnitId(req.getOrgUnitId())
                .clearanceHeight(req.getClearanceHeight())
                .symbolId(req.getSymbolId())
                .registeredArea(req.getRegisteredArea())
                .operatingHours(req.getOperatingHours())
                .recordedDate(req.getRecordedDate())
                .quantity(req.getQuantity())
                .loadCapacity(req.getLoadCapacity())
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(userId)
                .build();

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = GisSpatialObjectType.LINE_SHIPPING_ROUTE;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    nc.getChannelName(),
                    nc.getChannelCode(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    nc.getId(),
                    InfrastructureType.NAVIGATION_CHANNEL
            );
            nc.setSpatialId(spatialObj.getId());
        }

        nc = repo.save(nc);

        approvalHistoryRepo.save(InfrastructureHistory.builder()
                .refId(nc.getId())
                .refType(InfrastructureType.NAVIGATION_CHANNEL)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedBy(userId)
                .reason("Tạo mới tuyến luồng (Lưu tạm)")
                .build());

        return toResponse(nc);
    }

    @Transactional(readOnly = true)
    public NavigationChannelResponse getById(UUID id) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));
        if (nc.getDeletedAt() != null || nc.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Tuyến luồng đã bị xóa hoặc lưu trữ");
        }
        return toResponse(nc);
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findAll(int page, int size) {
        Scope scope = resolveEffectiveScope(null);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return repo.searchPaged(!scope.unrestricted(), scope.orgUnitIds(), null, null, null, null, null, null, null, null, pageable)
                .map(this::toResponse)
                .getContent();
    }

    @Transactional(readOnly = true)
    public Page<NavigationChannelResponse> searchPaged(UUID orgUnitId, String keyword, UUID seaportId,
                                                       Integer status, ApprovalStatus approvalStatus,
                                                       UUID updatedBy, LocalDateTime updatedFrom,
                                                       LocalDateTime updatedTo, Pageable pageable) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        return repo.searchPaged(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern,
                seaportId, status, approvalStatus, updatedBy, updatedFrom, updatedTo, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts(UUID orgUnitId, String keyword, Integer status) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        List<Object[]> rows = repo.countByApprovalStatus(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern, status);

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
    public List<NavigationChannelOptionResponse> getOptions(UUID orgUnitId) {
        return repo.findAllApprovedOptions(orgUnitId).stream()
                .map(nc -> NavigationChannelOptionResponse.builder()
                        .id(nc.getId())
                        .channelCode(nc.getChannelCode())
                        .channelName(nc.getChannelName())
                        .orgUnitId(nc.getOrgUnitId())
                        .seaportId(nc.getSeaportId())
                        .build())
                .toList();
    }

    @Transactional
    public NavigationChannelResponse update(UUID id, NavigationChannelUpdateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));

        if (nc.getDeletedAt() != null || nc.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Không thể chỉnh sửa tuyến luồng đã bị xóa hoặc lưu trữ");
        }

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(nc);

        validateAllowedOrgUnit(nc.getOrgUnitId());
        if (req.getOrgUnitId() != null && !req.getOrgUnitId().equals(nc.getOrgUnitId())) {
            validateAllowedOrgUnit(req.getOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = nc.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        EntityUpdateUtils.copyPropertiesIfPresent(req, nc, Collections.emptyMap());

        if (wasApproved) {
            nc.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        if (req.getSecurityLevel() != null) {
            nc.setSecurityLevel(req.getSecurityLevel());
        }
        if (req.getStatus() != null) {
            nc.setStatus(req.getStatus());
        }

        nc.setUpdatedBy(userId);
        NavigationChannel saved = repo.save(nc);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = GisSpatialObjectType.LINE_SHIPPING_ROUTE;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    nc.getSpatialId(),
                    nc.getChannelName(),
                    nc.getChannelCode(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    nc.getId(),
                    InfrastructureType.NAVIGATION_CHANNEL
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repo.save(saved);
        }

        if (wasApproved) {
            approvalHistoryRepo.save(InfrastructureHistory.builder()
                    .refId(saved.getId())
                    .refType(InfrastructureType.NAVIGATION_CHANNEL)
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
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));

        validateAllowedOrgUnit(nc.getOrgUnitId());

        InfrastructureHistoryUtils.recordSoftDelete(approvalHistoryRepo, nc.getId(), InfrastructureType.NAVIGATION_CHANNEL, userId, "Xóa tuyến luồng");
        nc.setDeletedAt(LocalDateTime.now());
        nc.setDeletedBy(userId);
        nc.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repo.save(nc);
    }

    @Transactional
    public NavigationChannelResponse submitForApproval(UUID id, UUID userId) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.NAVIGATION_CHANNEL, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public NavigationChannelResponse approveLevel1(UUID id, UUID userId, String note) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.NAVIGATION_CHANNEL, "APPROVED", note, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public NavigationChannelResponse approveLevel2(UUID id, UUID userId, String note) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.NAVIGATION_CHANNEL, "APPROVED", note, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public NavigationChannelResponse rejectLevel1(UUID id, UUID userId, String reason) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.NAVIGATION_CHANNEL, "REJECTED", reason, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public NavigationChannelResponse rejectLevel2(UUID id, UUID userId, String reason) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tuyến luồng với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.NAVIGATION_CHANNEL, "REJECTED", reason, userId);
        return toResponse(repo.save(entity));
    }

    public String generateChannelCode() {
        String maxCode = repo.findMaxCode();
        if (maxCode == null || !maxCode.startsWith("NC-")) {
            return "NC-000001";
        }
        try {
            int seq = Integer.parseInt(maxCode.substring(3));
            return String.format("NC-%06d", seq + 1);
        } catch (NumberFormatException e) {
            return "NC-" + System.currentTimeMillis();
        }
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        List<InfrastructureHistory> historyList = approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                InfrastructureType.NAVIGATION_CHANNEL, id);
        return historyList.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .navigationChannelId(h.getRefId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().name() : null)
                .approvedBy(h.getApprovedBy() != null ? userResolverService.resolveName(h.getApprovedBy()) : null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .build())
                .toList();
    }

    private NavigationChannelResponse toResponse(NavigationChannel nc) {
        String orgUnitName = nc.getOrgUnitId() != null
                ? orgUnitCacheService.getName(nc.getOrgUnitId())
                : null;
        String seaportName = nc.getSeaportId() != null
                ? portCacheService.getName(nc.getSeaportId())
                : null;
        String operatingUnitName = nc.getOperatingUnitId() != null
                ? orgUnitCacheService.getName(nc.getOperatingUnitId())
                : null;
        String updatedByName = nc.getUpdatedBy() != null
                ? userResolverService.resolveName(nc.getUpdatedBy())
                : null;

        List<ChannelRouteDetailResponse> routeDetails = nc.getChannelRouteDetailList() != null
                ? nc.getChannelRouteDetailList().stream().map(this::toRouteDetailResponse).toList()
                : Collections.emptyList();

        return NavigationChannelResponse.builder()
                .id(nc.getId())
                .securityLevel(nc.getSecurityLevel())
                .channelName(nc.getChannelName())
                .channelCode(nc.getChannelCode())
                .stationAmountt(nc.getStationAmountt())
                .latestStationRepairDate(nc.getLatestStationRepairDate())
                .stationArea(nc.getStationArea())
                .note(nc.getNote())
                .seaportId(nc.getSeaportId())
                .seaportName(seaportName)
                .operatingUnitId(nc.getOperatingUnitId())
                .operatingUnitName(operatingUnitName)
                .location(nc.getLocation())
                .detailedLocation(nc.getDetailedLocation())
                .channelManagementStation(nc.getChannelManagementStation())
                .stationStaffAmount(nc.getStationStaffAmount())
                .latestMaintenanceYear(nc.getLatestMaintenanceYear())
                .dredgingVolume(nc.getDredgingVolume())
                .buoyAmount(nc.getBuoyAmount())
                .beaconAmount(nc.getBeaconAmount())
                .status(nc.getStatus())
                .orgUnitId(nc.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .approvalStatus(nc.getApprovalStatus())
                .isApprovedLevel1(nc.getApprovedDateLevel1() != null)
                .approverLevel1(nc.getApproverLevel1())
                .approvedDateLevel1(nc.getApprovedDateLevel1() != null ? nc.getApprovedDateLevel1().toLocalDate() : null)
                .isApprovedLevel2(nc.getApprovedDateLevel2() != null)
                .approverLevel2(nc.getApproverLevel2())
                .approvedDateLevel2(nc.getApprovedDateLevel2() != null ? nc.getApprovedDateLevel2().toLocalDate() : null)
                .rejectionReason(nc.getRejectionReason())
                .isDeleted(nc.getDeletedAt() != null)
                .createdAt(nc.getCreatedAt())
                .updatedAt(nc.getUpdatedAt())
                .createdBy(nc.getCreatedBy())
                .updatedBy(nc.getUpdatedBy())
                .updatedByName(updatedByName)
                .deletedAt(nc.getDeletedAt())
                .deletedBy(nc.getDeletedBy())
                .clearanceHeight(nc.getClearanceHeight())
                .channelRouteDetailList(routeDetails)
                .spatialId(nc.getSpatialId())
                .symbolId(nc.getSymbolId())
                .registeredArea(nc.getRegisteredArea())
                .operatingHours(nc.getOperatingHours())
                .recordedDate(nc.getRecordedDate())
                .quantity(nc.getQuantity())
                .loadCapacity(nc.getLoadCapacity())
                .build();
    }

    private ChannelRouteDetailResponse toRouteDetailResponse(ChannelRouteDetail d) {
        return ChannelRouteDetailResponse.builder()
                .id(d.getId())
                .sequenceNo(d.getSequenceNo())
                .classification(d.getClassification())
                .code(d.getCode())
                .name(d.getName())
                .channelRouteType(d.getChannelRouteType())
                .currentDepth(d.getCurrentDepth())
                .designSlope(d.getDesignSlope())
                .length(d.getLength())
                .maxWidth(d.getMaxWidth())
                .minWidth(d.getMinWidth())
                .depth(d.getDepth())
                .dredgingVolume(d.getDredgingVolume())
                .publicAccess(d.getPublicAccess())
                .dedicated(d.getDedicated())
                .clearanceHeight(d.getClearanceHeight())
                .turningBasinLocation(d.getTurningBasinLocation())
                .turningBasinRadius(d.getTurningBasinRadius())
                .minCurveRadius(d.getMinCurveRadius())
                .channelProtectionScope(d.getChannelProtectionScope())
                .build();
    }
}
