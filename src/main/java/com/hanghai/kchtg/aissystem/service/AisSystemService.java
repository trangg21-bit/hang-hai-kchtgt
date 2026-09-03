package com.hanghai.kchtg.aissystem.service;

import com.hanghai.kchtg.aissystem.dto.AisSystemListItem;
import com.hanghai.kchtg.aissystem.dto.AisSystemOptionResponse;
import com.hanghai.kchtg.aissystem.dto.AisSystemRequest;
import com.hanghai.kchtg.aissystem.dto.AisSystemResponse;
import com.hanghai.kchtg.aissystem.dto.HistoryEntry;
import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.aissystem.repository.AisSystemRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.enums.UnitOfMeasure;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtsoperationcenter.repository.VtsOperationCenterRepository;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import jakarta.persistence.EntityNotFoundException;
import java.util.stream.Stream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.PortCacheService;
import org.springframework.jdbc.core.JdbcTemplate;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AisSystemService {

    private final AisSystemRepository repository;
    private final VtsOperationCenterRepository vtsOperationCenterRepository;
    private final RadarStationRepository radarStationRepository;
    private final VtsSystemRepository vtsSystemRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final InfrastructureApprovalService approvalService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final PortCacheService portCacheService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private Scope resolveEffectiveScope(UUID selectedOrgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (selectedOrgUnitId == null) {
            return userScope;
        }
        if (!userScope.unrestricted() && !userScope.allows(selectedOrgUnitId)) {
            return Scope.restricted(List.of());
        }
        List<UUID> selectedSubtree = orgUnitScopeService.resolveSubtreeIds(selectedOrgUnitId);
        if (userScope.unrestricted()) {
            return Scope.restricted(selectedSubtree);
        }
        List<UUID> intersected = selectedSubtree.stream()
                .filter(userScope::allows)
                .toList();
        return Scope.restricted(intersected);
    }

    /**
     * Chuẩn hóa từ khóa cho vế LIKE.
     *
     * Truy vấn so sánh với {@code immutable_unaccent(LOWER(...))} — tức là chuỗi
     * ĐÃ bỏ dấu — nên từ khóa cũng phải bỏ dấu, nếu không thì gõ tiếng Việt có
     * dấu (cách gõ tự nhiên) sẽ không bao giờ khớp và màn hình luôn báo không có
     * dữ liệu.
     */
    private static String toKeywordLike(String keyword) {
        String normalized = normalizeHistoryKeyword(keyword);
        return normalized == null ? null : "%" + normalized + "%";
    }

    /**
     * Bỏ dấu từ khóa, KHÔNG bọc `%`. Truy vấn nhật ký tự nối `%` bằng CONCAT nên
     * bọc sẵn ở đây sẽ thành `%%tu khoa%%` và khớp sai.
     */
    private static String normalizeHistoryKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return java.text.Normalizer
                .normalize(keyword.trim().toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.allows(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
        }
    }

    @Transactional
    public AisSystemResponse create(AisSystemRequest request, UUID userId) {
        validateAllowedOrgUnit(request.getOrgUnitId());
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            request.setCode(generateCode());
        }
        if (repository.existsByCodeAndDeletedAtIsNull(request.getCode().trim())) {
            throw new IllegalArgumentException("Mã thiết bị AIS '" + request.getCode() + "' đã tồn tại");
        }

        ApprovalStatus initialStatus = request.getApprovalStatus() != null
                ? request.getApprovalStatus()
                : ApprovalStatus.DRAFT;
        // Tạo thẳng ở trạng thái "Đã duyệt" là bỏ qua cả 2 vòng duyệt — chỉ dành
        // cho tài khoản cấp Cục (bảng chuyển trạng thái không có đường này cho
        // người dùng thường).
        if (initialStatus == ApprovalStatus.APPROVED && !approvalService.isDepartmentLevelUser(userId)) {
            throw new IllegalStateException(
                    "Chỉ tài khoản cấp Cục mới được lưu và phê duyệt trực tiếp; "
                            + "các đơn vị khác phải gửi hồ sơ qua quy trình phê duyệt 2 cấp");
        }

        if (request.getVtsOperationCenterId() == null && request.getRadarStationId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn Trung tâm điều hành VTS hoặc Trạm Radar");
        }
        if (request.getVtsOperationCenterId() != null && request.getRadarStationId() != null) {
            throw new IllegalArgumentException("Chỉ được chọn 1 trong 2: Trung tâm điều hành VTS hoặc Trạm Radar");
        }

        UUID vtsOpCenterId = null;
        UUID radarStId = null;

        if (request.getVtsOperationCenterId() != null) {
            boolean existsCenter = vtsOperationCenterRepository.findByIdAndDeletedAtIsNull(request.getVtsOperationCenterId()).isPresent();
            if (!existsCenter) {
                if (radarStationRepository.findByIdAndDeletedAtIsNull(request.getVtsOperationCenterId()).isPresent()) {
                    radarStId = request.getVtsOperationCenterId();
                } else {
                    throw new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại");
                }
            } else {
                vtsOpCenterId = request.getVtsOperationCenterId();
            }
        } else if (request.getRadarStationId() != null) {
            boolean existsRadar = radarStationRepository.findByIdAndDeletedAtIsNull(request.getRadarStationId()).isPresent();
            if (!existsRadar) {
                throw new IllegalArgumentException("Trạm Radar không tồn tại");
            }
            radarStId = request.getRadarStationId();
        }

        if (request.getOperatingOrgId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn đơn vị khai thác");
        }

        OrgUnit orgUnit = orgUnitRepository.findById(request.getOrgUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Đơn vị quản lý không tồn tại"));

        UUID symbolId = null;
        if (request.getSymbolId() != null && !request.getSymbolId().trim().isEmpty()) {
            try {
                symbolId = UUID.fromString(request.getSymbolId().trim());
            } catch (Exception ignored) {}
        }

        AisSystem entity = AisSystem.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .vtsOperationCenterId(vtsOpCenterId)
                .radarStationId(radarStId)
                .operatingOrgId(request.getOperatingOrgId())
                .orgUnitId(orgUnit.getId())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .unitOfMeasure(request.getUnitOfMeasure() != null ? request.getUnitOfMeasure() : UnitOfMeasure.SET)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .model(request.getModel())
                .specifications(request.getSpecifications())
                .manufacturer(request.getManufacturer())
                .commissioningYear(request.getCommissioningYear())
                .conditionStatus(request.getConditionStatus() != null ? request.getConditionStatus() : ConditionStatus.OPERATIONAL)
                .maintenanceInfo(request.getMaintenanceInfo())
                .note(request.getNote())
                .symbolId(symbolId)
                .spatialId(request.getSpatialId())
                .approvalStatus(initialStatus)
                .createdBy(userId)
                .updatedBy(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        AisSystem saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Thiết bị AIS " + saved.getName(),
                    "AIS_" + saved.getId(),
                    request.getGeometryType(),
                    request.getCoordinates(),
                    saved.getId(),
                    InfrastructureType.AIS_SYSTEM);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        return toResponse(saved);
    }

    @Transactional
    public AisSystemResponse update(UUID id, AisSystemRequest request, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Hệ thống AIS không tồn tại"));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        validateAllowedOrgUnit(entity.getOrgUnitId());
        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
        }

        if (request.getCode() != null && repository.existsByCodeAndIdNotAndDeletedAtIsNull(request.getCode().trim(), id)) {
            throw new IllegalArgumentException("Mã thiết bị AIS '" + request.getCode() + "' đã được sử dụng");
        }

        if (request.getVtsOperationCenterId() != null || request.getRadarStationId() != null) {
            if (request.getVtsOperationCenterId() != null && request.getRadarStationId() != null) {
                throw new IllegalArgumentException("Chỉ được chọn 1 trong 2: Trung tâm điều hành VTS hoặc Trạm Radar");
            }
            if (request.getVtsOperationCenterId() != null) {
                boolean existsCenter = vtsOperationCenterRepository.findByIdAndDeletedAtIsNull(request.getVtsOperationCenterId()).isPresent();
                if (!existsCenter) {
                    if (radarStationRepository.findByIdAndDeletedAtIsNull(request.getVtsOperationCenterId()).isPresent()) {
                        entity.setRadarStationId(request.getVtsOperationCenterId());
                        entity.setVtsOperationCenterId(null);
                    } else {
                        throw new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại");
                    }
                } else {
                    entity.setVtsOperationCenterId(request.getVtsOperationCenterId());
                    entity.setRadarStationId(null);
                }
            } else if (request.getRadarStationId() != null) {
                boolean existsRadar = radarStationRepository.findByIdAndDeletedAtIsNull(request.getRadarStationId()).isPresent();
                if (!existsRadar) {
                    throw new IllegalArgumentException("Trạm Radar không tồn tại");
                }
                entity.setRadarStationId(request.getRadarStationId());
                entity.setVtsOperationCenterId(null);
            }
        }

        Map<String, String> previousValues = new LinkedHashMap<>();

        String oldCoordinates = null;
        GisGeometryType oldGeometryType = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                oldCoordinates = spatialOpt.get().getCoordinates();
                oldGeometryType = spatialOpt.get().getGeometryType();
            }
        }

        UUID oldSymbolId = entity.getSymbolId();
        if (request.getSymbolId() != null) {
            if (!request.getSymbolId().trim().isEmpty()) {
                try {
                    UUID newSymbolId = UUID.fromString(request.getSymbolId().trim());
                    entity.setSymbolId(newSymbolId);
                    if (!Objects.equals(oldSymbolId, newSymbolId)) {
                        previousValues.put(AisSystem.Fields.symbolId, oldSymbolId != null ? oldSymbolId.toString() : "Chưa có");
                    }
                } catch (Exception ignored) {}
            } else {
                entity.setSymbolId(null);
                if (oldSymbolId != null) {
                    previousValues.put(AisSystem.Fields.symbolId, oldSymbolId.toString());
                }
            }
        }

        EntityUpdateUtils.copyPropertiesIfPresent(request, entity, previousValues,
                AisSystemRequest.Fields.geometryType,
                AisSystemRequest.Fields.coordinates,
                AisSystemRequest.Fields.vtsOperationCenterId,
                AisSystemRequest.Fields.radarStationId,
                AisSystemRequest.Fields.symbolId);

        if (request.getCoordinates() != null && !Objects.equals(request.getCoordinates().trim(), oldCoordinates != null ? oldCoordinates.trim() : null)) {
            previousValues.put(AisSystemRequest.Fields.coordinates, oldCoordinates != null ? oldCoordinates : "Chưa có");
        }
        if (request.getGeometryType() != null && !Objects.equals(request.getGeometryType(), oldGeometryType)) {
            previousValues.put(AisSystemRequest.Fields.geometryType, oldGeometryType != null ? oldGeometryType.name() : "Chưa có");
        }

        if (request.getCoordinates() != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    entity.getSpatialId(),
                    "Thiết bị AIS " + (request.getName() != null ? request.getName() : entity.getName()),
                    "AIS_" + entity.getId(),
                    geomType,
                    request.getCoordinates(),
                    entity.getId(),
                    InfrastructureType.AIS_SYSTEM);
            entity.setSpatialId(spatialId);
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else if (request.getApprovalStatus() != null) {
            // Chuyển thẳng sang "Đã duyệt" từ trạng thái chưa duyệt cũng là bỏ qua
            // 2 vòng — áp cùng ràng buộc cấp Cục như lúc tạo mới.
            if (request.getApprovalStatus() == ApprovalStatus.APPROVED
                    && !approvalService.isDepartmentLevelUser(userId)) {
                throw new IllegalStateException(
                        "Chỉ tài khoản cấp Cục mới được lưu và phê duyệt trực tiếp; "
                                + "các đơn vị khác phải gửi hồ sơ qua quy trình phê duyệt 2 cấp");
            }
            entity.setApprovalStatus(request.getApprovalStatus());
        }

        entity.setUpdatedBy(userId);
        entity.setUpdatedAt(LocalDateTime.now());
        AisSystem saved = repository.save(entity);

        if (wasApproved && !previousValues.isEmpty()) {
            for (Map.Entry<String, String> entry : previousValues.entrySet()) {
                String field = entry.getKey();
                String fieldName = getFieldDisplayName(field);
                String oldVal = formatDisplayValue(field, entry.getValue());
                Object rawNew = getEntityFieldValue(saved, field);
                if (AisSystemRequest.Fields.coordinates.equals(field)) {
                    rawNew = request.getCoordinates();
                } else if (AisSystemRequest.Fields.geometryType.equals(field)) {
                    rawNew = request.getGeometryType() != null ? request.getGeometryType().name() : null;
                }
                String newVal = formatDisplayValue(field, rawNew != null ? String.valueOf(rawNew) : null);
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.AIS_SYSTEM)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .changedField(fieldName)
                        .previousValue(oldVal)
                        .newValue(newVal)
                        .reason("Cập nhật thông tin " + fieldName)
                        .build());
            }
        }

        return toResponse(saved);
    }

    private Object getEntityFieldValue(AisSystem entity, String fieldName) {
        if (entity == null || fieldName == null) return null;
        if (fieldName.equals(AisSystem.Fields.name)) return entity.getName();
        if (fieldName.equals(AisSystem.Fields.code)) return entity.getCode();
        if (fieldName.equals(AisSystem.Fields.vtsOperationCenterId)) return entity.getVtsOperationCenterId();
        if (fieldName.equals(AisSystem.Fields.radarStationId)) return entity.getRadarStationId();
        if (fieldName.equals(AisSystem.Fields.operatingOrgId)) return entity.getOperatingOrgId();
        if (fieldName.equals(BaseApprovableEntity.Fields.orgUnitId)) return entity.getOrgUnitId();
        if (fieldName.equals(BaseApprovableEntity.Fields.provinceId)) return entity.getProvinceId();
        if (fieldName.equals(AisSystem.Fields.detailedLocation)) return entity.getDetailedLocation();
        if (fieldName.equals(AisSystem.Fields.unitOfMeasure)) return entity.getUnitOfMeasure();
        if (fieldName.equals(AisSystem.Fields.quantity)) return entity.getQuantity();
        if (fieldName.equals(AisSystem.Fields.model)) return entity.getModel();
        if (fieldName.equals(AisSystem.Fields.specifications)) return entity.getSpecifications();
        if (fieldName.equals(AisSystem.Fields.manufacturer)) return entity.getManufacturer();
        if (fieldName.equals(AisSystem.Fields.commissioningYear)) return entity.getCommissioningYear();
        if (fieldName.equals(AisSystem.Fields.conditionStatus)) return entity.getConditionStatus();
        if (fieldName.equals(AisSystem.Fields.maintenanceInfo)) return entity.getMaintenanceInfo();
        if (fieldName.equals(AisSystem.Fields.note)) return entity.getNote();
        if (fieldName.equals(AisSystem.Fields.symbolId) || "symbolId".equals(fieldName)) return entity.getSymbolId();
        if (fieldName.equals(BaseApprovableEntity.Fields.spatialId)) return entity.getSpatialId();
        return null;
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Hệ thống AIS không tồn tại"));

        validateAllowedOrgUnit(entity.getOrgUnitId());

        // T13/N04/BR-017: chỉ hồ sơ "Lưu tạm" mới xóa được; xóa mềm chuyển sang
        // "Đã xóa (lịch sử)" (ARCHIVED) và giữ nguyên bản ghi trong CSDL.
        approvalService.deleteDraft(entity, InfrastructureType.AIS_SYSTEM, userId);

        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
            entity.setSpatialId(null);
        }

        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(userId);
        repository.save(entity);

        InfrastructureHistoryUtils.recordSoftDelete(
                historyRepository,
                id,
                InfrastructureType.AIS_SYSTEM,
                userId,
                "Xóa hệ thống AIS: " + entity.getName());
    }

    @Transactional(readOnly = true)
    public AisSystemResponse getById(UUID id) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<AisSystemListItem> search(
            String keyword,
            String name,
            String code,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID radarStationId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            Integer commissioningYear,
            ApprovalStatus approvalStatus,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {

        Scope scope = resolveEffectiveScope(orgUnitId);
        if (!scope.unrestricted() && scope.orgUnitIds().isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        String kw = toKeywordLike(keyword);
        String n = toKeywordLike(name);
        String c = toKeywordLike(code);

        Page<AisSystem> page = repository.search(
                !scope.unrestricted(),
                scope.orgUnitIds(),
                null,
                vtsOperationCenterId,
                radarStationId,
                operatingOrgId,
                provinceId,
                conditionStatus,
                commissioningYear,
                approvalStatus,
                kw,
                n,
                c,
                updatedFrom,
                updatedTo,
                pageable);

        List<AisSystem> content = page.getContent();
        if (content.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, page.getTotalElements());
        }

        // Batch pre-fetch all relations for the page in batch queries instead of N+1 queries
        Set<UUID> opCenterIds = content.stream().map(AisSystem::getVtsOperationCenterId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, VtsOperationCenter> opCenterMap = opCenterIds.isEmpty() ? Map.of() :
                vtsOperationCenterRepository.findAllById(opCenterIds).stream().collect(Collectors.toMap(VtsOperationCenter::getId, o -> o, (a, b) -> a));

        Set<UUID> radarStationIds = content.stream().map(AisSystem::getRadarStationId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, RadarStation> radarStationMap = radarStationIds.isEmpty() ? Map.of() :
                radarStationRepository.findAllById(radarStationIds).stream().collect(Collectors.toMap(RadarStation::getId, r -> r, (a, b) -> a));

        Set<UUID> vtsSystemIds = opCenterMap.values().stream().map(VtsOperationCenter::getVtsSystemId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<UUID, String> vtsSystemMap = vtsSystemIds.isEmpty() ? Map.of() :
                vtsSystemRepository.findAllById(vtsSystemIds).stream().collect(Collectors.toMap(VtsSystem::getId, VtsSystem::getSystemName, (a, b) -> a));

        Set<UUID> orgUnitIds = new HashSet<>();
        for (AisSystem a : content) {
            if (a.getOrgUnitId() != null) orgUnitIds.add(a.getOrgUnitId());
            if (a.getOperatingOrgId() != null) orgUnitIds.add(a.getOperatingOrgId());
        }
        Map<UUID, String> orgUnitMap = orgUnitIds.isEmpty() ? Map.of() :
                orgUnitRepository.findAllById(orgUnitIds).stream().collect(Collectors.toMap(OrgUnit::getId, OrgUnit::getName, (a, b) -> a));

        Set<UUID> operatingOrganizationIds = content.stream()
                .map(AisSystem::getOperatingOrgId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> operatingOrganizationMap = operatingOrganizationIds.isEmpty() ? Map.of() :
                operatingOrganizationRepository.findAllById(operatingOrganizationIds).stream()
                        .collect(Collectors.toMap(OperatingOrganization::getId, OperatingOrganization::getName, (a, b) -> a));

        Set<UUID> userIds = new HashSet<>();
        for (AisSystem a : content) {
            if (a.getCreatedBy() != null) userIds.add(a.getCreatedBy());
            if (a.getUpdatedBy() != null) userIds.add(a.getUpdatedBy());
            if (a.getSubmittedBy() != null) userIds.add(a.getSubmittedBy());
            if (a.getApproverLevel1() != null) userIds.add(a.getApproverLevel1());
            if (a.getApproverLevel2() != null) userIds.add(a.getApproverLevel2());
        }
        Map<UUID, String> userMap = userIds.isEmpty() ? Map.of() :
                userRepository.findAllById(userIds).stream().collect(Collectors.toMap(User::getId, u -> (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getUsername(), (a, b) -> a));

        List<AisSystemListItem> items = content.stream()
                .map(e -> toListItem(e, opCenterMap, radarStationMap, vtsSystemMap, orgUnitMap, operatingOrganizationMap, userMap))
                .collect(Collectors.toList());

        return new PageImpl<>(items, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Page<AisSystemListItem> search(
            String keyword,
            String name,
            String code,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            Integer commissioningYear,
            ApprovalStatus approvalStatus,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {
        return search(keyword, name, code, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, commissioningYear, approvalStatus, updatedFrom, updatedTo, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AisSystemListItem> search(
            String keyword,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            Integer commissioningYear,
            ApprovalStatus approvalStatus,
            Pageable pageable) {
        return search(keyword, null, null, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, commissioningYear, approvalStatus, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Page<AisSystemListItem> search(
            String keyword,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            Pageable pageable) {
        return search(keyword, null, null, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, null, approvalStatus, null, null, pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(
            String keyword,
            String name,
            String code,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID radarStationId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            Integer commissioningYear,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo) {

        Scope scope = resolveEffectiveScope(orgUnitId);
        if (!scope.unrestricted() && scope.orgUnitIds().isEmpty()) {
            Map<String, Long> emptyCounts = new HashMap<>();
            emptyCounts.put("ALL", 0L);
            for (ApprovalStatus s : ApprovalStatus.values()) {
                emptyCounts.put(s.name(), 0L);
            }
            return emptyCounts;
        }

        String kw = toKeywordLike(keyword);
        String n = toKeywordLike(name);
        String c = toKeywordLike(code);

        List<Object[]> rows = repository.countByApprovalStatus(
                !scope.unrestricted(),
                scope.orgUnitIds(),
                null,
                vtsOperationCenterId,
                radarStationId,
                operatingOrgId,
                provinceId,
                conditionStatus,
                commissioningYear,
                kw,
                n,
                c,
                updatedFrom,
                updatedTo);

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
    public Map<String, Long> countByStatus(
            String keyword,
            String name,
            String code,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            Integer commissioningYear,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo) {
        return countByStatus(keyword, name, code, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, commissioningYear, updatedFrom, updatedTo);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(
            String keyword,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus) {
        return countByStatus(keyword, null, null, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, null, null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(
            String keyword,
            UUID orgUnitId,
            UUID vtsOperationCenterId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            Integer commissioningYear) {
        return countByStatus(keyword, null, null, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, commissioningYear, null, null);
    }

    @Transactional
    public void submit(UUID id, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        approvalService.submit(entity, InfrastructureType.AIS_SYSTEM, userId);
        repository.save(entity);
        recordApprovalTransition(entity, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.PROPOSED,
                userId, "Gửi duyệt hệ thống AIS: " + entity.getName(), previousStatus, entity.getApprovalStatus());
    }

    @Transactional
    public void approveC1(UUID id, String decision, String reason, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        approvalService.approveC1(entity, InfrastructureType.AIS_SYSTEM, decision, reason, userId);
        repository.save(entity);
        recordApprovalTransition(entity, ApprovalLevel.LEVEL_1, isRejectedDecision(decision)
                        ? InfrastructureHistoryStatus.REJECTED : InfrastructureHistoryStatus.APPROVED,
                userId, reason, previousStatus, entity.getApprovalStatus());
    }

    @Transactional
    public void approveC2(UUID id, String decision, String reason, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        approvalService.approveC2(entity, InfrastructureType.AIS_SYSTEM, decision, reason, userId);
        repository.save(entity);
        recordApprovalTransition(entity, ApprovalLevel.LEVEL_2, isRejectedDecision(decision)
                        ? InfrastructureHistoryStatus.REJECTED : InfrastructureHistoryStatus.APPROVED,
                userId, reason, previousStatus, entity.getApprovalStatus());
    }

    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.AIS_SYSTEM, ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.AIS_SYSTEM, ApprovalStatus.REJECTED.name(), reason, userId);
        }
        repository.save(entity);
        recordApprovalTransition(entity,
                currentStatus == ApprovalStatus.APPROVED_LEVEL1 ? ApprovalLevel.LEVEL_2 : ApprovalLevel.LEVEL_1,
                InfrastructureHistoryStatus.REJECTED, userId, reason, currentStatus, entity.getApprovalStatus());
    }

    private void recordApprovalTransition(AisSystem entity, ApprovalLevel level,
                                           InfrastructureHistoryStatus status, UUID userId,
                                           String reason, ApprovalStatus previousStatus,
                                           ApprovalStatus newStatus) {
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.AIS_SYSTEM)
                .approvalLevel(level)
                .status(status)
                .approvedBy(userId)
                .approvedDate(LocalDateTime.now())
                .reason(reason)
                .changedField("Trạng thái phê duyệt")
                .previousValue(previousStatus != null ? previousStatus.name() : null)
                .newValue(newStatus != null ? newStatus.name() : null)
                .build());
    }

    private boolean isRejectedDecision(String decision) {
        return decision != null && decision.trim().toUpperCase(Locale.ROOT).startsWith("REJECTED");
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        return getHistory(id, null, null);
    }

    /**
     * Nhật ký của một hồ sơ. Kiểm tra hồ sơ cha trước để không thể đọc lịch sử
     * của đơn vị khác bằng cách đoán id, và phân trang để drawer không phải tải
     * toàn bộ nhật ký trong một lần.
     */
    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
        return getHistory(id, page, pageSize, null, null, null);
    }

    /**
     * Nhật ký thay đổi, lọc và phân trang Ở SERVER.
     *
     * Trước đây hàm này tải TOÀN BỘ nhật ký của hồ sơ rồi lọc + cắt trang bằng
     * Java: vừa nặng dần theo số lần sửa, vừa khiến ô tìm kiếm của drawer chỉ soi
     * được phần đã tải. Nay điều kiện trạng thái, mốc "sau phê duyệt cấp cuối",
     * từ khóa và khoảng ngày đều đẩy xuống CSDL nên biên trang là chính xác.
     */
    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
            LocalDateTime fromDate, LocalDateTime toDate) {
        AisSystem parent = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(parent.getOrgUnitId());

        LocalDateTime finalApprovalAt = parent.getApprovedDateLevel2();
        if (finalApprovalAt == null) {
            return List.of();
        }

        // Chỉ hiển thị thay đổi phát sinh sau phê duyệt cấp cuối; ẩn log CREATE/duyệt
        // hoặc log nháp do phiên bản cũ đã ghi vào infrastructure_history.
        LocalDateTime effectiveFrom = (fromDate == null || fromDate.isBefore(finalApprovalAt))
                ? finalApprovalAt
                : fromDate;
        Pageable pageable = (page != null && pageSize != null && page >= 0 && pageSize > 0)
                ? PageRequest.of(page, pageSize)
                : Pageable.unpaged();

        List<InfrastructureHistory> list = historyRepository.searchChangeHistory(
                InfrastructureType.AIS_SYSTEM, id,
                List.of(InfrastructureHistoryStatus.CREATED,
                        InfrastructureHistoryStatus.APPROVED,
                        InfrastructureHistoryStatus.REJECTED),
                normalizeHistoryKeyword(keyword), effectiveFrom, toDate, pageable);
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        List<HistoryEntry> result = list.stream()
                .map(h -> {
                    User u = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
                    String userName = u != null
                            ? (u.getFullName() != null && !u.getFullName().trim().isEmpty() ? u.getFullName()
                                    : (u.getUsername() != null && !u.getUsername().trim().isEmpty() ? u.getUsername() : null))
                            : null;
                    String orgUnitName = u != null && u.getOrgUnit() != null ? u.getOrgUnit().getName() : null;
                    HistoryEntry entry = new HistoryEntry();
                    entry.setId(h.getId());
                    entry.setApprovalLevel(h.getApprovalLevel());
                    entry.setStatus(h.getStatus() != null ? h.getStatus().getCode() : null);
                    entry.setApprovedBy(userName);
                    entry.setOrgUnitName(orgUnitName);
                    entry.setApprovedDate(h.getApprovedDate());
                    entry.setReason(h.getReason());
                    entry.setChangedField(h.getChangedField());
                    entry.setPreviousValue(formatDisplayValue(h.getChangedField(), h.getPreviousValue()));
                    entry.setNewValue(formatDisplayValue(h.getChangedField(), h.getNewValue()));
                    return entry;
                })
                .collect(Collectors.toList());
        return result;
    }

    @Transactional
    public List<VtsSystemAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ensureAttachmentEditable(entity);

        Path dir = Paths.get(uploadDir, "ais_system", id.toString()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục lưu trữ file", e);
        }

        long existing = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.AIS_SYSTEM).size();
        String uploaderName = userId == null ? null : userRepository.findById(userId)
                .map(u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName().trim() : u.getUsername())
                .orElse(null);

        List<VtsSystemAttachmentResponse> uploaded = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            if (existing + uploaded.size() >= MAX_ATTACHMENTS) {
                throw new IllegalArgumentException(
                        "Số lượng tài liệu đính kèm tối đa là " + MAX_ATTACHMENTS + " tệp theo quy định");
            }
            validateAttachment(f);
            String originalFilename = Objects.requireNonNullElse(f.getOriginalFilename(), "file_" + System.currentTimeMillis());
            String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = UUID.randomUUID() + "_" + safeName;
            Path filePath = dir.resolve(storedFileName).normalize();
            if (!filePath.startsWith(dir)) {
                throw new IllegalArgumentException("Tên tệp không hợp lệ");
            }

            try {
                Files.copy(f.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Không thể lưu file " + originalFilename, e);
            }

            InfrastructureAttachment attachment = InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.AIS_SYSTEM)
                    .fileName(originalFilename)
                    .filePath(filePath.toString())
                    .fileSize(f.getSize())
                    .fileType(AttachmentFileType.fromValue(f.getContentType()))
                    .uploadedBy(userId)
                    .uploadedDate(LocalDateTime.now())
                    .build();

            InfrastructureAttachment saved = attachmentRepository.save(attachment);
            uploaded.add(toAttachmentResponse(saved, uploaderName));

            boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                    || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
            if (wasApproved) {
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(id)
                        .refType(InfrastructureType.AIS_SYSTEM)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        // Ghi đúng loại thao tác thay vì UPDATED chung chung: giao diện
                        // lấy nhãn + màu của dòng nhật ký từ trạng thái này, ghi UPDATED
                        // thì thao tác tệp cũng hiện là "Cập nhật" màu xanh.
                        .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .reason("Tải lên tài liệu đính kèm: " + originalFilename)
                        .changedField("Tài liệu đính kèm")
                        .previousValue("—")
                        .newValue(originalFilename)
                        .build());
            }
        }
        return uploaded;
    }

    @Transactional(readOnly = true)
    public List<VtsSystemAttachmentResponse> listAttachments(UUID id) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        return loadAttachments(id);
    }

    /** Đọc tệp đính kèm sau khi hồ sơ cha đã được kiểm tra tồn tại và phạm vi. */
    private List<VtsSystemAttachmentResponse> loadAttachments(UUID id) {
        List<InfrastructureAttachment> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.AIS_SYSTEM);
        if (attachments.isEmpty()) {
            return List.of();
        }
        Set<UUID> uploaderIds = attachments.stream()
                .map(InfrastructureAttachment::getUploadedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> uploaderNames = uploaderIds.isEmpty() ? Map.of() : userRepository.findAllById(uploaderIds).stream()
                .collect(Collectors.toMap(User::getId,
                        u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName().trim() : u.getUsername(),
                        (a, b) -> a));
        return attachments.stream()
                .map(att -> toAttachmentResponse(att, uploaderNames.get(att.getUploadedBy())))
                .toList();
    }

    /** Số tệp đính kèm tối đa cho một hồ sơ (khớp giới hạn hiển thị ở giao diện). */
    private static final int MAX_ATTACHMENTS = 10;

    private static final long MAX_ATTACHMENT_SIZE = 10L * 1024 * 1024;

    private static final List<String> ALLOWED_ATTACHMENT_TYPES = List.of(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg", "image/png", "image/gif");

    /**
     * N09/BR-019 & T12 — hồ sơ đang chờ duyệt bị khóa sửa.
     * Ủy thác cho InfrastructureApprovalService.assertEditable để cho phép tài khoản có quyền cấp Cục sửa hồ sơ Đã duyệt.
     */
    private void ensureAttachmentEditable(AisSystem entity) {
        approvalService.assertEditable(entity);
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được để trống");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được vượt quá 10MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_ATTACHMENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Định dạng tài liệu không được hỗ trợ");
        }
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attId, UUID userId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ensureAttachmentEditable(entity);

        InfrastructureAttachment att = attachmentRepository.findById(attId)
                .orElseThrow(() -> new EntityNotFoundException("File đính kèm không tồn tại"));

        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.AIS_SYSTEM) {
            throw new IllegalArgumentException("File đính kèm không thuộc hệ thống AIS này");
        }

        try {
            Files.deleteIfExists(Paths.get(att.getFilePath()));
        } catch (IOException ignored) {}
        attachmentRepository.delete(att);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        if (wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(id)
                    .refType(InfrastructureType.AIS_SYSTEM)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .reason("Xóa tài liệu đính kèm: " + att.getFileName())
                    .changedField("Tài liệu đính kèm")
                    .previousValue(att.getFileName())
                    .newValue("—")
                    .build());
        }
    }

    public InfrastructureAttachment getAttachment(UUID id, UUID attId) {
        AisSystem entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Hệ thống AIS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());

        InfrastructureAttachment att = attachmentRepository.findById(attId)
                .orElseThrow(() -> new EntityNotFoundException("File đính kèm không tồn tại"));

        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.AIS_SYSTEM) {
            throw new IllegalArgumentException("File đính kèm không thuộc hệ thống AIS này");
        }
        return att;
    }

    private String getFieldDisplayName(String field) {
        if (field == null) return "";
        if (AisSystem.Fields.name.equals(field)) return "Tên thiết bị";
        if (AisSystem.Fields.code.equals(field)) return "Mã thiết bị";
        if (AisSystem.Fields.vtsOperationCenterId.equals(field)) return "Thuộc trung tâm điều hành VTS";
        if (AisSystem.Fields.radarStationId.equals(field)) return "Thuộc trạm Radar";
        if (AisSystem.Fields.operatingOrgId.equals(field)) return "Đơn vị khai thác";
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)) return "Đơn vị quản lý";
        if (BaseApprovableEntity.Fields.provinceId.equals(field)) return "Địa điểm (Tỉnh/TP)";
        if (AisSystem.Fields.detailedLocation.equals(field)) return "Địa điểm chi tiết";
        if (AisSystem.Fields.unitOfMeasure.equals(field)) return "Đơn vị tính";
        if (AisSystem.Fields.quantity.equals(field)) return "Số lượng";
        if (AisSystem.Fields.model.equals(field)) return "Model/Ký hiệu";
        if (AisSystem.Fields.specifications.equals(field)) return "Thông số kỹ thuật";
        if (AisSystem.Fields.manufacturer.equals(field)) return "Hãng sản xuất/Nước sản xuất";
        if (AisSystem.Fields.commissioningYear.equals(field)) return "Năm đưa vào sử dụng";
        if (AisSystem.Fields.conditionStatus.equals(field)) return "Tình trạng";
        if (AisSystem.Fields.maintenanceInfo.equals(field)) return "Thông tin bảo dưỡng/sửa chữa";
        if (AisSystem.Fields.note.equals(field)) return "Ghi chú";
        if (AisSystem.Fields.symbolId.equals(field) || "symbolId".equals(field)) return "Biểu tượng";
        if (BaseApprovableEntity.Fields.approvalStatus.equals(field)) return "Trạng thái phê duyệt";
        if (AisSystemRequest.Fields.coordinates.equals(field)) return "Tọa độ GIS";
        if (AisSystemRequest.Fields.geometryType.equals(field)) return "Loại đối tượng GIS";
        return field;
    }

    private String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty() || "null".equalsIgnoreCase(rawValue) || "Chưa có".equals(rawValue)) {
            return "Chưa có";
        }
        if (AisSystem.Fields.symbolId.equals(field)
                || getFieldDisplayName(AisSystem.Fields.symbolId).equals(field)
                || "symbolId".equals(field)) {
            try {
                UUID symId = UUID.fromString(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, symId);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)
                || AisSystem.Fields.operatingOrgId.equals(field)
                || getFieldDisplayName(BaseApprovableEntity.Fields.orgUnitId).equals(field)
                || getFieldDisplayName(AisSystem.Fields.operatingOrgId).equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (AisSystem.Fields.vtsOperationCenterId.equals(field)
                || getFieldDisplayName(AisSystem.Fields.vtsOperationCenterId).equals(field)) {
            try {
                return vtsOperationCenterRepository.findById(UUID.fromString(rawValue))
                        .map(VtsOperationCenter::getName)
                        .orElse(rawValue);
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (AisSystem.Fields.radarStationId.equals(field)
                || getFieldDisplayName(AisSystem.Fields.radarStationId).equals(field)) {
            try {
                return radarStationRepository.findById(UUID.fromString(rawValue))
                        .map(RadarStation::getStationName)
                        .orElse(rawValue);
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (BaseApprovableEntity.Fields.provinceId.equals(field)
                || getFieldDisplayName(BaseApprovableEntity.Fields.provinceId).equals(field)) {
            try {
                int pid = Integer.parseInt(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, pid);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (AisSystem.Fields.unitOfMeasure.equals(field)
                || getFieldDisplayName(AisSystem.Fields.unitOfMeasure).equals(field)) {
            if (UnitOfMeasure.SYSTEM.name().equals(rawValue)) return UnitOfMeasure.SYSTEM.getLabel();
            if (UnitOfMeasure.PIECE.name().equals(rawValue)) return UnitOfMeasure.PIECE.getLabel();
            if (UnitOfMeasure.SET.name().equals(rawValue)) return UnitOfMeasure.SET.getLabel();
            if (UnitOfMeasure.STATION.name().equals(rawValue)) return UnitOfMeasure.STATION.getLabel();
            return rawValue;
        }
        if (AisSystem.Fields.conditionStatus.equals(field)
                || getFieldDisplayName(AisSystem.Fields.conditionStatus).equals(field)) {
            if (ConditionStatus.OPERATIONAL.name().equals(rawValue)) return "Đang hoạt động";
            if (ConditionStatus.STOPPED.name().equals(rawValue)) return "Dừng hoạt động";
            if (ConditionStatus.MAINTENANCE.name().equals(rawValue)) return "Đang bảo trì";
            if (ConditionStatus.UNDER_CONSTRUCTION.name().equals(rawValue)) return "Đang xây dựng";
            return rawValue;
        }
        if (BaseApprovableEntity.Fields.approvalStatus.equals(field)
                || getFieldDisplayName(BaseApprovableEntity.Fields.approvalStatus).equals(field)) {
            if (ApprovalStatus.DRAFT.name().equals(rawValue)) return "Lưu tạm";
            if (ApprovalStatus.PROPOSED.name().equals(rawValue) || ApprovalStatus.PENDING_APPROVAL.name().equals(rawValue)) return "Chờ Cảng vụ duyệt";
            if (ApprovalStatus.APPROVED_LEVEL1.name().equals(rawValue)) return "Chờ Cục duyệt";
            if (ApprovalStatus.APPROVED.name().equals(rawValue) || ApprovalStatus.APPROVED_LEVEL2.name().equals(rawValue)) return "Đã duyệt";
            if (ApprovalStatus.REJECTED_LEVEL1.name().equals(rawValue)) return "Bị Cảng vụ trả về";
            if (ApprovalStatus.REJECTED_LEVEL2.name().equals(rawValue) || ApprovalStatus.REJECTED.name().equals(rawValue)) return "Bị Cục trả về";
            return rawValue;
        }
        if (AisSystemRequest.Fields.geometryType.equals(field)
                || getFieldDisplayName(AisSystemRequest.Fields.geometryType).equals(field)) {
            if (GisGeometryType.POINT.name().equals(rawValue)) return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equals(rawValue) || "LINESTRING".equals(rawValue)) return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equals(rawValue)) return "Đối tượng vùng";
            return rawValue;
        }
        if (AisSystemRequest.Fields.coordinates.equals(field)
                || getFieldDisplayName(AisSystemRequest.Fields.coordinates).equals(field)) {
            if (rawValue == null || rawValue.trim().isEmpty() || "Chưa có".equals(rawValue) || "null".equalsIgnoreCase(rawValue)) {
                return "Chưa có";
            }
            return rawValue.trim();
        }
        return rawValue;
    }

    public String generateCode() {
        long count = repository.count();
        String candidate;
        int i = 1;
        do {
            candidate = String.format("AIS-%06d", count + i);
            i++;
        } while (repository.existsByCodeAndDeletedAtIsNull(candidate));
        return candidate;
    }

    private AisSystemResponse toResponse(AisSystem entity) {
        String vtsOpCenterName = null;
        UUID vtsSystemId = null;
        String vtsSystemName = null;
        String radarStationName = null;
        String locationTypeName = null;
        String attachedLocationName = null;

        if (entity.getVtsOperationCenterId() != null) {
            Optional<VtsOperationCenter> opCenterOpt = vtsOperationCenterRepository.findById(entity.getVtsOperationCenterId());
            if (opCenterOpt.isPresent()) {
                VtsOperationCenter opCenter = opCenterOpt.get();
                vtsOpCenterName = opCenter.getName();
                attachedLocationName = opCenter.getName();
                locationTypeName = "Trung tâm điều hành VTS";
                vtsSystemId = opCenter.getVtsSystemId();
                if (vtsSystemId != null) {
                    vtsSystemName = vtsSystemRepository.findById(vtsSystemId).map(VtsSystem::getSystemName).orElse(null);
                }
            }
        } else if (entity.getRadarStationId() != null) {
            Optional<RadarStation> radarOpt = radarStationRepository.findById(entity.getRadarStationId());
            if (radarOpt.isPresent()) {
                radarStationName = radarOpt.get().getStationName();
                attachedLocationName = radarStationName;
                locationTypeName = "Trạm Radar";
            }
        }

        // Tên đơn vị lấy từ cache/repository dùng chung
        String operatingOrgName = entity.getOperatingOrgId() != null
                ? operatingOrganizationRepository.findById(entity.getOperatingOrgId())
                        .map(OperatingOrganization::getName)
                        .orElseGet(() -> orgUnitCacheService.getName(entity.getOperatingOrgId()))
                : null;
        String orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());

        // Gom 4 người dùng (tạo / sửa / duyệt C1 / duyệt C2) vào một truy vấn.
        Set<UUID> relatedUserIds = Stream
                .of(entity.getCreatedBy(), entity.getUpdatedBy(), entity.getApproverLevel1(),
                        entity.getApproverLevel2(), entity.getSubmittedBy())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        // HashMap chứ không phải Map.of(): các id trên có thể null và
        // Map.of().get(null) ném NullPointerException.
        Map<UUID, String> relatedUserNames = new HashMap<>();
        if (!relatedUserIds.isEmpty()) {
            userRepository.findAllById(relatedUserIds).stream()
                    .filter(u -> u.getFullName() != null && !u.getFullName().isBlank())
                    .forEach(u -> relatedUserNames.put(u.getId(), u.getFullName().trim()));
        }

        String createdByName = relatedUserNames.get(entity.getCreatedBy());
        String updatedByName = relatedUserNames.get(entity.getUpdatedBy());
        String submittedByName = relatedUserNames.get(entity.getSubmittedBy());
        String approver1Name = relatedUserNames.get(entity.getApproverLevel1());
        String approver2Name = relatedUserNames.get(entity.getApproverLevel2());

        List<VtsSystemAttachmentResponse> attachments = loadAttachments(entity.getId());

        String coordinates = null;
        GisGeometryType geometryType = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                coordinates = spatial.getCoordinates();
                geometryType = spatial.getGeometryType();
            }
        }
        String symbolId = entity.getSymbolId() != null ? entity.getSymbolId().toString() : null;

        return AisSystemResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .vtsOperationCenterId(entity.getVtsOperationCenterId())
                .vtsOperationCenterName(vtsOpCenterName)
                .vtsSystemId(vtsSystemId)
                .vtsSystemName(vtsSystemName)
                .radarStationId(entity.getRadarStationId())
                .radarStationName(radarStationName)
                .locationTypeName(locationTypeName)
                .attachedLocationName(attachedLocationName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .unitOfMeasure(entity.getUnitOfMeasure())
                .unitOfMeasureLabel(entity.getUnitOfMeasure() != null ? entity.getUnitOfMeasure().getLabel() : null)
                .quantity(entity.getQuantity())
                .model(entity.getModel())
                .specifications(entity.getSpecifications())
                .manufacturer(entity.getManufacturer())
                .commissioningYear(entity.getCommissioningYear())
                .conditionStatus(entity.getConditionStatus())
                .conditionStatusLabel(entity.getConditionStatus() != null ? entity.getConditionStatus().name() : null)
                .maintenanceInfo(entity.getMaintenanceInfo())
                .note(entity.getNote())
                .spatialId(entity.getSpatialId())
                .geometryType(geometryType)
                .coordinates(coordinates)
                .symbolId(symbolId)
                .approvalStatus(entity.getApprovalStatus())
                .approvalStatusLabel(entity.getApprovalStatus() != null ? entity.getApprovalStatus().getLabel() : null)
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .submittedByName(submittedByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approver1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvalContentLevel1(entity.getLevel1ApprovalContent())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approver2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvalContentLevel2(entity.getLevel2ApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .attachments(attachments)
                .build();
    }

    public AisSystemListItem toListItem(AisSystem entity) {
        return toListItem(entity, Map.of(), Map.of(), Map.of(), Map.of(), Map.of(), Map.of());
    }

    public AisSystemListItem toListItem(
            AisSystem entity,
            Map<UUID, VtsOperationCenter> opCenterMap,
            Map<UUID, RadarStation> radarStationMap,
            Map<UUID, String> vtsSystemMap,
            Map<UUID, String> orgUnitMap,
            Map<UUID, String> operatingOrganizationMap,
            Map<UUID, String> userMap) {

        String vtsOpCenterName = null;
        UUID vtsSystemId = null;
        String vtsSystemName = null;
        String radarStationName = null;
        String locationTypeName = null;
        String attachedLocationName = null;

        if (entity.getVtsOperationCenterId() != null) {
            VtsOperationCenter opCenter = opCenterMap.get(entity.getVtsOperationCenterId());
            if (opCenter != null) {
                vtsOpCenterName = opCenter.getName();
                attachedLocationName = opCenter.getName();
                locationTypeName = "Trung tâm điều hành VTS";
                vtsSystemId = opCenter.getVtsSystemId();
                if (vtsSystemId != null) {
                    vtsSystemName = vtsSystemMap.get(vtsSystemId);
                }
            }
        } else if (entity.getRadarStationId() != null) {
            RadarStation radar = radarStationMap.get(entity.getRadarStationId());
            if (radar != null) {
                radarStationName = radar.getStationName();
                attachedLocationName = radarStationName;
                locationTypeName = "Trạm Radar";
            }
        }

        String operatingOrgName = null;
        if (entity.getOperatingOrgId() != null) {
            operatingOrgName = operatingOrganizationMap.get(entity.getOperatingOrgId());
            if (operatingOrgName == null) {
                operatingOrgName = orgUnitMap.get(entity.getOperatingOrgId());
            }
        }

        String orgUnitName = entity.getOrgUnitId() != null ? orgUnitMap.get(entity.getOrgUnitId()) : null;

        String updatedByName = entity.getUpdatedBy() != null ? userMap.get(entity.getUpdatedBy()) : null;
        String createdByName = entity.getCreatedBy() != null ? userMap.get(entity.getCreatedBy()) : null;
        String submittedByName = entity.getSubmittedBy() != null ? userMap.get(entity.getSubmittedBy()) : null;
        String approver1Name = entity.getApproverLevel1() != null ? userMap.get(entity.getApproverLevel1()) : null;
        String approver2Name = entity.getApproverLevel2() != null ? userMap.get(entity.getApproverLevel2()) : null;

        return AisSystemListItem.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .vtsOperationCenterId(entity.getVtsOperationCenterId())
                .vtsOperationCenterName(vtsOpCenterName)
                .vtsSystemId(vtsSystemId)
                .vtsSystemName(vtsSystemName)
                .radarStationId(entity.getRadarStationId())
                .radarStationName(radarStationName)
                .locationTypeName(locationTypeName)
                .attachedLocationName(attachedLocationName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .unitOfMeasure(entity.getUnitOfMeasure())
                .unitOfMeasureLabel(entity.getUnitOfMeasure() != null ? entity.getUnitOfMeasure().getLabel() : null)
                .quantity(entity.getQuantity())
                .model(entity.getModel())
                .manufacturer(entity.getManufacturer())
                .commissioningYear(entity.getCommissioningYear())
                .conditionStatus(entity.getConditionStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalStatusLabel(entity.getApprovalStatus() != null ? entity.getApprovalStatus().getLabel() : null)
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .submittedByName(submittedByName)
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approver1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approver2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .build();
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment att, String uploadedByName) {
        return VtsSystemAttachmentResponse.builder()
                .id(att.getId())
                .fileName(att.getFileName())
                .filePath(att.getFilePath())
                .fileSize(att.getFileSize())
                .documentType(att.getFileType() != null ? att.getFileType().name() : null)
                .uploadedBy(att.getUploadedBy())
                .uploadedByName(uploadedByName)
                .uploadedDate(att.getUploadedDate())
                .build();
    }

    @Transactional(readOnly = true)
    public List<AisSystemOptionResponse> getOptions(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService != null ? orgUnitScopeService.currentUserScope() : Scope.all();
        boolean scopeEnabled = userScope != null && !userScope.unrestricted();
        List<UUID> scopeOrgUnitIds = scopeEnabled ? userScope.orgUnitIds() : List.of();

        boolean orgFiltered = orgUnitId != null;
        List<UUID> targetOrgUnitIds = List.of();
        if (orgFiltered) {
            targetOrgUnitIds = orgUnitScopeService != null
                    ? orgUnitScopeService.resolveSubtreeIds(orgUnitId)
                    : List.of(orgUnitId);
        }

        return repository.findOptions(scopeEnabled, scopeOrgUnitIds, orgFiltered, targetOrgUnitIds);
    }
}
