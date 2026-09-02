package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatHistoryResponse;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatRequest;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatResponse;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
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
    private final InfrastructureApprovalService approvalService;

    public CoastalStationCospasSarsat createStation(CoastalStationCospasSarsatRequest request) {
        FieldWriteGuard.validateObject(request);
        if (repository.findByCode(request.getStationCode()).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getStationCode());
        }

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
                InfrastructureType.COSPAS_SARSAT_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Cospas-Sarsat station created",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public CoastalStationCospasSarsat updateStation(UUID id, CoastalStationCospasSarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        java.util.Map<String, String> oldValues = new java.util.LinkedHashMap<>();
        if (wasApproved) {
            if (request.getStationName() != null && !java.util.Objects.equals(request.getStationName(), entity.getName())) {
                oldValues.put("Tên đài", entity.getName() != null ? entity.getName() : "—");
            }
            if (request.getFrequency() != null && !java.util.Objects.equals(request.getFrequency(), entity.getFrequency())) {
                oldValues.put("Tần số", entity.getFrequency() != null ? entity.getFrequency() : "—");
            }
            if (request.getCoverageArea() != null && !java.util.Objects.equals(request.getCoverageArea(), entity.getCoverageArea())) {
                oldValues.put("Vùng phủ sóng", entity.getCoverageArea() != null ? entity.getCoverageArea() : "—");
            }
            if (request.getBeaconProtocol() != null && !java.util.Objects.equals(request.getBeaconProtocol(), entity.getBeaconProtocol())) {
                oldValues.put("Giao thức phát", entity.getBeaconProtocol() != null ? entity.getBeaconProtocol() : "—");
            }
            if (request.getEmergencyChannel() != null && !java.util.Objects.equals(request.getEmergencyChannel(), entity.getEmergencyChannel())) {
                oldValues.put("Kênh khẩn cấp", entity.getEmergencyChannel() != null ? entity.getEmergencyChannel() : "—");
            }
            if (request.getAntennaType() != null && !java.util.Objects.equals(request.getAntennaType(), entity.getAntennaType())) {
                oldValues.put("Loại anten", entity.getAntennaType() != null ? entity.getAntennaType() : "—");
            }
            if (request.getLocationAddress() != null && !java.util.Objects.equals(request.getLocationAddress(), entity.getLocationAddress())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationAddress() != null ? entity.getLocationAddress() : "—");
            }
            if (request.getContactPerson() != null && !java.util.Objects.equals(request.getContactPerson(), entity.getContactPerson())) {
                oldValues.put("Người liên hệ", entity.getContactPerson() != null ? entity.getContactPerson() : "—");
            }
            if (request.getContactPhone() != null && !java.util.Objects.equals(request.getContactPhone(), entity.getContactPhone())) {
                oldValues.put("Số điện thoại liên hệ", entity.getContactPhone() != null ? entity.getContactPhone() : "—");
            }
            if (request.getSignalRange() != null && !java.util.Objects.equals(request.getSignalRange(), entity.getSignalRange())) {
                oldValues.put("Cự ly tín hiệu", entity.getSignalRange() != null ? String.valueOf(entity.getSignalRange()) : "—");
            }
            if (request.getOperatingMode() != null && !java.util.Objects.equals(request.getOperatingMode(), entity.getOperatingMode())) {
                oldValues.put("Chế độ hoạt động", entity.getOperatingMode() != null ? entity.getOperatingMode() : "—");
            }
        }

        if (request.getStationName() != null)
            entity.setName(request.getStationName());
        if (request.getFrequency() != null)
            entity.setFrequency(request.getFrequency());
        if (request.getCoverageArea() != null)
            entity.setCoverageArea(request.getCoverageArea());
        if (request.getBeaconProtocol() != null)
            entity.setBeaconProtocol(request.getBeaconProtocol());
        if (request.getEmergencyChannel() != null)
            entity.setEmergencyChannel(request.getEmergencyChannel());
        if (request.getAntennaType() != null)
            entity.setAntennaType(request.getAntennaType());
        if (request.getLocationAddress() != null)
            entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null)
            entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null)
            entity.setContactPhone(request.getContactPhone());
        if (request.getSignalRange() != null)
            entity.setSignalRange(request.getSignalRange());
        if (request.getOperatingMode() != null)
            entity.setOperatingMode(request.getOperatingMode());

        CoastalStationCospasSarsat saved = repository.save(entity);
        // T12 — sửa hồ sơ đã duyệt: giữ nguyên trạng thái "Đã duyệt", chỉ ghi vết thay đổi
        if (wasApproved) {
            saved.setApprovalStatus(ApprovalStatus.APPROVED);
            syncStationStatus(saved);
            saved = repository.save(saved);
        }

        if (wasApproved && !oldValues.isEmpty()) {
            final CoastalStationCospasSarsat finalSaved = saved;
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            historyService.recordDeltaChanges(
                    InfrastructureType.COSPAS_SARSAT_STATION,
                    finalSaved.getId(),
                    oldValues,
                    field -> getNewValueDisplay(field, finalSaved),
                    currentUserId);
        }
        return saved;
    }

    private String getNewValueDisplay(String fieldName, CoastalStationCospasSarsat entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Tần số" -> entity.getFrequency() != null ? entity.getFrequency() : "—";
            case "Vùng phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
            case "Giao thức phát" -> entity.getBeaconProtocol() != null ? entity.getBeaconProtocol() : "—";
            case "Kênh khẩn cấp" -> entity.getEmergencyChannel() != null ? entity.getEmergencyChannel() : "—";
            case "Loại anten" -> entity.getAntennaType() != null ? entity.getAntennaType() : "—";
            case "Địa điểm chi tiết" -> entity.getLocationAddress() != null ? entity.getLocationAddress() : "—";
            case "Người liên hệ" -> entity.getContactPerson() != null ? entity.getContactPerson() : "—";
            case "Số điện thoại liên hệ" -> entity.getContactPhone() != null ? entity.getContactPhone() : "—";
            case "Cự ly tín hiệu" -> entity.getSignalRange() != null ? String.valueOf(entity.getSignalRange()) : "—";
            case "Chế độ hoạt động" -> entity.getOperatingMode() != null ? entity.getOperatingMode() : "—";
            default -> "—";
        };
    }

    public void deleteStation(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));

        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.COSPAS_SARSAT_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Active",
                "Cospas-Sarsat station deleted",
                SecurityUtils.getCurrentUserId());
    }

    public CoastalStationCospasSarsat getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));
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

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP (docs/conventions/approval-2-level-spec.md mục 3) ---

    public CoastalStationCospasSarsat submit(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        // Quy tắc 14: người gửi thuộc cấp Cục -> bỏ qua vòng 1, vào thẳng "Chờ Cục duyệt".
        // Kiểm tra trạng thái hợp lệ, chống tự duyệt và ghi nhật ký do service dùng chung đảm nhiệm.
        approvalService.submit(entity, InfrastructureType.COSPAS_SARSAT_STATION, currentUserId);

        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel1(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC1(entity, InfrastructureType.COSPAS_SARSAT_STATION, "APPROVED", null, currentUserId);
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel2(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC2(entity, InfrastructureType.COSPAS_SARSAT_STATION, "APPROVED", null, currentUserId);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat reject(UUID id, String rejectionReason) {
        CoastalStationCospasSarsat entity = getStationById(id);
        // Quy tắc 5: từ chối ở bất kỳ vòng nào đều bắt buộc lý do tối thiểu 10 ký tự
        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.COSPAS_SARSAT_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.COSPAS_SARSAT_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
        }
        syncStationStatus(entity);
        return repository.save(entity);
    }

    /**
     * Đồng bộ các trường hiển thị riêng của họ nhà trạm ({@code status}, {@code approvalLevel})
     * theo trạng thái phê duyệt chuẩn do service dùng chung đặt.
     */
    private void syncStationStatus(CoastalStationCospasSarsat entity) {
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
    public CoastalStationCospasSarsat approveStation(UUID id, boolean approved) {
        return approveStation(id, approved, null);
    }

    public CoastalStationCospasSarsat approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (!approved) {
            return reject(id, "Từ chối phê duyệt bởi quản trị viên");
        }
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            return approveLevel2(id);
        }
        return approveLevel1(id);
    }

    public CoastalStationCospasSarsat rejectStation(UUID id, String rejectionReason, Long userId) {
        return reject(id, rejectionReason);
    }


    public List<CoastalStationCospasSarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));
        return historyService.getHistory(InfrastructureType.COSPAS_SARSAT_STATION, entity.getId(), entity.getCode()).stream()
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

    // -- HELPERS --

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
