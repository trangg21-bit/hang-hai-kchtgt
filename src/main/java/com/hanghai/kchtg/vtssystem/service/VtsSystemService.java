package com.hanghai.kchtg.vtssystem.service;

import com.hanghai.kchtg.vtssystem.dto.*;
import com.hanghai.kchtg.vtssystem.entity.*;
import com.hanghai.kchtg.vtssystem.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
public class VtsSystemService {

    private final VtsSystemRepository repository;
    private final ApprovalHistoryRepository historyRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    public VtsSystemService(VtsSystemRepository repository,
                            ApprovalHistoryRepository historyRepository,
                            com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService) {
        this.repository = repository;
        this.historyRepository = historyRepository;
        this.gisSpatialObjectService = gisSpatialObjectService;
    }

    public VtsSystemResponse create(VtsSystemCreateRequest request, String username) {
        VtsSystem entity = VtsSystem.builder()
                .systemName(request.getSystemName())
                .location(request.getLocation())
                .conditionStatus(request.getConditionStatus())
                .responsibilityLevel(request.getResponsibilityLevel())
                .source(request.getSource())
                .partner(request.getPartner())
                .orgUnitId(request.getOrgUnitId())
                .scope(request.getScope())
                .approvalStatus("PROPOSED")
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy(username)
                .build();

        VtsSystem saved = repository.save(entity);

        if (request.getToaDo() != null && !request.getToaDo().trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    "Hệ thống VTS tại " + request.getLocation(),
                    "VTS_" + saved.getId(),
                    geomType,
                    objType,
                    request.getToaDo(),
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.HE_THONG_VTS
            );
            saved.setKhongGianId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(0)
                .status("CREATED")
                .approvedBy(username)
                .reason("Tạo mới hệ thống VTS")
                .build());

