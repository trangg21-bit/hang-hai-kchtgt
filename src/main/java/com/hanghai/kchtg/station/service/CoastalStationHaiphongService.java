package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongHistoryResponse;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongRequest;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongResponse;
import com.hanghai.kchtg.station.dto.haiphong.CoastalStationHaiphongUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoastalStationHaiphongService {

    private final CoastalStationHaiphongRepository repository;
    private final HistoryService historyService;

    public CoastalStationHaiphong createStation(CoastalStationHaiphongRequest request) {
        FieldWriteGuard.validateObject(request);
        if (repository.findByCode(request.getStationCode()).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getStationCode());
        }

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "coastalstationhaiphong",
                SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        CoastalStationHaiphong entity = new CoastalStationHaiphong();
        entity.setSecurityLevel(secLevel);
        entity.setCode(request.getStationCode());
        entity.setName(request.getStationName());
        entity.setPortName(request.getPortName());
        entity.setDistrict(request.getDistrict());
        entity.setWard(request.getWard());
        entity.setOperationalLicense(request.getOperationalLicense());
        entity.setLicenseExpiry(request.getLicenseExpiry());
        entity.setInspectorName(request.getInspectorName());
        entity.setInspectorPhone(request.getInspectorPhone());
        entity.setLastInspectionDate(request.getLastInspectionDate());
        entity.setNextInspectionDate(request.getNextInspectionDate());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setEquipmentType(request.getEquipmentType());
        entity.setCommunicationFrequency(request.getCommunicationFrequency());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setIsActive(true);

        CoastalStationHaiphong saved = repository.save(entity);
        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Haiphong station created",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public CoastalStationHaiphong updateStation(UUID id, CoastalStationHaiphongUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Haiphong station not found with id: " + id));

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "coastalstationhaiphong",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getStationName() != null)
            entity.setName(request.getStationName());
        if (request.getPortName() != null)
            entity.setPortName(request.getPortName());
        if (request.getDistrict() != null)
            entity.setDistrict(request.getDistrict());
        if (request.getWard() != null)
            entity.setWard(request.getWard());
        if (request.getOperationalLicense() != null)
            entity.setOperationalLicense(request.getOperationalLicense());
        if (request.getLicenseExpiry() != null)
            entity.setLicenseExpiry(request.getLicenseExpiry());
        if (request.getInspectorName() != null)
            entity.setInspectorName(request.getInspectorName());
        if (request.getInspectorPhone() != null)
            entity.setInspectorPhone(request.getInspectorPhone());
        if (request.getLastInspectionDate() != null)
            entity.setLastInspectionDate(request.getLastInspectionDate());
        if (request.getNextInspectionDate() != null)
            entity.setNextInspectionDate(request.getNextInspectionDate());
        if (request.getCoverageArea() != null)
            entity.setCoverageArea(request.getCoverageArea());
        if (request.getEquipmentType() != null)
            entity.setEquipmentType(request.getEquipmentType());
        if (request.getCommunicationFrequency() != null)
            entity.setCommunicationFrequency(request.getCommunicationFrequency());
        if (request.getLocationAddress() != null)
            entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null)
            entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null)
            entity.setContactPhone(request.getContactPhone());

        CoastalStationHaiphong saved = repository.save(entity);
        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                saved.getId(),
                StationHistoryActionType.UPDATE,
                null,
                "Haiphong station updated",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Haiphong station not found with id: " + id));

        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Active",
                "Haiphong station deleted",
                SecurityUtils.getCurrentUserId());
    }

    public CoastalStationHaiphong getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Haiphong station not found with id: " + id));
    }

    public List<CoastalStationHaiphong> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationHaiphong> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public List<CoastalStationHaiphong> findByPortName(String portName) {
        return repository.findByPortName(portName);
    }

    public CoastalStationHaiphong approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Haiphong station not found with id: " + id));

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(String.valueOf(userId))) {
            throw new IllegalStateException("Bạn không thể phê duyệt bản do chính mình gửi");
        }

        if (approved) {
            ApprovalLevel currentLevel = entity.getApprovalLevel() != null ? entity.getApprovalLevel()
                    : ApprovalLevel.LEVEL_0;
            if (currentLevel == ApprovalLevel.LEVEL_0 && AdminAutoApproval.isAutoApprover()) {
                // Administrators clear both levels in one step.
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
                entity.setStatus(StationStatus.APPROVED_L2);
            } else if (currentLevel == ApprovalLevel.LEVEL_0) {
                entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
                entity.setStatus(StationStatus.APPROVED_L1);
            } else if (currentLevel == ApprovalLevel.LEVEL_1) {
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
                entity.setStatus(StationStatus.APPROVED_L2);
            } else {
                entity.setStatus(StationStatus.PUBLISHED);
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
            }
            entity.setApprovedBy(String.valueOf(userId));
            entity.setApprovedDate(LocalDateTime.now());
            entity.setRejectionReason(null);

            historyService.recordHistory(
                    InfrastructureType.HANOI_STATION,
                    entity.getId(),
                    currentLevel == ApprovalLevel.LEVEL_0 ? StationHistoryActionType.APPROVE_L1
                                                : StationHistoryActionType.APPROVE_L2,
                    "Pending approval",
                    "Approved at level " + entity.getApprovalLevel(),
                    SecurityUtils.getCurrentUserId());
        } else {
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setStatus(StationStatus.PENDING_APPROVAL);
            entity.setApprovedBy(null);
            entity.setApprovedDate(null);
            entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            historyService.recordHistory(
                    InfrastructureType.HANOI_STATION,
                    entity.getId(),
                    StationHistoryActionType.UPDATE,
                    "Approved L1",
                    "Reset to pending",
                    SecurityUtils.getCurrentUserId());
        }

        return repository.save(entity);
    }

    public CoastalStationHaiphong rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Haiphong station not found with id: " + id));

        if (rejectionReason == null || rejectionReason.length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setRejectionReason(rejectionReason);
        entity.setApprovedBy(null);
        entity.setApprovedDate(null);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_0);

        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                entity.getId(),
                StationHistoryActionType.REJECT,
                "Approved",
                "Rejected: " + rejectionReason,
                SecurityUtils.getCurrentUserId());

        return repository.save(entity);
    }

    public List<CoastalStationHaiphongHistoryResponse> getHistory(UUID id) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Haiphong station not found with id: " + id));
        return historyService.getHistory(InfrastructureType.HANOI_STATION, entity.getId(), entity.getCode()).stream()
                .map(h -> {
                    CoastalStationHaiphongHistoryResponse r = new CoastalStationHaiphongHistoryResponse();
                    r.setId(h.getId());
                    r.setStationCode(h.getStationCode());
                    r.setActionType(h.getActionType());
                    r.setPreviousValue(h.getPreviousValue());
                    r.setNewValue(h.getNewValue());
                    r.setChangedBy(h.getChangedBy());
                    r.setChangedAt(h.getChangedAt());
                    return r;
                })
                .toList();
    }

    // -- HELPERS --

    private String resolveCreatedBy(CoastalStationHaiphong entity) {
        return entity.getApprovedBy();
    }

    public CoastalStationHaiphongResponse buildResponse(CoastalStationHaiphong entity) {
        return CoastalStationHaiphongResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .stationCode(entity.getCode())
                .stationName(entity.getName())
                .portName(entity.getPortName())
                .district(entity.getDistrict())
                .ward(entity.getWard())
                .operationalLicense(entity.getOperationalLicense())
                .licenseExpiry(entity.getLicenseExpiry())
                .inspectorName(entity.getInspectorName())
                .inspectorPhone(entity.getInspectorPhone())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .coverageArea(entity.getCoverageArea())
                .equipmentType(entity.getEquipmentType())
                .communicationFrequency(entity.getCommunicationFrequency())
                .locationAddress(entity.getLocationAddress())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy() != null ? java.util.UUID.fromString(entity.getApprovedBy()) : null)
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }
}
