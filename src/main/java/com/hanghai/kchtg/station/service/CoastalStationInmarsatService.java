package com.hanghai.kchtg.station.service;
import lombok.*;

import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.*;
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
        CoastalStationInmarsat entity = new CoastalStationInmarsat();
        entity.setDeviceCode(request.getDeviceCode());
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
                LocalDateTime.now()
        );
        return saved;
    }

    public CoastalStationInmarsat updateStation(UUID id, CoastalStationInmarsatUpdateRequest request) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inmarsat station not found with id: " + id));

        entity.setDeviceCode(request.getDeviceCode());
        entity.setName(request.getStationName());
        entity.setModemType(request.getModemType());
        entity.setFrequency(request.getFrequency());
        entity.setCoverageZone(request.getCoverageZone());
        entity.setSarCode(request.getSarCode());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());

        CoastalStationInmarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getDeviceCode(),
                StationHistoryActionType.UPDATE,
                null,
                "Inmarsat station updated",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inmarsat station not found with id: " + id));

        String deviceCode = entity.getDeviceCode();
        entity.softDelete();
        repository.save(entity);

        historyService.recordHistory(
                deviceCode,
                StationHistoryActionType.DELETE,
                "Active",
                "Inmarsat station deleted",
                "system",
                LocalDateTime.now()
        );
    }

    public CoastalStationInmarsat getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inmarsat station not found with id: " + id));
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
                .orElseThrow(() -> new RuntimeException("Inmarsat station not found with id: " + id));

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
                    entity.getDeviceCode(),
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
                    entity.getDeviceCode(),
                    StationHistoryActionType.UPDATE,
                    "Approved L1",
                    "Reset to pending",
                    String.valueOf(userId),
                    LocalDateTime.now()
            );
        }

        return repository.save(entity);
    }

    public CoastalStationInmarsat rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inmarsat station not found with id: " + id));

        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setRejectionReason(rejectionReason);
        entity.setApprovedBy(null);
        entity.setApprovedDate(null);
        entity.setApprovalLevel(0);

        historyService.recordHistory(
                entity.getDeviceCode(),
                StationHistoryActionType.REJECT,
                "Approved",
                "Rejected: " + rejectionReason,
                String.valueOf(userId),
                LocalDateTime.now()
        );

        return repository.save(entity);
    }

    public List<CoastalStationInmarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Inmarsat station not found with id: " + id));
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

    public CoastalStationInmarsatResponse buildResponse(CoastalStationInmarsat entity) {
        return CoastalStationInmarsatResponse.builder()
                .id(entity.getId())
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
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }
}
