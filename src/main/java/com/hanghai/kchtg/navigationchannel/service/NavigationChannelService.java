package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelCoordinate;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for NavigationChannel (F-038 to F-043).
 * <p>
 * Write-scope: every create/update validates the target orgUnitId against the current user's
 * {@link OrgUnitScopeService.Scope} (BR-038-04) — out-of-scope assignment throws 403.
 * Codegen: channelCode prefix {@code LHH} + %06d per orgUnitId (chốt a3); a duplicate-code
 * collision (unique index ux_navigation_channel_org_code) is retried once with a fresh count.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NavigationChannelService {

    private static final String CHANNEL_CODE_PREFIX = "LHH";

    private final NavigationChannelRepository repo;
    private final InfrastructureHistoryRepository approvalHistoryRepo;
    private final InfrastructureApprovalService approvalService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitRepository orgUnitRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public NavigationChannelResponse create(NavigationChannelCreateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);

        // BR-038-04: đơn vị quản lý phải nằm trong phạm vi được phân quyền (write-scope)
        if (!orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())) {
            throw new AccessDeniedException("Đơn vị quản lý nằm ngoài phạm vi được phân quyền");
        }
        if (!orgUnitRepository.existsById(req.getOrgUnitId())) {
            throw new IllegalArgumentException("Không tìm thấy đơn vị với id: " + req.getOrgUnitId());
        }

        NavigationChannel nc = NavigationChannel.builder()
                .channelName(trimToNull(req.getChannelName()))
                .seaportId(req.getSeaportId())
                .operatingUnitId(req.getOperatingUnitId())
                .conditionStatus(req.getConditionStatus() != null ? req.getConditionStatus() : ConditionStatus.OPERATIONAL)
                .detailedLocation(trimToNull(req.getDetailedLocation()))
                .managementStation(trimToNull(req.getManagementStation()))
                .stationCount(req.getStationCount())
                .stationStaffCount(req.getStationStaffCount())
                .stationAreaSquareMeters(req.getStationAreaSquareMeters())
                .latestStationRepairMonth(req.getLatestStationRepairMonth())
                .latestMaintenanceYear(req.getLatestMaintenanceYear())
                .latestDredgingVolumeCubicMeters(req.getLatestDredgingVolumeCubicMeters())
                .buoyCount(req.getBuoyCount())
                .beaconCount(req.getBeaconCount())
                .notes(trimToNull(req.getNotes()))
                .announcementDecisionNumber(trimToNull(req.getAnnouncementDecisionNumber()))
                .announcementDecisionDate(req.getAnnouncementDecisionDate())
                .announcementDecisionIssuer(trimToNull(req.getAnnouncementDecisionIssuer()))
                .protectionScopeMeters(req.getProtectionScopeMeters())
                .protectionNotes(trimToNull(req.getProtectionNotes()))
                .geometryType(req.getGeometryType())
                .mapIconId(req.getMapIconId())
                .coordinateReferenceSystem(trimToNull(req.getCoordinateReferenceSystem()))
                .displayRule(trimToNull(req.getDisplayRule()))
                .orgUnitId(req.getOrgUnitId())
                .provinceId(req.getProvinceId())
                // F-038: trạng thái mặc định DRAFT (design plan 6.3 — không dùng PROPOSED)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        String generatedCode = generateChannelCode(req.getOrgUnitId());
        nc.setChannelCode(generatedCode);
        nc = repo.save(nc);

        // Retry once nếu unique index ux_navigation_channel_org_code chặn code trùng (count+1 không atomic)
        try {
            attachChildren(nc, req.getRouteDetails(), req.getCoordinateList(), req.getAttachments(), userId);
            nc = repo.save(nc);
        } catch (DataIntegrityViolationException e) {
            log.warn("channel_code collision detected for orgUnitId={}, regenerating once", req.getOrgUnitId());
            nc.setChannelCode(generateChannelCode(req.getOrgUnitId()));
            nc = repo.save(nc);
        }

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = nc.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    nc.getChannelName(),
                    "NC_" + nc.getId(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    refId,
                    InfrastructureType.NAVIGATION_CHANNEL);
            nc.setSpatialId(spatialObj.getId());
            nc = repo.save(nc);
        }

        // F-043: ghi history CREATED sau khi create thành công (cùng transaction với toàn bộ create)
        approvalHistoryRepo.save(InfrastructureHistory.builder()
                .refId(nc.getId())
                .refType(InfrastructureType.NAVIGATION_CHANNEL)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedBy(userId)
                .reason("Tạo mới luồng hàng hải")
                .build());

        return toResponse(nc);
    }

    @Transactional(readOnly = true)
    public NavigationChannelResponse getById(UUID id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id)));
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findAll() {
        return repo.findByDeletedAtIsNull(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NavigationChannelResponse> findAll(int page, int size) {
        return repo
                .findByDeletedAtIsNull(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)))
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<NavigationChannelResponse> search(UUID orgUnitId, String keyword,
            String approvalStatusStr, int page, int size) {
        Page<NavigationChannel> results;
        ApprovalStatus approvalStatus = null;
        if (approvalStatusStr != null && !approvalStatusStr.isEmpty()) {
            try {
                approvalStatus = ApprovalStatus.valueOf(approvalStatusStr);
            } catch (IllegalArgumentException e) {
                log.debug("Bỏ qua bộ lọc trạng thái không hợp lệ: {}", approvalStatusStr);
            }
        }
        if (orgUnitId != null || (keyword != null && !keyword.isEmpty()) || approvalStatus != null) {
            results = repo.searchDocuments(orgUnitId, null, null, null, keyword, approvalStatus,
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)));
        } else {
            results = repo.findByDeletedAtIsNull(
                    PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)));
        }
        return results.map(nc -> toResponse(nc, false));
    }

    @Transactional
    public NavigationChannelResponse update(UUID id, NavigationChannelUpdateRequest req, UUID updatedBy) {
        FieldWriteGuard.validateObject(req);
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt.
        //
        // Guard riêng của F-039 D1 trước đây ngược với quy tắc nền ở cả hai chiều: nó CHO sửa khi
        // hồ sơ đang `PENDING_APPROVAL`/`APPROVED_LEVEL1` (người nhập đổi được nội dung sau khi cán
        // bộ đã đọc — cán bộ ký duyệt vào nội dung mình chưa từng xem), và CẤM sửa khi `APPROVED`
        // (mất thao tác T12 "Lưu và phê duyệt"). Nay dùng chung `assertEditable`.
        approvalService.assertEditable(nc);
        ApprovalStatus currentStatus = nc.getApprovalStatus() != null ? nc.getApprovalStatus() : ApprovalStatus.DRAFT;

        // BR-038-04: nếu đổi đơn vị quản lý phải nằm trong phạm vi được phân quyền
        if (req.getOrgUnitId() != null && !orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())) {
            throw new AccessDeniedException("Đơn vị quản lý nằm ngoài phạm vi được phân quyền");
        }

        Map<String, String> previousValues = new LinkedHashMap<>();
        Map<String, String> manualNewValues = new LinkedHashMap<>();

        // F-039 D3: copy field đơn (non-null) qua EntityUpdateUtils — ignore field có xử lý riêng
        EntityUpdateUtils.copyPropertiesIfPresent(req, nc, previousValues,
                NavigationChannelUpdateRequest.Fields.orgUnitId,
                NavigationChannelUpdateRequest.Fields.geometryType,
                NavigationChannelUpdateRequest.Fields.coordinates,
                NavigationChannelUpdateRequest.Fields.routeDetails,
                NavigationChannelUpdateRequest.Fields.coordinateList,
                NavigationChannelUpdateRequest.Fields.attachments);

        if (req.getOrgUnitId() != null) {
            if (!Objects.equals(req.getOrgUnitId(), nc.getOrgUnitId())) {
                previousValues.put(NavigationChannelUpdateRequest.Fields.orgUnitId,
                        nc.getOrgUnitId() != null ? String.valueOf(nc.getOrgUnitId()) : "Chưa có");
            }
            nc.setOrgUnitId(req.getOrgUnitId());
        }

        // F-039 D3: normalize trim sau reflection copy (BR-039-04)
        if (req.getChannelName() != null)
            nc.setChannelName(trimToNull(nc.getChannelName()));
        if (req.getDetailedLocation() != null)
            nc.setDetailedLocation(trimToNull(nc.getDetailedLocation()));
        if (req.getManagementStation() != null)
            nc.setManagementStation(trimToNull(nc.getManagementStation()));
        if (req.getNotes() != null)
            nc.setNotes(trimToNull(nc.getNotes()));
        if (req.getAnnouncementDecisionNumber() != null)
            nc.setAnnouncementDecisionNumber(trimToNull(nc.getAnnouncementDecisionNumber()));
        if (req.getAnnouncementDecisionIssuer() != null)
            nc.setAnnouncementDecisionIssuer(trimToNull(nc.getAnnouncementDecisionIssuer()));
        if (req.getProtectionNotes() != null)
            nc.setProtectionNotes(trimToNull(nc.getProtectionNotes()));
        if (req.getCoordinateReferenceSystem() != null)
            nc.setCoordinateReferenceSystem(trimToNull(nc.getCoordinateReferenceSystem()));
        if (req.getDisplayRule() != null)
            nc.setDisplayRule(trimToNull(nc.getDisplayRule()));

        // Bảng con #22-#38, #45, #46 — thay thế toàn bộ cùng transaction (BR-038-08), chỉ khi thực sự đổi
        if (req.getRouteDetails() != null) {
            String oldRouteDetailsStr = formatRouteDetails(nc.getChannelRouteDetailList());
            String newRouteDetailsStr = formatRouteDetails(req.getRouteDetails());
            if (!Objects.equals(oldRouteDetailsStr, newRouteDetailsStr)) {
                previousValues.put(NavigationChannelUpdateRequest.Fields.routeDetails, oldRouteDetailsStr);
                manualNewValues.put(NavigationChannelUpdateRequest.Fields.routeDetails, newRouteDetailsStr);
                nc.getChannelRouteDetailList().clear();
                List<ChannelRouteDetail> details = new ArrayList<>(req.getRouteDetails().size());
                for (int i = 0; i < req.getRouteDetails().size(); i++) {
                    details.add(toRouteDetail(req.getRouteDetails().get(i), nc, i));
                }
                nc.getChannelRouteDetailList().addAll(details);
            }
        }
        if (req.getCoordinateList() != null) {
            String oldCoordinateListStr = formatCoordinateList(nc.getCoordinates());
            String newCoordinateListStr = formatCoordinateList(req.getCoordinateList());
            if (!Objects.equals(oldCoordinateListStr, newCoordinateListStr)) {
                previousValues.put(NavigationChannelUpdateRequest.Fields.coordinateList, oldCoordinateListStr);
                manualNewValues.put(NavigationChannelUpdateRequest.Fields.coordinateList, newCoordinateListStr);
                nc.getCoordinates().clear();
                List<NavigationChannelCoordinate> coords = req.getCoordinateList().stream()
                        .map(c -> toCoordinate(c, nc))
                        .collect(Collectors.toList());
                nc.getCoordinates().addAll(coords);
            }
        }
        if (req.getAttachments() != null) {
            String oldAttachmentsStr = attachmentRepository
                    .findByRefIdAndRefTypeOrderByUploadedDateDesc(nc.getId(), InfrastructureType.NAVIGATION_CHANNEL)
                    .stream()
                    .map(a -> formatAttachment(a.getFileName(), a.getFilePath()))
                    .collect(Collectors.joining("; "));
            String newAttachmentsStr = req.getAttachments().stream()
                    .map(a -> formatAttachment(a.getFileName(), a.getFilePath()))
                    .collect(Collectors.joining("; "));
            if (!Objects.equals(oldAttachmentsStr, newAttachmentsStr)) {
                previousValues.put(NavigationChannelUpdateRequest.Fields.attachments,
                        oldAttachmentsStr.isEmpty() ? "Chưa có" : oldAttachmentsStr);
                manualNewValues.put(NavigationChannelUpdateRequest.Fields.attachments,
                        newAttachmentsStr.isEmpty() ? "Không có" : newAttachmentsStr);
                attachmentRepository.deleteByRefIdAndRefType(nc.getId(), InfrastructureType.NAVIGATION_CHANNEL);
                saveAttachments(nc.getId(), req.getAttachments(), updatedBy);
            }
        }

        // GIS — chỉ ghi flag khi tọa độ thực sự đổi (tránh no-op gây reset DRAFT)
        if (req.getCoordinates() != null) {
            if (req.getCoordinates().trim().isEmpty()) {
                if (nc.getSpatialId() != null) {
                    previousValues.put(NavigationChannelUpdateRequest.Fields.coordinates, "Có tọa độ GIS");
                    manualNewValues.put(NavigationChannelUpdateRequest.Fields.coordinates, "Đã xóa");
                    gisSpatialObjectService.delete(nc.getSpatialId());
                    nc.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = nc.getId();
                Optional<GisSpatialObject> existing = nc.getSpatialId() != null
                        ? gisSpatialObjectService.findById(nc.getSpatialId())
                        : Optional.empty();
                boolean gisChanged = existing
                        .map(sp -> !req.getCoordinates().trim().equals(sp.getCoordinates()))
                        .orElse(true);
                boolean gisNameChanged = previousValues
                        .containsKey(NavigationChannelUpdateRequest.Fields.channelName);
                if (gisChanged) {
                    previousValues.put(NavigationChannelUpdateRequest.Fields.coordinates,
                            existing.map(GisSpatialObject::getCoordinates).orElse("Chưa có"));
                    manualNewValues.put(NavigationChannelUpdateRequest.Fields.coordinates,
                            req.getCoordinates().trim());
                }
                // createOrUpdate luôn save — chỉ gọi khi tọa độ/name thực sự đổi (no-op không ghi GIS)
                if (gisChanged || gisNameChanged) {
                    GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                            nc.getSpatialId(),
                            nc.getChannelName(),
                            "NC_" + nc.getId(),
                            geomType,
                            objType,
                            req.getCoordinates(),
                            refId,
                            InfrastructureType.NAVIGATION_CHANNEL);
                    nc.setSpatialId(spatialObj.getId());
                }
            }
        } else if (nc.getSpatialId() != null && req.getChannelName() != null
                && previousValues.containsKey(NavigationChannelUpdateRequest.Fields.channelName)) {
            gisSpatialObjectService.findById(nc.getSpatialId()).ifPresent(spatialObj -> {
                UUID refId = nc.getId();
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        req.getChannelName(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        InfrastructureType.NAVIGATION_CHANNEL);
            });
        }

        // F-039 D2: no-op update → trả về hồ sơ nguyên vẹn (không reset, không history, không đổi updatedBy/updatedAt)
        boolean hasFieldChanges = !previousValues.isEmpty();
        if (!hasFieldChanges) {
            return toResponse(nc);
        }

        // F-039 D2: hồ sơ Bị trả về sau khi sửa thì quay về Lưu tạm để người nhập gửi lại.
        //
        // Quy tắc 12/T12 (approval-2-level-spec.md mục 3.9): hồ sơ **Đã duyệt** thì TUYỆT ĐỐI
        // không hạ về `DRAFT` — sửa qua "Lưu và phê duyệt", giữ nguyên `APPROVED` và ghi bản cũ
        // vào nhật ký. Hạ trạng thái sẽ làm hồ sơ đang khai thác biến mất khỏi mọi dropdown
        // `/options` (quy tắc APPROVED ONLY) của các màn hình khác.
        if (currentStatus == ApprovalStatus.APPROVED || currentStatus == ApprovalStatus.APPROVED_LEVEL2) {
            approvalService.recordSaveAndApprove(nc, InfrastructureType.NAVIGATION_CHANNEL,
                    "Cập nhật sau phê duyệt", updatedBy);
        } else if (currentStatus != ApprovalStatus.DRAFT) {
            nc.setApprovalStatus(ApprovalStatus.DRAFT);
            nc.setSubmittedAt(null);
            nc.setSubmittedBy(null);
            nc.setApproverLevel1(null);
            nc.setApprovedDateLevel1((LocalDateTime) null);
            nc.setApproverLevel2(null);
            nc.setApprovedDateLevel2((LocalDateTime) null);
            nc.setRejectionReason(null);
            nc.setLevel1ApprovalContent(null);
            nc.setLevel2ApprovalContent(null);
        }

        nc.setUpdatedBy(updatedBy);
        NavigationChannel saved = repo.save(nc);

        // F-039 D3: ghi history UPDATED sau save (cùng transaction)
        approvalHistoryRepo.save(InfrastructureHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.NAVIGATION_CHANNEL)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(updatedBy)
                .reason("Cập nhật thông tin")
                .changedField(formatChangedFields(previousValues))
                .previousValue(formatPreviousValues(previousValues))
                .newValue(formatNewValues(saved, previousValues, manualNewValues))
                .build());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id, UUID operatorId) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        // Quy tắc 11 (approval-2-level-spec.md mục 3.6): chỉ xóa được hồ sơ đang Lưu tạm.
        //
        // BR-040-01 trước đây làm ngược — chỉ cho xóa hồ sơ `APPROVED`. Quy định đó không xuất
        // phát từ nghiệp vụ mà viết ngược lại từ code (ô Assumptions của lean-spec F-040 tự khai
        // "…theo code hiện tại"), và sai về hệ quả: bản nháp gõ dở thì không xóa được nên tồn
        // đọng vĩnh viễn, còn hồ sơ đã qua 2 cấp ký lại xóa được chỉ với quyền `delete`.
        approvalService.assertDeletable(nc);

        nc.softDelete(operatorId);
        if (nc.getSpatialId() != null) {
            gisSpatialObjectService.delete(nc.getSpatialId());
        }
        repo.save(nc);

        // F-040 D2: ghi history DELETED (caller đầu tiên của InfrastructureHistoryUtils.recordSoftDelete)
        InfrastructureHistoryUtils.recordSoftDelete(approvalHistoryRepo, id,
                InfrastructureType.NAVIGATION_CHANNEL, operatorId, "Xóa luồng hàng hải");
        log.info("Soft deleted navigation channel id={} by {}", id, operatorId);
    }

    /**
     * Gửi hồ sơ đi phê duyệt (mới — F-038): ghi submittedAt/submittedBy qua
     * {@link InfrastructureApprovalService#submit} (Rule 14: cấp Cục submit → thẳng APPROVED_LEVEL1).
     */
    @Transactional
    public NavigationChannelResponse submit(UUID id, UUID userId) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        approvalService.submit(nc, InfrastructureType.NAVIGATION_CHANNEL, userId);
        return toResponse(repo.save(nc));
    }

    @Transactional
    public ApprovalResponse approveC1(UUID id, ApprovalRequest req, UUID approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        approvalService.approveC1(nc, InfrastructureType.NAVIGATION_CHANNEL, req.getStatus(), req.getReason(), approvedBy);
        repo.save(nc);
        return buildApprovalResponse(nc, 1);
    }

    @Transactional
    public ApprovalResponse approveC2(UUID id, ApprovalRequest req, UUID approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        approvalService.approveC2(nc, InfrastructureType.NAVIGATION_CHANNEL, req.getStatus(), req.getReason(), approvedBy);
        repo.save(nc);
        return buildApprovalResponse(nc, 2);
    }

    /** Trả về cấp 1 (mới — endpoint /reject-level-1) — luôn reject ở LEVEL_1 bất kể payload. */
    @Transactional
    public ApprovalResponse rejectLevel1(UUID id, ApprovalRequest req, UUID userId) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        approvalService.approveC1(nc, InfrastructureType.NAVIGATION_CHANNEL, ApprovalStatus.REJECTED.name(), req.getReason(), userId);
        repo.save(nc);
        return buildApprovalResponse(nc, 1);
    }

    /** Trả về cấp 2 (mới — endpoint /reject-level-2) — luôn reject ở LEVEL_2 bất kể payload. */
    @Transactional
    public ApprovalResponse rejectLevel2(UUID id, ApprovalRequest req, UUID userId) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        approvalService.approveC2(nc, InfrastructureType.NAVIGATION_CHANNEL, ApprovalStatus.REJECTED.name(), req.getReason(), userId);
        repo.save(nc);
        return buildApprovalResponse(nc, 2);
    }

    private ApprovalResponse buildApprovalResponse(NavigationChannel nc, Integer cap) {
        return ApprovalResponse.builder()
                .id(String.valueOf(nc.getId()))
                .navigationChannelId(nc.getId())
                .approvalLevel(ApprovalLevel.fromInt(cap))
                .status(nc.getApprovalStatus().name())
                .approvedBy(cap == 1 ? nc.getApproverLevel1() : nc.getApproverLevel2())
                .approvedDate(cap == 1 ? nc.getApprovedDateLevel1() : nc.getApprovedDateLevel2())
                .reason(nc.getRejectionReason())
                .build();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        // F-043 (QA CHANGES-REQUESTED): existence + org-unit data scope — repo.findById đi qua
        // @Filter(orgUnitFilter) (được bật bởi @DataScope ở controller), nên hồ sơ không tồn tại /
        // đã xóa mềm / ngoài phạm vi đơn vị → orElseThrow → 400-family thay vì trả [] (AC-043-04/06).
        repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        List<InfrastructureHistory> history = approvalHistoryRepo
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.NAVIGATION_CHANNEL, id);
        Set<UUID> userIds = history.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNames = resolveUserNames(userIds);

        return history.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .navigationChannelId(h.getRefId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approvedBy(h.getApprovedBy() != null
                        ? userNames.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString())
                        : null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .build()).collect(Collectors.toList());
    }

    private Map<UUID, String> resolveUserNames(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (nonNullIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<com.hanghai.kchtg.user.entity.User> users = userRepository.findAllByIdInWithOrgUnit(nonNullIds);
        Map<UUID, String> map = new java.util.HashMap<>();
        for (com.hanghai.kchtg.user.entity.User u : users) {
            String userStr = (u.getFullName() != null && !u.getFullName().trim().isEmpty())
                    ? u.getFullName()
                    : u.getUsername();
            map.put(u.getId(), userStr);
        }
        return map;
    }

    private String resolveUserName(UUID userId) {
        if (userId == null)
            return null;
        Map<UUID, String> map = resolveUserNames(Collections.singletonList(userId));
        return map.getOrDefault(userId, userId.toString());
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getApprovalHistory(UUID id) {
        return getHistory(id);
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findByApprovalStatus(ApprovalStatus s) {
        return repo.findByApprovalStatusAndDeletedAtIsNull(s)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> searchByChannelNameContaining(String kw) {
        return repo.findByChannelNameContainingAndDeletedAtIsNull(kw)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String statusStr, int page, int size) {
        ApprovalStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                status = ApprovalStatus.valueOf(statusStr.trim());
            } catch (IllegalArgumentException e) {
                log.debug("Bỏ qua bộ lọc trạng thái không hợp lệ: {}", statusStr);
            }
        }
        String keywordLike = (kw != null && !kw.trim().isEmpty()) ? "%" + kw.trim().toLowerCase() + "%" : null;
        Page<NavigationChannel> r = repo.searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus,
                keywordLike, status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)));
        return SearchResultResponse.builder()
                .results(r.getContent().stream().map(nc -> toResponse(nc, false)).collect(Collectors.toList()))
                .totalElements(r.getTotalElements())
                .totalPages(r.getTotalPages())
                .currentPage(r.getNumber())
                .pageSize(r.getSize())
                .build();
    }

    private NavigationChannelResponse toResponse(NavigationChannel nc) {
        return toResponse(nc, true);
    }

    private NavigationChannelResponse toResponse(NavigationChannel nc, boolean includeDetails) {
        List<NavigationChannelAttachmentResponse> atts = includeDetails
                ? attachmentRepository
                        .findByRefIdAndRefTypeOrderByUploadedDateDesc(nc.getId(), InfrastructureType.NAVIGATION_CHANNEL)
                        .stream()
                        .map(a -> NavigationChannelAttachmentResponse.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .filePath(a.getFilePath())
                                .fileSize(a.getFileSize())
                                .uploadDate(a.getUploadedDate() != null ? a.getUploadedDate().toLocalDate() : null)
                                .build())
                        .collect(Collectors.toList())
                : null;

        List<ApprovalResponse> hist = null;
        if (includeDetails) {
            try {
                List<InfrastructureHistory> histories = approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.NAVIGATION_CHANNEL, nc.getId());
                hist = histories.stream()
                        .map(h -> ApprovalResponse.builder()
                                .id(String.valueOf(h.getId()))
                                .navigationChannelId(h.getRefId())
                                .approvalLevel(h.getApprovalLevel())
                                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                                .approvedBy(h.getApprovedBy())
                                .approvedDate(h.getApprovedDate())
                                .reason(h.getReason())
                                .build())
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Could not load infrastructureHistory for navigation channel {}: {}", nc.getId(), e.getMessage());
                hist = new ArrayList<>();
            }
        }

        GisGeometryType geomType = null;
        String coords = null;
        if (nc.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(nc.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        List<ChannelRouteDetailResponse> routeDetailList = (includeDetails && nc.getChannelRouteDetailList() != null)
                ? nc.getChannelRouteDetailList().stream()
                        .map(this::toRouteDetailResponse)
                        .collect(Collectors.toList())
                : (includeDetails ? new ArrayList<>() : null);

        List<NavigationChannelCoordinateResponse> coordinateList =
                (includeDetails && nc.getCoordinates() != null)
                        ? nc.getCoordinates().stream()
                                .map(c -> NavigationChannelCoordinateResponse.builder()
                                        .id(c.getId())
                                        .sequenceNo(c.getSequenceNo())
                                        .longitude(c.getLongitude())
                                        .latitude(c.getLatitude())
                                        .build())
                                .collect(Collectors.toList())
                        : (includeDetails ? new ArrayList<>() : null);

        String resolvedOrgUnitName = resolveOrgUnitName(nc.getOrgUnitId());

        return NavigationChannelResponse.builder()
                .id(nc.getId())
                .channelName(nc.getChannelName())
                .channelCode(nc.getChannelCode())
                .seaportId(nc.getSeaportId())
                .operatingUnitId(nc.getOperatingUnitId())
                .conditionStatus(nc.getConditionStatus())
                .detailedLocation(nc.getDetailedLocation())
                .managementStation(nc.getManagementStation())
                .stationCount(nc.getStationCount())
                .stationStaffCount(nc.getStationStaffCount())
                .stationAreaSquareMeters(nc.getStationAreaSquareMeters())
                .latestStationRepairMonth(nc.getLatestStationRepairMonth())
                .latestMaintenanceYear(nc.getLatestMaintenanceYear())
                .latestDredgingVolumeCubicMeters(nc.getLatestDredgingVolumeCubicMeters())
                .buoyCount(nc.getBuoyCount())
                .beaconCount(nc.getBeaconCount())
                .notes(nc.getNotes())
                .announcementDecisionNumber(nc.getAnnouncementDecisionNumber())
                .announcementDecisionDate(nc.getAnnouncementDecisionDate())
                .announcementDecisionIssuer(nc.getAnnouncementDecisionIssuer())
                .protectionScopeMeters(nc.getProtectionScopeMeters())
                .protectionNotes(nc.getProtectionNotes())
                .geometryType(geomType != null ? geomType : nc.getGeometryType())
                .mapIconId(nc.getMapIconId())
                .coordinateReferenceSystem(nc.getCoordinateReferenceSystem())
                .displayRule(nc.getDisplayRule())
                .coordinateList(coordinateList)
                .spatialId(nc.getSpatialId())
                .coordinates(coords)
                .attachments(atts)
                .routeDetails(routeDetailList)
                .orgUnitId(nc.getOrgUnitId())
                .orgUnitName(resolvedOrgUnitName)
                .provinceId(nc.getProvinceId())
                .approvalStatus(nc.getApprovalStatus())
                .submittedAt(nc.getSubmittedAt())
                .submittedBy(nc.getSubmittedBy())
                .approverLevel1(nc.getApproverLevel1())
                .approvedDateLevel1(nc.getApprovedDateLevel1())
                .level1ApprovalContent(nc.getLevel1ApprovalContent())
                .approverLevel2(nc.getApproverLevel2())
                .approvedDateLevel2(nc.getApprovedDateLevel2())
                .level2ApprovalContent(nc.getLevel2ApprovalContent())
                .rejectionReason(nc.getRejectionReason())
                .createdAt(nc.getCreatedAt())
                .updatedAt(nc.getUpdatedAt())
                .deletedAt(nc.getDeletedAt())
                .createdBy(nc.getCreatedBy())
                .updatedBy(nc.getUpdatedBy())
                .deletedBy(nc.getDeletedBy())
                .approvalHistory(hist)
                .history(null)
                .build();
    }

    private ChannelRouteDetailResponse toRouteDetailResponse(ChannelRouteDetail ct) {
        return ChannelRouteDetailResponse.builder()
                .id(ct.getId())
                .sequenceNo(ct.getSequenceNo())
                .routeClassification(ct.getRouteClassification())
                .routeCode(ct.getRouteCode())
                .routeName(ct.getRouteName())
                .routeType(ct.getRouteType())
                .turningBasinLocation(ct.getTurningBasinLocation())
                .turningBasinRadiusMeters(ct.getTurningBasinRadiusMeters())
                .verticalClearanceMeters(ct.getVerticalClearanceMeters())
                .channelLengthKilometers(ct.getChannelLengthKilometers())
                .maximumDesignWidthMeters(ct.getMaximumDesignWidthMeters())
                .minimumDesignWidthMeters(ct.getMinimumDesignWidthMeters())
                .designDepthMeters(ct.getDesignDepthMeters())
                .currentDepthMeters(ct.getCurrentDepthMeters())
                .designSlope(ct.getDesignSlope())
                .minimumCurveRadiusMeters(ct.getMinimumCurveRadiusMeters())
                .routeLatestDredgingVolumeCubicMeters(ct.getRouteLatestDredgingVolumeCubicMeters())
                .routeLatestMaintenanceYear(ct.getRouteLatestMaintenanceYear())
                .routeGrade(ct.getRouteGrade())
                .build();
    }

    private String resolveOrgUnitName(UUID orgUnitId) {
        return orgUnitCacheService.getName(orgUnitId);
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON)
            return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_SHIPPING_ROUTE;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Tự sinh channelCode prefix LHH (chốt a3): count + 1 theo orgUnitId. */
    private String generateChannelCode(UUID orgUnitId) {
        long count = repo.countByOrgUnitId(orgUnitId);
        return CHANNEL_CODE_PREFIX + String.format("%06d", count + 1);
    }

    /** Gắn bảng con route details (#22-#38), coordinates (#45), attachments (#46) cùng transaction. */
    private void attachChildren(NavigationChannel nc, List<ChannelRouteDetailRequest> routeDetails,
            List<NavigationChannelCoordinateRequest> coordinateList,
            List<NavigationChannelAttachmentRequest> attachments, UUID userId) {
        if (routeDetails != null) {
            for (int i = 0; i < routeDetails.size(); i++) {
                nc.getChannelRouteDetailList().add(toRouteDetail(routeDetails.get(i), nc, i));
            }
        }
        if (coordinateList != null) {
            coordinateList.stream()
                    .map(c -> toCoordinate(c, nc))
                    .forEach(nc.getCoordinates()::add);
        }
        if (attachments != null && nc.getId() != null) {
            saveAttachments(nc.getId(), attachments, userId);
        }
    }

    private ChannelRouteDetail toRouteDetail(ChannelRouteDetailRequest d, NavigationChannel nc, int index) {
        // BR-038-03: routeCode (#23) tự sinh server-side từ channelCode + sequenceNo (không nhận từ client);
        // sequenceNo null → lấy vị trí dòng + 1 để routeCode không bao giờ NULL.
        Integer sequenceNo = d.getSequenceNo();
        if (sequenceNo == null) {
            sequenceNo = index + 1;
        }
        return ChannelRouteDetail.builder()
                .navigationChannel(nc)
                .sequenceNo(sequenceNo)
                .routeCode(nc.getChannelCode() + "-" + String.format("%02d", sequenceNo))
                .routeClassification(trimToNull(d.getRouteClassification()))
                .routeName(trimToNull(d.getRouteName()))
                .routeType(d.getRouteType())
                .turningBasinLocation(trimToNull(d.getTurningBasinLocation()))
                .turningBasinRadiusMeters(d.getTurningBasinRadiusMeters())
                .verticalClearanceMeters(d.getVerticalClearanceMeters())
                .channelLengthKilometers(d.getChannelLengthKilometers())
                .maximumDesignWidthMeters(d.getMaximumDesignWidthMeters())
                .minimumDesignWidthMeters(d.getMinimumDesignWidthMeters())
                .designDepthMeters(d.getDesignDepthMeters())
                .currentDepthMeters(d.getCurrentDepthMeters())
                .designSlope(d.getDesignSlope())
                .minimumCurveRadiusMeters(d.getMinimumCurveRadiusMeters())
                .routeLatestDredgingVolumeCubicMeters(d.getRouteLatestDredgingVolumeCubicMeters())
                .routeLatestMaintenanceYear(d.getRouteLatestMaintenanceYear())
                .routeGrade(d.getRouteGrade())
                .build();
    }

    private NavigationChannelCoordinate toCoordinate(NavigationChannelCoordinateRequest c, NavigationChannel nc) {
        return NavigationChannelCoordinate.builder()
                .navigationChannel(nc)
                .sequenceNo(c.getSequenceNo())
                .longitude(c.getLongitude())
                .latitude(c.getLatitude())
                .build();
    }

    private void saveAttachments(UUID refId, List<NavigationChannelAttachmentRequest> attachments, UUID userId) {
        for (NavigationChannelAttachmentRequest a : attachments) {
            if (a.getFileName() == null || a.getFileName().trim().isEmpty()) {
                continue;
            }
            attachmentRepository.save(InfrastructureAttachment.builder()
                    .refId(refId)
                    .refType(InfrastructureType.NAVIGATION_CHANNEL)
                    .fileName(a.getFileName().trim())
                    .filePath(a.getFilePath() != null ? a.getFilePath().trim() : null)
                    .fileSize(a.getFileSize())
                    .fileType(a.getFileType())
                    .uploadedBy(userId)
                    .build());
        }
    }

    /** Trim chuỗi; chuỗi rỗng sau trim → null (BR-038-05). */
    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    // ── F-039 D3: helpers định dạng diff / history UPDATED ──────────────────

    private String formatRouteDetails(List<?> routeDetails) {
        if (routeDetails == null || routeDetails.isEmpty()) {
            return "Chưa có";
        }
        return routeDetails.stream().map(d -> {
            if (d instanceof ChannelRouteDetail e) {
                return routeDetailFields(e.getSequenceNo(), e.getRouteClassification(), e.getRouteName(),
                        e.getRouteType(), e.getTurningBasinLocation(), e.getTurningBasinRadiusMeters(),
                        e.getVerticalClearanceMeters(), e.getChannelLengthKilometers(),
                        e.getMaximumDesignWidthMeters(), e.getMinimumDesignWidthMeters(), e.getDesignDepthMeters(),
                        e.getCurrentDepthMeters(), e.getDesignSlope(), e.getMinimumCurveRadiusMeters(),
                        e.getRouteLatestDredgingVolumeCubicMeters(), e.getRouteLatestMaintenanceYear(),
                        e.getRouteGrade());
            }
            if (d instanceof ChannelRouteDetailRequest r) {
                return routeDetailFields(r.getSequenceNo(), r.getRouteClassification(), r.getRouteName(),
                        r.getRouteType(), r.getTurningBasinLocation(), r.getTurningBasinRadiusMeters(),
                        r.getVerticalClearanceMeters(), r.getChannelLengthKilometers(),
                        r.getMaximumDesignWidthMeters(), r.getMinimumDesignWidthMeters(), r.getDesignDepthMeters(),
                        r.getCurrentDepthMeters(), r.getDesignSlope(), r.getMinimumCurveRadiusMeters(),
                        r.getRouteLatestDredgingVolumeCubicMeters(), r.getRouteLatestMaintenanceYear(),
                        r.getRouteGrade());
            }
            return String.valueOf(d);
        }).collect(Collectors.joining("; "));
    }

    private String routeDetailFields(Integer sequenceNo, String routeClassification, String routeName,
            Integer routeType, String turningBasinLocation, BigDecimal turningBasinRadiusMeters,
            BigDecimal verticalClearanceMeters, BigDecimal channelLengthKilometers,
            BigDecimal maximumDesignWidthMeters, BigDecimal minimumDesignWidthMeters, BigDecimal designDepthMeters,
            BigDecimal currentDepthMeters, BigDecimal designSlope, BigDecimal minimumCurveRadiusMeters,
            BigDecimal routeLatestDredgingVolumeCubicMeters, Integer routeLatestMaintenanceYear, Integer routeGrade) {
        return String.join("|",
                String.valueOf(sequenceNo),
                nullToEmpty(routeClassification),
                nullToEmpty(routeName),
                String.valueOf(routeType),
                nullToEmpty(turningBasinLocation),
                String.valueOf(turningBasinRadiusMeters),
                String.valueOf(verticalClearanceMeters),
                String.valueOf(channelLengthKilometers),
                String.valueOf(maximumDesignWidthMeters),
                String.valueOf(minimumDesignWidthMeters),
                String.valueOf(designDepthMeters),
                String.valueOf(currentDepthMeters),
                String.valueOf(designSlope),
                String.valueOf(minimumCurveRadiusMeters),
                String.valueOf(routeLatestDredgingVolumeCubicMeters),
                String.valueOf(routeLatestMaintenanceYear),
                String.valueOf(routeGrade));
    }

    private String formatCoordinateList(List<?> coordinateList) {
        if (coordinateList == null || coordinateList.isEmpty()) {
            return "Chưa có";
        }
        return coordinateList.stream().map(c -> {
            if (c instanceof NavigationChannelCoordinate e) {
                return e.getSequenceNo() + "|" + e.getLongitude() + "|" + e.getLatitude();
            }
            if (c instanceof NavigationChannelCoordinateRequest r) {
                return r.getSequenceNo() + "|" + r.getLongitude() + "|" + r.getLatitude();
            }
            return String.valueOf(c);
        }).collect(Collectors.joining("; "));
    }

    private String formatAttachment(String fileName, String filePath) {
        return (fileName == null ? "" : fileName.trim()) + "|" + (filePath == null ? "" : filePath.trim());
    }

    private String nullToEmpty(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private String getFieldDisplayName(String field) {
        if (field == null) return "";
        if (NavigationChannelUpdateRequest.Fields.channelName.equals(field)) return "Tên luồng hàng hải";
        if (NavigationChannelUpdateRequest.Fields.conditionStatus.equals(field)) return "Tình trạng";
        if (NavigationChannelUpdateRequest.Fields.orgUnitId.equals(field)) return "Đơn vị quản lý";
        if (NavigationChannelUpdateRequest.Fields.detailedLocation.equals(field)) return "Vị trí chi tiết";
        if (NavigationChannelUpdateRequest.Fields.managementStation.equals(field)) return "Trạm quản lý";
        if (NavigationChannelUpdateRequest.Fields.notes.equals(field)) return "Ghi chú";
        if (NavigationChannelUpdateRequest.Fields.routeDetails.equals(field)) return "Chi tiết tuyến luồng";
        if (NavigationChannelUpdateRequest.Fields.coordinateList.equals(field)) return "Danh sách tọa độ";
        if (NavigationChannelUpdateRequest.Fields.attachments.equals(field)) return "Tài liệu đính kèm";
        if (NavigationChannelUpdateRequest.Fields.coordinates.equals(field)) return "Tọa độ GIS";
        return field;
    }

    private String formatChangedFields(Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(this::getFieldDisplayName)
                .collect(Collectors.joining(", "));
    }

    private String formatPreviousValues(Map<String, String> previousValues) {
        return previousValues.entrySet().stream()
                .map(entry -> getFieldDisplayName(entry.getKey()) + "=" + entry.getValue())
                .collect(Collectors.joining("; "));
    }

    private String formatNewValues(NavigationChannel entity, Map<String, String> previousValues,
            Map<String, String> manualNewValues) {
        return previousValues.keySet().stream()
                .map(field -> getFieldDisplayName(field) + "="
                        + (manualNewValues.containsKey(field)
                                ? manualNewValues.get(field)
                                : currentFieldValue(entity, field)))
                .collect(Collectors.joining("; "));
    }

    /** Đọc giá trị hiện tại của field trên entity (sau update) — fallback "" khi không đọc được. */
    private String currentFieldValue(NavigationChannel entity, String field) {
        if (entity == null || field == null) return "";
        Class<?> current = entity.getClass();
        while (current != null && current != Object.class) {
            try {
                Field declared = current.getDeclaredField(field);
                declared.setAccessible(true);
                Object value = declared.get(entity);
                return value != null ? String.valueOf(value) : "";
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            } catch (IllegalAccessException e) {
                return "";
            }
        }
        return "";
    }
}
