package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSHistoryResponse;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSRequest;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSResponse;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationVTS;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
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
    private final InfrastructureApprovalService approvalService;

    public CoastalStationVTS createStation(CoastalStationVTSRequest request) {
        FieldWriteGuard.validateObject(request);
        if (repository.findByCode(request.getStationCode()).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getStationCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "coastalstationvts", SecurityUtils.getCurrentUserPermissions(),
                SecurityUtils.isElevatedAdministrator());

        CoastalStationVTS entity = new CoastalStationVTS();
        entity.setSecurityLevel(secLevel);
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
                InfrastructureType.COASTAL_RADIO_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Station created",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public CoastalStationVTS updateStation(UUID id, CoastalStationVTSUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        String previousCode = entity.getCode();

        validateCoordinates(request.getLongitude(), request.getLatitude());

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "coastalstationvts",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }

        if (request.getStationName() != null)
            entity.setName(request.getStationName());
        if (request.getFrequencyBand() != null)
            entity.setFrequencyBand(request.getFrequencyBand());
        if (request.getTransmitPower() != null)
            entity.setTransmitPower(request.getTransmitPower());
        if (request.getEquipmentType() != null)
            entity.setEquipmentType(request.getEquipmentType());
        if (request.getLocationAddress() != null)
            entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null)
            entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null)
            entity.setContactPhone(request.getContactPhone());

        CoastalStationVTS saved = repository.save(entity);

        // T12 — sửa hồ sơ đã duyệt: giữ nguyên trạng thái "Đã duyệt", chỉ ghi vết thay đổi
        if (wasApproved) {
            saved.setApprovalStatus(ApprovalStatus.APPROVED);
            syncStationStatus(saved);
            saved = repository.save(saved);
        }

        historyService.recordHistory(
                InfrastructureType.COASTAL_RADIO_STATION,
                saved.getId(),
                StationHistoryActionType.UPDATE,
                previousCode,
                wasApproved ? "Cập nhật sau phê duyệt" : "Station updated",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));

        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.COASTAL_RADIO_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Active",
                "Deleted",
                SecurityUtils.getCurrentUserId());
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

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP (docs/conventions/approval-2-level-spec.md mục 3) ---

    public CoastalStationVTS submit(UUID id) {
        CoastalStationVTS entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        // Quy tắc 14: người gửi thuộc cấp Cục -> bỏ qua vòng 1, vào thẳng "Chờ Cục duyệt".
        // Kiểm tra trạng thái hợp lệ, chống tự duyệt và ghi nhật ký do service dùng chung đảm nhiệm.
        approvalService.submit(entity, InfrastructureType.COASTAL_RADIO_STATION, currentUserId);

        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationVTS approveLevel1(UUID id) {
        CoastalStationVTS entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC1(entity, InfrastructureType.COASTAL_RADIO_STATION, "APPROVED", null, currentUserId);
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationVTS approveLevel2(UUID id) {
        CoastalStationVTS entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC2(entity, InfrastructureType.COASTAL_RADIO_STATION, "APPROVED", null, currentUserId);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationVTS reject(UUID id, String rejectionReason) {
        CoastalStationVTS entity = getStationById(id);
        // Quy tắc 5: từ chối ở bất kỳ vòng nào đều bắt buộc lý do tối thiểu 10 ký tự
        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.COASTAL_RADIO_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.COASTAL_RADIO_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
        }
        syncStationStatus(entity);
        return repository.save(entity);
    }

    /**
     * Đồng bộ các trường hiển thị riêng của họ nhà trạm ({@code status}, {@code approvalLevel})
     * theo trạng thái phê duyệt chuẩn do service dùng chung đặt.
     */
    private void syncStationStatus(CoastalStationVTS entity) {
        ApprovalStatus st = entity.getApprovalStatus();
        if (st == null) {
            return;
        }
        switch (st) {
            case DRAFT, PROPOSED -> {
                entity.setStatus(StationStatus.DRAFT);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            }
            case PENDING_APPROVAL -> {
                entity.setStatus(StationStatus.PENDING_APPROVAL);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            }
            case APPROVED_LEVEL1 -> {
                entity.setStatus(StationStatus.APPROVED_L1);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
            }
            case APPROVED, APPROVED_LEVEL2 -> {
                entity.setStatus(StationStatus.APPROVED_L2);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
            }
            case REJECTED, REJECTED_LEVEL1 -> {
                entity.setStatus(StationStatus.REJECTED);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            }
            case REJECTED_LEVEL2 -> {
                entity.setStatus(StationStatus.REJECTED);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
            }
            case ARCHIVED -> entity.setStatus(StationStatus.DELETED);
        }
    }

    // Tương thích ngược với endpoint /approve, /reject cũ
    public CoastalStationVTS approveStation(UUID id, boolean approved) {
        return approveStation(id, approved, null);
    }

    public CoastalStationVTS approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationVTS entity = getStationById(id);
        if (!approved) {
            return reject(id, "Từ chối phê duyệt bởi quản trị viên");
        }
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            return approveLevel2(id);
        }
        return approveLevel1(id);
    }

    public CoastalStationVTS rejectStation(UUID id, String rejectionReason, Long userId) {
        return reject(id, rejectionReason);
    }


    public List<CoastalStationVTSHistoryResponse> getHistory(UUID id) {
        CoastalStationVTS entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Station not found with id: " + id));
        return historyService.getHistory(InfrastructureType.COASTAL_RADIO_STATION, entity.getId(), entity.getCode());
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

    public CoastalStationVTSResponse buildResponse(CoastalStationVTS entity) {
        return CoastalStationVTSResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
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
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .approverLevel1(entity.getApproverLevel1())
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .build();
    }
}
