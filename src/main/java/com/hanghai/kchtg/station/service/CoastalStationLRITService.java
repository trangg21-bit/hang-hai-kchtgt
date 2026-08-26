package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITHistoryResponse;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITRequest;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITResponse;
import com.hanghai.kchtg.station.dto.lrit.CoastalStationLRITUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationLRITRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoastalStationLRITService {

    private final CoastalStationLRITRepository repository;
    private final HistoryService historyService;

    public CoastalStationLRIT createStation(CoastalStationLRITRequest request) {
        FieldWriteGuard.validateObject(request);
        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "coastalstationlrit",
                SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        CoastalStationLRIT entity = new CoastalStationLRIT();
        entity.setSecurityLevel(secLevel);
        entity.setCode(request.getStationCode());
        entity.setName(request.getStationName());
        entity.setTerminalId(request.getTerminalId());
        entity.setImoNumber(request.getImoNumber());
        entity.setReportingInterval(request.getReportingInterval());
        entity.setAntennaHeight(request.getAntennaHeight());
        entity.setPowerOutput(request.getPowerOutput());
        entity.setAntennaType(request.getAntennaType());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setDataFormat(request.getDataFormat());
        entity.setCommunicationChannel(request.getCommunicationChannel());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setIsActive(true);

        CoastalStationLRIT saved = repository.save(entity);
        historyService.recordHistory(
                InfrastructureType.LRIT_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "LRIT station created",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public CoastalStationLRIT updateStation(UUID id, CoastalStationLRITUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(
                        () -> new jakarta.persistence.EntityNotFoundException("LRIT station not found with id: " + id));

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "coastalstationlrit",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getStationName() != null)
            entity.setName(request.getStationName());
        if (request.getTerminalId() != null)
            entity.setTerminalId(request.getTerminalId());
        if (request.getImoNumber() != null)
            entity.setImoNumber(request.getImoNumber());
        if (request.getReportingInterval() != null)
            entity.setReportingInterval(request.getReportingInterval());
        if (request.getAntennaHeight() != null)
            entity.setAntennaHeight(request.getAntennaHeight());
        if (request.getPowerOutput() != null)
            entity.setPowerOutput(request.getPowerOutput());
        if (request.getAntennaType() != null)
            entity.setAntennaType(request.getAntennaType());
        if (request.getLocationAddress() != null)
            entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null)
            entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null)
            entity.setContactPhone(request.getContactPhone());
        if (request.getDataFormat() != null)
            entity.setDataFormat(request.getDataFormat());
        if (request.getCommunicationChannel() != null)
            entity.setCommunicationChannel(request.getCommunicationChannel());
        if (request.getCoverageArea() != null)
            entity.setCoverageArea(request.getCoverageArea());

        CoastalStationLRIT saved = repository.save(entity);
        historyService.recordHistory(
                InfrastructureType.LRIT_STATION,
                saved.getId(),
                StationHistoryActionType.UPDATE,
                null,
                "LRIT station updated",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(
                        () -> new jakarta.persistence.EntityNotFoundException("LRIT station not found with id: " + id));

        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.LRIT_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Active",
                "LRIT station deleted",
                SecurityUtils.getCurrentUserId());
    }

    public CoastalStationLRIT getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(
                        () -> new jakarta.persistence.EntityNotFoundException("LRIT station not found with id: " + id));
    }

    public List<CoastalStationLRIT> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationLRIT> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public Optional<CoastalStationLRIT> findByTerminalId(String terminalId) {
        return repository.findByTerminalId(terminalId);
    }

    public Optional<CoastalStationLRIT> findByImoNumber(String imoNumber) {
        return repository.findByImoNumber(imoNumber);
    }

    public CoastalStationLRIT approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(
                        () -> new jakarta.persistence.EntityNotFoundException("LRIT station not found with id: " + id));

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
                    InfrastructureType.LRIT_STATION,
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
                    InfrastructureType.LRIT_STATION,
                    entity.getId(),
                    StationHistoryActionType.UPDATE,
                    "Approved L1",
                    "Reset to pending",
                    SecurityUtils.getCurrentUserId());
        }

        return repository.save(entity);
    }

    public CoastalStationLRIT rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(
                        () -> new jakarta.persistence.EntityNotFoundException("LRIT station not found with id: " + id));

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
                InfrastructureType.LRIT_STATION,
                entity.getId(),
                StationHistoryActionType.REJECT,
                "Approved",
                "Rejected: " + rejectionReason,
                SecurityUtils.getCurrentUserId());

        return repository.save(entity);
    }

    public List<CoastalStationLRITHistoryResponse> getHistory(UUID id) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(
                        () -> new jakarta.persistence.EntityNotFoundException("LRIT station not found with id: " + id));
        return historyService.getHistory(InfrastructureType.LRIT_STATION, entity.getId(), entity.getCode()).stream()
                .map(h -> {
                    CoastalStationLRITHistoryResponse r = new CoastalStationLRITHistoryResponse();
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

    private String resolveCreatedBy(CoastalStationLRIT entity) {
        return entity.getApprovedBy();
    }

    public CoastalStationLRITResponse buildResponse(CoastalStationLRIT entity) {
        return CoastalStationLRITResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .stationCode(entity.getCode())
                .stationName(entity.getName())
                .terminalId(entity.getTerminalId())
                .imoNumber(entity.getImoNumber())
                .reportingInterval(entity.getReportingInterval())
                .antennaHeight(entity.getAntennaHeight())
                .powerOutput(entity.getPowerOutput())
                .antennaType(entity.getAntennaType())
                .locationAddress(entity.getLocationAddress())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .dataFormat(entity.getDataFormat())
                .communicationChannel(entity.getCommunicationChannel())
                .coverageArea(entity.getCoverageArea())
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
