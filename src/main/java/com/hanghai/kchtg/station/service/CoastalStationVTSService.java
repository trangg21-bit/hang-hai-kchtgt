package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.security.AdminAutoApproval;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSHistoryResponse;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSRequest;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSResponse;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationVTS;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationVTSRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

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
        entity.softDelete(SecurityUtils.getCurrentUserId());
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

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(String.valueOf(userId))) {
            throw new IllegalStateException("Bạn không thể phê duyệt bản do chính mình gửi");
        }

        if (approved) {
            int currentLevel = entity.getApprovalLevel() != null ? entity.getApprovalLevel().ordinal() : 0;
            if (currentLevel == 0 && AdminAutoApproval.isAutoApprover()) {
                // Administrators clear both levels in one step.
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L2);
                entity.setStatus(StationStatus.APPROVED_L2);
            } else if (currentLevel == 0) {
                entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L1);
                entity.setStatus(StationStatus.APPROVED_L1);
            } else if (currentLevel == 1) {
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L2);
                entity.setStatus(StationStatus.APPROVED_L2);
            } else {
                entity.setStatus(StationStatus.PUBLISHED);
                entity.setApprovalStatus(StationApprovalStatus.APPROVED_L2);
            }
            entity.setApprovedBy(userId != null ? new UUID(0L, userId) : null);
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
            entity.setApprovalLevel(null);
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
        entity.setApprovalLevel(null);

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

    private String resolveCreatedBy(CoastalStationVTS entity) {
        return entity.getApprovedBy() != null ? entity.getApprovedBy().toString() : null;
    }

    public CoastalStationVTSResponse buildResponse(CoastalStationVTS entity) {
        return CoastalStationVTSResponse.builder()
                .id(entity.getId())
                .stationCode(entity.getCode())
                .stationName(entity.getName())
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



