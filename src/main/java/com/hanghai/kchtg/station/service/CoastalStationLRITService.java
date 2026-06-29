package com.hanghai.kchtg.station.service;
import lombok.*;

import com.hanghai.kchtg.station.dto.lrit.*;
import com.hanghai.kchtg.station.entity.*;
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
        CoastalStationLRIT entity = new CoastalStationLRIT();
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
                saved.getCode(),
                StationHistoryActionType.CREATE,
                null,
                "LRIT station created",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public CoastalStationLRIT updateStation(UUID id, CoastalStationLRITUpdateRequest request) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("LRIT station not found with id: " + id));

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

        CoastalStationLRIT saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.UPDATE,
                null,
                "LRIT station updated",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("LRIT station not found with id: " + id));

        String stationCode = entity.getCode();
        entity.softDelete();
        repository.save(entity);

        historyService.recordHistory(
                stationCode,
                StationHistoryActionType.DELETE,
                "Active",
                "LRIT station deleted",
                "system",
                LocalDateTime.now()
        );
    }

    public CoastalStationLRIT getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("LRIT station not found with id: " + id));
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
                .orElseThrow(() -> new RuntimeException("LRIT station not found with id: " + id));

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

    public CoastalStationLRIT rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("LRIT station not found with id: " + id));

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

    public List<CoastalStationLRITHistoryResponse> getHistory(UUID id) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("LRIT station not found with id: " + id));
        return historyService.getHistory(entity.getCode()).stream()
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

    public CoastalStationLRITResponse buildResponse(CoastalStationLRIT entity) {
        return CoastalStationLRITResponse.builder()
                .id(entity.getId())
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
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }
}
