package com.hanghai.kchtg.vtssystem.service;

import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.dto.OrgUnitResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.entity.VtsZone;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemListProjection;
import com.hanghai.kchtg.vtssystem.repository.VtsZoneRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.text.Normalizer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import com.hanghai.kchtg.port.service.PortCacheService;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VtsSystemService {

    private record DataScopeContext(boolean enabled, List<UUID> orgUnitIds) {
    }

    private final VtsSystemRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final PortCacheService portCacheService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final VtsZoneRepository zoneRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.upload.attachment-path:uploads/vts-attachments}")
    private String attachmentUploadPath;

    public VtsSystemService(VtsSystemRepository repository,
            ApprovalHistoryRepository historyRepository,
            GisSpatialObjectService gisSpatialObjectService,
            OrgUnitCacheService orgUnitCacheService,
            PortCacheService portCacheService,
            InfrastructureAttachmentRepository attachmentRepository,
            VtsZoneRepository zoneRepository,
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.historyRepository = historyRepository;
        this.gisSpatialObjectService = gisSpatialObjectService;
        this.orgUnitCacheService = orgUnitCacheService;
        this.portCacheService = portCacheService;
        this.attachmentRepository = attachmentRepository;
        this.zoneRepository = zoneRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public VtsSystemResponse create(VtsSystemCreateRequest request, UUID userId) {
        validateCreateRequest(request);
        String normalizedCode = request.getCode().trim();
        if (repository.existsByCode(normalizedCode)) {
            throw new IllegalArgumentException("Mã hệ thống VTS đã tồn tại trong hệ thống");
        }
        VtsSystem entity = VtsSystem.builder()
                .systemName(request.getSystemName())
                .conditionStatus(request.getConditionStatus())
                .responsibilityLevel(request.getResponsibilityLevel())
                .source(request.getSource())
                .partner(request.getPartner())
                .orgUnitId(request.getOrgUnitId())
                .owningOrgId(request.getOwningOrgId())
                .operatingOrgId(request.getOperatingOrgId())
                .portId(request.getPortId())
                .scope(request.getScope())
                .note(request.getNote())
                .code(normalizedCode)
                .provinceId(request.getProvinceId())
                .address(request.getAddress())
                .maritimeNotice(request.getMaritimeNotice())
                .operationStartDate(request.getOperationStartDate())
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .build();

        if (request.getZones() != null && !request.getZones().isEmpty()) {
            entity.setZones(request.getZones().stream().map(dto -> {
                VtsZone z = new VtsZone();
                z.setCode(dto.getCode());
                z.setName(dto.getName());
                z.setConditionStatus(dto.getConditionStatus() != null ? dto.getConditionStatus() : ConditionStatus.OPERATIONAL);
                z.setCreatedBy(userId);
                z.setUpdatedBy(userId);
                z.setVtsSystem(entity);
                return z;
            }).collect(Collectors.toList()));
        }

        VtsSystem saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.POINT;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = saved.getId();
            String spatialName = "Hệ thống VTS " + request.getSystemName() +
                    (request.getAddress() != null && !request.getAddress().isBlank() ? " - " + request.getAddress() : "");
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    spatialName,
                    "VTS_" + saved.getId(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    refId,
                    InfrastructureType.VTS_SYSTEM);
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
        return toLightResponse(saved);
    }

    /**
     * Keep the create invariants enforced even when the service is called
     * without going through a controller (for example, from another backend
     * flow or a direct service test).
     */
    private void validateCreateRequest(VtsSystemCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dữ liệu tạo hệ thống VTS không được để trống");
        }
        if (request.getSystemName() == null || request.getSystemName().isBlank()) {
            throw new IllegalArgumentException("Tên hệ thống không được để trống");
        }
        if (request.getCode() == null || request.getCode().isBlank()) {
            throw new IllegalArgumentException("Mã hệ thống VTS không được để trống");
        }
        if (request.getOrgUnitId() == null) {
            throw new IllegalArgumentException("Đơn vị quản lý không được để trống");
        }
        if (request.getOwningOrgId() == null) {
            throw new IllegalArgumentException("Đơn vị chủ quản không được để trống");
        }
        if (request.getOperatingOrgId() == null) {
            throw new IllegalArgumentException("Đơn vị vận hành không được để trống");
        }
        if (request.getProvinceId() == null) {
            throw new IllegalArgumentException("Địa điểm (Tỉnh/TP) không được để trống");
        }
        if (request.getConditionStatus() == null) {
            throw new IllegalArgumentException("Tình trạng không được để trống");
        }
    }

    public VtsSystemResponse getById(UUID id) {
        return getById(id, true, true);
    }

    public VtsSystemResponse getById(UUID id, boolean includeZones, boolean includeAttachments) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return toResponse(entity, includeZones, includeAttachments);
    }

    public List<VtsZoneDto> getZones(UUID id) {
        ensureExists(id);
        List<VtsZoneDto> zones = zoneRepository.findByVtsSystemIdOrderByCreatedAtAsc(id).stream()
                .map(this::toZoneDto)
                .collect(Collectors.toList());
        return zones;
    }

    public List<VtsSystemAttachmentResponse> getAttachments(UUID id) {
        ensureExists(id);
        List<VtsSystemAttachmentResponse> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.VTS_SYSTEM).stream()
                .map(this::toAttachmentResponse)
                .collect(Collectors.toList());
        return attachments;
    }

    private void ensureExists(UUID id) {
        if (!repository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id);
        }
    }

    public List<VtsSystemResponse> findByApprovalStatus(ApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndIsDeletedFalse(approvalStatus).stream()
                .map(this::toLightResponse)
                .collect(Collectors.toList());
    }

    public Page<VtsSystemResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        return repository.findAll(pageable).map(this::toLightResponse);
    }

    @Transactional(readOnly = true)
    public List<OrgUnitResponse> getScopedOrgUnitOptions() {
        DataScopeContext scope = resolveDataScope();
        List<OrgUnitResponse> all = orgUnitCacheService.getList();
        if (!scope.enabled()) return all;
        return all.stream()
                .filter(unit -> scope.orgUnitIds().contains(unit.getId()))
                .toList();
    }

    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    private static String toKeywordLike(String keyword) {
        String normalized = normalizeSearchKeyword(keyword);
        if (normalized == null) {
            return null;
        }
        return "%" + normalized + "%";
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus, int page, int size) {
        return findAllWithSearch(orgUnitId, keyword, conditionStatus, approvalStatus, null, page, size);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus, Integer year, int page, int size) {
        DataScopeContext scope = resolveDataScope();
        String keywordLike = toKeywordLike(keyword);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        if (year == null) {
            return repository.search(scope.enabled(), scope.orgUnitIds(), orgUnitId, keywordLike,
                    conditionStatus, approvalStatus, pageable)
                    .map(this::toLightResponse);
        }
        LocalDateTime fromDate = LocalDateTime.of(year, Month.JANUARY, 1, 0, 0);
        LocalDateTime toDate = fromDate.plusYears(1);
        return repository
                .searchByCreatedDateRange(scope.enabled(), scope.orgUnitIds(), orgUnitId, keywordLike,
                        conditionStatus, approvalStatus, fromDate, toDate, pageable)
                .map(this::toLightResponse);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus, int page, int size) {
        return findAllWithSearchAndCounts(orgUnitId, keyword, conditionStatus, approvalStatus, null, page, size);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year, int page, int size) {
        return findAllWithSearchAndCounts(orgUnitId, keyword, conditionStatus, approvalStatus, year, page, size, true);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year, int page, int size,
            boolean includeCounts) {
        DataScopeContext scope = resolveDataScope();
        String keywordLike = toKeywordLike(keyword);
        Page<VtsSystemListItemResponse> pageResult = findAllListItems(orgUnitId, keyword, conditionStatus, approvalStatus,
                year, page, size, scope);
        return VtsSystemListResponse.builder()
                .items(pageResult.getContent())
                .total(pageResult.getTotalElements())
                .statusCounts(includeCounts
                        ? countByApprovalStatus(scope, orgUnitId, keywordLike, conditionStatus)
                        : Collections.emptyMap())
                .build();
    }

    /**
     * List query projection. It intentionally avoids the detail mapper because
     * that mapper loads attachments, spatial objects and creator names per row.
     */
    private Page<VtsSystemListItemResponse> findAllListItems(UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year, int page, int size,
            DataScopeContext scope) {
        String keywordLike = toKeywordLike(keyword);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        if (year == null) {
            return repository.searchList(scope.enabled(), scope.orgUnitIds(), orgUnitId, keywordLike,
                    conditionStatus, approvalStatus, pageable)
                    .map(this::toListItemResponse);
        }
        LocalDateTime fromDate = LocalDateTime.of(year, Month.JANUARY, 1, 0, 0);
        LocalDateTime toDate = fromDate.plusYears(1);
        return repository.searchListByCreatedDateRange(scope.enabled(), scope.orgUnitIds(), orgUnitId,
                keywordLike, conditionStatus, approvalStatus, fromDate, toDate, pageable)
                .map(this::toListItemResponse);
    }

    public VtsSystemResponse update(UUID id, VtsSystemUpdateRequest request, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        UUID effectiveUserId = userId != null ? userId : entity.getCreatedBy();

        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            throw new IllegalStateException(
                    "Hệ thống VTS đã được phê duyệt, không thể cập nhật trực tiếp. Vui lòng thực hiện quy trình sửa đổi và phê duyệt lại.");
        }

        if (request.getCode() != null) {
            String requestedCode = request.getCode().trim();
            if (!requestedCode.equals(entity.getCode())) {
                if (repository.existsByCodeAndIdNot(requestedCode, id)) {
                    throw new IllegalArgumentException("Mã hệ thống VTS đã tồn tại trong hệ thống");
                }
                throw new IllegalArgumentException("Mã hệ thống VTS không được phép thay đổi sau khi tạo");
            }
        }
        if (request.getOrgUnitId() != null && !request.getOrgUnitId().equals(entity.getOrgUnitId())) {
            throw new IllegalArgumentException("Đơn vị quản lý không được phép thay đổi sau khi tạo");
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        Map<String, String> previousValues = new LinkedHashMap<>();
        EntityUpdateUtils.copyPropertiesIfPresent(request, entity, previousValues,
                VtsSystem.Fields.zones,
                VtsSystem.Fields.code,
                VtsSystem.Fields.orgUnitId,
                VtsSystemUpdateRequest.Fields.coordinates,
                VtsSystemUpdateRequest.Fields.geometryType);

        if (request.getZones() != null) {
            List<VtsZone> oldZones = entity.getZones() != null ? new ArrayList<>(entity.getZones()) : new ArrayList<>();
            if (entity.getZones() != null) {
                entity.getZones().clear();
            } else {
                entity.setZones(new ArrayList<>());
            }
            entity.getZones().addAll(request.getZones().stream().map(dto -> {
                VtsZone z = new VtsZone();
                if (dto.getId() != null) {
                    z.setId(dto.getId());
                }
                z.setCode(dto.getCode());
                z.setName(dto.getName());
                z.setConditionStatus(dto.getConditionStatus() != null ? dto.getConditionStatus() : ConditionStatus.OPERATIONAL);
                UUID creator = oldZones.stream()
                        .filter(oz -> oz != null && oz.getId() != null && oz.getId().equals(dto.getId()) && oz.getCreatedBy() != null)
                        .map(VtsZone::getCreatedBy)
                        .findFirst()
                        .orElse(effectiveUserId);
                z.setCreatedBy(creator != null ? creator : effectiveUserId);
                z.setUpdatedBy(effectiveUserId);
                z.setVtsSystem(entity);
                return z;
            }).collect(Collectors.toList()));
        }

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                        : GisGeometryType.POINT;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = entity.getId();
                String spatialName = "Hệ thống VTS " + (request.getSystemName() != null ? request.getSystemName() : entity.getSystemName()) +
                        (request.getAddress() != null && !request.getAddress().isBlank() ? " - " + request.getAddress() :
                        (entity.getAddress() != null && !entity.getAddress().isBlank() ? " - " + entity.getAddress() : ""));
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        spatialName,
                        "VTS_" + entity.getId(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        refId,
                        InfrastructureType.VTS_SYSTEM);
                entity.setSpatialId(spatialObj.getId());
            }
        } else if (entity.getSpatialId() != null && (request.getSystemName() != null || request.getAddress() != null)) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                UUID refId = entity.getId();
                String sysName = request.getSystemName() != null ? request.getSystemName() : entity.getSystemName();
                String addr = request.getAddress() != null ? request.getAddress() : (entity.getAddress() != null ? entity.getAddress() : "");
                String spatialName = "Hệ thống VTS " + sysName + (!addr.isBlank() ? " - " + addr : "");
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        spatialName,
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        InfrastructureType.VTS_SYSTEM);
            });
        }

        boolean approvalRestart = previousApprovalStatus != ApprovalStatus.PROPOSED
                || Boolean.TRUE.equals(entity.getApprovedLevel1())
                || Boolean.TRUE.equals(entity.getApprovedLevel2());
        // Any data change invalidates previous approval and must return to C1.
        // UNDER_REVIEW is reserved for the state after C1 has actually approved.
        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setRejectionReason(null);
        entity.setApprovedLevel1(false);
        entity.setApproverLevel1(null);
        entity.setApprovedDateLevel1(null);
        entity.setApprovedLevel2(false);
        entity.setApproverLevel2(null);
        entity.setApprovedDateLevel2(null);

        entity.setUpdatedBy(effectiveUserId);

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.VTS_SYSTEM)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.UPDATED)
                .approvedBy(effectiveUserId)
                .reason("Cập nhật thông tin")
                .changedField(approvalRestart ? getFieldDisplayName(VtsSystem.Fields.approvalStatus) + ", " + formatChangedFields(previousValues)
                        : formatChangedFields(previousValues))
                .previousValue(approvalRestart
                        ? getFieldDisplayName(VtsSystem.Fields.approvalStatus) + "=" + formatDisplayValue(VtsSystem.Fields.approvalStatus, previousApprovalStatus.name())
                                + (previousValues.isEmpty() ? "" : "; " + formatPreviousValues(previousValues))
                        : formatPreviousValues(previousValues))
                .newValue(approvalRestart
                        ? getFieldDisplayName(VtsSystem.Fields.approvalStatus) + "=" + formatDisplayValue(VtsSystem.Fields.approvalStatus, ApprovalStatus.PROPOSED.name())
                                + (previousValues.isEmpty() ? "" : "; " + formatNewValues(saved, previousValues))
                        : formatNewValues(saved, previousValues))
                .build());

        return toLightResponse(saved);
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
                .changedField("Thời điểm xóa")
                .previousValue("Chưa xóa")
                .newValue("Đã xóa mềm")
                .build());
    }

    public VtsSystemResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean canApproveC1 = entity.getApprovalStatus() == ApprovalStatus.PROPOSED
                || (entity.getApprovalStatus() == ApprovalStatus.UNDER_REVIEW
                        && !Boolean.TRUE.equals(entity.getApprovedLevel1()));
        if (!canApproveC1) {
            throw new RuntimeException("Chỉ có thể phê duyệt C1 từ trạng thái Chờ duyệt (PROPOSED/UNDER_REVIEW)");
        }

        if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())) {
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
            entity.setApprovedLevel1(false);
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
        } else {
            entity.setApprovalStatus(ApprovalStatus.UNDER_REVIEW);
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
                .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                .approvedBy(userId)
                .reason(request.getReason())
                .changedField("Trạng thái phê duyệt")
                .previousValue(formatDisplayValue(VtsSystem.Fields.approvalStatus, previousApprovalStatus.name()))
                .newValue(ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
                        ? "Từ chối" : "Đang xem xét")
                .build());

        return toLightResponse(saved);
    }

    public VtsSystemResponse approveC2(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.UNDER_REVIEW
                || !Boolean.TRUE.equals(entity.getApprovedLevel1())) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Đang xem xét (UNDER_REVIEW)");
        }

        UUID c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(userId)) {
            throw new IllegalStateException(
                    "Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())) {
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
                .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                .approvedBy(userId)
                .reason(request.getReason())
                .changedField("Trạng thái phê duyệt")
                .previousValue(formatDisplayValue(VtsSystem.Fields.approvalStatus, ApprovalStatus.UNDER_REVIEW.name()))
                .newValue(ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
                        ? "Từ chối" : "Đã phê duyệt")
                .build());

        return toLightResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID id) {
        return getHistory(id, null, null);
    }

    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
        return getHistory(id, page, pageSize, null, null, null);
    }

    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
            LocalDateTime fromDate, LocalDateTime toDate) {
        // Check the parent VTS first so a user cannot read history by guessing an ID
        // when the history table itself is not org-scoped.
        ensureExists(id);
        List<ApprovalHistory> list;
        if (page != null && pageSize != null && pageSize > 0) {
            Pageable pageable = PageRequest.of(page, pageSize);
            String normalizedKeyword = normalizeSearchKeyword(keyword);
            if (normalizedKeyword == null && fromDate == null && toDate == null) {
                // Opening the history drawer must not execute the text-search
                // expression. This keeps legacy BYTEA audit columns readable
                // until their schema migration has been applied.
                list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.VTS_SYSTEM, id, pageable);
            } else {
                list = historyRepository.searchHistory(InfrastructureType.VTS_SYSTEM, id, normalizedKeyword,
                        fromDate, toDate, pageable);
            }
        } else {
            list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.VTS_SYSTEM, id);
        }
        Set<UUID> userIds = list.stream()
                .map(ApprovalHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = resolveUsers(userIds);
        Map<UUID, String> userNameMap = new java.util.HashMap<>();
        userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));

        return list.stream()
                .map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                        .approvedBy(h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : null)
                        .orgUnitName(h.getApprovedBy() != null && userMap.get(h.getApprovedBy()) != null
                                && userMap.get(h.getApprovedBy()).getOrgUnit() != null
                                ? userMap.get(h.getApprovedBy()).getOrgUnit().getName() : null)
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
        InfrastructureAttachment attachment = attachmentRepository
                .findByIdAndRefIdAndRefType(attachmentId, vtsSystemId, InfrastructureType.VTS_SYSTEM)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu đính kèm"));
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException ex) {
            throw new RuntimeException("Không thể xóa tài liệu đính kèm", ex);
        }
        attachmentRepository.delete(attachment);
    }

    public InfrastructureAttachment getAttachment(UUID vtsSystemId, UUID attachmentId) {
        ensureExists(vtsSystemId);
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, vtsSystemId, InfrastructureType.VTS_SYSTEM)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy tài liệu đính kèm"));
    }

    public List<VtsSystemResponse> search(UUID orgUnitId, String keyword, ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus) {
        return search(orgUnitId, keyword, conditionStatus, approvalStatus, null);
    }

    public List<VtsSystemResponse> search(UUID orgUnitId, String keyword, ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus, Integer year) {
        String keywordLike = toKeywordLike(keyword);
        Pageable pageable = PageRequest.of(0, 100);
        Page<VtsSystem> pageResult;
        DataScopeContext scope = resolveDataScope();
        if (year == null) {
            pageResult = repository.search(scope.enabled(), scope.orgUnitIds(), orgUnitId, keywordLike,
                    conditionStatus, approvalStatus, pageable);
        } else {
            LocalDateTime fromDate = LocalDateTime.of(year, Month.JANUARY, 1, 0, 0);
            LocalDateTime toDate = fromDate.plusYears(1);
            pageResult = repository.searchByCreatedDateRange(scope.enabled(), scope.orgUnitIds(), orgUnitId,
                    keywordLike, conditionStatus, approvalStatus, fromDate, toDate, pageable);
        }
        return pageResult.getContent().stream()
                .map(this::toLightResponse)
                .collect(Collectors.toList());
    }

    private VtsSystemResponse toResponse(VtsSystem entity) {
        return toResponse(entity, true, true, true, true);
    }

    private VtsSystemResponse toResponse(VtsSystem entity, boolean includeZones, boolean includeAttachments) {
        return toResponse(entity, includeZones, includeAttachments, true, true);
    }

    /**
     * Mutation/list response. It keeps scalar fields and cache-resolved names,
     * but does not load zones, attachments or spatial data.
     */
    private VtsSystemResponse toLightResponse(VtsSystem entity) {
        return toResponse(entity, false, false, false, false);
    }

    private VtsSystemResponse toResponse(VtsSystem entity, boolean includeZones, boolean includeAttachments,
            boolean includeSpatial, boolean includeCreatedByName) {
        List<VtsSystemAttachmentResponse> attachments = includeAttachments
                ? attachmentRepository
                        .findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(), InfrastructureType.VTS_SYSTEM).stream()
                        .map(this::toAttachmentResponse)
                        .collect(Collectors.toList())
                : Collections.emptyList();

        List<VtsZoneDto> zones = includeZones && entity.getZones() != null
                ? entity.getZones().stream().map(this::toZoneDto).collect(Collectors.toList())
                : Collections.emptyList();

        GisGeometryType geomType = null;
        String coords = null;
        if (includeSpatial && entity.getSpatialId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        String createdByName = null;
        if (includeCreatedByName && entity.getCreatedBy() != null) {
            createdByName = userRepository.findByIdWithRelations(entity.getCreatedBy())
                    .map(this::formatUserDisplayName)
                    .orElse(null);
        }

        String updatedByName = null;
        if (includeCreatedByName && entity.getUpdatedBy() != null) {
            updatedByName = userRepository.findByIdWithRelations(entity.getUpdatedBy())
                    .map(this::formatUserDisplayName)
                    .orElse(null);
        }

        return VtsSystemResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .systemName(entity.getSystemName())
                .conditionStatus(entity.getConditionStatus())
                .responsibilityLevel(entity.getResponsibilityLevel())
                .source(entity.getSource())
                .partner(entity.getPartner())
                .zones(zones)
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .owningOrgId(entity.getOwningOrgId())
                .owningOrgName(orgUnitCacheService.getName(entity.getOwningOrgId()))
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(orgUnitCacheService.getName(entity.getOperatingOrgId()))
                .portId(entity.getPortId())
                .portName(portCacheService.getName(entity.getPortId()))
                .provinceId(entity.getProvinceId())
                .address(entity.getAddress())
                .maritimeNotice(entity.getMaritimeNotice())
                .operationStartDate(entity.getOperationStartDate())
                .scope(entity.getScope())
                .note(entity.getNote())
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
                .updatedByName(updatedByName)
                .updatedDate(entity.getUpdatedAt())
                .attachments(attachments)
                .spatialId(entity.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .build();
    }

    private String formatUserDisplayName(User user) {
        String identity = user.getEmail() != null && !user.getEmail().isBlank()
                ? user.getEmail()
                : (user.getFullName() != null && !user.getFullName().isBlank()
                        ? user.getFullName()
                        : user.getUsername());
        String orgName = user.getOrgUnit() != null ? user.getOrgUnit().getName() : null;
        if (identity == null || identity.isBlank()) {
            return orgName;
        }
        return orgName == null || orgName.isBlank() ? identity : identity + " - " + orgName;
    }

    private VtsZoneDto toZoneDto(VtsZone zone) {
        return VtsZoneDto.builder()
                .id(zone.getId())
                .code(zone.getCode())
                .name(zone.getName())
                .conditionStatus(zone.getConditionStatus())
                .build();
    }

    private VtsSystemListItemResponse toListItemResponse(VtsSystemListProjection item) {
        return VtsSystemListItemResponse.builder()
                .id(item.getId())
                .code(item.getCode())
                .systemName(item.getSystemName())
                .address(item.getAddress())
                .conditionStatus(item.getConditionStatus())
                .responsibilityLevel(item.getResponsibilityLevel())
                .partner(item.getPartner())
                .orgUnitId(item.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(item.getOrgUnitId()))
                .approvalStatus(item.getApprovalStatus())
                .approverLevel1(item.getApproverLevel1())
                .updatedDate(item.getUpdatedDate())
                .build();
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON)
            return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment attachment) {
        return VtsSystemAttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .filePath("/api/v1/vts-systems/" + attachment.getRefId()
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
        if (request == null || request.getDecision() == null
                || !(ApprovalStatus.APPROVED.name().equalsIgnoreCase(request.getDecision())
                        || ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision()))) {
            throw new IllegalArgumentException("Quyết định phê duyệt không hợp lệ");
        }
        if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
                && (request.getReason() == null || request.getReason().trim().isEmpty())) {
            throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
        }
    }

    private String getFieldDisplayName(String field) {
        if (field == null) return "";
        if (VtsSystem.Fields.systemName.equals(field)) return "Tên hệ thống";
        if (VtsSystem.Fields.conditionStatus.equals(field)) return "Tình trạng";
        if (VtsSystem.Fields.responsibilityLevel.equals(field)) return "Mức độ phụ trách";
        if (VtsSystem.Fields.source.equals(field)) return "Nguồn gốc";
        if (VtsSystem.Fields.partner.equals(field)) return "Đối tác";
        if (VtsSystem.Fields.orgUnitId.equals(field)) return "Đơn vị quản lý";
        if (VtsSystem.Fields.owningOrgId.equals(field)) return "Đơn vị chủ quản";
        if (VtsSystem.Fields.operatingOrgId.equals(field)) return "Đơn vị vận hành";
        if (VtsSystem.Fields.portId.equals(field)) return "Thuộc cảng biển";
        if (VtsSystem.Fields.code.equals(field)) return "Mã hệ thống VTS";
        if (VtsSystem.Fields.provinceId.equals(field) || "province".equals(field)) return "Địa điểm (Tỉnh/TP)";
        if (VtsSystem.Fields.address.equals(field)) return "Địa điểm chi tiết";
        if (VtsSystem.Fields.maritimeNotice.equals(field)) return "Thông báo hàng hải";
        if (VtsSystem.Fields.operationStartDate.equals(field)) return "Thời gian bắt đầu hoạt động";
        if (VtsSystem.Fields.scope.equals(field)) return "Phạm vi áp dụng";
        if (VtsSystem.Fields.note.equals(field)) return "Ghi chú";
        if (VtsSystem.Fields.approvalStatus.equals(field)) return "Trạng thái phê duyệt";
        if (VtsSystem.Fields.approvedLevel1.equals(field)) return "Đã phê duyệt cấp 1";
        if (VtsSystem.Fields.approvedLevel2.equals(field)) return "Đã phê duyệt cấp 2";
        if (EntityFields.DELETED_AT.equals(field)) return "Thời điểm xóa";
        if (VtsSystemUpdateRequest.Fields.coordinates.equals(field)) return "Tọa độ GIS";
        if (VtsSystemUpdateRequest.Fields.geometryType.equals(field)) return "Loại đối tượng GIS";
        return field;
    }

    private String formatChangedFields(Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(this::getFieldDisplayName)
                .collect(Collectors.joining(", "));
    }

    private String formatPreviousValues(Map<String, String> previousValues) {
        return previousValues.entrySet().stream()
                .map(entry -> getFieldDisplayName(entry.getKey()) + "="
                        + formatDisplayValue(entry.getKey(), entry.getValue()))
                .collect(Collectors.joining("; "));
    }

    private String formatNewValues(VtsSystem entity, Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(field -> getFieldDisplayName(field) + "="
                        + formatDisplayValue(field, currentFieldValue(entity, field)))
                .collect(Collectors.joining("; "));
    }

    private String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty())
            return "";
        if (VtsSystem.Fields.orgUnitId.equals(field)
                || VtsSystem.Fields.owningOrgId.equals(field)
                || VtsSystem.Fields.operatingOrgId.equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (VtsSystem.Fields.portId.equals(field) || "portId".equals(field) || "port".equals(field)) {
            try {
                String name = portCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (VtsSystem.Fields.provinceId.equals(field) || "provinceId".equals(field) || "province".equals(field)) {
            try {
                int pid = Integer.parseInt(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, pid);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (VtsSystem.Fields.conditionStatus.equals(field)) {
            if (ConditionStatus.OPERATIONAL.name().equals(rawValue)) return "Đang hoạt động";
            if (ConditionStatus.STOPPED.name().equals(rawValue)) return "Dừng hoạt động";
            if (ConditionStatus.MAINTENANCE.name().equals(rawValue)) return "Đang bảo trì";
            if (ConditionStatus.UNDER_CONSTRUCTION.name().equals(rawValue)) return "Đang xây dựng";
            return rawValue;
        }
        if (VtsSystem.Fields.approvalStatus.equals(field)) {
            if (ApprovalStatus.DRAFT.name().equals(rawValue)) return "Bản nháp";
            if (ApprovalStatus.PROPOSED.name().equals(rawValue)) return "Chờ phê duyệt";
            if (ApprovalStatus.PENDING_APPROVAL.name().equals(rawValue)) return "Đang xem xét";
            if (ApprovalStatus.UNDER_REVIEW.name().equals(rawValue)) return "Đang xem xét";
            if (ApprovalStatus.APPROVED_LEVEL1.name().equals(rawValue)) return "Đã phê duyệt cấp 1";
            if (ApprovalStatus.APPROVED_LEVEL2.name().equals(rawValue)) return "Đã phê duyệt cấp 2";
            if (ApprovalStatus.APPROVED.name().equals(rawValue)) return "Đã phê duyệt";
            if (ApprovalStatus.REJECTED.name().equals(rawValue)) return "Từ chối";
            return rawValue;
        }
        if (VtsSystemUpdateRequest.Fields.geometryType.equals(field)) {
            if (GisGeometryType.POINT.name().equals(rawValue)) return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equals(rawValue) || "LINESTRING".equals(rawValue)) return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equals(rawValue)) return "Đối tượng vùng";
            return rawValue;
        }
        if (VtsSystemUpdateRequest.Fields.coordinates.equals(field)) {
            if (rawValue == null || rawValue.trim().isEmpty() || "Chưa có".equals(rawValue)) {
                return "Chưa có";
            }
            if (rawValue.startsWith(GisGeometryType.POLYGON.name())) {
                int count = rawValue.split(",").length;
                return "Vùng bản đồ (" + count + " điểm tọa độ)";
            }
            if (rawValue.startsWith(GisGeometryType.LINE.name()) || rawValue.startsWith("LINESTRING")) {
                int count = rawValue.split(",").length;
                return "Đường bản đồ (" + count + " điểm tọa độ)";
            }
            if (rawValue.startsWith(GisGeometryType.POINT.name())) {
                return rawValue.replace("POINT(", "Điểm tọa độ (").replace(")", ")");
            }
            return rawValue;
        }
        return rawValue;
    }

    private String currentFieldValue(VtsSystem entity, String field) {
        if (field == null || entity == null) return "";
        if (VtsSystem.Fields.systemName.equals(field)) return String.valueOf(entity.getSystemName());
        if (VtsSystem.Fields.conditionStatus.equals(field)) return String.valueOf(entity.getConditionStatus());
        if (VtsSystem.Fields.responsibilityLevel.equals(field)) return String.valueOf(entity.getResponsibilityLevel());
        if (VtsSystem.Fields.source.equals(field)) return String.valueOf(entity.getSource());
        if (VtsSystem.Fields.partner.equals(field)) return String.valueOf(entity.getPartner());
        if (VtsSystem.Fields.orgUnitId.equals(field)) return String.valueOf(entity.getOrgUnitId());
        if (VtsSystem.Fields.owningOrgId.equals(field)) return String.valueOf(entity.getOwningOrgId());
        if (VtsSystem.Fields.operatingOrgId.equals(field)) return String.valueOf(entity.getOperatingOrgId());
        if (VtsSystem.Fields.portId.equals(field)) return String.valueOf(entity.getPortId());
        if (VtsSystem.Fields.code.equals(field)) return String.valueOf(entity.getCode());
        if (VtsSystem.Fields.provinceId.equals(field) || "province".equals(field)) return String.valueOf(entity.getProvinceId());
        if (VtsSystem.Fields.address.equals(field)) return String.valueOf(entity.getAddress());
        if (VtsSystem.Fields.maritimeNotice.equals(field)) return String.valueOf(entity.getMaritimeNotice());
        if (VtsSystem.Fields.operationStartDate.equals(field)) return String.valueOf(entity.getOperationStartDate());
        if (VtsSystem.Fields.scope.equals(field)) return String.valueOf(entity.getScope());
        if (VtsSystem.Fields.note.equals(field)) return String.valueOf(entity.getNote());
        if (VtsSystemUpdateRequest.Fields.coordinates.equals(field)) {
            if (entity.getSpatialId() != null) {
                return gisSpatialObjectService.findById(entity.getSpatialId())
                        .map(GisSpatialObject::getCoordinates)
                        .orElse("");
            }
            return "";
        }
        if (VtsSystemUpdateRequest.Fields.geometryType.equals(field)) {
            if (entity.getSpatialId() != null) {
                return gisSpatialObjectService.findById(entity.getSpatialId())
                        .map(o -> String.valueOf(o.getGeometryType()))
                        .orElse("");
            }
            return "";
        }
        return "";
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> countByApprovalStatus() {
        return countByApprovalStatus(null, null, null);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, ConditionStatus conditionStatus) {
        return countByApprovalStatus(resolveDataScope(), orgUnitId, keyword, conditionStatus);
    }

    private java.util.Map<String, Long> countByApprovalStatus(DataScopeContext scope, UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus) {
        java.util.Map<String, Long> counts = new java.util.LinkedHashMap<>();
        for (Object[] row : repository.countByApprovalStatus(scope.enabled(), scope.orgUnitIds(), orgUnitId,
                keyword, conditionStatus)) {
            counts.put(((ApprovalStatus) row[0]).name(), (Long) row[1]);
        }
        return counts;
    }

    /**
     * Resolve the logged-in user's organisation subtree for list queries.
     * The controller-level Hibernate filter remains as defence in depth, but
     * list projections also carry this predicate explicitly because they run
     * in a separate transactional repository call.
     */
    private DataScopeContext resolveDataScope() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return new DataScopeContext(false, List.of());
        }

        User currentUser = authentication.getPrincipal() instanceof User principalUser
                ? principalUser
                : userRepository.findByUsernameWithRelations(authentication.getName()).orElse(null);
        if (currentUser == null) {
            return new DataScopeContext(true, List.of());
        }

        boolean nationwide = currentUser.getRoles().stream()
                .map(role -> role.getCode())
                .anyMatch(Set.of("ROLE_SYSTEM_ADMIN", "ROLE_ADMIN")::contains);
        if (nationwide) {
            return new DataScopeContext(false, List.of());
        }

        if (currentUser.getOrgUnit() == null || currentUser.getOrgUnit().getId() == null) {
            return new DataScopeContext(true, List.of());
        }
        return new DataScopeContext(true, resolveSubtreeIdsByParentId(currentUser.getOrgUnit().getId()));
    }

    /**
     * Resolve the user's visible organisational subtree from parent_id. The
     * materialized path is display metadata only and must not decide access.
     */
    private List<UUID> resolveSubtreeIdsByParentId(UUID rootId) {
        Map<UUID, List<UUID>> childIdsByParent = orgUnitCacheService.getList().stream()
                .filter(unit -> unit.getId() != null && unit.getParentId() != null)
                .collect(Collectors.groupingBy(
                        OrgUnitResponse::getParentId,
                        LinkedHashMap::new,
                        Collectors.mapping(OrgUnitResponse::getId, Collectors.toList())));

        LinkedHashSet<UUID> result = new LinkedHashSet<>();
        List<UUID> queue = new ArrayList<>();
        queue.add(rootId);
        for (int index = 0; index < queue.size(); index++) {
            UUID currentId = queue.get(index);
            if (!result.add(currentId)) {
                continue;
            }
            queue.addAll(childIdsByParent.getOrDefault(currentId, List.of()));
        }
        return List.copyOf(result);
    }

    private Map<UUID, String> resolveUserNames(Collection<UUID> userIds) {
        Map<UUID, User> users = resolveUsers(userIds);
        Map<UUID, String> map = new java.util.HashMap<>();
        users.forEach((userId, user) -> map.put(userId, formatUserName(user)));
        return map;
    }

    private Map<UUID, User> resolveUsers(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) return Collections.emptyMap();
        Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (nonNullIds.isEmpty()) return Collections.emptyMap();
        return userRepository.findAllByIdInWithOrgUnit(nonNullIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user, (first, second) -> first));
    }

    private String formatUserName(User user) {
        String userStr = formatUserIdentity(user);
        if (user.getOrgUnit() != null && user.getOrgUnit().getName() != null && !user.getOrgUnit().getName().isBlank()) {
            userStr = userStr + " - " + user.getOrgUnit().getName();
        }
        return userStr;
    }

    private String formatUserIdentity(User user) {
        return (user.getEmail() != null && !user.getEmail().trim().isEmpty())
                ? user.getEmail()
                : ((user.getFullName() != null && !user.getFullName().trim().isEmpty()) ? user.getFullName() : user.getUsername());
    }

    private String resolveUserName(UUID userId) {
        if (userId == null)
            return null;
        Map<UUID, String> map = resolveUserNames(Collections.singletonList(userId));
        return map.getOrDefault(userId, userId.toString());
    }
}
