package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RadarStationService {

    private final RadarStationRepository repository;
    private final InfrastructureHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final VtsSystemRepository vtsSystemRepository;
    private final PortRepository portRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final InfrastructureApprovalService approvalService;
    private final OrgUnitScopeService orgUnitScopeService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

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

    @Transactional(readOnly = true)
    public String generateCode() {
        long next = repository.count() + 1;
        String code = String.format("RADAR-%04d", next);
        while (repository.existsByCode(code)) {
            next++;
            code = String.format("RADAR-%04d", next);
        }
        return code;
    }

    public RadarStationResponse create(RadarStationCreateRequest request, UUID createdBy) {
        validateAllowedOrgUnit(request.getOrgUnitId());

        String action = request.getAction() != null ? request.getAction().trim().toLowerCase() : "draft";
        if (!"draft".equals(action) && !"submit".equals(action)) {
            throw new IllegalArgumentException("Action không hợp lệ: " + action + ". Chỉ chấp nhận 'draft' hoặc 'submit'");
        }

        String code = generateCode();
        ApprovalStatus initialStatus = "submit".equals(action) ? ApprovalStatus.PENDING_APPROVAL : ApprovalStatus.DRAFT;

        RadarStation entity = RadarStation.builder()
                .code(code)
                .stationName(trimToNull(request.getStationName()))
                .location(trimToNull(request.getLocation()))
                .stationType(trimToNull(request.getStationType()))
                .coverage(trimToNull(request.getCoverage()))
                .emissionArea(request.getEmissionArea())
                .source(trimToNull(request.getSource()))
                .conditionStatus(request.getConditionStatus() != null ? request.getConditionStatus().trim() : "1")
                .orgUnitId(request.getOrgUnitId())
                .seaportId(request.getSeaportId())
                .vtsSystemId(request.getVtsSystemId())
                .vtsOperationCenterId(request.getVtsOperationCenterId())
                .operatingUnitId(request.getOperatingUnitId())
                .provinceId(request.getProvinceId())
                .unitOfMeasure(trimToNull(request.getUnitOfMeasure()))
                .quantity(request.getQuantity())
                .note(trimToNull(request.getNote()))
                .towerHeight(request.getTowerHeight())
                .radarRange(request.getRadarRange())
                .approvalStatus(initialStatus)
                .build();

        RadarStation saved = repository.save(entity);

        String coordinates = trimToNull(request.getCoordinates());
        if (coordinates == null && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_OTHER;
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getStationName(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.RADAR_STATION_LEGACY
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(InfrastructureHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("submit".equals(action) ? InfrastructureHistoryStatus.PROPOSED : InfrastructureHistoryStatus.CREATED)
                .approvedBy(createdBy)
                .reason("submit".equals(action) ? "Tạo mới và gửi phê duyệt trạm radar" : "Tạo mới trạm radar (Lưu tạm)")
                .build());

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RadarStationResponse getById(UUID id) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        if (entity.getDeletedAt() != null || entity.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Trạm Radar đã bị xóa hoặc lưu trữ với ID: " + id);
        }
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<RadarStationResponse> findByApprovalStatus(ApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(approvalStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RadarStationResponse> findAll(int page, int size) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    public RadarStationResponse update(UUID id, RadarStationUpdateRequest request, UUID updatedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getDeletedAt() != null || entity.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        validateAllowedOrgUnit(entity.getOrgUnitId());
        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        if (request.getStationName() != null) entity.setStationName(request.getStationName().trim());
        if (request.getLocation() != null) entity.setLocation(request.getLocation().trim());
        if (request.getStationType() != null) entity.setStationType(request.getStationType().trim());
        if (request.getCoverage() != null) entity.setCoverage(request.getCoverage().trim());
        if (request.getEmissionArea() != null) entity.setEmissionArea(request.getEmissionArea());
        if (request.getSource() != null) entity.setSource(request.getSource().trim());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus().trim());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
        if (request.getSeaportId() != null) entity.setSeaportId(request.getSeaportId());
        if (request.getVtsSystemId() != null) entity.setVtsSystemId(request.getVtsSystemId());
        if (request.getVtsOperationCenterId() != null) entity.setVtsOperationCenterId(request.getVtsOperationCenterId());
        if (request.getOperatingUnitId() != null) entity.setOperatingUnitId(request.getOperatingUnitId());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getUnitOfMeasure() != null) entity.setUnitOfMeasure(request.getUnitOfMeasure().trim());
        if (request.getQuantity() != null) entity.setQuantity(request.getQuantity());
        if (request.getNote() != null) entity.setNote(request.getNote().trim());
        if (request.getTowerHeight() != null) entity.setTowerHeight(request.getTowerHeight());
        if (request.getRadarRange() != null) entity.setRadarRange(request.getRadarRange());

        RadarStation saved = repository.save(entity);

        String coordinates = trimToNull(request.getCoordinates());
        if (coordinates == null && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_OTHER;
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getStationName(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.RADAR_STATION_LEGACY
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repository.save(saved);
        }

        if (wasApproved) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(saved.getId())
                    .refType(InfrastructureType.RADAR_STATION)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(updatedBy)
                    .reason("Cập nhật thông tin trạm radar sau phê duyệt")
                    .build());
        }

        return toResponse(saved);
    }

    public void delete(UUID id, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        validateAllowedOrgUnit(entity.getOrgUnitId());

        InfrastructureHistoryUtils.recordSoftDelete(historyRepository, entity.getId(), InfrastructureType.RADAR_STATION, userId, "Xóa trạm radar");
        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(userId);
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repository.save(entity);
    }

    public RadarStationResponse submitForApproval(UUID id, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.RADAR_STATION, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse approveLevel1(UUID id, UUID userId, String note) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.RADAR_STATION, "APPROVED", note, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse approveLevel2(UUID id, UUID userId, String note) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.RADAR_STATION, "APPROVED", note, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse rejectLevel1(UUID id, UUID userId, String reason) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.RADAR_STATION, "REJECTED", reason, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse rejectLevel2(UUID id, UUID userId, String reason) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.RADAR_STATION, "REJECTED", reason, userId);
        return toResponse(repository.save(entity));
    }

    // Aliases for legacy controllers
    public RadarStationResponse approveL1(UUID id, UUID approverId) {
        return approveLevel1(id, approverId, "Phê duyệt Cấp 1 trạm radar");
    }

    public RadarStationResponse reject(UUID id, String rejectReason, UUID approverId) {
        return rejectLevel1(id, approverId, rejectReason);
    }

    @Transactional(readOnly = true)
    public List<RadarStationOptionResponse> getOptions(UUID orgUnitId) {
        return repository.findAllApprovedOptions(orgUnitId).stream()
                .map(r -> RadarStationOptionResponse.builder()
                        .id(r.getId())
                        .code(r.getCode())
                        .stationName(r.getStationName())
                        .orgUnitId(r.getOrgUnitId())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts(UUID orgUnitId, String keyword, String conditionStatus) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        List<Object[]> rows = repository.countByApprovalStatus(
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
    public Page<RadarStationResponse> searchPaged(String keyword, UUID orgUnitId, UUID seaportId,
                                                   UUID vtsSystemId, UUID vtsOperationCenterId,
                                                   UUID operatingUnitId, Integer provinceId,
                                                   String conditionStatus, String approvalStatusStr,
                                                   String legacyStatus, UUID updatedBy, LocalDateTime updatedFrom, LocalDateTime updatedTo,
                                                   Pageable pageable) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        ApprovalStatus statusEnum = (approvalStatusStr != null && !approvalStatusStr.trim().isEmpty())
                ? ApprovalStatus.fromString(approvalStatusStr)
                : null;

        return repository.searchPaged(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern,
                seaportId, vtsSystemId, vtsOperationCenterId, operatingUnitId, provinceId,
                conditionStatus, statusEnum, updatedBy, updatedFrom, updatedTo, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<RadarStationResponse> search(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatusStr) {
        return searchPaged(keyword, orgUnitId, null, null, null, null, null,
                conditionStatus, approvalStatusStr, null, null, null, null, Pageable.unpaged())
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID radarStationId) {
        List<InfrastructureHistory> historyList = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                InfrastructureType.RADAR_STATION, radarStationId);
        Set<UUID> userIds = historyList.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNames = resolveUserNames(userIds);

        return historyList.stream().map(h -> {
            HistoryEntry entry = new HistoryEntry();
            entry.setId(h.getId());
            entry.setApprovalLevel(h.getApprovalLevel());
            entry.setStatus(h.getStatus() != null ? h.getStatus().getCode() : null);
            entry.setApprovedBy(h.getApprovedBy() != null ? userNames.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : null);
            entry.setApprovedDate(h.getApprovedDate());
            entry.setReason(h.getReason());
            return entry;
        }).toList();
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

    // ── Attachment operations ─────────────────────────────────────────

    public List<RadarStationAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        validateAllowedOrgUnit(entity.getOrgUnitId());

        long existingCount = attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.RADAR_STATION).size();
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }

        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
        List<InfrastructureAttachment> savedAttachments = new ArrayList<>();
        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;

            try {
                java.nio.file.Path dir = basePath.resolve(InfrastructureType.RADAR_STATION.name()).resolve(id.toString());
                java.nio.file.Files.createDirectories(dir);
                java.nio.file.Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                log.warn("Không thể lưu file {} cho trạm radar {}: {}", originalFilename, id, e.getMessage());
                throw new RuntimeException("Không thể lưu file: " + originalFilename);
            }

            InfrastructureAttachment attachment = InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.RADAR_STATION)
                    .fileName(originalFilename)
                    .filePath(basePath.resolve(InfrastructureType.RADAR_STATION.name()).resolve(id.toString()).resolve(storageFileName).toString())
                    .fileSize(file.getSize())
                    .fileType(AttachmentFileType.fromValue(file.getContentType()))
                    .uploadedBy(userId)
                    .build();
            savedAttachments.add(attachmentRepository.save(attachment));
        }
        return savedAttachments.stream().map(this::toAttachmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RadarStationAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.RADAR_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());

        InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.RADAR_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);
    }

    private RadarStationAttachmentResponse toAttachmentResponse(InfrastructureAttachment a) {
        return RadarStationAttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileSize(a.getFileSize())
                .documentType(a.getFileType() != null ? a.getFileType().getCode() : "OTHER")
                .uploadedBy(a.getUploadedBy() != null ? a.getUploadedBy().toString() : null)
                .uploadedDate(a.getUploadedDate())
                .build();
    }

    private RadarStationResponse toResponse(RadarStation entity) {
        List<RadarStationAttachmentResponse> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(), InfrastructureType.RADAR_STATION)
                .stream().map(this::toAttachmentResponse).toList();

        RadarStationResponse.RadarStationResponseBuilder builder = RadarStationResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .stationName(entity.getStationName())
                .location(entity.getLocation())
                .stationType(entity.getStationType())
                .coverage(entity.getCoverage())
                .emissionArea(entity.getEmissionArea())
                .source(entity.getSource())
                .conditionStatus(entity.getConditionStatus())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .seaportId(entity.getSeaportId())
                .seaportName(entity.getSeaportId() != null ?
                        portRepository.findById(entity.getSeaportId()).map(Port::getPortName).orElse("") : "")
                .vtsSystemId(entity.getVtsSystemId())
                .vtsSystemName(entity.getVtsSystemId() != null ?
                        vtsSystemRepository.findById(entity.getVtsSystemId()).map(VtsSystem::getSystemName).orElse("") : "")
                .vtsOperationCenterId(entity.getVtsOperationCenterId())
                .vtsOperationCenterName(entity.getVtsOperationCenterId() != null ?
                        vtsSystemRepository.findById(entity.getVtsOperationCenterId()).map(VtsSystem::getSystemName).orElse("") : "")
                .operatingUnitId(entity.getOperatingUnitId())
                .operatingUnitName(orgUnitCacheService.getName(entity.getOperatingUnitId()))
                .provinceId(entity.getProvinceId())
                .unitOfMeasure(entity.getUnitOfMeasure())
                .quantity(entity.getQuantity())
                .note(entity.getNote())
                .approvalStatus(entity.getApprovalStatus())
                .status(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : "DRAFT")
                .approverLevel1(entity.getApproverLevel1())
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvedLevel1(entity.getApproverLevel1() != null)
                .approverLevel2(entity.getApproverLevel2())
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvedLevel2(entity.getApproverLevel2() != null)
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdDate(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedDate(entity.getUpdatedAt())
                .attachments(attachments)
                .towerHeight(entity.getTowerHeight())
                .radarRange(entity.getRadarRange());

        if (entity.getSpatialId() != null) {
            builder.spatialId(entity.getSpatialId());
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        builder.longitude(new BigDecimal(parts[0]));
                        builder.latitude(new BigDecimal(parts[1]));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }
        return builder.build();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
