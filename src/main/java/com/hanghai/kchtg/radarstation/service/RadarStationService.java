package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RadarStationService {

    private final RadarStationRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final VtsSystemRepository vtsSystemRepository;
    private final PortRepository portRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    /**
     * Sinh mã trạm radar tự động: 'RADAR-' + 4 chữ số (RADAR-0001, RADAR-0002, ...).
     * Dựa trên tổng số bản ghi hiện có, kiểm tra trùng lặp bằng existsByCode.
     */
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
        String action = request.getAction() != null ? request.getAction().trim() : "draft";
        if (action.isEmpty()) action = "draft";
        if (!"draft".equals(action) && !"submit".equals(action)) {
            throw new IllegalArgumentException("Action không hợp lệ: " + action + ". Chỉ chấp nhận 'draft' hoặc 'submit'");
        }

        // Mã tự động sinh ở server — bỏ qua code từ client
        String code = generateCode();

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
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
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

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.CREATED)
                .approvedBy(createdBy)
                .reason("Tạo mới trạm radar")
                .build());

        return toResponse(saved);
    }

    public RadarStationResponse getById(UUID id) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        if (entity.getDeletedAt() != null) {
            throw new RuntimeException("Trạm Radar đã bị xóa với ID: " + id);
        }
        return toResponse(entity);
    }

    /**
     * List records sitting at a given approval status, mirroring the endpoint the
     * other infrastructure modules expose.
     */
    public List<RadarStationResponse> findByApprovalStatus(ApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(approvalStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<RadarStationResponse> findAll(int page, int size) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    public RadarStationResponse update(UUID id, RadarStationUpdateRequest request, UUID updatedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getDeletedAt() != null) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        // BR-057-02: sau khi sửa, trạng thái phê duyệt quay về PROPOSED — cần duyệt lại
        if (entity.getApprovalStatus() != ApprovalStatus.PROPOSED) {
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setApprovedLevel1(false);
            entity.setApproverLevel1(null);
            entity.setApprovedDateLevel1(null);
            entity.setApprovedLevel2(false);
            entity.setApproverLevel2(null);
            entity.setApprovedDateLevel2(null);
            entity.setRejectionReason(null);
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

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.UPDATED)
                .approvedBy(updatedBy)
                .reason("Cập nhật thông tin trạm radar")
                .build());

        return toResponse(saved);
    }

    public void delete(UUID id, UUID deletedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED) với ID: " + id);
        }

        entity.softDelete(deletedBy);
        repository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }

        historyRepository.save(ApprovalHistory.builder()
                .refId(entity.getId()).refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.DELETED)
                .approvedBy(deletedBy)
                .reason("Xóa trạm radar")
                .build());
    }

    public RadarStationResponse approveC1(UUID id, ApprovalRequest request, UUID approvedBy) {
        boolean autoApproved = false;
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.PROPOSED) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Chờ duyệt (PROPOSED) với ID: " + id);
        }

        if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())) {
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovedLevel1(true);
            entity.setApproverLevel1(approvedBy);
            entity.setApprovedDateLevel1(LocalDateTime.now());

            // Phê duyệt 1 bước (y hệt /beacon-lights): duyệt thẳng APPROVED, không cần cấp 2.
            entity.setApprovedLevel2(true);
            entity.setApproverLevel2(approvedBy);
            entity.setApprovedDateLevel2(LocalDateTime.now());
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            autoApproved = true;
        }

        RadarStation saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                .approvedBy(approvedBy)
                .reason(request.getReason())
                .build());

        if (autoApproved) {
            historyRepository.save(ApprovalHistory.builder()
                    .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                    .approvedBy(approvedBy)
                    .reason(request.getReason())
                    .build());
        }

        return toResponse(saved);
    }

    public RadarStationResponse approveC2(UUID id, ApprovalRequest request, UUID approvedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Chờ phê duyệt (PENDING_APPROVAL) với ID: " + id);
        }

        UUID c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())) {
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovedLevel2(true);
            entity.setApproverLevel2(approvedBy);
            entity.setApprovedDateLevel2(LocalDateTime.now());
        }

        RadarStation saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                .approvedBy(approvedBy)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID radarStationId) {
        List<ApprovalHistory> historyList = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, radarStationId);
        Set<UUID> userIds = historyList.stream()
                .map(ApprovalHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNames = resolveUserNames(userIds);

        return historyList.stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                        .approvedBy(h.getApprovedBy() != null ? userNames.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : null)
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .build()).toList();
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
        if (userId == null) return null;
        Map<UUID, String> map = resolveUserNames(Collections.singletonList(userId));
        return map.getOrDefault(userId, userId.toString());
    }

    public List<RadarStationResponse> search(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatusStr) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        ApprovalStatus statusEnum = (approvalStatusStr != null && !approvalStatusStr.trim().isEmpty()) ? ApprovalStatus.fromString(approvalStatusStr) : null;
        return repository.search(orgUnitId, keywordLike, conditionStatus, statusEnum, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Tìm kiếm mở rộng có phân trang cho màn danh sách F-068.
     * keyword khớp stationName/code (substring, không phân biệt hoa/thường).
     * Lọc thêm theo cán bộ cập nhật (updatedBy) và khoảng ngày cập nhật (updatedFrom/updatedTo).
     */
    public Page<RadarStationResponse> searchPaged(String keyword, UUID orgUnitId, UUID seaportId,
                                                   UUID vtsSystemId, UUID vtsOperationCenterId,
                                                   UUID operatingUnitId, Integer provinceId,
                                                   String conditionStatus, String approvalStatusStr,
                                                   UUID updatedBy, LocalDateTime updatedFrom, LocalDateTime updatedTo,
                                                   Pageable pageable) {
        String trimmedKeyword = (keyword != null && !keyword.trim().isEmpty()) ? keyword.trim() : null;
        ApprovalStatus statusEnum = (approvalStatusStr != null && !approvalStatusStr.trim().isEmpty())
                ? ApprovalStatus.fromString(approvalStatusStr)
                : null;
        return repository.searchPaged(trimmedKeyword, orgUnitId, seaportId, vtsSystemId,
                        vtsOperationCenterId, operatingUnitId, provinceId, conditionStatus, statusEnum,
                        updatedBy, updatedFrom, updatedTo, pageable)
                .map(this::toResponse);
    }

    // ── Attachment operations (InfrastructureAttachment + refType RADAR_STATION) ──

    @Transactional
    public List<RadarStationAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

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

    public List<RadarStationAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.RADAR_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
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
                .approvedLevel1(entity.getApprovedLevel1())
                .approverLevel1(entity.getApproverLevel1())
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvedLevel2(entity.getApprovedLevel2())
                .approverLevel2(entity.getApproverLevel2())
                .approvedDateLevel2(entity.getApprovedDateLevel2())
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
