package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;

@Service
@RequiredArgsConstructor
@Transactional
public class RadarStationService {

    private final RadarStationRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final VtsSystemRepository vtsSystemRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;

    public RadarStationResponse create(RadarStationCreateRequest request, UUID createdBy) {
        RadarStation entity = RadarStation.builder()
                .stationName(request.getStationName())
                .location(request.getLocation())
                .stationType(request.getStationType())
                .coverage(request.getCoverage())
                .emissionArea(request.getEmissionArea())
                .source(request.getSource())
                .conditionStatus(request.getConditionStatus())
                .orgUnitId(request.getOrgUnitId())
                .vtsSystemId(request.getVtsSystemId())
                .towerHeight(request.getTowerHeight())
                .radarRange(request.getRadarRange())
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false)
               .approvedLevel2(false)
                .build();

        RadarStation saved = repository.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
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

        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        }

        if (request.getStationName() != null) entity.setStationName(request.getStationName());
        if (request.getLocation() != null) entity.setLocation(request.getLocation());
        if (request.getStationType() != null) entity.setStationType(request.getStationType());
        if (request.getCoverage() != null) entity.setCoverage(request.getCoverage());
        if (request.getEmissionArea() != null) entity.setEmissionArea(request.getEmissionArea());
        if (request.getSource() != null) entity.setSource(request.getSource());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
        if (request.getVtsSystemId() != null) entity.setVtsSystemId(request.getVtsSystemId());
        if (request.getTowerHeight() != null) entity.setTowerHeight(request.getTowerHeight());
        if (request.getRadarRange() != null) entity.setRadarRange(request.getRadarRange());

        RadarStation saved = repository.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
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

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovedLevel1(true);
            entity.setApproverLevel1(approvedBy);
            entity.setApprovedDateLevel1(LocalDateTime.now());

            if (AdminAutoApproval.isAutoApprover()) {
                // Administrators clear both levels in one step.
                entity.setApprovedLevel2(true);
                entity.setApproverLevel2(approvedBy);
                entity.setApprovedDateLevel2(LocalDateTime.now());
                entity.setApprovalStatus(ApprovalStatus.APPROVED);
                autoApproved = true;
            } else {
                entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            }
        }

        RadarStation saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.fromValue(request.getQuyetDinh()))
                .approvedBy(approvedBy)
                .reason(request.getReason())
                .build());

        if (autoApproved) {
            historyRepository.save(ApprovalHistory.builder()
                    .refId(saved.getId()).refType(InfrastructureType.RADAR_STATION)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(ApprovalHistoryStatus.fromValue(request.getQuyetDinh()))
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
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Đang xem xét (UNDER_REVIEW) với ID: " + id);
        }

        UUID c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
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
                .status(ApprovalHistoryStatus.fromValue(request.getQuyetDinh()))
                .approvedBy(approvedBy)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID radarStationId) {
        return historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.RADAR_STATION, radarStationId)
                .stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                        .approvedBy(resolveUserName(h.getApprovedBy()))
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .build()).toList();
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> (u.getFullName() != null && !u.getFullName().trim().isEmpty())
                        ? u.getFullName()
                        : u.getUsername())
                .orElse(userId.toString());
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

    private RadarStationResponse toResponse(RadarStation entity) {
        List<RadarStationAttachmentResponse> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(), InfrastructureType.RADAR_STATION)
                .stream().map(a -> RadarStationAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .filePath(a.getFilePath())
                        .fileSize(a.getFileSize())
                        .documentType(a.getFileType() != null ? a.getFileType().getCode() : "OTHER")
                        .uploadedBy(a.getUploadedBy() != null ? a.getUploadedBy().toString() : null)
                        .uploadedDate(a.getUploadedDate())
                        .build()).toList();

        RadarStationResponse.RadarStationResponseBuilder builder = RadarStationResponse.builder()
                .id(entity.getId())
                .stationName(entity.getStationName())
                .location(entity.getLocation())
                .stationType(entity.getStationType())
                .coverage(entity.getCoverage())
                .emissionArea(entity.getEmissionArea())
                .source(entity.getSource())
                .conditionStatus(entity.getConditionStatus())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
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
                .vtsSystemId(entity.getVtsSystemId())
                .towerHeight(entity.getTowerHeight())
                .radarRange(entity.getRadarRange())
                .vtsSystemName(entity.getVtsSystemId() != null ?
                    vtsSystemRepository.findById(entity.getVtsSystemId())
                        .map(VtsSystem::getSystemName)
                        .orElse("") : "");

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
}
