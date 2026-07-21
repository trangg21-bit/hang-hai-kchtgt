package com.hanghai.kchtg.station.service;
import lombok.*;

import com.hanghai.kchtg.station.dto.coastal.*;
import com.hanghai.kchtg.station.entity.*;
import com.hanghai.kchtg.station.repository.CoastalStationVTSRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CoastalStationVTSService {

    private final CoastalStationVTSRepository repository;
    private final HistoryService historyService;

    public CoastalStationVTS createStation(CoastalStationVTSRequest request) {
        if (repository.findByCode(request.getStationCode()).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getStationCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());

        CoastalStationVTS entity = new CoastalStationVTS();
        entity.setCode(request.getStationCode());
        entity.setName(request.getStationName());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());
        entity.setFrequencyBand(request.getFrequencyBand());
        entity.setTransmitPower(request.getTransmitPower());
        entity.setEquipmentType(request.getEquipmentType());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setIsActive(true);

        CoastalStationVTS saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.CREATE,
                null,
                "Station created",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public CoastalStationVTS updateStation(UUID id, CoastalStationVTSUpdateRequest request) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));

        String previousCode = entity.getCode();

        validateCoordinates(request.getLongitude(), request.getLatitude());

        if (request.getStationName() != null) entity.setName(request.getStationName());
        if (request.getLatitude() != null) entity.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) entity.setLongitude(request.getLongitude());
        if (request.getFrequencyBand() != null) entity.setFrequencyBand(request.getFrequencyBand());
        if (request.getTransmitPower() != null) entity.setTransmitPower(request.getTransmitPower());
        if (request.getEquipmentType() != null) entity.setEquipmentType(request.getEquipmentType());
        if (request.getLocationAddress() != null) entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null) entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null) entity.setContactPhone(request.getContactPhone());

        CoastalStationVTS saved = repository.save(entity);

        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.UPDATE,
                previousCode,
                "Station updated",
                "system",
                LocalDateTime.now()
        );
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));

        String stationCode = entity.getCode();
        entity.softDelete();
        repository.save(entity);

        historyService.recordHistory(
                stationCode,
                StationHistoryActionType.DELETE,
                "Active",
                "Deleted",
                "system",
                LocalDateTime.now()
        );
    }

    public CoastalStationVTS getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));
    }

    public List<CoastalStationVTS> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationVTS> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public Optional<CoastalStationVTS> findByCode(String code) {
        return repository.findByCode(code);
    }

    public CoastalStationVTS approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));

        Long creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(userId)) {
            throw new IllegalStateException("Bạn không thể phê duyệt bản do chính mình gửi");
        }

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
            entity.setRejectionReason(null);

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

    public CoastalStationVTS rejectStation(UUID id, String rejectionReason, Long userId) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));

        if (rejectionReason == null || rejectionReason.length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

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

    public List<CoastalStationVTSHistoryResponse> getHistory(UUID id) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));
        return historyService.getHistory(entity.getCode());
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

    private Long resolveCreatedBy(BaseStation entity) {
        return entity.getApprovedBy();
    }

    public CoastalStationVTSResponse buildResponse(CoastalStationVTS entity) {
        return CoastalStationVTSResponse.builder()
                .id(entity.getId())
                .stationCode(entity.getCode())
                .stationName(entity.getName())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .frequencyBand(entity.getFrequencyBand())
                .transmitPower(entity.getTransmitPower())
                .equipmentType(entity.getEquipmentType())
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
