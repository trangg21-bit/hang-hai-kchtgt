package com.hanghai.kchtg.shiprepairfacility.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.shiprepairfacility.dto.*;
import com.hanghai.kchtg.shiprepairfacility.entity.ShipRepairFacility;
import com.hanghai.kchtg.common.entity.ApprovalHistory;
import com.hanghai.kchtg.common.enums.ApprovalHistoryStatus;
import com.hanghai.kchtg.common.repository.ApprovalHistoryRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.shiprepairfacility.repository.ShipRepairFacilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ShipRepairFacilityService {

    private final ShipRepairFacilityRepository repository;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final ApprovalHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;

    public ShipRepairFacilityResponse create(ShipRepairFacilityCreateRequest request, UUID createdBy) {
        FieldWriteGuard.validateObject(request);
        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "shiprepairfacility",
                SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        ShipRepairFacility entity = ShipRepairFacility.builder()
                .securityLevel(secLevel)
                .facilityName(request.getFacilityName())
                .address(request.getAddress())
                .provinceId(request.getProvinceId())
                .phone(request.getPhone())
                .email(request.getEmail())
                .facilityType(request.getFacilityType())
                .capacity(request.getCapacity())
                .authority(request.getAuthority())
                .orgUnitId(request.getOrgUnitId())
                .approvalStatus(ApprovalStatus.PROPOSED)
                .approvedLevel1(false)
                .approvedLevel2(false)
                .createdBy(createdBy)
                .build();

        ShipRepairFacility saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.POINT;
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
                    InfrastructureType.SHIP_REPAIR_FACILITY);
            saved.setSpatialId(spatialObj.getId());
            saved = repository.save(saved);
        }

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.SHIP_REPAIR_FACILITY)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.CREATED)
                .approvedBy(createdBy)
                .approvedDate(LocalDateTime.now())
                .reason("Tạo mới cơ sở sửa chữa, đóng tàu")
                .build());

        return toResponse(saved);
    }

    public ShipRepairFacilityResponse getById(UUID id) {
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));
        if (entity.getDeletedAt() != null) {
            throw new RuntimeException("Cơ sở sửa chữa, đóng tàu đã bị xóa với ID: " + id);
        }
        return toResponse(entity);
    }

    /**
     * List records sitting at a given approval status, mirroring the endpoint the
     * other infrastructure modules expose.
     */
    public List<ShipRepairFacilityResponse> findByApprovalStatus(ApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(approvalStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<ShipRepairFacilityResponse> findAll(int page, int size) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED).stream()
                .map(this::toResponse).toList();
    }

    public ShipRepairFacilityResponse update(UUID id, ShipRepairFacilityUpdateRequest request, UUID updatedBy) {
        FieldWriteGuard.validateObject(request);
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

        if (entity.getDeletedAt() != null) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        }

        java.util.Map<String, String> previousValues = new java.util.LinkedHashMap<>();
        if (request.getFacilityName() != null
                && !java.util.Objects.equals(request.getFacilityName(), entity.getFacilityName()))
            previousValues.put("facilityName", entity.getFacilityName());
        if (request.getAddress() != null && !java.util.Objects.equals(request.getAddress(), entity.getAddress()))
            previousValues.put("address", entity.getAddress());
        if (request.getProvinceId() != null
                && !Objects.equals(request.getProvinceId(), entity.getProvinceId()))
            previousValues.put("provinceId", String.valueOf(entity.getProvinceId()));
        if (request.getPhone() != null && !java.util.Objects.equals(request.getPhone(), entity.getPhone()))
            previousValues.put("phone", entity.getPhone());
        if (request.getEmail() != null && !java.util.Objects.equals(request.getEmail(), entity.getEmail()))
            previousValues.put("email", entity.getEmail());
        if (request.getFacilityType() != null
                && !java.util.Objects.equals(request.getFacilityType(), entity.getFacilityType()))
            previousValues.put("facilityType", String.valueOf(entity.getFacilityType()));
        if (request.getCapacity() != null && !java.util.Objects.equals(request.getCapacity(), entity.getCapacity()))
            previousValues.put("capacity", entity.getCapacity());
        if (request.getAuthority() != null && !java.util.Objects.equals(request.getAuthority(), entity.getAuthority()))
            previousValues.put("authority", entity.getAuthority());
        if (request.getOrgUnitId() != null && !java.util.Objects.equals(request.getOrgUnitId(), entity.getOrgUnitId()))
            previousValues.put("orgUnitId", String.valueOf(entity.getOrgUnitId()));

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "shiprepairfacility",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getFacilityName() != null)
            entity.setFacilityName(request.getFacilityName());
        if (request.getAddress() != null)
            entity.setAddress(request.getAddress());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getPhone() != null)
            entity.setPhone(request.getPhone());
        if (request.getEmail() != null)
            entity.setEmail(request.getEmail());
        if (request.getFacilityType() != null)
            entity.setFacilityType(request.getFacilityType());
        if (request.getCapacity() != null)
            entity.setCapacity(request.getCapacity());
        if (request.getAuthority() != null)
            entity.setAuthority(request.getAuthority());
        if (request.getOrgUnitId() != null)
            entity.setOrgUnitId(request.getOrgUnitId());

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
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        "Cơ sở sửa chữa tại "
                                + (request.getAddress() != null ? request.getAddress() : entity.getAddress()),
                        "COSO_" + entity.getId(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        refId,
                        InfrastructureType.SHIP_REPAIR_FACILITY);
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
                        InfrastructureType.SHIP_REPAIR_FACILITY);
            });
        }

        ShipRepairFacility saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.SHIP_REPAIR_FACILITY)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.UPDATED)
                .approvedBy(updatedBy)
                .approvedDate(LocalDateTime.now())
                .reason("Cập nhật cơ sở sửa chữa, đóng tàu")
                .changedField(formatChangedFields(previousValues))
                .previousValue(formatPreviousValues(previousValues))
                .newValue(formatNewValues(saved, previousValues))
                .build());

        return toResponse(saved);
    }

    public void delete(UUID id, UUID deletedBy) {
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new RuntimeException("Chỉ có thể xóa bản ghi đã được phê duyệt (APPROVED) với ID: " + id);
        }

        entity.softDelete(deletedBy);
        repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.SHIP_REPAIR_FACILITY)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(ApprovalHistoryStatus.DELETED)
                .approvedBy(deletedBy)
                .approvedDate(LocalDateTime.now())
                .reason("Xóa cơ sở sửa chữa, đóng tàu")
                .build());

        attachmentRepository.deleteByRefIdAndRefType(id, InfrastructureType.SHIP_REPAIR_FACILITY);
    }

    public ShipRepairFacilityResponse approveC1(UUID id, ApprovalRequest request, java.util.UUID approvedBy) {
        boolean autoApproved = false;
        ShipRepairFacility entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy cơ sở sửa chữa, đóng tàu với ID: " + id));

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

        ShipRepairFacility saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.SHIP_REPAIR_FACILITY)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                .approvedBy(approvedBy)
                .approvedDate(LocalDateTime.now())
                .reason(request.getReason())
                .build());

        if (autoApproved) {
            historyRepository.save(ApprovalHistory.builder()
                    .refId(saved.getId())
                    .refType(InfrastructureType.SHIP_REPAIR_FACILITY)
                    .approvalLevel(ApprovalLevel.LEVEL_2)
                    .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
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

        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL) {
            throw new RuntimeException(
                    "Chỉ có thể phê duyệt bản ghi ở trạng thái Đang xem xét (UNDER_REVIEW) với ID: " + id);
        }

        UUID c1Actor = entity.getApproverLevel1();
        if (c1Actor != null && c1Actor.equals(approvedBy)) {
            throw new IllegalStateException(
                    "Người phê duyệt C2 không được trùng với người phê duyệt C1 (Nguoi phe duyet C2 khong duoc trung)");
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

        ShipRepairFacility saved = repository.save(entity);

        historyRepository.save(ApprovalHistory.builder()
                .refId(saved.getId())
                .refType(InfrastructureType.SHIP_REPAIR_FACILITY)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(ApprovalHistoryStatus.fromValue(request.getDecision()))
                .approvedBy(approvedBy)
                .approvedDate(LocalDateTime.now())
                .reason(request.getReason())
                .build());

        return toResponse(saved);
    }

    public List<HistoryEntry> getHistory(UUID shipRepairFacilityId) {
        List<ApprovalHistory> historyList = historyRepository
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.SHIP_REPAIR_FACILITY,
                        shipRepairFacilityId);
        Set<UUID> userIds = historyList.stream()
                .map(ApprovalHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNames = resolveUserNames(userIds);

        return historyList.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approvedBy(h.getApprovedBy() != null
                        ? userNames.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString())
                        : null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .build())
                .toList();
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
        if (userId == null)
            return null;
        Map<UUID, String> map = resolveUserNames(Collections.singletonList(userId));
        return map.getOrDefault(userId, userId.toString());
    }

    public List<ShipRepairFacilityResponse> search(UUID orgUnitId, String keyword, Integer provinceId,
            String approvalStatus, String reviewStatus) {
        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        ApprovalStatus statusEnum = (approvalStatus != null && !approvalStatus.trim().isEmpty())
                ? ApprovalStatus.fromString(approvalStatus)
                : null;
        ApprovalStatus reviewStatusEnum = (reviewStatus != null && !reviewStatus.trim().isEmpty())
                ? ApprovalStatus.fromString(reviewStatus)
                : null;
        return repository.search(orgUnitId, keywordLike, provinceId, statusEnum, reviewStatusEnum).stream()
                .map(e -> toResponse(e, false)).toList();
    }

    private ShipRepairFacilityResponse toResponse(ShipRepairFacility entity) {
        return toResponse(entity, true);
    }

    private ShipRepairFacilityResponse toResponse(ShipRepairFacility entity, boolean includeAttachments) {
        List<ShipRepairFacilityAttachmentResponse> attachments = includeAttachments
                ? attachmentRepository
                        .findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(),
                                InfrastructureType.SHIP_REPAIR_FACILITY)
                        .stream().map(a -> ShipRepairFacilityAttachmentResponse.builder()
                                .id(a.getId())
                                .fileName(a.getFileName())
                                .filePath(a.getFilePath())
                                .fileSize(a.getFileSize())
                                .documentType(a.getFileType() != null ? a.getFileType().getCode() : "OTHER")
                                .uploadedBy(a.getUploadedBy() != null ? a.getUploadedBy().toString() : null)
                                .uploadedDate(a.getUploadedDate())
                                .build())
                        .toList()
                : null;

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
                .securityLevel(entity.getSecurityLevel())
                .facilityName(entity.getFacilityName())
                .address(entity.getAddress())
                .provinceId(entity.getProvinceId())
                .phone(entity.getPhone())
                .email(entity.getEmail())
                .facilityType(entity.getFacilityType())
                .capacity(entity.getCapacity())
                .authority(entity.getAuthority())
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
                .spatialId(entity.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .build();
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON)
            return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }

    private String getFieldDisplayName(String field) {
        return switch (field) {
            case "facilityName" -> "Tên cơ sở sửa chữa";
            case "facilityType" -> "Loại cơ sở";
            case "address" -> "Địa chỉ";
            case "phone" -> "Số điện thoại";
            case "email" -> "Email";
            case "capacity" -> "Công suất";
            case "authority" -> "Cơ quan thẩm quyền";
            case "orgUnitId" -> "Đơn vị quản lý";
            case "provinceId" -> "Tỉnh / Thành phố";
            default -> field;
        };
    }

    private String formatChangedFields(java.util.Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(this::getFieldDisplayName)
                .collect(java.util.stream.Collectors.joining(", "));
    }

    private String formatPreviousValues(java.util.Map<String, String> previousValues) {
        return previousValues.entrySet().stream()
                .map(entry -> getFieldDisplayName(entry.getKey()) + "="
                        + formatDisplayValue(entry.getKey(), entry.getValue()))
                .collect(java.util.stream.Collectors.joining("; "));
    }

    private String formatNewValues(ShipRepairFacility entity, java.util.Map<String, String> previousValues) {
        return previousValues.keySet().stream()
                .map(field -> getFieldDisplayName(field) + "="
                        + formatDisplayValue(field, currentFieldValue(entity, field)))
                .collect(java.util.stream.Collectors.joining("; "));
    }

    private String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty())
            return "";
        if ("orgUnitId".equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        return rawValue;
    }

    private String currentFieldValue(ShipRepairFacility entity, String field) {
        return switch (field) {
            case "facilityName" -> String.valueOf(entity.getFacilityName());
            case "facilityType" -> String.valueOf(entity.getFacilityType());
            case "address" -> String.valueOf(entity.getAddress());
            case "phone" -> String.valueOf(entity.getPhone());
            case "email" -> String.valueOf(entity.getEmail());
            case "capacity" -> String.valueOf(entity.getCapacity());
            case "authority" -> String.valueOf(entity.getAuthority());
            case "orgUnitId" -> String.valueOf(entity.getOrgUnitId());
            case "provinceId" -> String.valueOf(entity.getProvinceId());
            default -> "";
        };
    }
}
