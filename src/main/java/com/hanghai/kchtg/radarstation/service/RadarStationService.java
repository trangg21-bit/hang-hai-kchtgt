package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.radarstation.entity.*;
import com.hanghai.kchtg.radarstation.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
@Transactional
public class RadarStationService {

    private final RadarStationRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;
    private final VtsSystemRepository vtsSystemRepository;

    public RadarStationResponse create(RadarStationCreateRequest request, String createdBy) {
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
                .approvalStatus(RadarStationApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy(createdBy)
                .build();

        RadarStation saved = repository.save(entity);

        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_OTHER;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getStationName(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    toaDo,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.TRAM_RADAR
            );
            saved.setKhongGianId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(ApprovalHistory.builder()
                .radarStationId(saved.getId())
                .approvalLevel(0)
                .status("CREATE")
                .approvedBy(createdBy)
                .reason("Tạo mới trạm radar")
                .build());

        return toResponse(saved);
    }

    public RadarStationResponse getById(UUID id) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        if (entity.getIsDeleted()) {
            throw new RuntimeException("Trạm Radar đã bị xóa với ID: " + id);
        }
        return toResponse(entity);
    }

    public List<RadarStationResponse> findAll(int page, int size) {
        return repository.findByApprovalStatusAndIsDeletedFalse(RadarStationApprovalStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    public RadarStationResponse update(UUID id, RadarStationUpdateRequest request, String updatedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getIsDeleted()) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        if (entity.getApprovalStatus() == RadarStationApprovalStatus.APPROVED) {
            entity.setApprovalStatus(RadarStationApprovalStatus.UNDER_REVIEW);
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

        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getKinhDo() != null && request.getViDo() != null) {
            toaDo = "POINT(" + request.getKinhDo() + " " + request.getViDo() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_OTHER;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getKhongGianId(),
                    saved.getStationName(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    toaDo,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.TRAM_RADAR
            );
            saved.setKhongGianId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(ApprovalHistory.builder()
                .radarStationId(saved.getId())
                .approvalLevel(0)
                .status("UPDATE")
                .approvedBy(updatedBy)
                .reason("Cập nhật thông tin trạm radar")
                .build());

        return toResponse(saved);
    }

    public void delete(UUID id, String deletedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getApprovalStatus() != RadarStationApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED) với ID: " + id);
        }

        entity.setIsDeleted(true);
        repository.save(entity);
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }

        historyRepository.save(ApprovalHistory.builder()
                .radarStationId(entity.getId())
                .approvalLevel(0)
                .status("DELETE")
                .approvedBy(deletedBy)
                .reason("Xóa trạm radar")
                .build());
    }

    public RadarStationResponse approveC1(UUID id, ApprovalRequest request, String approvedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getApprovalStatus() != RadarStationApprovalStatus.PROPOSED) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Chờ duyệt (PROPOSED) với ID: " + id);
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(RadarStationApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus(RadarStationApprovalStatus.UNDER_REVIEW);
            entity.setApprovedLevel1(true);
            entity.setApproverLevel1(approvedBy);
            entity.setApprovedDateLevel1(LocalDateTime.now());
        }

        RadarStation saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .radarStationId(saved.getId())
                .approvalLevel(1)
                .status(request.getQuyetDinh())
                .approvedBy(approvedBy)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public RadarStationResponse approveC2(UUID id, ApprovalRequest request, String approvedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getApprovalStatus() != RadarStationApprovalStatus.UNDER_REVIEW) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Đang xem xét (UNDER_REVIEW) với ID: " + id);
        }

        String c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy) && !"admin".equals(approvedBy)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(RadarStationApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus(RadarStationApprovalStatus.APPROVED);
            entity.setApprovedLevel2(true);
            entity.setApproverLevel2(approvedBy);
            entity.setApprovedDateLevel2(LocalDateTime.now());
        }

        RadarStation saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .radarStationId(saved.getId())
                .approvalLevel(2)
                .status(request.getQuyetDinh())
                .approvedBy(approvedBy)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID radarStationId) {
        return historyRepository.findByRadarStationIdOrderByApprovedDateDesc(radarStationId)
                .stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus())
                        .approvedBy(h.getApprovedBy())
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .build()).toList();
    }

    public List<RadarStationResponse> search(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatusStr) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        RadarStationApprovalStatus statusEnum = (approvalStatusStr != null && !approvalStatusStr.trim().isEmpty()) ? RadarStationApprovalStatus.fromString(approvalStatusStr) : null;
        return repository.search(orgUnitId, keywordLike, conditionStatus, statusEnum, org.springframework.data.domain.Pageable.unpaged()).stream()
                .map(this::toResponse)
                .toList();
    }

    private RadarStationResponse toResponse(RadarStation entity) {
        List<RadarStationAttachmentResponse> attachments = entity.getAttachments().stream()
                .map(a -> RadarStationAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .filePath(a.getFilePath())
                        .fileSize(a.getFileSize())
                        .documentType(a.getDocumentType())
                        .uploadedBy(a.getUploadedBy())
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
                .approvalStatus(entity.getApprovalStatus())
                .approvedLevel1(entity.getApprovedLevel1())
                .approverLevel1(entity.getApproverLevel1())
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvedLevel2(entity.getApprovedLevel2())
                .approverLevel2(entity.getApproverLevel2())
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdDate(entity.getCreatedDate())
                .updatedBy(entity.getUpdatedBy())
                .updatedDate(entity.getUpdatedDate())
                .attachments(attachments)
                .vtsSystemId(entity.getVtsSystemId())
                .towerHeight(entity.getTowerHeight())
                .radarRange(entity.getRadarRange())
                .vtsSystemName(entity.getVtsSystemId() != null ? 
                    vtsSystemRepository.findById(entity.getVtsSystemId())
                        .map(VtsSystem::getSystemName)
                        .orElse("") : "");

        if (entity.getKhongGianId() != null) {
            builder.khongGianId(entity.getKhongGianId());
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                builder.loaiHinhHoc(spatialObj.getGeometryType());
                builder.toaDo(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        builder.kinhDo(new BigDecimal(parts[0]));
                        builder.viDo(new BigDecimal(parts[1]));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }
        return builder.build();
    }
}
