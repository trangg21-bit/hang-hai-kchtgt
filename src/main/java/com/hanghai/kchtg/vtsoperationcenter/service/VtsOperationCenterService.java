package com.hanghai.kchtg.vtsoperationcenter.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.vtsoperationcenter.dto.HistoryEntry;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterListItem;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterRequest;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterResponse;
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
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Slf4j
public class VtsOperationCenterService {

    private final VtsOperationCenterRepository repository;
    private final VtsSystemRepository vtsSystemRepository;
    private final PortRepository portRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final InfrastructureApprovalService approvalService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final PortCacheService portCacheService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == null || geomType == GisGeometryType.POINT) {
            return GisSpatialObjectType.POINT_OTHER;
        }
        if (geomType == GisGeometryType.POLYGON) {
            return GisSpatialObjectType.POLYGON_OTHER;
        }
        return GisSpatialObjectType.LINE_OTHER;
    }

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

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.allows(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
        }
    }

    @Transactional
    public VtsOperationCenterResponse create(VtsOperationCenterRequest request, UUID userId) {
        validateAllowedOrgUnit(request.getOrgUnitId());

        if (request.getCode() == null || request.getCode().trim().isEmpty()) {
            request.setCode(generateCode());
        }
        if (repository.existsByCodeAndDeletedAtIsNull(request.getCode().trim())) {
            throw new IllegalArgumentException("Mã trung tâm điều hành VTS '" + request.getCode() + "' đã tồn tại");
        }

        VtsSystem vtsSystem = vtsSystemRepository.findById(request.getVtsSystemId())
                .orElseThrow(() -> new IllegalArgumentException("Hệ thống VTS không tồn tại"));

        OrgUnit orgUnit = orgUnitRepository.findById(request.getOrgUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Đơn vị quản lý không tồn tại"));

        VtsOperationCenter entity = VtsOperationCenter.builder()
                .code(request.getCode().trim())
                .name(request.getName().trim())
                .vtsSystemId(vtsSystem.getId())
                .portId(request.getPortId())
                .orgUnitId(orgUnit.getId())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation() != null ? request.getDetailedLocation().trim() : null)
                .coverage(request.getCoverage() != null ? request.getCoverage().trim() : null)
                .conditionStatus(request.getConditionStatus() != null ? request.getConditionStatus()
                        : ConditionStatus.OPERATIONAL)
                .note(request.getNote())
                .spatialId(request.getSpatialId())
                .approvalStatus(
                        request.getApprovalStatus() != null ? request.getApprovalStatus() : ApprovalStatus.DRAFT)
                .createdBy(userId)
                .updatedBy(userId)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        VtsOperationCenter saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Trung tâm điều hành VTS " + saved.getName(),
                    "TTDH_" + saved.getId(),
                    request.getGeometryType(),
                    request.getCoordinates(),
                    saved.getId(),
                    InfrastructureType.VTS_OPERATION_CENTER);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        // Ghi lịch sử tạo mới
        historyRepository.save(InfrastructureHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.VTS_OPERATION_CENTER)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.CREATED)
                .approvedBy(userId)
                .reason("Tạo mới trung tâm điều hành VTS: " + saved.getName())
                .build());

        return toResponse(saved);
    }

    @Transactional
    public VtsOperationCenterResponse update(UUID id, VtsOperationCenterRequest request, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại"));

        validateAllowedOrgUnit(entity.getOrgUnitId());
        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
        }

        if (request.getCode() != null
                && repository.existsByCodeAndIdNotAndDeletedAtIsNull(request.getCode().trim(), id)) {
            throw new IllegalArgumentException(
                    "Mã trung tâm điều hành VTS '" + request.getCode() + "' đã được sử dụng");
        }

        VtsSystem vtsSystem = vtsSystemRepository.findById(request.getVtsSystemId())
                .orElseThrow(() -> new IllegalArgumentException("Hệ thống VTS không tồn tại"));

        OrgUnit orgUnit = orgUnitRepository.findById(request.getOrgUnitId())
                .orElseThrow(() -> new IllegalArgumentException("Đơn vị quản lý không tồn tại"));

        Map<String, String> previousValues = new LinkedHashMap<>();
        EntityUpdateUtils.copyPropertiesIfPresent(request, entity, previousValues,
                VtsOperationCenterRequest.Fields.geometryType);

        if (request.getCoordinates() != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    entity.getSpatialId(),
                    "Trung tâm điều hành VTS " + (request.getName() != null ? request.getName() : entity.getName()),
                    "TTDH_" + entity.getId(),
                    geomType,
                    request.getCoordinates(),
                    entity.getId(),
                    InfrastructureType.VTS_OPERATION_CENTER);
            entity.setSpatialId(spatialId);
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else if (request.getApprovalStatus() != null) {
            entity.setApprovalStatus(request.getApprovalStatus());
        }

        entity.setUpdatedBy(userId);
        entity.setUpdatedAt(LocalDateTime.now());
        VtsOperationCenter saved = repository.save(entity);

        if (wasApproved && !previousValues.isEmpty()) {
            for (Map.Entry<String, String> entry : previousValues.entrySet()) {
                String field = entry.getKey();
                String fieldName = getFieldDisplayName(field);
                String oldVal = formatDisplayValue(field, entry.getValue());
                Object rawNew = getEntityFieldValue(saved, field);
                String newVal = formatDisplayValue(field, rawNew != null ? String.valueOf(rawNew) : null);
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.VTS_OPERATION_CENTER)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(userId)
                        .changedField(fieldName)
                        .previousValue(oldVal)
                        .newValue(newVal)
                        .reason("Cập nhật thông tin " + fieldName)
                        .build());
            }
        }

        return toResponse(saved);
    }

    private Object getEntityFieldValue(VtsOperationCenter entity, String fieldName) {
        if (entity == null || fieldName == null) return null;
        if (fieldName.equals(VtsOperationCenter.Fields.name)) return entity.getName();
        if (fieldName.equals(VtsOperationCenter.Fields.code)) return entity.getCode();
        if (fieldName.equals(VtsOperationCenter.Fields.vtsSystemId)) return entity.getVtsSystemId();
        if (fieldName.equals(VtsOperationCenter.Fields.portId)) return entity.getPortId();
        if (fieldName.equals(BaseApprovableEntity.Fields.orgUnitId)) return entity.getOrgUnitId();
        if (fieldName.equals(BaseApprovableEntity.Fields.provinceId)) return entity.getProvinceId();
        if (fieldName.equals(VtsOperationCenter.Fields.detailedLocation)) return entity.getDetailedLocation();
        if (fieldName.equals(VtsOperationCenter.Fields.coverage)) return entity.getCoverage();
        if (fieldName.equals(VtsOperationCenter.Fields.conditionStatus)) return entity.getConditionStatus();
        if (fieldName.equals(VtsOperationCenter.Fields.note)) return entity.getNote();
        if (fieldName.equals(VtsOperationCenter.Fields.spatialId)) return entity.getSpatialId();
        return null;
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại"));

        validateAllowedOrgUnit(entity.getOrgUnitId());

        // T13/N04/BR-017: chỉ hồ sơ "Lưu tạm" mới xóa được; xóa mềm chuyển sang
        // "Đã xóa (lịch sử)" (ARCHIVED) và giữ nguyên bản ghi trong CSDL.
        approvalService.deleteDraft(entity, InfrastructureType.VTS_OPERATION_CENTER, userId);

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
                InfrastructureType.VTS_OPERATION_CENTER,
                userId,
                "Xóa trung tâm điều hành VTS: " + entity.getName());
    }

    @Transactional(readOnly = true)
    public VtsOperationCenterResponse getById(UUID id) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Trung tâm điều hành VTS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<VtsOperationCenterListItem> search(
            String keyword,
            UUID orgUnitId,
            UUID vtsSystemId,
            UUID portId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            Pageable pageable) {

        Scope scope = resolveEffectiveScope(orgUnitId);
        if (!scope.unrestricted() && scope.orgUnitIds().isEmpty()) {
            return new PageImpl<>(List.of(), pageable, 0);
        }

        String kw = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        Page<VtsOperationCenter> page = repository.search(
                !scope.unrestricted(),
                scope.orgUnitIds(),
                null,
                vtsSystemId,
                portId,
                provinceId,
                conditionStatus,
                approvalStatus,
                kw,
                pageable);

        List<VtsOperationCenter> content = page.getContent();
        if (content.isEmpty()) {
            return new PageImpl<>(List.of(), pageable, page.getTotalElements());
        }

        // Batch pre-fetch all relations for the page in 4 fast queries instead of N+1
        // queries
        Set<UUID> vtsSystemIds = content.stream().map(VtsOperationCenter::getVtsSystemId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<UUID> portIds = content.stream().map(VtsOperationCenter::getPortId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<UUID> orgUnitIds = content.stream().map(VtsOperationCenter::getOrgUnitId).filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<UUID> userIds = new HashSet<>();
        for (VtsOperationCenter c : content) {
            if (c.getCreatedBy() != null)
                userIds.add(c.getCreatedBy());
            if (c.getUpdatedBy() != null)
                userIds.add(c.getUpdatedBy());
        }

        Map<UUID, String> vtsSystemMap = vtsSystemIds.isEmpty() ? Map.of()
                : vtsSystemRepository.findAllById(vtsSystemIds).stream()
                        .collect(Collectors.toMap(VtsSystem::getId, VtsSystem::getSystemName, (a, b) -> a));
        Map<UUID, String> portMap = portIds.isEmpty() ? Map.of()
                : portRepository.findAllById(portIds).stream()
                        .collect(Collectors.toMap(Port::getId, Port::getPortName, (a, b) -> a));
        Map<UUID, String> orgUnitMap = orgUnitIds.isEmpty() ? Map.of()
                : orgUnitRepository.findAllById(orgUnitIds).stream()
                        .collect(Collectors.toMap(OrgUnit::getId, OrgUnit::getName, (a, b) -> a));
        Map<UUID, String> userMap = userIds.isEmpty() ? Map.of()
                : userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId,
                                u -> (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName()
                                        : u.getUsername(),
                                (a, b) -> a));

        List<VtsOperationCenterListItem> items = content.stream()
                .map(e -> toListItem(e, vtsSystemMap, portMap, orgUnitMap, userMap))
                .toList();

        return new PageImpl<>(items, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByStatus(
            String keyword,
            UUID orgUnitId,
            UUID vtsSystemId,
            UUID portId,
            Integer provinceId,
            ConditionStatus conditionStatus) {

        Scope scope = resolveEffectiveScope(orgUnitId);
        if (!scope.unrestricted() && scope.orgUnitIds().isEmpty()) {
            Map<String, Long> emptyCounts = new HashMap<>();
            emptyCounts.put("ALL", 0L);
            for (ApprovalStatus s : ApprovalStatus.values()) {
                emptyCounts.put(s.name(), 0L);
            }
            return emptyCounts;
        }

        String kw = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        List<Object[]> rows = repository.countByApprovalStatus(
                !scope.unrestricted(),
                scope.orgUnitIds(),
                null,
                vtsSystemId,
                portId,
                provinceId,
                conditionStatus,
                kw);

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

    @Transactional
    public void submit(UUID id, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại"));
        approvalService.submit(entity, InfrastructureType.VTS_OPERATION_CENTER, userId);
        repository.save(entity);
    }

    @Transactional
    public void approveC1(UUID id, String decision, String reason, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại"));
        approvalService.approveC1(entity, InfrastructureType.VTS_OPERATION_CENTER, decision, reason, userId);
        repository.save(entity);
    }

    @Transactional
    public void approveC2(UUID id, String decision, String reason, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại"));
        approvalService.approveC2(entity, InfrastructureType.VTS_OPERATION_CENTER, decision, reason, userId);
        repository.save(entity);
    }

    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new IllegalArgumentException("Trung tâm điều hành VTS không tồn tại"));
        ApprovalStatus currentStatus = entity.getApprovalStatus();
        if (currentStatus == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.VTS_OPERATION_CENTER, ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.VTS_OPERATION_CENTER, ApprovalStatus.REJECTED.name(), reason, userId);
        }
        repository.save(entity);
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
        VtsOperationCenter parent = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Trung tâm điều hành VTS không tồn tại"));
        validateAllowedOrgUnit(parent.getOrgUnitId());

        List<InfrastructureHistory> list = (page != null && pageSize != null && pageSize > 0)
                ? historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.VTS_OPERATION_CENTER, id, PageRequest.of(page, pageSize))
                : historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.VTS_OPERATION_CENTER, id);
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return list.stream()
                .map(h -> {
                    User u = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
                    // list-screen-ui-standard §3: chỉ Họ và tên (hoặc tên đăng nhập);
                    // không để lộ email hay UUID ra giao diện.
                    String userName = u != null
                            ? (u.getFullName() != null && !u.getFullName().trim().isEmpty() ? u.getFullName()
                                    : (u.getUsername() != null && !u.getUsername().trim().isEmpty() ? u.getUsername() : null))
                            : null;
                    String orgUnitName = u != null && u.getOrgUnit() != null ? u.getOrgUnit().getName() : null;
                    return HistoryEntry.builder()
                            .id(h.getId())
                            .approvalLevel(h.getApprovalLevel())
                            .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                            .approvedBy(userName)
                            .orgUnitName(orgUnitName)
                            .approvedDate(h.getApprovedDate())
                            .reason(h.getReason())
                            .changedField(h.getChangedField())
                            .previousValue(formatDisplayValue(h.getChangedField(), h.getPreviousValue()))
                            .newValue(formatDisplayValue(h.getChangedField(), h.getNewValue()))
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public List<VtsSystemAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Trung tâm điều hành VTS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ensureAttachmentEditable(entity);

        Path dir = Paths.get(uploadDir, "vts_operation_center", id.toString())
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục lưu trữ file", e);
        }

        long existing = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.VTS_OPERATION_CENTER).size();

        List<VtsSystemAttachmentResponse> uploaded = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f.isEmpty())
                continue;
            if (existing + uploaded.size() >= MAX_ATTACHMENTS) {
                throw new IllegalArgumentException(
                        "Số lượng tài liệu đính kèm tối đa là " + MAX_ATTACHMENTS + " tệp theo quy định");
            }
            validateAttachment(f);
            String originalFilename = Objects.requireNonNullElse(f.getOriginalFilename(),
                    "file_" + System.currentTimeMillis());
            // Làm sạch tên tệp trước khi ghép vào đường dẫn, rồi chốt lại bằng kiểm
            // tra thư mục đích để không thể ghi ra ngoài thư mục của hồ sơ.
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
                    .refType(InfrastructureType.VTS_OPERATION_CENTER)
                    .fileName(originalFilename)
                    .filePath(filePath.toString())
                    .fileSize(f.getSize())
                    .fileType(AttachmentFileType.fromValue(f.getContentType()))
                    .uploadedBy(userId)
                    .uploadedDate(LocalDateTime.now())
                    .build();

            InfrastructureAttachment saved = attachmentRepository.save(attachment);
            uploaded.add(toAttachmentResponse(saved));

            historyRepository.save(InfrastructureHistory.builder()
                    .refId(id)
                    .refType(InfrastructureType.VTS_OPERATION_CENTER)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(userId)
                    .reason("Tải lên tài liệu đính kèm: " + originalFilename)
                    .changedField("Tài liệu đính kèm")
                    .previousValue(null)
                    .newValue(originalFilename)
                    .build());
        }
        return uploaded;
    }

    @Transactional(readOnly = true)
    public List<VtsSystemAttachmentResponse> listAttachments(UUID id) {
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Trung tâm điều hành VTS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        return loadAttachments(id);
    }

    /** Đọc tệp đính kèm sau khi hồ sơ cha đã được kiểm tra tồn tại và phạm vi. */
    private List<VtsSystemAttachmentResponse> loadAttachments(UUID id) {
        return attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.VTS_OPERATION_CENTER)
                .stream()
                .map(this::toAttachmentResponse)
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
     * N09/BR-019 — hồ sơ đang chờ duyệt bị khóa sửa, hồ sơ đã duyệt và đã xóa
     * cũng vậy. Chỉ "Lưu tạm" và "Bị trả về" mới được thay đổi tài liệu đính kèm.
     */
    private void ensureAttachmentEditable(VtsOperationCenter entity) {
        ApprovalStatus status = entity.getApprovalStatus();
        boolean editable = status == null
                || status == ApprovalStatus.DRAFT
                || status == ApprovalStatus.REJECTED_LEVEL1
                || status == ApprovalStatus.REJECTED_LEVEL2;
        if (!editable) {
            throw new IllegalStateException(
                    "Chỉ thay đổi được tài liệu đính kèm khi hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về. "
                            + "Trạng thái hiện tại: " + status.getLabel());
        }
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
        VtsOperationCenter entity = repository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new EntityNotFoundException("Trung tâm điều hành VTS không tồn tại"));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        ensureAttachmentEditable(entity);

        InfrastructureAttachment att = attachmentRepository.findById(attId)
                .orElseThrow(() -> new EntityNotFoundException("File đính kèm không tồn tại"));

        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.VTS_OPERATION_CENTER) {
            throw new IllegalArgumentException("File đính kèm không thuộc trung tâm điều hành VTS này");
        }

        try {
            Files.deleteIfExists(Paths.get(att.getFilePath()));
        } catch (IOException ignored) {
        }

        attachmentRepository.delete(att);

        historyRepository.save(InfrastructureHistory.builder()
                .refId(id)
                .refType(InfrastructureType.VTS_OPERATION_CENTER)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(userId)
                .reason("Xóa tài liệu đính kèm: " + att.getFileName())
                .changedField("Tài liệu đính kèm")
                .previousValue(att.getFileName())
                .newValue(null)
                .build());
    }

    private String getFieldDisplayName(String field) {
        if (field == null) return "";
        if (VtsOperationCenter.Fields.name.equals(field)) return "Tên trung tâm điều hành VTS";
        if (VtsOperationCenter.Fields.code.equals(field)) return "Mã trung tâm điều hành VTS";
        if (VtsOperationCenter.Fields.vtsSystemId.equals(field)) return "Thuộc hệ thống VTS";
        if (VtsOperationCenter.Fields.portId.equals(field)) return "Thuộc cảng biển";
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)) return "Đơn vị quản lý";
        if (BaseApprovableEntity.Fields.provinceId.equals(field)) return "Địa điểm (Tỉnh/TP)";
        if (VtsOperationCenter.Fields.detailedLocation.equals(field)) return "Địa điểm chi tiết";
        if (VtsOperationCenter.Fields.coverage.equals(field)) return "Vùng phủ sóng";
        if (VtsOperationCenter.Fields.conditionStatus.equals(field)) return "Tình trạng";
        if (VtsOperationCenter.Fields.note.equals(field)) return "Ghi chú";
        if (BaseApprovableEntity.Fields.approvalStatus.equals(field)) return "Trạng thái phê duyệt";
        if (VtsOperationCenterRequest.Fields.coordinates.equals(field)) return "Tọa độ GIS";
        if (VtsOperationCenterRequest.Fields.geometryType.equals(field)) return "Loại đối tượng GIS";
        return field;
    }

    private String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty() || "null".equalsIgnoreCase(rawValue) || "Chưa có".equals(rawValue)) {
            return "Chưa có";
        }
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)
                || getFieldDisplayName(BaseApprovableEntity.Fields.orgUnitId).equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (VtsOperationCenter.Fields.portId.equals(field)
                || getFieldDisplayName(VtsOperationCenter.Fields.portId).equals(field)) {
            try {
                String name = portCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if (VtsOperationCenter.Fields.vtsSystemId.equals(field)
                || getFieldDisplayName(VtsOperationCenter.Fields.vtsSystemId).equals(field)) {
            try {
                return vtsSystemRepository.findById(UUID.fromString(rawValue))
                        .map(VtsSystem::getSystemName)
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
        if (VtsOperationCenter.Fields.conditionStatus.equals(field)
                || getFieldDisplayName(VtsOperationCenter.Fields.conditionStatus).equals(field)) {
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
        if (VtsOperationCenterRequest.Fields.geometryType.equals(field)
                || getFieldDisplayName(VtsOperationCenterRequest.Fields.geometryType).equals(field)) {
            if (GisGeometryType.POINT.name().equals(rawValue)) return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equals(rawValue) || "LINESTRING".equals(rawValue)) return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equals(rawValue)) return "Đối tượng vùng";
            return rawValue;
        }
        if (VtsOperationCenterRequest.Fields.coordinates.equals(field)
                || getFieldDisplayName(VtsOperationCenterRequest.Fields.coordinates).equals(field)) {
            if (rawValue.trim().isEmpty() || "Chưa có".equals(rawValue)) {
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
            return rawValue;
        }
        return rawValue;
    }

    public String generateCode() {
        long count = repository.count();
        String candidate;
        int i = 1;
        do {
            candidate = String.format("TTDH-%06d", count + i);
            i++;
        } while (repository.existsByCodeAndDeletedAtIsNull(candidate));
        return candidate;
    }

    private VtsOperationCenterResponse toResponse(VtsOperationCenter entity) {
        String vtsSystemName = null;
        if (entity.getVtsSystemId() != null) {
            vtsSystemName = vtsSystemRepository.findById(entity.getVtsSystemId())
                    .map(VtsSystem::getSystemName)
                    .orElse(null);
        }

        // Tên cảng và tên đơn vị lấy từ cache dùng chung thay vì truy vấn riêng.
        String portName = portCacheService.getName(entity.getPortId());
        String orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());

        // Gom 4 người dùng (tạo / sửa / duyệt C1 / duyệt C2) vào một truy vấn.
        Set<UUID> relatedUserIds = Stream
                .of(entity.getCreatedBy(), entity.getUpdatedBy(), entity.getApproverLevel1(),
                        entity.getApproverLevel2())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        // Dùng HashMap thay cho Map.of(): các id dưới đây có thể null (hồ sơ chưa
        // qua duyệt) và Map.of().get(null) ném NullPointerException.
        Map<UUID, String> relatedUserNames = new HashMap<>();
        if (!relatedUserIds.isEmpty()) {
            userRepository.findAllById(relatedUserIds).stream()
                    .filter(u -> u.getFullName() != null && !u.getFullName().isBlank())
                    .forEach(u -> relatedUserNames.put(u.getId(), u.getFullName().trim()));
        }

        String createdByName = relatedUserNames.get(entity.getCreatedBy());
        String updatedByName = relatedUserNames.get(entity.getUpdatedBy());
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

        return VtsOperationCenterResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .vtsSystemId(entity.getVtsSystemId())
                .vtsSystemName(vtsSystemName)
                .portId(entity.getPortId())
                .portName(portName)
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .coverage(entity.getCoverage())
                .conditionStatus(entity.getConditionStatus())
                .note(entity.getNote())
                .spatialId(entity.getSpatialId())
                .geometryType(geometryType)
                .coordinates(coordinates)
                .approvalStatus(entity.getApprovalStatus())
                .approvalStatusLabel(entity.getApprovalStatus() != null ? entity.getApprovalStatus().getLabel() : null)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approver1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approver2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
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

    public VtsOperationCenterListItem toListItem(VtsOperationCenter entity) {
        return toListItem(entity, Map.of(), Map.of(), Map.of(), Map.of());
    }

    public VtsOperationCenterListItem toListItem(
            VtsOperationCenter entity,
            Map<UUID, String> vtsSystemMap,
            Map<UUID, String> portMap,
            Map<UUID, String> orgUnitMap,
            Map<UUID, String> userMap) {

        String vtsSystemName = null;
        if (entity.getVtsSystemId() != null) {
            vtsSystemName = vtsSystemMap.containsKey(entity.getVtsSystemId())
                    ? vtsSystemMap.get(entity.getVtsSystemId())
                    : vtsSystemRepository.findById(entity.getVtsSystemId()).map(VtsSystem::getSystemName).orElse(null);
        }

        String portName = null;
        if (entity.getPortId() != null) {
            portName = portMap.containsKey(entity.getPortId())
                    ? portMap.get(entity.getPortId())
                    : portRepository.findById(entity.getPortId()).map(Port::getPortName).orElse(null);
        }

        String orgUnitName = null;
        if (entity.getOrgUnitId() != null) {
            orgUnitName = orgUnitMap.containsKey(entity.getOrgUnitId())
                    ? orgUnitMap.get(entity.getOrgUnitId())
                    : orgUnitRepository.findById(entity.getOrgUnitId()).map(OrgUnit::getName).orElse(null);
        }

        String updatedByName = entity.getUpdatedBy() != null
                ? (userMap.containsKey(entity.getUpdatedBy()) ? userMap.get(entity.getUpdatedBy())
                        : userRepository.findById(entity.getUpdatedBy()).map(User::getFullName).orElse(null))
                : null;
        String createdByName = entity.getCreatedBy() != null
                ? (userMap.containsKey(entity.getCreatedBy()) ? userMap.get(entity.getCreatedBy())
                        : userRepository.findById(entity.getCreatedBy()).map(User::getFullName).orElse(null))
                : null;

        String approver1Name = entity.getApproverLevel1() != null
                ? (userMap.containsKey(entity.getApproverLevel1()) ? userMap.get(entity.getApproverLevel1())
                        : userRepository.findById(entity.getApproverLevel1()).map(User::getFullName).orElse(null))
                : null;
        String approver2Name = entity.getApproverLevel2() != null
                ? (userMap.containsKey(entity.getApproverLevel2()) ? userMap.get(entity.getApproverLevel2())
                        : userRepository.findById(entity.getApproverLevel2()).map(User::getFullName).orElse(null))
                : null;

        return VtsOperationCenterListItem.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .vtsSystemId(entity.getVtsSystemId())
                .vtsSystemName(vtsSystemName)
                .portId(entity.getPortId())
                .portName(portName)
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .coverage(entity.getCoverage())
                .conditionStatus(entity.getConditionStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalStatusLabel(entity.getApprovalStatus() != null ? entity.getApprovalStatus().getLabel() : null)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approver1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approver2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .rejectionReason(entity.getRejectionReason())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .build();
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment att) {
        return VtsSystemAttachmentResponse.builder()
                .id(att.getId())
                .fileName(att.getFileName())
                .filePath(att.getFilePath())
                .fileSize(att.getFileSize())
                .documentType(att.getFileType() != null ? att.getFileType().name() : null)
                .uploadedBy(att.getUploadedBy())
                .uploadedDate(att.getUploadedDate())
                .build();
    }

    @Transactional(readOnly = true)
    public List<VtsOperationCenterOptionResponse> getOptions(UUID orgUnitId) {
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
