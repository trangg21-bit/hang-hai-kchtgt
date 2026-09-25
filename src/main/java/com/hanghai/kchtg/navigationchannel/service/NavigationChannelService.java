package com.hanghai.kchtg.navigationchannel.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.navigationchannel.dto.*;
import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelCoordinate;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hanghai.kchtg.common.enums.AttachmentFileType;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for NavigationChannel (F-038 to F-043).
 * <p>
 * Write-scope: every create/update validates the target orgUnitId against the current user's
 * {@link OrgUnitScopeService.Scope} (BR-038-04) — out-of-scope assignment throws 403.
 * Codegen: channelCode prefix {@code LHH-} + %06d per orgUnitId (chốt a3); a duplicate-code
 * collision (unique index ux_navigation_channel_org_code) is retried with fresh next sequence.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NavigationChannelService {

    private static final String CHANNEL_CODE_PREFIX = "LHH-";

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

        // BR-038-04: đơn vị quản lý phải nằm trong phạm vi được phân quyền (write-scope).
        //
        // Field 'Đơn vị quản lý' để trống KHÔNG phải lỗi phân quyền: trước đây allows(null) = false
        // nên mọi thao tác GHI hợp lệ của tài khoản bị giới hạn phạm vi đều bị chặn bằng 403 rỗng
        // body (UI chỉ hiện toast quyền chung). Nay thiếu orgUnitId thì fallback về đơn vị của người
        // thao tác; CHỈ ném 403 khi request GỬI đơn vị cụ thể nhưng đơn vị đó ngoài phạm vi.
        UUID effectiveOrgUnitId = req.getOrgUnitId() != null
                ? req.getOrgUnitId()
                : resolveOperatorOrgUnitId(userId);
        if (req.getOrgUnitId() != null && !orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())) {
            throw new IllegalArgumentException(
                    "Đơn vị quản lý không thuộc phạm vi đơn vị được phép sử dụng");
        }
        if (!orgUnitRepository.existsById(effectiveOrgUnitId)) {
            throw new IllegalArgumentException("Không tìm thấy đơn vị với id: " + effectiveOrgUnitId);
        }

        ApprovalStatus initialStatus = req.getApprovalStatus() != null ? req.getApprovalStatus() : ApprovalStatus.DRAFT;
        boolean submitForApproval = req.isSubmitForApproval();
        if (submitForApproval && initialStatus == ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể vừa gửi phê duyệt vừa phê duyệt trực tiếp");
        }
        if (initialStatus == ApprovalStatus.APPROVED) {
            approvalService.requireApproveC2Permission(userId, "navigationchannel:approvec2");
        }

        NavigationChannel nc = NavigationChannel.builder()
                .channelName(trimToNull(req.getChannelName()))
                .seaportId(req.getSeaportId())
                .operatingUnitId(req.getOperatingUnitId())
                .conditionStatus(req.getConditionStatus() != null ? req.getConditionStatus() : ConditionStatus.NOT_YET_OPERATIONAL)
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
                .orgUnitId(effectiveOrgUnitId)
                .provinceId(req.getProvinceId())
                // F-038: trạng thái mặc định DRAFT (hoặc APPROVED nếu có thẩm quyền tạo và duyệt)
                .approvalStatus(initialStatus)
                .build();

        String generatedCode = generateChannelCode(effectiveOrgUnitId);
        nc.setChannelCode(generatedCode);
        LocalDateTime now = LocalDateTime.now();
        if (nc.getCreatedAt() == null) {
            nc.setCreatedAt(now);
        }
        nc.setUpdatedAt(now);
        nc = repo.save(nc);

        // Retry nếu unique index ux_navigation_channel_org_code chặn code trùng do tương tác đồng thời
        try {
            attachChildren(nc, req.getRouteDetails(), req.getCoordinateList(), req.getAttachments(), userId);
            nc = repo.save(nc);
        } catch (DataIntegrityViolationException e) {
            log.warn("channel_code collision detected for orgUnitId={}, regenerating code", effectiveOrgUnitId);
            nc.setChannelCode(generateChannelCode(effectiveOrgUnitId));
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

        if (submitForApproval) {
            approvalService.submit(nc, InfrastructureType.NAVIGATION_CHANNEL, userId);
            nc = repo.save(nc);
        }
        if (initialStatus == ApprovalStatus.APPROVED) {
            approvalService.recordSaveAndApprove(
                    nc,
                    InfrastructureType.NAVIGATION_CHANNEL,
                    "Create and approve directly",
                    userId);
            nc = repo.save(nc);
        }

        // F-043: ghi history CREATED sau khi create thành công (cùng transaction với toàn bộ create)
        approvalHistoryRepo.save(InfrastructureHistory.builder()
                .refId(nc.getId())
                .refType(InfrastructureType.NAVIGATION_CHANNEL)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedBy(userId)
                .build());

        return toResponse(nc);
    }

    /** Tạo và phê duyệt trong một transaction để không để lại bản ghi khi C2 bị từ chối. */
    @Transactional
    public NavigationChannelResponse createAndApprove(NavigationChannelCreateRequest req, UUID userId) {
        req.setApprovalStatus(ApprovalStatus.APPROVED);
        return create(req, userId);
    }

    @Transactional(readOnly = true)
    public NavigationChannelResponse getById(UUID id) {
        return toResponse(repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id)));
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findAll() {
        return repo.findByDeletedAtIsNull(Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT))
                .stream().map(nc -> toResponse(nc, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<NavigationChannelResponse> findAll(int page, int size) {
        return repo
                .findByDeletedAtIsNull(
                        PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)))
                .map(nc -> toResponse(nc, false));
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
            java.util.Collection<UUID> orgUnitIds = orgUnitId != null
                    ? orgUnitScopeService.resolveSubtreeIds(orgUnitId)
                    : null;
            results = orgUnitIds != null
                    ? repo.searchDocumentsByOrgUnitIds(orgUnitIds, null, null, null, toKeywordLike(keyword), null, approvalStatus, null, null,
                            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT)))
                    : repo.searchDocuments(null, null, null, null, toKeywordLike(keyword), null, approvalStatus, null, null,
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

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9 - T12 "Lưu và phê duyệt"):
        // Hồ sơ Đã duyệt chỉ được phép sửa bởi người có quyền phê duyệt cấp Cục (approvec2).
        boolean isApprovedFlow = (currentStatus == ApprovalStatus.APPROVED || currentStatus == ApprovalStatus.APPROVED_LEVEL2);
        if (isApprovedFlow || req.getApprovalStatus() == ApprovalStatus.APPROVED) {
            approvalService.requireApproveC2Permission(updatedBy, "navigationchannel:approvec2");
        }

        // BR-038-04: nếu đổi đơn vị quản lý phải nằm trong phạm vi được phân quyền
        if (req.getOrgUnitId() != null && !Objects.equals(req.getOrgUnitId(), nc.getOrgUnitId())
                && !orgUnitScopeService.currentUserScope().allows(req.getOrgUnitId())) {
            throw new IllegalArgumentException(
                    "Đơn vị quản lý không thuộc phạm vi đơn vị được phép sử dụng");
        }
        // Field 'Đơn vị quản lý' để trống ⇒ giữ đơn vị hiện có của bản ghi. Bản ghi cũ tạo trước khi
        // có DataScope đang để org_unit_id NULL thì gán bù đơn vị người thao tác — nhờ đó vẫn sửa được
        // và bản ghi thoát khỏi trạng thái NULL (trước đây NULL vĩnh viễn vì nhánh copy bên dưới chỉ
        // chạy khi req.getOrgUnitId() != null). Cố ý dùng bản KHÔNG ném lỗi: một bản ghi cũ thiếu đơn
        // vị không được phép làm hỏng thao tác cập nhật; nếu không resolve được thì giữ nguyên và để
        // migration backfill xử lý.
        if (req.getOrgUnitId() == null && nc.getOrgUnitId() == null) {
            UUID operatorOrgUnitId = resolveOperatorOrgUnitIdOrNull(updatedBy);
            if (operatorOrgUnitId != null) {
                nc.setOrgUnitId(operatorOrgUnitId);
            }
        }
        if (nc.getChannelCode() == null || nc.getChannelCode().isBlank()) {
            nc.setChannelCode(generateChannelCode(nc.getOrgUnitId()));
        }

        // BR-039-08: chuẩn hóa trim trên REQUEST trước khi copy — payload chỉ khác khoảng trắng
        // so với giá trị đang lưu phải rơi vào nhánh no-op (giữ trạng thái, không ghi history).
        trimRequestStrings(req);

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
                        .toList();
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
        if (req.isFieldPresent("coordinates") || req.getCoordinates() != null) {
            if (req.getCoordinates() == null || req.getCoordinates().trim().isEmpty()) {
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
                        .map(sp -> !com.hanghai.kchtg.common.util.WktCoordinateUtils.coordinatesEqual(req.getCoordinates(), sp.getCoordinates()))
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

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9):
        // Hồ sơ Đã duyệt khi sửa qua "Lưu và phê duyệt" giữ nguyên trạng thái APPROVED và ghi nhận thông tin duyệt.
        // Hồ sơ Bị trả về sau khi sửa thì quay về Lưu tạm (DRAFT) để người nhập gửi lại.
        if (isApprovedFlow || req.getApprovalStatus() == ApprovalStatus.APPROVED) {
            approvalService.recordSaveAndApprove(
                    nc,
                    InfrastructureType.NAVIGATION_CHANNEL,
                    "Update and approve directly",
                    updatedBy);
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
        nc.setUpdatedAt(LocalDateTime.now());
        NavigationChannel saved = repo.save(nc);

        // F-039 D3: ghi history UPDATED sau save (cùng transaction) - lưu từng trường riêng biệt
        if (!previousValues.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            for (Map.Entry<String, String> entry : previousValues.entrySet()) {
                String field = entry.getKey();
                String oldVal = formatDisplayValue(field, entry.getValue());
                String rawNew = manualNewValues.containsKey(field)
                        ? manualNewValues.get(field)
                        : currentFieldValue(saved, field);
                String newVal = formatDisplayValue(field, rawNew);
                approvalHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.NAVIGATION_CHANNEL)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(updatedBy)
                        .approvedDate(now)
                        .changedField(field)
                        .previousValue(oldVal)
                        .newValue(newVal)
                        .build());
            }
        }
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
        nc.setApprovalStatus(ApprovalStatus.ARCHIVED);
        if (nc.getSpatialId() != null) {
            gisSpatialObjectService.delete(nc.getSpatialId());
        }
        repo.save(nc);
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
        nc.setUpdatedAt(LocalDateTime.now());
        approvalService.submit(nc, InfrastructureType.NAVIGATION_CHANNEL, userId);
        return toResponse(repo.save(nc));
    }

    @Transactional
    public NavigationChannelResponse directApprove(UUID id, UUID userId) {
        approvalService.requireApproveC2Permission(userId, "navigationchannel:approvec2");
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Navigation channel not found"));
        nc.setUpdatedAt(LocalDateTime.now());
        approvalService.recordSaveAndApprove(
                nc,
                InfrastructureType.NAVIGATION_CHANNEL,
                "Save and approve directly",
                userId);
        return toResponse(repo.save(nc));
    }

    @Transactional
    public ApprovalResponse approveC1(UUID id, ApprovalRequest req, UUID approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        nc.setUpdatedAt(LocalDateTime.now());
        approvalService.approveC1(nc, InfrastructureType.NAVIGATION_CHANNEL, req.getStatus(), req.getReason(), approvedBy);
        repo.save(nc);
        return buildApprovalResponse(nc, 1);
    }

    @Transactional
    public ApprovalResponse approveC2(UUID id, ApprovalRequest req, UUID approvedBy) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        nc.setUpdatedAt(LocalDateTime.now());
        approvalService.approveC2(nc, InfrastructureType.NAVIGATION_CHANNEL, req.getStatus(), req.getReason(), approvedBy);
        repo.save(nc);
        return buildApprovalResponse(nc, 2);
    }

    /** Trả về cấp 1 (mới — endpoint /reject-level-1) — luôn reject ở LEVEL_1 bất kể payload. */
    @Transactional
    public ApprovalResponse rejectLevel1(UUID id, ApprovalRequest req, UUID userId) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        nc.setUpdatedAt(LocalDateTime.now());
        approvalService.approveC1(nc, InfrastructureType.NAVIGATION_CHANNEL, ApprovalStatus.REJECTED.name(), req.getReason(), userId);
        repo.save(nc);
        return buildApprovalResponse(nc, 1);
    }

    /** Trả về cấp 2 (mới — endpoint /reject-level-2) — luôn reject ở LEVEL_2 bất kể payload. */
    @Transactional
    public ApprovalResponse rejectLevel2(UUID id, ApprovalRequest req, UUID userId) {
        NavigationChannel nc = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        nc.setUpdatedAt(LocalDateTime.now());
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
                .build();
    }

    // F-043: đường đọc nhật ký đã chuyển sang NavigationChannelHistoryService — endpoint
    // /{id}/history gọi historyService.getHistory(...). Các bản getHistory/getApprovalHistory tại
    // đây (trả DTO HistoryEntry rời rạc, không gộp phiên LEVEL_1/LEVEL_2) đã bị xoá để chỉ còn MỘT
    // đường lịch sử; xem docs/JOURNAL.md mục "P2: Luồng hàng hải có HAI đường lịch sử".

    /**
     * Chuẩn hóa từ khóa cho vế LIKE của truy vấn nhật ký — vế CSDL so với
     * {@code immutable_unaccent(LOWER(...))} nên từ khóa PHẢI bỏ dấu + lowercase,
     * nếu không gõ tiếng Việt có dấu (Đèn biển) hay chữ hoa sẽ không bao giờ khớp.
     * KHÔNG bọc `%` ở đây: repository tự CONCAT `%` quanh tham số.
     */
    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    public String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty() || "null".equalsIgnoreCase(rawValue) || "Chưa có".equals(rawValue)) {
            return null;
        }
        if (NavigationChannelUpdateRequest.Fields.coordinates.equals(field) || "coordinates".equals(field)) {
            return rawValue.trim();
        }
        if (NavigationChannelUpdateRequest.Fields.orgUnitId.equals(field) || "orgUnitId".equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (NavigationChannelUpdateRequest.Fields.conditionStatus.equals(field) || "conditionStatus".equals(field)) {
            if (ConditionStatus.OPERATIONAL.name().equals(rawValue)) return "Đang hoạt động";
            if (ConditionStatus.STOPPED.name().equals(rawValue)) return "Dừng hoạt động";
            if (ConditionStatus.MAINTENANCE.name().equals(rawValue)) return "Đang bảo trì";
            if (ConditionStatus.UNDER_CONSTRUCTION.name().equals(rawValue)) return "Đang xây dựng";
            return rawValue;
        }
        if ("geometryType".equals(field)) {
            if (GisGeometryType.POINT.name().equals(rawValue)) return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equals(rawValue) || "LINESTRING".equals(rawValue)) return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equals(rawValue)) return "Đối tượng vùng";
            return rawValue;
        }
        return rawValue;
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

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> findByApprovalStatus(ApprovalStatus s) {
        return repo.findByApprovalStatusAndDeletedAtIsNull(s)
                .stream().map(nc -> toResponse(nc, false)).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelResponse> searchByChannelNameContaining(String kw) {
        return repo.findByChannelNameContainingAndDeletedAtIsNull(kw)
                .stream().map(nc -> toResponse(nc, false)).collect(Collectors.toList());
    }

    private static String toKeywordLike(String keyword) {
        String normalized = normalizeSearchKeyword(keyword);
        return normalized == null ? null : "%" + normalized + "%";
    }

    public static Sort resolveSort(String sortBy, String sortDir) {
        Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) || "ascend".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "COALESCE(l.updatedAt, l.createdAt)")
                .and(JpaSort.unsafe(Sort.Direction.DESC, "l.createdAt"))
                .and(JpaSort.unsafe(Sort.Direction.ASC, "l.id"));
        if (sortBy == null || sortBy.isBlank()) {
            return defaultSort;
        }
        String field = sortBy.trim();
        String property;
        switch (field) {
            case "channelName":
            case "name":
                property = "LOWER(l.channelName)";
                break;
            case "channelCode":
            case "code":
                property = "LOWER(l.channelCode)";
                break;
            case "orgUnitId":
            case "orgUnitName":
            case "unitId":
            case "unitName":
                property = "LOWER(o.name)";
                break;
            case "seaportId":
            case "seaportName":
            case "portId":
            case "portName":
                property = "LOWER(p.portName)";
                break;
            case "operatingUnitId":
            case "operatingUnitName":
                property = "LOWER(op.name)";
                break;
            case "provinceId":
            case "provinceName":
            case "province":
                property = "LOWER(pv.name)";
                break;
            case "conditionStatus":
                property = "l.conditionStatus";
                break;
            case "approvalStatus":
            case "status":
                property = "l.approvalStatus";
                break;
            case "updatedAt":
            case "updatedBy":
            case "updatedByName":
                property = "COALESCE(l.updatedAt, l.createdAt)";
                break;
            case "submittedAt":
            case "submittedBy":
            case "submittedByName":
            case "submittedForApprovalAt":
            case "submittedForApprovalBy":
                property = "l.submittedAt";
                break;
            case "approvedDateLevel1":
            case "approverLevel1":
            case "approverLevel1Name":
            case "level1ApprovedAt":
            case "level1ApprovedBy":
            case "portAuthorityApprovedAt":
            case "portAuthorityApprovedBy":
                property = "l.approvedDateLevel1";
                break;
            case "approvedDateLevel2":
            case "approverLevel2":
            case "approverLevel2Name":
            case "level2ApprovedAt":
            case "level2ApprovedBy":
            case "departmentApprovedAt":
            case "departmentApprovedBy":
                property = "l.approvedDateLevel2";
                break;
            case "createdAt":
            case "createdBy":
                property = "l.createdAt";
                break;
            case "stationCount":
                property = "l.stationCount";
                break;
            case "buoyCount":
                property = "l.buoyCount";
                break;
            case "beaconCount":
                property = "l.beaconCount";
                break;
            default:
                property = null;
        }
        if (property == null) {
            return defaultSort;
        }
        return JpaSort.unsafe(direction, property).and(defaultSort);
    }

    private static LocalDateTime parseLocalDateTime(String value, boolean endOfDay) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            String v = value.trim();
            if (v.length() == 10) {
                return endOfDay ? LocalDate.parse(v).atTime(23, 59, 59, 999999000) : LocalDate.parse(v).atStartOfDay();
            }
            v = v.replace(" ", "T");
            return LocalDateTime.parse(v);
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String channelCode, String updatedFrom, String updatedTo) {
        String keywordLike = toKeywordLike(kw);
        String codeLike = toKeywordLike(channelCode);
        LocalDateTime fromDt = parseLocalDateTime(updatedFrom, false);
        LocalDateTime toDt = parseLocalDateTime(updatedTo, true);
        Collection<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : null;
        List<Object[]> rows = orgUnitIds != null
                ? repo.countByApprovalStatusByOrgUnitIds(orgUnitIds, seaportId, provinceId, conditionStatus, keywordLike, codeLike, fromDt, toDt)
                : repo.countByApprovalStatus(orgUnitId, seaportId, provinceId, conditionStatus, keywordLike, codeLike, fromDt, toDt);

        Map<String, Long> counts = new HashMap<>();
        counts.put("ALL", 0L);
        for (ApprovalStatus s : ApprovalStatus.values()) {
            counts.put(s.name(), 0L);
        }

        long total = 0;
        for (Object[] r : rows) {
            ApprovalStatus st = (ApprovalStatus) r[0];
            Long cnt = (Long) r[1];
            if (st != null && cnt != null) {
                counts.put(st.name(), cnt);
                total += cnt;
            }
        }
        counts.put("ALL", total);
        return counts;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String channelCode) {
        return countByStatus(orgUnitId, seaportId, provinceId, conditionStatus, kw, channelCode, null, null);
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String channelCode, String statusStr,
            String updatedFrom, String updatedTo, int page, int size,
            String sortBy, String sortDir) {
        ApprovalStatus status = null;
        if (statusStr != null && !statusStr.trim().isEmpty()) {
            try {
                status = ApprovalStatus.valueOf(statusStr.trim());
            } catch (IllegalArgumentException e) {
                log.debug("Bỏ qua bộ lọc trạng thái không hợp lệ: {}", statusStr);
            }
        }
        String keywordLike = toKeywordLike(kw);
        String codeLike = toKeywordLike(channelCode);
        LocalDateTime fromDt = parseLocalDateTime(updatedFrom, false);
        LocalDateTime toDt = parseLocalDateTime(updatedTo, true);
        Sort sort = resolveSort(sortBy, sortDir);
        Collection<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : null;
        Page<NavigationChannel> r = orgUnitIds != null
                ? repo.searchDocumentsByOrgUnitIds(orgUnitIds, seaportId, provinceId, conditionStatus,
                        keywordLike, codeLike, status, fromDt, toDt,
                        PageRequest.of(page, size, sort))
                : repo.searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus,
                        keywordLike, codeLike, status, fromDt, toDt,
                        PageRequest.of(page, size, sort));

        Map<String, Long> statusCounts = countByStatus(orgUnitId, seaportId, provinceId, conditionStatus, kw, channelCode, updatedFrom, updatedTo);

        return SearchResultResponse.builder()
                .results(r.getContent().stream().map(nc -> toResponse(nc, false)).collect(Collectors.toList()))
                .totalElements(r.getTotalElements())
                .totalPages(r.getTotalPages())
                .currentPage(r.getNumber())
                .pageSize(r.getSize())
                .statusCounts(statusCounts)
                .build();
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String channelCode, String statusStr, int page, int size,
            String sortBy, String sortDir) {
        return searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus, kw, channelCode, statusStr, null, null, page, size, sortBy, sortDir);
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String channelCode, String statusStr, int page, int size) {
        return searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus, kw, channelCode, statusStr, page, size, null, null);
    }

    @Transactional(readOnly = true)
    public SearchResultResponse searchDocuments(UUID orgUnitId, UUID seaportId, Integer provinceId,
            ConditionStatus conditionStatus, String kw, String statusStr, int page, int size) {
        return searchDocuments(orgUnitId, seaportId, provinceId, conditionStatus, kw, null, statusStr, page, size);
    }

    private NavigationChannelResponse toResponse(NavigationChannel nc) {
        return toResponse(nc, true);
    }

    private NavigationChannelResponse toResponse(NavigationChannel nc, boolean includeDetails) {
        List<NavigationChannelAttachmentResponse> atts = includeDetails
                ? attachmentRepository
                        .findByRefIdAndRefTypeOrderByUploadedDateDesc(nc.getId(), InfrastructureType.NAVIGATION_CHANNEL)
                        .stream()
                        .map(a -> toAttachmentResponse(a, resolveUserName(a.getUploadedBy())))
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
                                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                                .approvedBy(h.getApprovedBy())
                                .approvedDate(h.getApprovedDate())
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
                .approvalStatus(nc.getDeletedAt() != null ? ApprovalStatus.ARCHIVED : nc.getApprovalStatus())
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
                .protectionScope(ct.getProtectionScope())
                .memo(ct.getMemo())
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

    /** Tự sinh channelCode format chuẩn LHH-000001 (MAX(seq) + 1 theo orgUnitId, chống xung đột). */
    public synchronized String generateChannelCode(UUID orgUnitId) {
        List<String> codes = repo.findActiveChannelCodesByOrgUnitId(orgUnitId);
        int maxSeq = 0;
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^LHH-?(\\d+)$", java.util.regex.Pattern.CASE_INSENSITIVE);
        if (codes != null) {
            for (String code : codes) {
                if (code == null) continue;
                java.util.regex.Matcher m = pattern.matcher(code.trim());
                if (m.matches()) {
                    try {
                        int seq = Integer.parseInt(m.group(1));
                        if (seq > maxSeq) {
                            maxSeq = seq;
                        }
                    } catch (NumberFormatException ignored) {
                    }
                }
            }
        }
        int nextSeq = maxSeq + 1;
        String candidate = String.format("LHH-%06d", nextSeq);
        while (repo.existsActiveByOrgUnitIdAndChannelCode(orgUnitId, candidate)) {
            nextSeq++;
            candidate = String.format("LHH-%06d", nextSeq);
        }
        return candidate;
    }

    /**
     * Đơn vị của người thao tác — dùng làm fallback khi request không gửi orgUnitId.
     *
     * <p>Ném lỗi NGHIỆP VỤ (IllegalArgumentException → 400 kèm message tiếng Việt), KHÔNG ném
     * AccessDeniedException: tài khoản thiếu đơn vị không phải lỗi phân quyền, và 403 rỗng body
     * khiến UI chỉ hiện toast quyền chung mà không nói được người dùng cần làm gì.
     */
    private UUID resolveOperatorOrgUnitId(UUID userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Không xác định được người thao tác để gán đơn vị quản lý");
        }
        User operator = userRepository.findByIdWithRelations(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Không tìm thấy tài khoản người thao tác với id: " + userId));
        OrgUnit orgUnit = operator.getOrgUnit();
        if (orgUnit == null || orgUnit.getId() == null) {
            throw new IllegalArgumentException(
                    "Tài khoản của bạn chưa được gán đơn vị quản lý, vui lòng chọn đơn vị quản lý trước khi lưu");
        }
        return orgUnit.getId();
    }

    /**
     * Như {@link #resolveOperatorOrgUnitId(UUID)} nhưng trả {@code null} thay vì ném lỗi — dùng cho
     * nhánh gán bù khi CẬP NHẬT bản ghi cũ.
     *
     * <p>Tạo mới thì bắt buộc phải có đơn vị (ném lỗi để người dùng chọn), nhưng cập nhật một bản ghi
     * cũ đang thiếu đơn vị không được phép thất bại vì lý do đó.
     */
    private UUID resolveOperatorOrgUnitIdOrNull(UUID userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findByIdWithRelations(userId)
                .map(User::getOrgUnit)
                .map(OrgUnit::getId)
                .orElse(null);
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
                .protectionScope(d.getProtectionScope())
                .memo(trimToNull(d.getMemo()))
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
            String path = a.getFilePath() != null && !a.getFilePath().trim().isEmpty()
                    ? a.getFilePath().trim()
                    : "uploads/navigation-channel/" + refId + "/" + a.getFileName().trim();
            attachmentRepository.save(InfrastructureAttachment.builder()
                    .refId(refId)
                    .refType(InfrastructureType.NAVIGATION_CHANNEL)
                    .fileName(a.getFileName().trim())
                    .filePath(path)
                    .fileSize(a.getFileSize())
                    .fileType(a.getFileType() != null ? a.getFileType() : AttachmentFileType.OTHER)
                    .uploadedBy(userId)
                    .uploadedDate(LocalDateTime.now())
                    .build());
        }
    }

    private static final int MAX_ATTACHMENTS = 10;
    private static final long MAX_ATTACHMENT_SIZE = 20L * 1024 * 1024;
    private static final List<String> ALLOWED_ATTACHMENT_EXTS = List.of(
            "pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "tiff", "tif");

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được để trống");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được vượt quá 20MB theo quy định");
        }
        String filename = file.getOriginalFilename();
        if (filename == null || !filename.contains(".")) {
            throw new IllegalArgumentException("Định dạng file không hỗ trợ");
        }
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(java.util.Locale.ROOT);
        if (!ALLOWED_ATTACHMENT_EXTS.contains(ext)) {
            throw new IllegalArgumentException("Định dạng file không hỗ trợ");
        }
    }

    @Transactional
    public List<NavigationChannelAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        if (files == null || files.isEmpty()) {
            return List.of();
        }

        List<InfrastructureAttachment> currentAtts = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.NAVIGATION_CHANNEL);
        if (currentAtts.size() + files.size() > MAX_ATTACHMENTS) {
            throw new IllegalArgumentException("Số lượng tệp đính kèm tối đa là " + MAX_ATTACHMENTS + " tệp");
        }

        List<String> fileListBefore = currentAtts.stream()
                .map(InfrastructureAttachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        String oldFilesSummary = String.join(", ", fileListBefore);

        boolean isNewlyCreated = entity.getCreatedAt() != null
                && Math.abs(java.time.Duration.between(entity.getCreatedAt(), LocalDateTime.now()).toSeconds()) <= 30;
        boolean wasApproved = !isNewlyCreated
                && (ApprovalStatus.APPROVED.equals(entity.getApprovalStatus())
                    || ApprovalStatus.APPROVED_LEVEL2.equals(entity.getApprovalStatus()));

        for (MultipartFile file : files) {
            validateAttachment(file);
        }

        Path uploadDir = Paths.get("uploads", "navigation-channel", id.toString()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục lưu file đính kèm: " + e.getMessage(), e);
        }

        List<NavigationChannelAttachmentResponse> uploaded = new ArrayList<>();
        List<String> uploadedFileNames = new ArrayList<>();
        LocalDateTime batchNow = LocalDateTime.now();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment";
            String safePrefix = System.currentTimeMillis() + "_" + UUID.randomUUID().toString().substring(0, 8) + "_";
            String storageFileName = safePrefix + originalFilename;
            Path filePath = uploadDir.resolve(storageFileName);

            try {
                file.transferTo(filePath.toFile());
            } catch (IOException e) {
                throw new RuntimeException("Không thể lưu file đính kèm: " + originalFilename, e);
            }

            String relativePath = "uploads/navigation-channel/" + id + "/" + storageFileName;
            String ext = originalFilename.contains(".")
                    ? originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase(java.util.Locale.ROOT)
                    : "";
            AttachmentFileType fileType = AttachmentFileType.fromValue(ext);

            InfrastructureAttachment attachment = InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.NAVIGATION_CHANNEL)
                    .fileName(originalFilename)
                    .filePath(relativePath)
                    .fileSize(file.getSize())
                    .fileType(fileType)
                    .uploadedBy(userId)
                    .uploadedDate(batchNow)
                    .build();

            InfrastructureAttachment saved = attachmentRepository.save(attachment);
            uploaded.add(toAttachmentResponse(saved, resolveUserName(userId)));
            uploadedFileNames.add(originalFilename);
        }

        // Snapshot danh sách file sau khi upload
        List<String> fileListAfter = new ArrayList<>(fileListBefore);
        for (String fn : uploadedFileNames) {
            if (fn != null && !fn.isBlank() && !fileListAfter.contains(fn.trim())) {
                fileListAfter.add(fn.trim());
            }
        }
        String newFilesSummary = String.join(", ", fileListAfter);

        if (wasApproved && !uploadedFileNames.isEmpty()) {
            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            if (!Objects.equals(oldVal, newVal)) {
                approvalHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(id)
                        .refType(InfrastructureType.NAVIGATION_CHANNEL)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .changedField("Tài liệu đính kèm")
                        .approvalContent("Tải lên tệp: " + String.join(", ", uploadedFileNames))
                        .previousValue(oldVal != null ? oldVal : "—")
                        .newValue(newVal != null ? newVal : "—")
                        .build());
            }
        }

        return uploaded;
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelAttachmentResponse> listAttachments(UUID id) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));
        List<InfrastructureAttachment> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.NAVIGATION_CHANNEL);
        return attachments.stream()
                .map(a -> toAttachmentResponse(a, resolveUserName(a.getUploadedBy())))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        InfrastructureAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("File đính kèm không tồn tại: " + attachmentId));

        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.NAVIGATION_CHANNEL) {
            throw new IllegalArgumentException("File đính kèm không thuộc luồng hàng hải này");
        }

        List<InfrastructureAttachment> existingAtts = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.NAVIGATION_CHANNEL);
        String oldFilesSummary = existingAtts.stream()
                .map(InfrastructureAttachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        String newFilesSummary = existingAtts.stream()
                .filter(a -> !a.getId().equals(attachmentId))
                .map(InfrastructureAttachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        String fileName = att.getFileName();
        try {
            if (att.getFilePath() != null) {
                Path path = Paths.get(att.getFilePath()).toAbsolutePath().normalize();
                Files.deleteIfExists(path);
            }
        } catch (Exception ignored) {
        }

        attachmentRepository.delete(att);

        boolean wasApproved = entity != null
                && (ApprovalStatus.APPROVED.equals(entity.getApprovalStatus())
                    || ApprovalStatus.APPROVED_LEVEL2.equals(entity.getApprovalStatus()));
        if (wasApproved) {
            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            approvalHistoryRepo.save(InfrastructureHistory.builder()
                    .refId(id)
                    .refType(InfrastructureType.NAVIGATION_CHANNEL)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("Tài liệu đính kèm")
                    .approvalContent("Xóa tệp: " + fileName)
                    .previousValue(oldVal != null ? oldVal : "—")
                    .newValue(newVal != null ? newVal : "—")
                    .build());
        }
    }

    public InfrastructureAttachment getAttachment(UUID id, UUID attachmentId) {
        NavigationChannel entity = repo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy luồng hàng hải với id: " + id));

        InfrastructureAttachment att = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalArgumentException("File đính kèm không tồn tại: " + attachmentId));

        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.NAVIGATION_CHANNEL) {
            throw new IllegalArgumentException("File đính kèm không thuộc luồng hàng hải này");
        }
        return att;
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return "Cán bộ quản lý";
        return userRepository.findById(userId)
                .map(u -> (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getUsername())
                .orElse("Cán bộ quản lý");
    }

    private NavigationChannelAttachmentResponse toAttachmentResponse(InfrastructureAttachment a, String uploaderName) {
        return NavigationChannelAttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileUrl("/api/v1/navigation-channel/" + a.getRefId() + "/attachments/" + a.getId() + "/download")
                .fileSize(a.getFileSize())
                .fileType(a.getFileType() != null ? a.getFileType().getCode() : null)
                .contentType(a.getFileType() != null ? a.getFileType().name() : null)
                .uploadedBy(a.getUploadedBy())
                .uploadedByName(uploaderName)
                .uploadedDate(a.getUploadedDate())
                .uploadDate(a.getUploadedDate() != null ? a.getUploadedDate().toLocalDate() : null)
                .build();
    }

    /** Trim chuỗi; chuỗi rỗng sau trim → null (BR-038-05). */
    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * BR-039-08: chuẩn hóa trim 9 trường text của update request trước khi copy —
     * payload chỉ khác khoảng trắng so với giá trị đang lưu được coi là no-op.
     */
    private void trimRequestStrings(NavigationChannelUpdateRequest req) {
        if (req.getChannelName() != null) req.setChannelName(trimToNull(req.getChannelName()));
        if (req.getDetailedLocation() != null) req.setDetailedLocation(trimToNull(req.getDetailedLocation()));
        if (req.getManagementStation() != null) req.setManagementStation(trimToNull(req.getManagementStation()));
        if (req.getNotes() != null) req.setNotes(trimToNull(req.getNotes()));
        if (req.getAnnouncementDecisionNumber() != null) req.setAnnouncementDecisionNumber(trimToNull(req.getAnnouncementDecisionNumber()));
        if (req.getAnnouncementDecisionIssuer() != null) req.setAnnouncementDecisionIssuer(trimToNull(req.getAnnouncementDecisionIssuer()));
        if (req.getProtectionNotes() != null) req.setProtectionNotes(trimToNull(req.getProtectionNotes()));
        if (req.getCoordinateReferenceSystem() != null) req.setCoordinateReferenceSystem(trimToNull(req.getCoordinateReferenceSystem()));
        if (req.getDisplayRule() != null) req.setDisplayRule(trimToNull(req.getDisplayRule()));
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
                        e.getRouteGrade(), e.getProtectionScope(), e.getMemo());
            }
            if (d instanceof ChannelRouteDetailRequest r) {
                return routeDetailFields(r.getSequenceNo(), r.getRouteClassification(), r.getRouteName(),
                        r.getRouteType(), r.getTurningBasinLocation(), r.getTurningBasinRadiusMeters(),
                        r.getVerticalClearanceMeters(), r.getChannelLengthKilometers(),
                        r.getMaximumDesignWidthMeters(), r.getMinimumDesignWidthMeters(), r.getDesignDepthMeters(),
                        r.getCurrentDepthMeters(), r.getDesignSlope(), r.getMinimumCurveRadiusMeters(),
                        r.getRouteLatestDredgingVolumeCubicMeters(), r.getRouteLatestMaintenanceYear(),
                        r.getRouteGrade(), r.getProtectionScope(), r.getMemo());
            }
            return String.valueOf(d);
        }).collect(Collectors.joining("; "));
    }

    private String routeDetailFields(Integer sequenceNo, String routeClassification, String routeName,
            Integer routeType, String turningBasinLocation, BigDecimal turningBasinRadiusMeters,
            BigDecimal verticalClearanceMeters, BigDecimal channelLengthKilometers,
            BigDecimal maximumDesignWidthMeters, BigDecimal minimumDesignWidthMeters, BigDecimal designDepthMeters,
            BigDecimal currentDepthMeters, BigDecimal designSlope, BigDecimal minimumCurveRadiusMeters,
            BigDecimal routeLatestDredgingVolumeCubicMeters, Integer routeLatestMaintenanceYear, Integer routeGrade,
            BigDecimal protectionScope, String memo) {
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
                String.valueOf(routeGrade),
                String.valueOf(protectionScope),
                nullToEmpty(memo));
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

    @Transactional(readOnly = true)
    public List<NavigationChannelOptionResponse> getOptions() {
        return getOptions(null);
    }

    @Transactional(readOnly = true)
    public List<NavigationChannelOptionResponse> getOptions(UUID orgUnitId) {
        if (orgUnitId != null) {
            return repo.findOptionsByOrgUnitId(orgUnitId);
        }
        return repo.findAllOptions();
    }
}

