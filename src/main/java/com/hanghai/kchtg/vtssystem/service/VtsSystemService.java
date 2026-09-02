package com.hanghai.kchtg.vtssystem.service;

import jakarta.persistence.EntityNotFoundException;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.fieldvisibility.FieldVisibilityContext;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.security.service.PermissionCacheService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
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
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemListProjection;
import com.hanghai.kchtg.vtssystem.repository.VtsZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
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
import com.hanghai.kchtg.port.repository.PortRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VtsSystemService {

    private record DataScopeContext(boolean enabled, List<UUID> orgUnitIds) {
    }

    private final VtsSystemRepository repository;
    private final InfrastructureHistoryRepository historyRepository;
    private final InfrastructureApprovalService approvalService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final PortCacheService portCacheService;
    private final PortRepository portRepository;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final VtsZoneRepository zoneRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private PermissionCacheService permissionCacheService;
    private OrgUnitScopeService orgUnitScopeService;
    private OperatingOrganizationRepository operatingOrganizationRepository;

    @Autowired(required = false)
    public void setOperatingOrganizationRepository(OperatingOrganizationRepository operatingOrganizationRepository) {
        this.operatingOrganizationRepository = operatingOrganizationRepository;
    }

    private String resolveOperatingOrgName(UUID operatingOrgId) {
        if (operatingOrgId == null) {
            return null;
        }
        if (operatingOrganizationRepository != null) {
            Optional<OperatingOrganization> op = operatingOrganizationRepository.findById(operatingOrgId);
            if (op.isPresent()) {
                return op.get().getName();
            }
        }
        return orgUnitCacheService.getName(operatingOrgId);
    }

    @Value("${app.upload.attachment-path:uploads/vts-attachments}")
    private String attachmentUploadPath;

    public VtsSystemService(VtsSystemRepository repository,
            InfrastructureHistoryRepository historyRepository,
            InfrastructureApprovalService approvalService,
            GisSpatialObjectService gisSpatialObjectService,
            OrgUnitCacheService orgUnitCacheService,
            PortCacheService portCacheService,
            PortRepository portRepository,
            InfrastructureAttachmentRepository attachmentRepository,
            VtsZoneRepository zoneRepository,
            UserRepository userRepository,
            JdbcTemplate jdbcTemplate) {
        this.repository = repository;
        this.historyRepository = historyRepository;
        this.approvalService = approvalService;
        this.gisSpatialObjectService = gisSpatialObjectService;
        this.orgUnitCacheService = orgUnitCacheService;
        this.portCacheService = portCacheService;
        this.portRepository = portRepository;
        this.attachmentRepository = attachmentRepository;
        this.zoneRepository = zoneRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Autowired(required = false)
    public void setOrgUnitScopeService(OrgUnitScopeService orgUnitScopeService) {
        this.orgUnitScopeService = orgUnitScopeService;
    }

    @Autowired
    public void setPermissionCacheService(PermissionCacheService permissionCacheService) {
        this.permissionCacheService = permissionCacheService;
    }

    public String generateCode() {
        long count = repository.count();
        String candidate;
        int i = 1;
        do {
            candidate = String.format("VTS-%06d", count + i);
            i++;
        } while (repository.existsByCode(candidate));
        return candidate;
    }

    public VtsSystemResponse create(VtsSystemCreateRequest request, UUID userId) {
        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            request.setCode(generateCode());
        }
        validateCreateRequest(request);
        validateWriteGuard(request);
        String normalizedCode = request.getCode().trim();
        if (repository.existsByCode(normalizedCode)) {
            if (normalizedCode.matches("VTS-\\d{6}")) {
                normalizedCode = generateCode();
                request.setCode(normalizedCode);
            } else {
                throw new IllegalArgumentException("Mã hệ thống VTS đã tồn tại trong hệ thống");
            }
        }
        ApprovalStatus initialStatus = request.getApprovalStatus() != null ? request.getApprovalStatus() : ApprovalStatus.DRAFT;
        if (initialStatus == ApprovalStatus.PENDING_APPROVAL && approvalService.isDepartmentLevelUser(userId)) {
            initialStatus = ApprovalStatus.APPROVED_LEVEL1;
        }
        // Tạo thẳng ở trạng thái "Đã duyệt" chỉ dành cho tài khoản cấp Cục.
        if (initialStatus == ApprovalStatus.APPROVED && !approvalService.isDepartmentLevelUser(userId)) {
            throw new IllegalStateException(
                    "Chỉ tài khoản cấp Cục mới được lưu và phê duyệt trực tiếp; "
                            + "các đơn vị khác phải gửi hồ sơ qua quy trình phê duyệt 2 cấp");
        }

        VtsSystem entity = VtsSystem.builder()
                .systemName(request.getSystemName())
                .conditionStatus(request.getConditionStatus())
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
                .approvalStatus(initialStatus)
                .approvedDateLevel2(initialStatus == ApprovalStatus.APPROVED ? LocalDateTime.now() : null)
                .approverLevel2(initialStatus == ApprovalStatus.APPROVED ? userId : null)
                .build();

        if (request.getZones() != null && !request.getZones().isEmpty()) {
            entity.setZones(request.getZones().stream().map(dto -> {
                VtsZone z = new VtsZone();
                z.setCode(dto.getCode());
                z.setName(dto.getName());
                z.setConditionStatus(
                        dto.getConditionStatus() != null ? dto.getConditionStatus() : ConditionStatus.OPERATIONAL);
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
                    (request.getAddress() != null && !request.getAddress().isBlank() ? " - " + request.getAddress()
                            : "");
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
        validateReferenceScope(resolveDataScope(), request.getOrgUnitId(), request.getOwningOrgId(),
                request.getOperatingOrgId(), request.getPortId());
    }

    private void validateReferenceScope(DataScopeContext scope, UUID orgUnitId, UUID owningOrgId,
            UUID operatingOrgId, UUID portId) {
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, orgUnitId, "Đơn vị quản lý");
            validateAllowedOrgUnit(scope, owningOrgId, "Đơn vị chủ quản");
            validateAllowedOrgUnit(scope, operatingOrgId, "Đơn vị vận hành");
        }

        if (portId == null) {
            return;
        }

        var port = portRepository.findActiveById(portId)
                .orElseThrow(() -> new IllegalArgumentException("Cảng biển không tồn tại hoặc đã bị xóa"));
        if (scope.enabled() && (port.getOrgUnitId() == null || !scope.orgUnitIds().contains(port.getOrgUnitId()))) {
            throw new IllegalArgumentException("Cảng biển không thuộc phạm vi đơn vị được phép sử dụng");
        }
    }

    private void validateAllowedOrgUnit(DataScopeContext scope, UUID orgUnitId, String label) {
        if (orgUnitId == null || !scope.orgUnitIds().contains(orgUnitId)) {
            throw new IllegalArgumentException(label + " không thuộc phạm vi đơn vị được phép sử dụng");
        }
    }

    /**
     * Nạp hồ sơ theo ID và chặn nếu nằm ngoài phạm vi đơn vị của người gọi.
     *
     * Hibernate {@code @Filter(orgUnitFilter)} chỉ áp cho truy vấn, KHÔNG áp cho
     * {@code findById}, nên mọi thao tác nhận ID từ client đều phải tự kiểm tra —
     * nếu không, người dùng có quyền hành động (duyệt, sửa tệp đính kèm) vẫn tác
     * động được lên hồ sơ của đơn vị khác chỉ bằng cách đoán/biết UUID.
     */
    private VtsSystem loadWithinScope(UUID id) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + id));
        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, entity.getOrgUnitId(), "Đơn vị quản lý");
        }
        return entity;
    }

    private void validateWriteGuard(VtsSystemCreateRequest request) {
        if (request == null)
            return;
        if (request.getSystemName() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.systemName);
        if (request.getConditionStatus() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.conditionStatus);
        if (request.getOwningOrgId() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.owningOrgId);
        if (request.getOperatingOrgId() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.operatingOrgId);
        if (request.getPortId() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.portId);
        if (request.getScope() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.scope);
        if (request.getNote() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.note);
        if (request.getProvinceId() != null)
            FieldVisibilityContext.assertWritable(BaseApprovableEntity.Fields.provinceId);
        if (request.getAddress() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.address);
        if (request.getMaritimeNotice() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.maritimeNotice);
        if (request.getOperationStartDate() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.operationStartDate);
    }

    private void validateWriteGuard(VtsSystemUpdateRequest request) {
        if (request == null)
            return;
        if (request.getSystemName() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.systemName);
        if (request.getConditionStatus() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.conditionStatus);
        if (request.getOwningOrgId() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.owningOrgId);
        if (request.getOperatingOrgId() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.operatingOrgId);
        if (request.getPortId() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.portId);
        if (request.getScope() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.scope);
        if (request.getNote() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.note);
        if (request.getProvinceId() != null)
            FieldVisibilityContext.assertWritable(BaseApprovableEntity.Fields.provinceId);
        if (request.getAddress() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.address);
        if (request.getMaritimeNotice() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.maritimeNotice);
        if (request.getOperationStartDate() != null)
            FieldVisibilityContext.assertWritable(VtsSystem.Fields.operationStartDate);
    }

    private User resolveCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        if (authentication.getPrincipal() instanceof User principalUser) {
            return principalUser;
        }
        return userRepository.findByUsernameWithRelations(authentication.getName()).orElse(null);
    }

    private boolean isElevatedAdministrator() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_SYSTEM_ADMIN".equalsIgnoreCase(authority.getAuthority())
                        || "ROLE_SUPER_ADMIN".equalsIgnoreCase(authority.getAuthority()));
    }

    public VtsSystemResponse getById(UUID id) {
        return getById(id, false, false);
    }

    public VtsSystemResponse getById(UUID id, boolean includeZones, boolean includeAttachments) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + id));
        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, entity.getOrgUnitId(), "Đơn vị quản lý");
        }
        return toResponse(entity, includeZones, includeAttachments);
    }

    public VtsZoneDto toZoneDto(VtsZone entity) {
        if (entity == null) return null;
        return VtsZoneDto.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .conditionStatus(entity.getConditionStatus())
                .build();
    }

    public List<VtsZoneDto> getZones(UUID id) {
        ensureExists(id);
        List<VtsZoneDto> zones = zoneRepository.findByVtsSystemIdOrderByCreatedAtAsc(id).stream()
                .map(this::toZoneDto)
                .collect(Collectors.toList());
        return zones;
    }

    public Page<VtsZoneDto> getZones(UUID id, Pageable pageable) {
        ensureExists(id);
        return zoneRepository.findByVtsSystemId(id, pageable).map(this::toZoneDto);
    }

    @Transactional
    public VtsZoneDto createZone(UUID systemId, VtsZoneDto dto, UUID userId) {
        VtsSystem vtsSystem = repository.findById(systemId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + systemId));

        approvalService.assertEditable(vtsSystem);

        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, vtsSystem.getOrgUnitId(), "Đơn vị quản lý");
        }

        if (dto == null) {
            throw new IllegalArgumentException("Dữ liệu vùng VTS không được để trống");
        }
        if (dto.getCode() == null || dto.getCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã vùng VTS không được để trống");
        }
        if (dto.getName() == null || dto.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên vùng VTS không được để trống");
        }

        String trimmedCode = dto.getCode().trim();
        if (zoneRepository.existsByVtsSystemIdAndCode(systemId, trimmedCode)) {
            throw new IllegalArgumentException("Mã vùng VTS '" + trimmedCode + "' đã tồn tại trong hệ thống VTS này");
        }

        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();

        VtsZone zone = VtsZone.builder()
                .code(trimmedCode)
                .name(dto.getName().trim())
                .conditionStatus(dto.getConditionStatus() != null ? dto.getConditionStatus() : ConditionStatus.OPERATIONAL)
                .vtsSystem(vtsSystem)
                .createdBy(effectiveUserId)
                .updatedBy(effectiveUserId)
                .build();

        VtsZone saved = zoneRepository.save(zone);

        // Ghi log lịch sử thay đổi khi hệ thống VTS đã được phê duyệt
        boolean wasApproved = vtsSystem.getApprovalStatus() == ApprovalStatus.APPROVED
                || vtsSystem.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        if (wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(systemId)
                    .refType(InfrastructureType.VTS_SYSTEM)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(effectiveUserId)
                    .reason("Thêm mới vùng VTS: " + saved.getName())
                    .changedField("Vùng VTS")
                    .previousValue(null)
                    .newValue("Thêm vùng [" + saved.getCode() + "] " + saved.getName() + " (" + saved.getConditionStatus().name() + ")")
                    .build());
        }

        return toZoneDto(saved);
    }

    @Transactional
    public VtsZoneDto updateZone(UUID systemId, UUID zoneId, VtsZoneDto dto, UUID userId) {
        VtsSystem vtsSystem = repository.findById(systemId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + systemId));

        approvalService.assertEditable(vtsSystem);

        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, vtsSystem.getOrgUnitId(), "Đơn vị quản lý");
        }

        VtsZone zone = zoneRepository.findByIdAndVtsSystemId(zoneId, systemId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng VTS với ID: " + zoneId));

        if (dto == null) {
            throw new IllegalArgumentException("Dữ liệu vùng VTS không được để trống");
        }

        String oldDesc = "[" + zone.getCode() + "] " + zone.getName() + " (" + (zone.getConditionStatus() != null ? zone.getConditionStatus().name() : "OPERATIONAL") + ")";

        if (dto.getCode() != null && !dto.getCode().trim().isEmpty()) {
            String trimmedCode = dto.getCode().trim();
            if (zoneRepository.existsByVtsSystemIdAndCodeAndIdNot(systemId, trimmedCode, zoneId)) {
                throw new IllegalArgumentException("Mã vùng VTS '" + trimmedCode + "' đã tồn tại trong hệ thống VTS này");
            }
            zone.setCode(trimmedCode);
        }

        if (dto.getName() != null && !dto.getName().trim().isEmpty()) {
            zone.setName(dto.getName().trim());
        }
        if (dto.getConditionStatus() != null) {
            zone.setConditionStatus(dto.getConditionStatus());
        }

        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        zone.setUpdatedBy(effectiveUserId);

        VtsZone saved = zoneRepository.save(zone);
        String newDesc = "[" + saved.getCode() + "] " + saved.getName() + " (" + (saved.getConditionStatus() != null ? saved.getConditionStatus().name() : "OPERATIONAL") + ")";

        // Ghi log lịch sử thay đổi khi hệ thống VTS đã được phê duyệt
        boolean wasApproved = vtsSystem.getApprovalStatus() == ApprovalStatus.APPROVED
                || vtsSystem.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        if (wasApproved && !Objects.equals(oldDesc, newDesc)) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(systemId)
                    .refType(InfrastructureType.VTS_SYSTEM)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(effectiveUserId)
                    .reason("Cập nhật vùng VTS: " + saved.getName())
                    .changedField("Vùng VTS [" + saved.getCode() + "]")
                    .previousValue(oldDesc)
                    .newValue(newDesc)
                    .build());
        }

        return toZoneDto(saved);
    }

    @Transactional
    public void deleteZone(UUID systemId, UUID zoneId, UUID userId) {
        VtsSystem vtsSystem = repository.findById(systemId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + systemId));

        approvalService.assertEditable(vtsSystem);

        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, vtsSystem.getOrgUnitId(), "Đơn vị quản lý");
        }

        VtsZone zone = zoneRepository.findByIdAndVtsSystemId(zoneId, systemId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng VTS với ID: " + zoneId));

        String zoneDesc = "Xóa vùng [" + zone.getCode() + "] " + zone.getName() + " (" + (zone.getConditionStatus() != null ? zone.getConditionStatus().name() : "OPERATIONAL") + ")";
        String zoneName = zone.getName();

        zoneRepository.delete(zone);

        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();

        // Ghi log lịch sử thay đổi khi hệ thống VTS đã được phê duyệt
        boolean wasApproved = vtsSystem.getApprovalStatus() == ApprovalStatus.APPROVED
                || vtsSystem.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        if (wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(systemId)
                    .refType(InfrastructureType.VTS_SYSTEM)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(effectiveUserId)
                    .reason("Xóa vùng VTS: " + zoneName)
                    .changedField("Vùng VTS")
                    .previousValue(zoneDesc)
                    .newValue(null)
                    .build());
        }
    }

    public List<VtsSystemAttachmentResponse> getAttachments(UUID id) {
        loadWithinScope(id);
        List<InfrastructureAttachment> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.VTS_SYSTEM);
        Set<UUID> uploaderIds = attachments.stream()
                .map(InfrastructureAttachment::getUploadedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> uploaderNames = resolveUserNames(uploaderIds);
        return attachments.stream()
                .map(a -> toAttachmentResponse(a, uploaderNames.get(a.getUploadedBy())))
                .collect(Collectors.toList());
    }

    private void ensureExists(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + id);
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

    /**
     * Các cột danh sách được phép sắp xếp ở tầng CSDL.
     *
     * Những cột hiển thị tên (đơn vị quản lý, đơn vị chủ quản, cán bộ cập nhật…)
     * được resolve từ cache SAU khi truy vấn nên không thể sắp xếp đúng ở đây —
     * cố tình không đưa vào danh sách này, và giao diện cũng không bật sắp xếp
     * cho chúng.
     */
    private static final Map<String, String> SORTABLE_LIST_FIELDS = Map.ofEntries(
            Map.entry("systemName", "t.systemName"),
            Map.entry("code", "t.code"),
            Map.entry("address", "t.address"),
            Map.entry("operationStartDate", "t.operationStartDate"),
            Map.entry("conditionStatus", "t.conditionStatus"),
            Map.entry("approvalStatus", "t.approvalStatus"),
            Map.entry("rejectionReason", "t.rejectionReason"),
            Map.entry("orgUnitName", "o.name"),
            Map.entry("orgUnitId", "t.orgUnitId"),
            Map.entry("owningOrgName", "own.name"),
            Map.entry("owningOrgId", "t.owningOrgId"),
            Map.entry("operatingOrgName", "op.name"),
            Map.entry("operatingOrgId", "t.operatingOrgId"),
            Map.entry("portName", "p.portName"),
            Map.entry("portId", "t.portId"),
            Map.entry("updatedByName", "t.updatedAt"),
            Map.entry("updatedBy", "t.updatedBy"),
            Map.entry("updatedDate", "t.updatedAt"),
            Map.entry("updatedAt", "t.updatedAt"),
            Map.entry("createdAt", "t.createdAt"));

    /**
     * Chuyển tham số {@code sort=<field>,<asc|desc>} thành {@link Sort}. Tên cột
     * không nằm trong danh sách cho phép sẽ rơi về mặc định (mới nhất trước) thay
     * vì ném lỗi, để một tham số lạ không làm hỏng cả màn danh sách.
     */
    private static Sort resolveListSort(String sort) {
        Sort defaultSort = Sort.by(Sort.Direction.DESC, "t.createdAt");
        if (sort == null || sort.isBlank()) {
            return defaultSort;
        }
        String[] parts = sort.split(",");
        String property = SORTABLE_LIST_FIELDS.get(parts[0].trim());
        if (property == null) {
            return defaultSort;
        }
        Sort.Direction direction = parts.length > 1 && "asc".equalsIgnoreCase(parts[1].trim())
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        // Chốt thêm createdAt để thứ tự ổn định khi giá trị sắp xếp trùng nhau,
        // tránh bản ghi nhảy giữa các trang.
        return Sort.by(direction, property).and(defaultSort);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus, int page, int size) {
        return findAllWithSearch(orgUnitId, keyword, conditionStatus, approvalStatus, null, page, size);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus, Integer year, int page, int size) {
        DataScopeContext scope = resolveDataScopeForFilter(orgUnitId);
        String keywordLike = toKeywordLike(keyword);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, EntityFields.CREATED_AT));
        if (scope.enabled() && scope.orgUnitIds().isEmpty()) {
            return Page.empty(pageable);
        }
        LocalDate fromDate = year != null ? LocalDate.of(year, 1, 1) : null;
        LocalDate toDate = year != null ? LocalDate.of(year + 1, 1, 1) : null;
        return repository.search(scope.enabled(), scope.orgUnitIds(), null, keywordLike,
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
        return findAllWithSearchAndCounts(orgUnitId, keyword, conditionStatus, approvalStatus, year, page, size,
                includeCounts, null);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus, Integer year, int page, int size,
            boolean includeCounts, String sort) {
        return findAllWithSearchAndCounts(orgUnitId, null, null, keyword, conditionStatus, approvalStatus,
                null, null, null, null, year, page, size, includeCounts, sort);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(
            UUID orgUnitId, UUID portId, Integer provinceId, String keyword,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus,
            LocalDate operationStartDateFrom, LocalDate operationStartDateTo,
            LocalDateTime updatedFrom, LocalDateTime updatedTo,
            Integer year, int page, int size,
            boolean includeCounts, String sort) {
        return findAllWithSearchAndCounts(orgUnitId, portId, provinceId, keyword, null, null,
                conditionStatus, approvalStatus, operationStartDateFrom, operationStartDateTo,
                updatedFrom, updatedTo, year, page, size, includeCounts, sort);
    }

    public VtsSystemListResponse findAllWithSearchAndCounts(
            UUID orgUnitId, UUID portId, Integer provinceId, String keyword, String systemName, String code,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus,
            LocalDate operationStartDateFrom, LocalDate operationStartDateTo,
            LocalDateTime updatedFrom, LocalDateTime updatedTo,
            Integer year, int page, int size,
            boolean includeCounts, String sort) {
        DataScopeContext scope = resolveDataScopeForFilter(orgUnitId);
        String keywordLike = toKeywordLike(keyword);
        String systemNameLike = toKeywordLike(systemName);
        String codeLike = toKeywordLike(code);
        LocalDate fromDate = operationStartDateFrom != null ? operationStartDateFrom
                : (year != null ? LocalDate.of(year, 1, 1) : null);
        LocalDate toDate = operationStartDateTo != null ? operationStartDateTo
                : (year != null ? LocalDate.of(year, 12, 31) : null);

        Page<VtsSystemListItemResponse> pageResult = findAllListItems(
                orgUnitId, portId, provinceId, keyword, systemName, code, conditionStatus, approvalStatus,
                fromDate, toDate, updatedFrom, updatedTo, page, size, scope, sort);

        return VtsSystemListResponse.builder()
                .items(pageResult.getContent())
                .total(pageResult.getTotalElements())
                .statusCounts(includeCounts
                        ? countByApprovalStatus(scope, null, portId, provinceId, keywordLike, systemNameLike, codeLike,
                                conditionStatus, fromDate, toDate, updatedFrom, updatedTo)
                        : Collections.emptyMap())
                .build();
    }

    /**
     * List query projection. It intentionally avoids the detail mapper because
     * that mapper loads attachments, spatial objects and creator names per row.
     */
    private Page<VtsSystemListItemResponse> findAllListItems(
            UUID orgUnitId, UUID portId, Integer provinceId, String keyword,
            String systemName, String code,
            ConditionStatus conditionStatus, ApprovalStatus approvalStatus,
            LocalDate fromDate, LocalDate toDate, LocalDateTime updatedFrom, LocalDateTime updatedTo,
            int page, int size, DataScopeContext scope, String sort) {
        String keywordLike = toKeywordLike(keyword);
        String systemNameLike = toKeywordLike(systemName);
        String codeLike = toKeywordLike(code);
        Pageable pageable = PageRequest.of(page, size, resolveListSort(sort));
        if (scope.enabled() && scope.orgUnitIds().isEmpty()) {
            return Page.empty(pageable);
        }
        Page<VtsSystemListProjection> rawPage = repository.searchList(
                scope.enabled(), scope.orgUnitIds(), orgUnitId, portId, provinceId, keywordLike, systemNameLike, codeLike,
                conditionStatus, approvalStatus, fromDate, toDate, updatedFrom, updatedTo, pageable);

        // Batch resolve user names in a single query to eliminate N+1 queries
        Set<UUID> userIds = new LinkedHashSet<>();
        for (VtsSystemListProjection item : rawPage.getContent()) {
            if (item.getUpdatedBy() != null) userIds.add(item.getUpdatedBy());
            if (item.getCreatedBy() != null) userIds.add(item.getCreatedBy());
            if (item.getApproverLevel1() != null) userIds.add(item.getApproverLevel1());
        }
        Map<UUID, String> userNameMap = resolveUserNames(userIds);

        return rawPage.map(item -> toListItemResponse(item, userNameMap));
    }

    public VtsSystemResponse update(UUID id, VtsSystemUpdateRequest request, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + id));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, entity.getOrgUnitId(), "Đơn vị quản lý");
        }

        UUID effectiveUserId = userId != null ? userId : entity.getCreatedBy();

        Map<String, String> previousValues = new LinkedHashMap<>();
        Map<String, String> customNewValues = new LinkedHashMap<>();

        if (request.getCode() != null && !request.getCode().isBlank()) {
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

        validateReferenceScope(scope,
                entity.getOrgUnitId(),
                request.getOwningOrgId() != null ? request.getOwningOrgId() : entity.getOwningOrgId(),
                request.getOperatingOrgId() != null ? request.getOperatingOrgId() : entity.getOperatingOrgId(),
                request.getPortId() != null ? request.getPortId() : entity.getPortId());

        validateWriteGuard(request);

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        EntityUpdateUtils.copyPropertiesIfPresent(request, entity, previousValues,
                VtsSystem.Fields.zones,
                VtsSystem.Fields.code,
                BaseApprovableEntity.Fields.orgUnitId,
                VtsSystemUpdateRequest.Fields.coordinates,
                VtsSystemUpdateRequest.Fields.geometryType);

        if (request.getZones() != null) {
            List<VtsZone> oldZones = entity.getZones() != null ? new ArrayList<>(entity.getZones()) : new ArrayList<>();
            List<VtsZoneDto> newZoneDtos = request.getZones();

            // 1. Identify added zones (in request but not in oldZones by code and ID)
            List<String> addedList = new ArrayList<>();
            for (VtsZoneDto nzd : newZoneDtos) {
                if (nzd == null) continue;
                boolean exists = oldZones.stream().anyMatch(oz ->
                    (nzd.getId() != null && oz.getId() != null && oz.getId().equals(nzd.getId()))
                    || (nzd.getCode() != null && oz.getCode() != null && oz.getCode().trim().equalsIgnoreCase(nzd.getCode().trim()))
                );
                if (!exists) {
                    String name = nzd.getName() != null ? nzd.getName().trim() : "";
                    String code = nzd.getCode() != null ? nzd.getCode().trim() : "";
                    addedList.add((!name.isEmpty() && !code.isEmpty()) ? name + " (" + code + ")" : (!name.isEmpty() ? name : code));
                }
            }

            // 2. Identify removed zones (in oldZones but not in request by code and ID)
            List<String> removedList = new ArrayList<>();
            for (VtsZone oz : oldZones) {
                if (oz == null) continue;
                boolean exists = newZoneDtos.stream().anyMatch(nzd ->
                    (nzd.getId() != null && oz.getId() != null && oz.getId().equals(nzd.getId()))
                    || (nzd.getCode() != null && oz.getCode() != null && oz.getCode().trim().equalsIgnoreCase(nzd.getCode().trim()))
                );
                if (!exists) {
                    String name = oz.getName() != null ? oz.getName().trim() : "";
                    String code = oz.getCode() != null ? oz.getCode().trim() : "";
                    removedList.add((!name.isEmpty() && !code.isEmpty()) ? name + " (" + code + ")" : (!name.isEmpty() ? name : code));
                }
            }

            // 3. Identify modified zones (matching by ID or code, but changed name or status)
            List<String> modifiedOldList = new ArrayList<>();
            List<String> modifiedNewList = new ArrayList<>();
            for (VtsZoneDto nzd : newZoneDtos) {
                if (nzd == null) continue;
                Optional<VtsZone> matched = oldZones.stream().filter(oz ->
                    (nzd.getId() != null && oz.getId() != null && oz.getId().equals(nzd.getId()))
                    || (nzd.getCode() != null && oz.getCode() != null && oz.getCode().trim().equalsIgnoreCase(nzd.getCode().trim()))
                ).findFirst();
                if (matched.isPresent()) {
                    VtsZone oz = matched.get();
                    String oldName = oz.getName() != null ? oz.getName().trim() : "";
                    String newName = nzd.getName() != null ? nzd.getName().trim() : "";
                    ConditionStatus oldCond = oz.getConditionStatus() != null ? oz.getConditionStatus() : ConditionStatus.OPERATIONAL;
                    ConditionStatus newCond = nzd.getConditionStatus() != null ? nzd.getConditionStatus() : ConditionStatus.OPERATIONAL;
                    if (!Objects.equals(oldName, newName) || oldCond != newCond) {
                        modifiedOldList.add(oldName + " (" + oz.getCode() + ")");
                        modifiedNewList.add(newName + " (" + nzd.getCode() + ")");
                    }
                }
            }

            boolean hasZoneChanges = !addedList.isEmpty() || !removedList.isEmpty() || !modifiedOldList.isEmpty();
            if (hasZoneChanges) {
                List<String> prevParts = new ArrayList<>();
                for (String r : removedList) {
                    prevParts.add("Xóa " + r);
                }
                for (String m : modifiedOldList) {
                    prevParts.add("Cũ: " + m);
                }

                List<String> newParts = new ArrayList<>();
                for (String a : addedList) {
                    newParts.add("Thêm " + a);
                }
                for (String m : modifiedNewList) {
                    newParts.add("Mới: " + m);
                }

                String prevZonesStr = prevParts.isEmpty() ? "—" : String.join(", ", prevParts);
                String newZonesStr = newParts.isEmpty() ? "—" : String.join(", ", newParts);
                previousValues.put(VtsSystem.Fields.zones, prevZonesStr);
                customNewValues.put(VtsSystem.Fields.zones, newZonesStr);
            }

            if (entity.getZones() != null) {
                entity.getZones().clear();
            } else {
                entity.setZones(new ArrayList<>());
            }
            entity.getZones().addAll(newZoneDtos.stream().map(dto -> {
                VtsZone z = new VtsZone();
                if (dto.getId() != null) {
                    z.setId(dto.getId());
                }
                z.setCode(dto.getCode());
                z.setName(dto.getName());
                z.setConditionStatus(
                        dto.getConditionStatus() != null ? dto.getConditionStatus() : ConditionStatus.OPERATIONAL);
                UUID creator = oldZones.stream()
                        .filter(oz -> oz != null && oz.getId() != null && oz.getId().equals(dto.getId())
                                && oz.getCreatedBy() != null)
                        .map(VtsZone::getCreatedBy)
                        .findFirst()
                        .orElse(effectiveUserId);
                z.setCreatedBy(creator != null ? creator : effectiveUserId);
                z.setUpdatedBy(effectiveUserId);
                z.setVtsSystem(entity);
                return z;
            }).collect(Collectors.toList()));
        }

        // Attachment smart delta diff
        List<String> addedAtts = request.getAddedAttachmentNames();
        List<String> removedAtts = request.getRemovedAttachmentNames();
        boolean hasAttachmentChanges = (addedAtts != null && !addedAtts.isEmpty()) || (removedAtts != null && !removedAtts.isEmpty());
        if (hasAttachmentChanges) {
            List<String> prevAttParts = new ArrayList<>();
            if (removedAtts != null) {
                for (String r : removedAtts) {
                    if (r != null && !r.trim().isEmpty()) {
                        prevAttParts.add("Xóa " + r.trim());
                    }
                }
            }
            List<String> newAttParts = new ArrayList<>();
            if (addedAtts != null) {
                for (String a : addedAtts) {
                    if (a != null && !a.trim().isEmpty()) {
                        newAttParts.add("Thêm " + a.trim());
                    }
                }
            }
            String prevAttStr = prevAttParts.isEmpty() ? "—" : String.join(", ", prevAttParts);
            String newAttStr = newAttParts.isEmpty() ? "—" : String.join(", ", newAttParts);
            previousValues.put("attachments", prevAttStr);
            customNewValues.put("attachments", newAttStr);
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
                String spatialName = "Hệ thống VTS "
                        + (request.getSystemName() != null ? request.getSystemName() : entity.getSystemName()) +
                        (request.getAddress() != null && !request.getAddress().isBlank() ? " - " + request.getAddress()
                                : (entity.getAddress() != null && !entity.getAddress().isBlank()
                                        ? " - " + entity.getAddress()
                                        : ""));
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
                String addr = request.getAddress() != null ? request.getAddress()
                        : (entity.getAddress() != null ? entity.getAddress() : "");
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

        boolean hasFieldChanges = !previousValues.isEmpty();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            // Keep approved status when editing already approved records
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else if (request.getApprovalStatus() != null) {
            ApprovalStatus requestedStatus = request.getApprovalStatus();
            entity.setApprovalStatus(requestedStatus);
            // Luồng "Lưu và phê duyệt" khi tạo mới: hồ sơ được tạo ở trạng thái Lưu
            // tạm (để tải được tệp đính kèm) rồi mới chuyển thẳng sang Đã duyệt.
            // Phải ghi lại người duyệt + nhật ký như create(), nếu không hồ sơ sẽ
            // mang trạng thái Đã duyệt mà không có dấu vết ai duyệt.
            if (requestedStatus == ApprovalStatus.APPROVED && entity.getApproverLevel2() == null) {
                // Duyệt thẳng bỏ qua 2 vòng chỉ dành cho tài khoản cấp Cục.
                if (!approvalService.isDepartmentLevelUser(effectiveUserId)) {
                    throw new IllegalStateException(
                            "Chỉ tài khoản cấp Cục mới được lưu và phê duyệt trực tiếp; "
                                    + "các đơn vị khác phải gửi hồ sơ qua quy trình phê duyệt 2 cấp");
                }
                entity.setApproverLevel2(effectiveUserId);
                entity.setApprovedDateLevel2(LocalDateTime.now());
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(entity.getId())
                        .refType(InfrastructureType.VTS_SYSTEM)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.APPROVED)
                        .approvedBy(effectiveUserId)
                        .reason("Tạo mới và phê duyệt hệ thống VTS")
                        .changedField("Trạng thái phê duyệt")
                        .previousValue(previousApprovalStatus != null ? previousApprovalStatus.getLabel() : null)
                        .newValue(ApprovalStatus.APPROVED.getLabel())
                        .build());
            }
        }

        if (hasFieldChanges) {
            entity.setUpdatedBy(effectiveUserId);
        }

        VtsSystem saved = repository.save(entity);

        // Only record field change history if the record was already approved (final level)
        if (hasFieldChanges && wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(saved.getId())
                    .refType(InfrastructureType.VTS_SYSTEM)
                    .approvalLevel(null)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(effectiveUserId)
                    .reason("Cập nhật sau phê duyệt")
                    .changedField(formatChangedFields(previousValues))
                    .previousValue(formatPreviousValues(previousValues))
                    .newValue(formatNewValues(saved, previousValues, customNewValues))
                    .build());
        }

        return toLightResponse(saved);
    }

    public void delete(UUID id, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + id));

        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, entity.getOrgUnitId(), "Đơn vị quản lý");
        }

        // T13/N04/BR-017: chỉ hồ sơ "Lưu tạm" mới xóa được; xóa mềm chuyển sang
        // "Đã xóa (lịch sử)" (ARCHIVED) và giữ nguyên bản ghi trong DB để đối chiếu.
        approvalService.deleteDraft(entity, InfrastructureType.VTS_SYSTEM, userId);
        entity.softDelete(userId);
        repository.save(entity);
    }

    public VtsSystemResponse submit(UUID id, UUID userId) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Hệ thống VTS với ID: " + id));

        DataScopeContext scope = resolveDataScope();
        if (scope.enabled()) {
            validateAllowedOrgUnit(scope, entity.getOrgUnitId(), "Đơn vị quản lý");
        }

        approvalService.submit(entity, InfrastructureType.VTS_SYSTEM, userId);
        VtsSystem saved = repository.save(entity);
        return toLightResponse(saved);
    }

    public VtsSystemResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        VtsSystem entity = loadWithinScope(id);

        approvalService.approveC1(entity, InfrastructureType.VTS_SYSTEM, request.getDecision(), request.getReason(),
                userId);
        VtsSystem saved = repository.save(entity);
        return toLightResponse(saved);
    }

    public VtsSystemResponse approveC2(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        VtsSystem entity = loadWithinScope(id);

        approvalService.approveC2(entity, InfrastructureType.VTS_SYSTEM, request.getDecision(), request.getReason(),
                userId);
        VtsSystem saved = repository.save(entity);
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
        List<InfrastructureHistory> list;
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
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = resolveUsers(userIds);
        Map<UUID, String> userNameMap = new java.util.HashMap<>();
        userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));

        return list.stream()
                .map(h -> {
                    HistoryEntry entry = new HistoryEntry();
                    entry.setId(h.getId());
                    entry.setApprovalLevel(h.getApprovalLevel());
                    entry.setStatus(h.getStatus() != null ? h.getStatus().getCode() : null);
                    entry.setApprovedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null);
                    // Không fallback sang UUID: thà để trống còn hơn hiện mã máy.
                    String unitName = null;
                    if (h.getApprovedBy() != null && userMap.get(h.getApprovedBy()) != null) {
                        User u = userMap.get(h.getApprovedBy());
                        if (u.getOrgUnit() != null && u.getOrgUnit().getName() != null && !u.getOrgUnit().getName().isBlank()) {
                            unitName = u.getOrgUnit().getName();
                        } else if (u.getDepartment() != null && !u.getDepartment().isBlank()) {
                            unitName = u.getDepartment();
                        } else {
                            unitName = "Cục Hàng hải Việt Nam";
                        }
                    }
                    entry.setOrgUnitName(unitName != null ? unitName : "Cục Hàng hải Việt Nam");
                    entry.setApprovedDate(h.getApprovedDate());
                    entry.setReason(h.getReason());
                    entry.setChangedField(h.getChangedField());
                    entry.setPreviousValue(h.getPreviousValue());
                    entry.setNewValue(h.getNewValue());
                    return entry;
                })
                .collect(Collectors.toList());
    }

    public VtsSystemAttachmentResponse uploadAttachment(UUID vtsSystemId, MultipartFile file, UUID userId) {
        VtsSystem entity = loadWithinScope(vtsSystemId);
        ensureAttachmentEditable(entity);
        ensureAttachmentQuota(vtsSystemId);
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

        UUID effectiveUserId = userId != null ? userId : SecurityUtils.getCurrentUserId();
        entity.setUpdatedBy(effectiveUserId);
        repository.save(entity);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        if (historyRepository != null && wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(vtsSystemId)
                    .refType(InfrastructureType.VTS_SYSTEM)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(effectiveUserId)
                    .approvedDate(LocalDateTime.now())
                    .reason("Tải lên tài liệu đính kèm: " + originalName)
                    .changedField("Tài liệu đính kèm")
                    .previousValue("—")
                    .newValue(originalName)
                    .build());
        }

        return toAttachmentResponse(saved);
    }

    public void deleteAttachment(UUID vtsSystemId, UUID attachmentId) {
        VtsSystem entity = loadWithinScope(vtsSystemId);
        ensureAttachmentEditable(entity);
        InfrastructureAttachment attachment = attachmentRepository
                .findByIdAndRefIdAndRefType(attachmentId, vtsSystemId, InfrastructureType.VTS_SYSTEM)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài liệu đính kèm"));
        String fileName = attachment.getFileName();
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (IOException ex) {
            throw new RuntimeException("Không thể xóa tài liệu đính kèm", ex);
        }
        attachmentRepository.delete(attachment);

        UUID effectiveUserId = SecurityUtils.getCurrentUserId();
        entity.setUpdatedBy(effectiveUserId);
        repository.save(entity);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        if (historyRepository != null && wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(vtsSystemId)
                    .refType(InfrastructureType.VTS_SYSTEM)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(effectiveUserId)
                    .approvedDate(LocalDateTime.now())
                    .reason("Xóa tài liệu đính kèm: " + fileName)
                    .changedField("Tài liệu đính kèm")
                    .previousValue(fileName)
                    .newValue("—")
                    .build());
        }
    }

    public InfrastructureAttachment getAttachment(UUID vtsSystemId, UUID attachmentId) {
        loadWithinScope(vtsSystemId);
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, vtsSystemId, InfrastructureType.VTS_SYSTEM)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài liệu đính kèm"));
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
        DataScopeContext scope = resolveDataScopeForFilter(orgUnitId);
        if (scope.enabled() && scope.orgUnitIds().isEmpty()) {
            return List.of();
        }
        if (year == null) {
            pageResult = repository.search(scope.enabled(), scope.orgUnitIds(), orgUnitId,
                    keywordLike, conditionStatus, approvalStatus, pageable);
        } else {
            LocalDate fromDate = LocalDate.of(year, 1, 1);
            LocalDate toDate = LocalDate.of(year + 1, 1, 1);
            pageResult = repository.searchByDateRange(scope.enabled(), scope.orgUnitIds(), orgUnitId,
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
        List<VtsSystemAttachmentResponse> attachments = Collections.emptyList();
        if (includeAttachments && entity.getId() != null) {
            List<InfrastructureAttachment> atts = attachmentRepository
                    .findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(), InfrastructureType.VTS_SYSTEM);
            Set<UUID> uploaderIds = atts.stream()
                    .map(InfrastructureAttachment::getUploadedBy)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());
            Map<UUID, String> uploaderNames = resolveUserNames(uploaderIds);
            attachments = atts.stream()
                    .map(a -> toAttachmentResponse(a, uploaderNames.get(a.getUploadedBy())))
                    .collect(Collectors.toList());
        }

        List<VtsZoneDto> zones = includeZones && entity.getId() != null
                ? zoneRepository.findByVtsSystemIdOrderByCreatedAtAsc(entity.getId()).stream()
                        .map(this::toZoneDto)
                        .collect(Collectors.toList())
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
        String updatedByName = null;
        String submittedByName = null;
        String approverLevel1Name = null;
        String approverLevel2Name = null;

        if (includeCreatedByName) {
            Set<UUID> userIds = new LinkedHashSet<>();
            if (entity.getCreatedBy() != null) userIds.add(entity.getCreatedBy());
            if (entity.getUpdatedBy() != null) userIds.add(entity.getUpdatedBy());
            if (entity.getSubmittedBy() != null) userIds.add(entity.getSubmittedBy());
            if (entity.getApproverLevel1() != null) userIds.add(entity.getApproverLevel1());
            if (entity.getApproverLevel2() != null) userIds.add(entity.getApproverLevel2());

            Map<UUID, String> userNameMap = resolveUserNames(userIds);
            createdByName = userNameMap.get(entity.getCreatedBy());
            updatedByName = userNameMap.get(entity.getUpdatedBy());
            submittedByName = userNameMap.get(entity.getSubmittedBy());
            approverLevel1Name = userNameMap.get(entity.getApproverLevel1());
            approverLevel2Name = userNameMap.get(entity.getApproverLevel2());
        }

        String approvalContentLevel1 = entity.getLevel1ApprovalContent();
        if ((approvalContentLevel1 == null || approvalContentLevel1.isBlank()) && entity.getApproverLevel1() != null) {
            approvalContentLevel1 = "Đã phê duyệt";
        }
        String approvalContentLevel2 = entity.getLevel2ApprovalContent();
        if ((approvalContentLevel2 == null || approvalContentLevel2.isBlank())
                && (entity.getApproverLevel2() != null || entity.getApprovalStatus() == ApprovalStatus.APPROVED)) {
            approvalContentLevel2 = "Đã phê duyệt";
        }

        return VtsSystemResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .systemName(entity.getSystemName())
                .conditionStatus(entity.getConditionStatus())
                .zones(zones)
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .owningOrgId(entity.getOwningOrgId())
                .owningOrgName(orgUnitCacheService.getName(entity.getOwningOrgId()))
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(resolveOperatingOrgName(entity.getOperatingOrgId()))
                .portId(entity.getPortId())
                .portName(portCacheService.getName(entity.getPortId()))
                .provinceId(entity.getProvinceId())
                .address(entity.getAddress())
                .maritimeNotice(entity.getMaritimeNotice())
                .operationStartDate(entity.getOperationStartDate())
                .scope(entity.getScope())
                .note(entity.getNote())
                .approvalStatus(entity.getApprovalStatus())
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approverLevel1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvalContentLevel1(approvalContentLevel1)
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approverLevel2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvalContentLevel2(approvalContentLevel2)
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdDate(entity.getCreatedAt())
                .submittedByName(submittedByName)
                .submittedDate(entity.getSubmittedAt())
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
        return formatUserIdentity(user);
    }

    private String formatZones(List<?> zones) {
        if (zones == null || zones.isEmpty()) {
            return "Chưa có";
        }
        List<String> formatted = zones.stream().map(z -> {
            if (z instanceof VtsZone vz) {
                String name = vz.getName() != null ? vz.getName().trim() : "";
                String code = vz.getCode() != null ? vz.getCode().trim() : "";
                if (!name.isEmpty() && !code.isEmpty()) return name + " (" + code + ")";
                if (!name.isEmpty()) return name;
                if (!code.isEmpty()) return code;
                return "";
            } else if (z instanceof VtsZoneDto zd) {
                String name = zd.getName() != null ? zd.getName().trim() : "";
                String code = zd.getCode() != null ? zd.getCode().trim() : "";
                if (!name.isEmpty() && !code.isEmpty()) return name + " (" + code + ")";
                if (!name.isEmpty()) return name;
                if (!code.isEmpty()) return code;
                return "";
            }
            return String.valueOf(z).trim();
        }).filter(s -> !s.isBlank()).sorted().collect(Collectors.toList());

        return formatted.isEmpty() ? "Chưa có" : String.join(", ", formatted);
    }

    private VtsSystemListItemResponse toListItemResponse(VtsSystemListProjection item) {
        return toListItemResponse(item, Collections.emptyMap());
    }

    private VtsSystemListItemResponse toListItemResponse(VtsSystemListProjection item, Map<UUID, String> userNameMap) {
        UUID updatedBy = item.getUpdatedBy();
        String updatedByName = updatedBy != null ? userNameMap.get(updatedBy) : null;
        UUID createdBy = item.getCreatedBy();
        String createdByName = createdBy != null ? userNameMap.get(createdBy) : null;
        UUID approverLevel1 = item.getApproverLevel1();

        String operatingOrgName = item.getOperatingOrgName();
        if (operatingOrgName == null && item.getOperatingOrgId() != null) {
            operatingOrgName = resolveOperatingOrgName(item.getOperatingOrgId());
        }

        return VtsSystemListItemResponse.builder()
                .id(item.getId())
                .code(item.getCode())
                .systemName(item.getSystemName())
                .address(item.getAddress())
                .conditionStatus(item.getConditionStatus())
                .orgUnitId(item.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(item.getOrgUnitId()))
                .approvalStatus(item.getApprovalStatus())
                .rejectionReason(item.getRejectionReason())
                .approverLevel1(approverLevel1)
                .createdBy(createdBy)
                .createdByName(createdByName)
                .updatedDate(item.getUpdatedDate())
                .updatedByName(updatedByName)
                .owningOrgId(item.getOwningOrgId())
                .owningOrgName(orgUnitCacheService.getName(item.getOwningOrgId()))
                .operatingOrgId(item.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .portId(item.getPortId())
                .portName(portCacheService.getName(item.getPortId()))
                .provinceId(item.getProvinceId())
                .operationStartDate(item.getOperationStartDate())
                .build();
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON)
            return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment attachment, String uploadedByName) {
        return VtsSystemAttachmentResponse.builder()
                .id(attachment.getId())
                .fileName(attachment.getFileName())
                .filePath("/api/v1/vts-systems/" + attachment.getRefId()
                        + "/attachments/" + attachment.getId() + "/download")
                .fileSize(attachment.getFileSize())
                .documentType(attachment.getFileType() != null ? attachment.getFileType().getCode() : "OTHER")
                .uploadedBy(attachment.getUploadedBy())
                .uploadedByName(uploadedByName)
                .uploadedDate(attachment.getUploadedDate())
                .build();
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment attachment) {
        String uploadedByName = attachment.getUploadedBy() != null
                ? resolveUserName(attachment.getUploadedBy())
                : null;
        return toAttachmentResponse(attachment, uploadedByName);
    }

    /** Số tệp đính kèm tối đa cho một hồ sơ (khớp giới hạn hiển thị ở giao diện). */
    private static final int MAX_ATTACHMENTS = 10;
    private static final long MAX_ATTACHMENT_SIZE = 20 * 1024 * 1024L;

    /**
     * Kiểm tra trạng thái hồ sơ có cho phép thay đổi tài liệu đính kèm hay không (quy tắc 12).
     */
    private void ensureAttachmentEditable(VtsSystem entity) {
        approvalService.assertEditable(entity);
    }

    private void ensureAttachmentQuota(UUID vtsSystemId) {
        long current = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(vtsSystemId, InfrastructureType.VTS_SYSTEM).size();
        if (current >= MAX_ATTACHMENTS) {
            throw new IllegalArgumentException(
                    "Số lượng tài liệu đính kèm tối đa là " + MAX_ATTACHMENTS + " tệp theo quy định");
        }
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được để trống");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được vượt quá 20MB");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        List<String> allowed = List.of(
                "application/pdf", "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "image/jpeg", "image/png", "image/gif", "image/tiff", "image/tif");
        if (!allowed.contains(contentType) && !isAllowedFileExtension(file.getOriginalFilename())) {
            throw new IllegalArgumentException("Định dạng tài liệu không được hỗ trợ");
        }
    }

    private boolean isAllowedFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return false;
        String ext = filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        return List.of("pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif", "tiff", "tif").contains(ext);
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
        if (field == null)
            return "";
        if (VtsSystem.Fields.systemName.equals(field))
            return "Tên hệ thống";
        if (VtsSystem.Fields.conditionStatus.equals(field))
            return "Tình trạng";
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field))
            return "Đơn vị quản lý";
        if (VtsSystem.Fields.owningOrgId.equals(field))
            return "Đơn vị chủ quản";
        if (VtsSystem.Fields.operatingOrgId.equals(field))
            return "Đơn vị vận hành";
        if (VtsSystem.Fields.portId.equals(field))
            return "Thuộc cảng biển";
        if (VtsSystem.Fields.code.equals(field))
            return "Mã hệ thống VTS";
        if (BaseApprovableEntity.Fields.provinceId.equals(field) || "province".equals(field))
            return "Địa điểm (Tỉnh/TP)";
        if (VtsSystem.Fields.address.equals(field))
            return "Địa điểm chi tiết";
        if (VtsSystem.Fields.maritimeNotice.equals(field))
            return "Thông báo hàng hải";
        if (VtsSystem.Fields.operationStartDate.equals(field))
            return "Thời gian bắt đầu hoạt động";
        if (VtsSystem.Fields.scope.equals(field))
            return "Phạm vi áp dụng";
        if (VtsSystem.Fields.note.equals(field))
            return "Ghi chú";
        if (BaseApprovableEntity.Fields.approvalStatus.equals(field))
            return "Trạng thái phê duyệt";
        if (VtsSystem.Fields.zones.equals(field) || "zones".equals(field))
            return "Vùng VTS";
        if ("attachments".equals(field) || "attachmentList".equals(field) || "Tài liệu đính kèm".equals(field))
            return "Tài liệu đính kèm";
        if (EntityFields.DELETED_AT.equals(field))
            return "Thời điểm xóa";
        if (VtsSystemUpdateRequest.Fields.coordinates.equals(field))
            return "Tọa độ GIS";
        if (VtsSystemUpdateRequest.Fields.geometryType.equals(field))
            return "Loại đối tượng GIS";
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

    private String formatNewValues(VtsSystem entity, Map<String, String> previousValues, Map<String, String> customNewValues) {
        return previousValues.keySet().stream()
                .map(field -> {
                    String raw = (customNewValues != null && customNewValues.containsKey(field))
                            ? customNewValues.get(field)
                            : currentFieldValue(entity, field);
                    return getFieldDisplayName(field) + "=" + formatDisplayValue(field, raw);
                })
                .collect(Collectors.joining("; "));
    }

    private String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty())
            return "";
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)
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
        if (BaseApprovableEntity.Fields.provinceId.equals(field) || "provinceId".equals(field) || "province".equals(field)) {
            try {
                int pid = Integer.parseInt(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class,
                        pid);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (VtsSystem.Fields.conditionStatus.equals(field)) {
            if (ConditionStatus.OPERATIONAL.name().equals(rawValue))
                return "Đang hoạt động";
            if (ConditionStatus.STOPPED.name().equals(rawValue))
                return "Dừng hoạt động";
            if (ConditionStatus.MAINTENANCE.name().equals(rawValue))
                return "Đang bảo trì";
            if (ConditionStatus.UNDER_CONSTRUCTION.name().equals(rawValue))
                return "Đang xây dựng";
            return rawValue;
        }
        if (BaseApprovableEntity.Fields.approvalStatus.equals(field)) {
            if (ApprovalStatus.DRAFT.name().equals(rawValue))
                return "Bản nháp";
            if (ApprovalStatus.PROPOSED.name().equals(rawValue))
                return "Chờ phê duyệt";
            if (ApprovalStatus.PENDING_APPROVAL.name().equals(rawValue))
                return "Chờ phê duyệt";
            if (ApprovalStatus.APPROVED_LEVEL1.name().equals(rawValue))
                return "Đã phê duyệt cấp Chi cục";
            if (ApprovalStatus.APPROVED_LEVEL2.name().equals(rawValue))
                return "Đã phê duyệt cấp Cục";
            if (ApprovalStatus.APPROVED.name().equals(rawValue))
                return "Đã phê duyệt";
            if (ApprovalStatus.REJECTED.name().equals(rawValue))
                return "Từ chối";
            return rawValue;
        }
        if (VtsSystemUpdateRequest.Fields.geometryType.equals(field)) {
            if (GisGeometryType.POINT.name().equals(rawValue))
                return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equals(rawValue) || "LINESTRING".equals(rawValue))
                return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equals(rawValue))
                return "Đối tượng vùng";
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
        if (field == null || entity == null)
            return "";
        if (VtsSystem.Fields.systemName.equals(field))
            return String.valueOf(entity.getSystemName());
        if (VtsSystem.Fields.conditionStatus.equals(field))
            return String.valueOf(entity.getConditionStatus());
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field))
            return String.valueOf(entity.getOrgUnitId());
        if (VtsSystem.Fields.owningOrgId.equals(field))
            return String.valueOf(entity.getOwningOrgId());
        if (VtsSystem.Fields.operatingOrgId.equals(field))
            return String.valueOf(entity.getOperatingOrgId());
        if (VtsSystem.Fields.portId.equals(field))
            return String.valueOf(entity.getPortId());
        if (VtsSystem.Fields.code.equals(field))
            return String.valueOf(entity.getCode());
        if (BaseApprovableEntity.Fields.provinceId.equals(field) || "province".equals(field))
            return String.valueOf(entity.getProvinceId());
        if (VtsSystem.Fields.address.equals(field))
            return String.valueOf(entity.getAddress());
        if (VtsSystem.Fields.maritimeNotice.equals(field))
            return String.valueOf(entity.getMaritimeNotice());
        if (VtsSystem.Fields.operationStartDate.equals(field))
            return String.valueOf(entity.getOperationStartDate());
        if (VtsSystem.Fields.scope.equals(field))
            return String.valueOf(entity.getScope());
        if (VtsSystem.Fields.note.equals(field))
            return String.valueOf(entity.getNote());
        if (VtsSystem.Fields.zones.equals(field) || "zones".equals(field)) {
            return formatZones(entity.getZones());
        }
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
        return countByApprovalStatus(resolveDataScopeForFilter(null), null, null, null, null, null, null,
                null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword,
            ConditionStatus conditionStatus) {
        return countByApprovalStatus(resolveDataScopeForFilter(orgUnitId), orgUnitId, null, null, keyword, null, null,
                conditionStatus, null, null, null, null);
    }

    private java.util.Map<String, Long> countByApprovalStatus(
            DataScopeContext scope, UUID orgUnitId, UUID portId, Integer provinceId, String keyword,
            String systemName, String code,
            ConditionStatus conditionStatus, LocalDate fromDate, LocalDate toDate,
            LocalDateTime updatedFrom, LocalDateTime updatedTo) {
        if (scope.enabled() && scope.orgUnitIds().isEmpty()) {
            return Collections.emptyMap();
        }
        java.util.Map<String, Long> counts = new java.util.LinkedHashMap<>();
        List<Object[]> rows = repository.countByApprovalStatus(
                scope.enabled(), scope.orgUnitIds(), orgUnitId, portId, provinceId, keyword, systemName, code, conditionStatus,
                fromDate, toDate, updatedFrom, updatedTo);
        for (Object[] row : rows) {
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
        return resolveDataScope(null);
    }

    private DataScopeContext resolveDataScope(Map<UUID, List<UUID>> childIndex) {
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

        boolean nationwide = currentUser.getAllPermissions().contains("orgunit:scope_all")
                || currentUser.getAllPermissions().contains("admin:all")
                || currentUser.getAllPermissions().contains("*");
        if (nationwide) {
            return new DataScopeContext(false, List.of());
        }

        if (currentUser.getOrgUnit() == null || currentUser.getOrgUnit().getId() == null) {
            return new DataScopeContext(true, List.of());
        }
        return new DataScopeContext(true, resolveSubtreeIdsByParentId(currentUser.getOrgUnit().getId(),
                childIndex != null ? childIndex : buildOrgUnitChildIndex()));
    }

    /**
     * Resolve the effective scope for a list filter. Selecting an organisation
     * includes that organisation and all descendants, then intersects the
     * result with the caller's own scope. This keeps list rows and status
     * counts consistent with the hierarchy permission rule.
     */
    private DataScopeContext resolveDataScopeForFilter(UUID selectedOrgUnitId) {
        // Dựng chỉ mục một lần rồi dùng chung cho cả phạm vi của người dùng lẫn
        // cây đơn vị được chọn ở bộ lọc.
        Map<UUID, List<UUID>> childIndex = buildOrgUnitChildIndex();
        DataScopeContext callerScope = resolveDataScope(childIndex);
        if (selectedOrgUnitId == null) {
            return callerScope;
        }

        if (callerScope.enabled() && !callerScope.orgUnitIds().contains(selectedOrgUnitId)) {
            return new DataScopeContext(true, List.of());
        }

        List<UUID> selectedSubtree = resolveSubtreeIdsByParentId(selectedOrgUnitId, childIndex);
        if (!callerScope.enabled()) {
            return new DataScopeContext(true, selectedSubtree);
        }

        Set<UUID> callerOrgUnitIds = new LinkedHashSet<>(callerScope.orgUnitIds());
        return new DataScopeContext(true, selectedSubtree.stream()
                .filter(callerOrgUnitIds::contains)
                .toList());
    }

    /**
     * Resolve the user's visible organisational subtree from parent_id. The
     * materialized path is display metadata only and must not decide access.
     */
    private List<UUID> resolveSubtreeIdsByParentId(UUID rootId) {
        return resolveSubtreeIdsByParentId(rootId, buildOrgUnitChildIndex());
    }

    /**
     * Chỉ mục con-theo-cha dựng từ cache đơn vị. Tách riêng để một request cần
     * duyệt nhiều cây (phạm vi của người dùng + đơn vị được chọn ở bộ lọc) chỉ
     * phải dựng chỉ mục một lần thay vì mỗi lần gọi.
     */
    private Map<UUID, List<UUID>> buildOrgUnitChildIndex() {
        return orgUnitCacheService.getList().stream()
                .filter(unit -> unit.getId() != null && unit.getParentId() != null)
                .collect(Collectors.groupingBy(
                        OrgUnitResponse::getParentId,
                        LinkedHashMap::new,
                        Collectors.mapping(OrgUnitResponse::getId, Collectors.toList())));
    }

    private List<UUID> resolveSubtreeIdsByParentId(UUID rootId, Map<UUID, List<UUID>> childIdsByParent) {
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
        if (userIds == null || userIds.isEmpty())
            return Collections.emptyMap();
        Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (nonNullIds.isEmpty())
            return Collections.emptyMap();
        return userRepository.findAllByIdInWithOrgUnit(nonNullIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user, (first, second) -> first));
    }

    private String formatUserName(User user) {
        return formatUserIdentity(user);
    }

    /**
     * list-screen-ui-standard §3: cán bộ hiển thị bằng Họ và tên; tuyệt đối không
     * để lộ email hay UUID ra giao diện. Không tra được tên thì trả null để phía
     * hiển thị dùng dấu "—".
     */
    private String formatUserIdentity(User user) {
        if (user == null) {
            return null;
        }
        if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
            return user.getFullName().trim();
        }
        if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
            return user.getUsername().trim();
        }
        return null;
    }

    private String resolveUserName(UUID userId) {
        if (userId == null)
            return null;
        Map<UUID, String> map = resolveUserNames(Collections.singletonList(userId));
        return map.get(userId);
    }

    public List<VtsSystemOptionResponse> getOptions(UUID orgUnitId) {
        OrgUnitScopeService.Scope userScope = orgUnitScopeService != null ? orgUnitScopeService.currentUserScope() : OrgUnitScopeService.Scope.all();
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
