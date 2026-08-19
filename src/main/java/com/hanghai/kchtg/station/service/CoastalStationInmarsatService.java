package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.inmarsat.CoastalStationInmarsatHistoryResponse;
import com.hanghai.kchtg.station.dto.inmarsat.CoastalStationInmarsatRequest;
import com.hanghai.kchtg.station.dto.inmarsat.CoastalStationInmarsatResponse;
import com.hanghai.kchtg.station.dto.inmarsat.CoastalStationInmarsatUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoastalStationInmarsatService {

    private final CoastalStationInmarsatRepository repository;
    private final HistoryService historyService;

    public CoastalStationInmarsat createStation(CoastalStationInmarsatRequest request) {
        FieldWriteGuard.validateObject(request);
        if (repository.findByDeviceCode(request.getDeviceCode()).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getDeviceCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "coastalstationinmarsat",
                SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        CoastalStationInmarsat entity = new CoastalStationInmarsat();
        entity.setSecurityLevel(secLevel);
        entity.setDeviceCode(request.getDeviceCode());
        entity.setCode(request.getDeviceCode());
        entity.setName(request.getStationName());
        entity.setModemType(request.getModemType());
        entity.setFrequency(request.getFrequency());
        entity.setCoverageZone(request.getCoverageZone());
        entity.setSarCode(request.getSarCode());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setIsActive(true);

        CoastalStationInmarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getDeviceCode(),
                StationHistoryActionType.CREATE,
                null,
                "Inmarsat station created",
                "system",
                LocalDateTime.now());
        return saved;
    }

    public CoastalStationInmarsat updateStation(UUID id, CoastalStationInmarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Inmarsat station not found with id: " + id));

        validateCoordinates(request.getLongitude(), request.getLatitude());

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "coastalstationinmarsat",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }

        if (request.getStationName() != null)
            entity.setName(request.getStationName());
        if (request.getModemType() != null)
            entity.setModemType(request.getModemType());
        if (request.getFrequency() != null)
            entity.setFrequency(request.getFrequency());
        if (request.getCoverageZone() != null)
            entity.setCoverageZone(request.getCoverageZone());
        if (request.getSarCode() != null)
            entity.setSarCode(request.getSarCode());
        if (request.getLocationAddress() != null)
            entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null)
            entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null)
            entity.setContactPhone(request.getContactPhone());

        CoastalStationInmarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getDeviceCode(),
                StationHistoryActionType.UPDATE,
                null,
                "Inmarsat station updated",
                "system",
                LocalDateTime.now());
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Inmarsat station not found with id: " + id));

        String deviceCode = entity.getDeviceCode();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                deviceCode,
                StationHistoryActionType.DELETE,
                "Active",
                "Inmarsat station deleted",
                "system",
                LocalDateTime.now());
    }

    public CoastalStationInmarsat getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Inmarsat station not found with id: " + id));
    }

    public List<CoastalStationInmarsat> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationInmarsat> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public Optional<CoastalStationInmarsat> findByDeviceCode(String deviceCode) {
        return repository.findByDeviceCode(deviceCode);
    }

    public CoastalStationInmarsat approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Inmarsat station not found with id: " + id));

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(String.valueOf(userId))) {
            throw new IllegalStateException("Bạn không thể phê duyệt bản do chính mình gửi");
        }

        if (approved) {
            int currentLevel = entity.getApprovalLevel() != null ? entity.getApprovalLevel().ordinal() : 0;
            if (currentLevel == 0 && AdminAutoApproval.isAutoApprover()) {
                // Administrators clear both levels in one step.
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
                entity.setStatus(StationStatus.APPROVED_L2);
            } else if (currentLevel == 0) {
                entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
                entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
                entity.setStatus(StationStatus.APPROVED_L1);
            } else if (currentLevel == 1) {
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
                    entity.getDeviceCode(),
                    currentLevel == 0 ? StationHistoryActionType.APPROVE_L1 : StationHistoryActionType.APPROVE_L2,
                    "Pending approval",
                    "Approved at level " + entity.getApprovalLevel(),
                    String.valueOf(userId),
                    LocalDateTime.now());
        } else {
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setStatus(StationStatus.PENDING_APPROVAL);
            entity.setApprovedBy(null);
            entity.setApprovedDate(null);
            entity.setApprovalLevel(null);
            historyService.recordHistory(
                    entity.getDeviceCode(),
                    StationHistoryActionType.UPDATE,
                    "Approved L1",
                    "Reset to pending",
                    String.valueOf(userId),
                    LocalDateTime.now());
        }

        return repository.save(entity);
    }

    public CoastalStationInmarsat rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Inmarsat station not found with id: " + id));

        if (rejectionReason == null || rejectionReason.length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setRejectionReason(rejectionReason);
        entity.setApprovedBy(null);
        entity.setApprovedDate(null);
        entity.setApprovalLevel(null);

        historyService.recordHistory(
                entity.getDeviceCode(),
                StationHistoryActionType.REJECT,
                "Approved",
                "Rejected: " + rejectionReason,
                String.valueOf(userId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public List<CoastalStationInmarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Inmarsat station not found with id: " + id));
        return historyService.getHistory(entity.getDeviceCode()).stream()
                .map(h -> {
                    CoastalStationInmarsatHistoryResponse r = new CoastalStationInmarsatHistoryResponse();
                    r.setId(h.getId());
                    r.setDeviceCode(h.getStationCode());
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

    private void validateCoordinates(Double longitude, Double latitude) {
        if (longitude == null || latitude == null) {
            throw new IllegalArgumentException("Tọa độ không được để trống");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Kinh độ phải trong khoảng -180~180 (WGS84)");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Vĩ độ phải trong khoảng -90~90 (WGS84)");
        }
    }

    private String resolveCreatedBy(CoastalStationInmarsat entity) {
        return entity.getApprovedBy();
    }

    public CoastalStationInmarsatResponse buildResponse(CoastalStationInmarsat entity) {
        return CoastalStationInmarsatResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .deviceCode(entity.getDeviceCode())
                .stationName(entity.getName())
                .modemType(entity.getModemType())
                .frequency(entity.getFrequency())
                .coverageZone(entity.getCoverageZone())
                .sarCode(entity.getSarCode())
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
