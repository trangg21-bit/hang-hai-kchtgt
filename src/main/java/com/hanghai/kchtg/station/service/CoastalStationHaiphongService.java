package com.hanghai.kchtg.station.service;
import lombok.*;

import com.hanghai.kchtg.station.dto.haiphong.*;
import com.hanghai.kchtg.station.entity.*;
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
        CoastalStationHaiphong entity = new CoastalStationHaiphong();
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
                saved.getCode(),
                StationHistoryActionType.CREATE,
                null,
                "Haiphong station created",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public CoastalStationHaiphong updateStation(UUID id, CoastalStationHaiphongUpdateRequest request) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Haiphong station not found with id: " + id));

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

        CoastalStationHaiphong saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.UPDATE,
                null,
                "Haiphong station updated",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Haiphong station not found with id: " + id));

        String stationCode = entity.getCode();
        entity.softDelete();
        repository.save(entity);

        historyService.recordHistory(
                stationCode,
                StationHistoryActionType.DELETE,
                "Active",
                "Haiphong station deleted",
                "system",
                LocalDateTime.now()
        );
    }

    public CoastalStationHaiphong getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Haiphong station not found with id: " + id));
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
                .orElseThrow(() -> new RuntimeException("Haiphong station not found with id: " + id));

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

    public CoastalStationHaiphong rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Haiphong station not found with id: " + id));

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

    public List<CoastalStationHaiphongHistoryResponse> getHistory(UUID id) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Haiphong station not found with id: " + id));
        return historyService.getHistory(entity.getCode()).stream()
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

    public CoastalStationHaiphongResponse buildResponse(CoastalStationHaiphong entity) {
        return CoastalStationHaiphongResponse.builder()
                .id(entity.getId())
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
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }
}
