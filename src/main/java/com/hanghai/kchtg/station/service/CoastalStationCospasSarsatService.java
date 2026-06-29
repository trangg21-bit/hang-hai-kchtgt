package com.hanghai.kchtg.station.service;
import lombok.*;

import com.hanghai.kchtg.station.dto.cospas.*;
import com.hanghai.kchtg.station.entity.*;
import com.hanghai.kchtg.station.repository.CoastalStationCospasSarsatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CoastalStationCospasSarsatService {

    private final CoastalStationCospasSarsatRepository repository;
    private final HistoryService historyService;

    public CoastalStationCospasSarsat createStation(CoastalStationCospasSarsatRequest request) {
        CoastalStationCospasSarsat entity = new CoastalStationCospasSarsat();
        entity.setCode(request.getStationCode());
        entity.setName(request.getStationName());
        entity.setFrequency(request.getFrequency());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setBeaconProtocol(request.getBeaconProtocol());
        entity.setEmergencyChannel(request.getEmergencyChannel());
        entity.setAntennaType(request.getAntennaType());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setSignalRange(request.getSignalRange());
        entity.setOperatingMode(request.getOperatingMode());
        entity.setIsActive(true);

        CoastalStationCospasSarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.CREATE,
                null,
                "Cospas-Sarsat station created",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public CoastalStationCospasSarsat updateStation(UUID id, CoastalStationCospasSarsatUpdateRequest request) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cospas-Sarsat station not found with id: " + id));

        entity.setCode(request.getStationCode());
        entity.setName(request.getStationName());
        entity.setFrequency(request.getFrequency());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setBeaconProtocol(request.getBeaconProtocol());
        entity.setEmergencyChannel(request.getEmergencyChannel());
        entity.setAntennaType(request.getAntennaType());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setSignalRange(request.getSignalRange());
        entity.setOperatingMode(request.getOperatingMode());

        CoastalStationCospasSarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.UPDATE,
                null,
                "Cospas-Sarsat station updated",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cospas-Sarsat station not found with id: " + id));

        String stationCode = entity.getCode();
        entity.softDelete();
        repository.save(entity);

        historyService.recordHistory(
                stationCode,
                StationHistoryActionType.DELETE,
                "Active",
                "Cospas-Sarsat station deleted",
                "system",
                LocalDateTime.now()
        );
    }

    public CoastalStationCospasSarsat getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cospas-Sarsat station not found with id: " + id));
    }

    public List<CoastalStationCospasSarsat> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationCospasSarsat> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public Optional<CoastalStationCospasSarsat> findByCode(String code) {
        return repository.findByCode(code);
    }

    public CoastalStationCospasSarsat approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cospas-Sarsat station not found with id: " + id));

        if (approved) {
            Integer currentLevel = entity.getApprovalLevel() != null ? entity.getApprovalLevel() : 0;
            if (currentLevel == 0) {
                entity.setApprovalLevel(1);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L1);
                entity.setStatus(StationStatus.APPROVED_L1);
            } else if (currentLevel == 1) {
                entity.setApprovalLevel(2);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L2);
                entity.setStatus(StationStatus.APPROVED_L2);
            } else {
                entity.setStatus(StationStatus.PUBLISHED);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L2);
            }
            entity.setApprovedBy(userId);
            entity.setApprovedDate(LocalDateTime.now());
            entity.setRejectionReason(null);

            historyService.recordHistory(
                    entity.getCode(),
                    currentLevel == 0 ? StationHistoryActionType.APPROVE_L1 : StationHistoryActionType.APPROVE_L2,
                    "Pending approval",
                    "Approved at level " + entity.getApprovalLevel(),
                    String.valueOf(userId),
                    LocalDateTime.now()
            );
        } else {
            entity.setApprovalStatus(StationApprovalStatus.PENDING);
            entity.setStatus(StationStatus.PENDING_APPROVAL);
            entity.setApprovedBy(null);
            entity.setApprovedDate(null);
            entity.setApprovalLevel(0);
            historyService.recordHistory(
                    entity.getCode(),
                    StationHistoryActionType.UPDATE,
                    "Approved L1",
                    "Reset to pending",
                    String.valueOf(userId),
                    LocalDateTime.now()
            );
        }

        return repository.save(entity);
    }

    public CoastalStationCospasSarsat rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cospas-Sarsat station not found with id: " + id));

        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setRejectionReason(rejectionReason);
        entity.setApprovedBy(null);
        entity.setApprovedDate(null);
        entity.setApprovalLevel(0);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.REJECT,
                "Approved",
                "Rejected: " + rejectionReason,
                String.valueOf(userId),
                LocalDateTime.now()
        );

        return repository.save(entity);
    }

    public List<CoastalStationCospasSarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cospas-Sarsat station not found with id: " + id));
        return historyService.getHistory(entity.getCode()).stream()
                .map(h -> {
                    CoastalStationCospasSarsatHistoryResponse r = new CoastalStationCospasSarsatHistoryResponse();
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

    public CoastalStationCospasSarsatResponse buildResponse(CoastalStationCospasSarsat entity) {
        return CoastalStationCospasSarsatResponse.builder()
                .id(entity.getId())
                .stationCode(entity.getCode())
                .stationName(entity.getName())
                .frequency(entity.getFrequency())
                .coverageArea(entity.getCoverageArea())
                .beaconProtocol(entity.getBeaconProtocol())
                .emergencyChannel(entity.getEmergencyChannel())
                .antennaType(entity.getAntennaType())
                .locationAddress(entity.getLocationAddress())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .signalRange(entity.getSignalRange())
                .operatingMode(entity.getOperatingMode())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }
}
