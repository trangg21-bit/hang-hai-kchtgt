package com.hanghai.kchtg.shiprepairfacility.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.shiprepairfacility.dto.*;
import com.hanghai.kchtg.shiprepairfacility.entity.ApprovalHistory;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairApprovalStatus;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacility;
import com.hanghai.kchtg.shiprepairfacility.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityAttachmentRepository;
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class ShipRepairFacilityService {

    private final ShipRepairFacilityRepository repository;
    private final ShipRepairFacilityAttachmentRepository attachmentRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;

    public ShipRepairFacilityResponse create(ShipRepairFacilityCreateRequest request, UUID createdBy) {
        ShipRepairFacility entity = ShipRepairFacility.builder()
                .facilityName(request.getFacilityName())
                .address(request.getAddress())
                .provinceId(request.getProvinceId())
                .phone(request.getPhone())
                .email(request.getEmail())
                .facilityType(request.getFacilityType())
                .capacity(request.getCapacity())
                .authority(request.getAuthority())
                .orgUnitId(request.getOrgUnitId())
                .approvalStatus(ShipRepairApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .isDeleted(false)
                .createdBy(createdBy)
                .build();

        ShipRepairFacility saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    "Cơ sở sửa chữa tại " + request.getAddress(),
                    "COSO_" + saved.getId(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    refId,
                    InfrastructureType.SHIP_REPAIR_FACILITY
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(ApprovalHistory.builder()
                .shipRepairFacilityId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("CREATE")
                .approvedBy(createdBy)
                .approvedDate(LocalDateTime.now())
                .reason("Tạo mới cơ sở sửa chữa, đóng tàu")
                .build());

        return toResponse(saved);
    }

    public ShipRepairFacilityResponse getById(UUID id) {
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));
        if (entity.getIsDeleted()) {
            throw new RuntimeException("Cơ sở sửa chữa, đóng tàu đã bị xóa với ID: " + id);
        }
        return toResponse(entity);
    }

    /**
     * List records sitting at a given approval status, mirroring the endpoint the
     * other infrastructure modules expose.
     */
    public List<ShipRepairFacilityResponse> findByApprovalStatus(ShipRepairApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndIsDeletedFalse(approvalStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ShipRepairFacilityResponse> findAll(int page, int size) {
        return repository.findByApprovalStatusAndIsDeletedFalse(ShipRepairApprovalStatus.APPROVED).stream().map(this::toResponse).toList();
    }

    public ShipRepairFacilityResponse update(UUID id, ShipRepairFacilityUpdateRequest request, UUID updatedBy) {
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

        if (entity.getIsDeleted()) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        if (entity.getApprovalStatus() == ShipRepairApprovalStatus.APPROVED) {
            entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
        }

        if (request.getFacilityName() != null) entity.setFacilityName(request.getFacilityName());
        if (request.getAddress() != null) entity.setAddress(request.getAddress());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getPhone() != null) entity.setPhone(request.getPhone());
        if (request.getEmail() != null) entity.setEmail(request.getEmail());
        if (request.getFacilityType() != null) entity.setFacilityType(request.getFacilityType());
        if (request.getCapacity() != null) entity.setCapacity(request.getCapacity());
        if (request.getAuthority() != null) entity.setAuthority(request.getAuthority());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                UUID refId = entity.getId();
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        "Cơ sở sửa chữa tại " + (request.getAddress() != null ? request.getAddress() : entity.getAddress()),
                        "COSO_" + entity.getId(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        refId,
                        InfrastructureType.SHIP_REPAIR_FACILITY
                );
                entity.setSpatialId(spatialObj.getId());
            }
        } else if (entity.getSpatialId() != null && request.getAddress() != null) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                UUID refId = entity.getId();
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        "Cơ sở sửa chữa tại " + request.getAddress(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        refId,
                        InfrastructureType.SHIP_REPAIR_FACILITY
                );
            });
        }

        ShipRepairFacility saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .shipRepairFacilityId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("UPDATE")
                .approvedBy(updatedBy)
                .approvedDate(LocalDateTime.now())
                .reason("Cập nhật cơ sở sửa chữa, đóng tàu")
                .build());

        return toResponse(saved);
    }

    public void delete(UUID id, java.util.UUID deletedBy) {
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

        if (entity.getApprovalStatus() != ShipRepairApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED) với ID: " + id);
        }

        entity.setDeletedBy(deletedBy); entity.setIsDeleted(true);
        repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .shipRepairFacilityId(entity.getId())
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status("DELETE")
                .approvedBy(deletedBy)
                .approvedDate(LocalDateTime.now())
                .reason("Xóa cơ sở sửa chữa, đóng tàu")
                .build());

        attachmentRepository.deleteByShipRepairFacilityId(id);
    }

    public ShipRepairFacilityResponse approveC1(UUID id, ApprovalRequest request, java.util.UUID approvedBy) {
        boolean autoApproved = false;
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

        if (entity.getApprovalStatus() != ShipRepairApprovalStatus.PROPOSED) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Chờ duyệt (PROPOSED) với ID: " + id);
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(ShipRepairApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovedLevel1(true);
            entity.setApproverLevel1(approvedBy != null ? approvedBy.toString() : null);
            entity.setApprovedDateLevel1(LocalDateTime.now());

            if (AdminAutoApproval.isAutoApprover()) {
                // Administrators clear both levels in one step.
                entity.setApprovedLevel2(true);
                entity.setApproverLevel2(approvedBy != null ? approvedBy.toString() : null);
                entity.setApprovedDateLevel2(LocalDateTime.now());
                entity.setApprovalStatus(ShipRepairApprovalStatus.APPROVED);
                autoApproved = true;
            } else {
                entity.setApprovalStatus(ShipRepairApprovalStatus.UNDER_REVIEW);
            }
        }

        ShipRepairFacility saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .shipRepairFacilityId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(request.getQuyetDinh())
                .approvedBy(approvedBy)
                .approvedDate(LocalDateTime.now())
                .reason(request.getReason())
                .build());

        if (autoApproved) {
            historyRepository.save(ApprovalHistory.builder()
                    .shipRepairFacilityId(saved.getId())
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(request.getQuyetDinh())
                    .approvedBy(approvedBy)
                    .approvedDate(LocalDateTime.now())
                    .reason(request.getReason())
                    .build());
        }

        return toResponse(saved);
    }

    public ShipRepairFacilityResponse approveC2(UUID id, ApprovalRequest request, java.util.UUID approvedBy) {
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

        if (entity.getApprovalStatus() != ShipRepairApprovalStatus.UNDER_REVIEW) {
            throw new RuntimeException("Chỉ có thể phê duyệt bản ghi ở trạng thái Đang xem xét (UNDER_REVIEW) với ID: " + id);
        }

        String c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy != null ? approvedBy.toString() : null) && !"admin".equals(approvedBy)) {
            throw new IllegalStateException("Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
        }

        if ("REJECTED".equals(request.getQuyetDinh())) {
            entity.setApprovalStatus(ShipRepairApprovalStatus.REJECTED);
            entity.setRejectionReason(request.getReason());
        } else {
            entity.setApprovalStatus(ShipRepairApprovalStatus.APPROVED);
            entity.setApprovedLevel2(true);
            entity.setApproverLevel2(approvedBy != null ? approvedBy.toString() : null);
            entity.setApprovedDateLevel2(LocalDateTime.now());
        }

        ShipRepairFacility saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .shipRepairFacilityId(saved.getId())
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(request.getQuyetDinh())
                .approvedBy(approvedBy)
                .approvedDate(LocalDateTime.now())
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID shipRepairFacilityId) {
        return historyRepository.findByShipRepairFacilityIdOrderByApprovedDateDesc(shipRepairFacilityId)
                .stream().map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus())
                        .approvedBy(h.getApprovedBy())
                        .approvedDate(h.getApprovedDate())
                        .reason(h.getReason())
                        .build()).toList();
    }

    public List<ShipRepairFacilityResponse> search(UUID orgUnitId, String keyword, Integer provinceId, String approvalStatus, String reviewStatus) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;
        ShipRepairApprovalStatus statusEnum = (approvalStatus != null && !approvalStatus.trim().isEmpty()) ? ShipRepairApprovalStatus.fromString(approvalStatus) : null;
        ShipRepairApprovalStatus reviewStatusEnum = (reviewStatus != null && !reviewStatus.trim().isEmpty()) ? ShipRepairApprovalStatus.fromString(reviewStatus) : null;
        return repository.search(orgUnitId, keywordLike, provinceId, statusEnum, reviewStatusEnum).stream().map(this::toResponse).toList();
    }

    private ShipRepairFacilityResponse toResponse(ShipRepairFacility entity) {
        List<ShipRepairFacilityAttachmentResponse> attachments = attachmentRepository
                .findByShipRepairFacilityId(entity.getId())
                .stream().map(a -> ShipRepairFacilityAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .filePath(a.getFilePath())
                        .fileSize(a.getFileSize())
                        .documentType(a.getDocumentType())
                        .uploadedBy(a.getUploadedBy())
                        .uploadedDate(a.getUploadedDate())
                        .build()).toList();

        GisGeometryType geomType = null;
        String coords = null;
        UUID symbolId = null;
        if (entity.getSpatialId() != null) {
            java.util.Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject spatial = spatialOpt.get();
                geomType = spatial.getGeometryType();
                coords = spatial.getCoordinates();
            }
        }

        return ShipRepairFacilityResponse.builder()
                .id(entity.getId())
                .facilityName(entity.getFacilityName())
                .address(entity.getAddress())
                .provinceId(entity.getProvinceId())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .facilityType(entity.getFacilityType())
                .capacity(entity.getCapacity())
                .authority(entity.getAuthority())
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
                .createdDate(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedDate(entity.getUpdatedAt())
                .isDeleted(entity.getIsDeleted())
                .attachments(attachments)
                .spatialId(entity.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .build();
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }
}