        return toResponse(saved);
    }

    public VtsSystemResponse getById(UUID id) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return toResponse(entity);
    }

    public Page<VtsSystemResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<VtsSystemResponse> findAllWithSearch(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatus, int page, int size) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String trimmedConditionStatus = (conditionStatus != null && !conditionStatus.trim().isEmpty()) ? conditionStatus.trim() : null;
        String trimmedApprovalStatus = (approvalStatus != null && !approvalStatus.trim().isEmpty()) ? approvalStatus.trim() : null;
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return repository.search(orgUnitId, keywordLike, trimmedConditionStatus, trimmedApprovalStatus, pageable).map(this::toResponse);
    }

    public VtsSystemResponse update(UUID id, VtsSystemUpdateRequest request, String username) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        boolean wasApproved = "APPROVED".equals(entity.getApprovalStatus());

        if (request.getSystemName() != null) entity.setSystemName(request.getSystemName());
        if (request.getLocation() != null) entity.setLocation(request.getLocation());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());
        if (request.getResponsibilityLevel() != null) entity.setResponsibilityLevel(request.getResponsibilityLevel());
        if (request.getSource() != null) entity.setSource(request.getSource());
        if (request.getPartner() != null) entity.setPartner(request.getPartner());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
        if (request.getScope() != null) entity.setScope(request.getScope());

        if (request.getToaDo() != null) {
            if (request.getToaDo().trim().isEmpty()) {
                if (entity.getKhongGianId() != null) {
                    gisSpatialObjectService.delete(entity.getKhongGianId());
                    entity.setKhongGianId(null);
                }
            } else {
                com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
                com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = entity.getId();
                com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getKhongGianId(),
                        "Hệ thống VTS tại " + (request.getLocation() != null ? request.getLocation() : entity.getLocation()),
                        "VTS_" + entity.getId(),
                        geomType,
                        objType,
                        request.getToaDo(),
                        refId,
                        com.hanghai.kchtg.gis.search.dto.KchtType.HE_THONG_VTS
                );
                entity.setKhongGianId(spatialObj.getId());
            }
        } else if (entity.getKhongGianId() != null && request.getLocation() != null) {
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                UUID refId = entity.getId();
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        "Hệ thống VTS tại " + request.getLocation(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        com.hanghai.kchtg.gis.search.dto.KchtType.HE_THONG_VTS
                );
            });
        }

        entity.setUpdatedBy(username);

        if (wasApproved) {
            entity.setApprovalStatus("UNDER_REVIEW");
        }

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(0)
                .status("UPDATED")
                .approvedBy(username)
                .reason("Cập nhật thông tin")
                .build());

        return toResponse(saved);
    }

    public void delete(UUID id, String username) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (!"APPROVED".equals(entity.getApprovalStatus())) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED)");
        }

        entity.setIsDeleted(true);
        entity.setUpdatedBy(username);
        repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(entity.getId())
                .approvalLevel(0)
                .status("DELETED")
                .approvedBy(username)
                .reason("Xóa bản ghi")
                .build());
    }

    public VtsSystemResponse approveC1(UUID id, ApprovalRequest request, String username) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (!"PROPOSED".equals(entity.getApprovalStatus())) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Chờ duyệt (PROPOSED)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus("REJECTED");
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus("UNDER_REVIEW");
        }

        entity.setApprovedLevel1(true);
        entity.setApproverLevel1(username);
        entity.setApprovedDateLevel1(LocalDateTime.now());

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(1)
                .status(request.getQuyetDinh())
                .approvedBy(username)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public VtsSystemResponse approveC2(UUID id, ApprovalRequest request, String username) {
        VtsSystem entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));

        if (!"UNDER_REVIEW".equals(entity.getApprovalStatus())) {
            throw new RuntimeException("Chỉ có thể phê duyệt từ trạng thái Đang xem xét (UNDER_REVIEW)");
        }

        String c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(username) && !"admin".equals(username)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus("REJECTED");
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus("APPROVED");
        }

        entity.setApprovedLevel2(true);
        entity.setApproverLevel2(username);
        entity.setApprovedDateLevel2(LocalDateTime.now());

        VtsSystem saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .vtsSystemId(saved.getId())
                .approvalLevel(2)
                .status(request.getQuyetDinh())
                .approvedBy(username)
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID id) {
        repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Hệ thống VTS với ID: " + id));
        return historyRepository.findByVtsSystemIdOrderByApprovedDateDesc(id).stream()
                .map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus())
                        .approvedBy(h.getApprovedBy())
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .build())
                .collect(Collectors.toList());
    }

    public List<VtsSystemResponse> search(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatus) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        String trimmedConditionStatus = (conditionStatus != null && !conditionStatus.trim().isEmpty()) ? conditionStatus.trim() : null;
        String trimmedApprovalStatus = (approvalStatus != null && !approvalStatus.trim().isEmpty()) ? approvalStatus.trim() : null;
        Pageable pageable = PageRequest.of(0, 100);
        Page<VtsSystem> pageResult = repository.search(orgUnitId, keywordLike, trimmedConditionStatus, trimmedApprovalStatus, pageable);
        return pageResult.getContent().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private VtsSystemResponse toResponse(VtsSystem entity) {
        List<VtsSystemAttachmentResponse> attachments = entity.getAttachments().stream()
                .map(a -> VtsSystemAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .filePath(a.getFilePath())
                        .fileSize(a.getFileSize())
                        .documentType(a.getDocumentType())
                        .uploadedBy(a.getUploadedBy())
                        .uploadedDate(a.getUploadedDate())
                        .build())
                .collect(Collectors.toList());

        com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = null;
        String coords = null;
        UUID symbolId = null;
        if (entity.getKhongGianId() != null) {
            java.util.Optional<com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getKhongGianId());
            if (spatialOpt.isPresent()) {
                com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        return VtsSystemResponse.builder()
                .id(entity.getId())
                .systemName(entity.getSystemName())
                .location(entity.getLocation())
                .conditionStatus(entity.getConditionStatus())
                .responsibilityLevel(entity.getResponsibilityLevel())
                .source(entity.getSource())
                .partner(entity.getPartner())
                .orgUnitId(entity.getOrgUnitId())
                .scope(entity.getScope())
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
                .khongGianId(entity.getKhongGianId())
                .loaiHinhHoc(geomType)
                .toaDo(coords)
                .build();
    }

    private com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType getSpatialObjectType(com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType) {
        if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) return com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_OTHER;
        if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POLYGON) return com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POLYGON_OTHER;
        return com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.LINE_OTHER;
    }
}
