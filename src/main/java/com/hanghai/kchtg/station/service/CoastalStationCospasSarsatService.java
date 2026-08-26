package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatHistoryResponse;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatRequest;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatResponse;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatUpdateRequest;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
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

    public CoastalStationCospasSarsat createStation(CoastalStationCospasSarsatRequest request) {
        FieldWriteGuard.validateObject(request);
        if (repository.findByCode(request.getStationCode()).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getStationCode());
        }

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "coastalstationcospassarsat",
                SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        CoastalStationCospasSarsat entity = new CoastalStationCospasSarsat();
        entity.setSecurityLevel(secLevel);
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
                LocalDateTime.now());
        return saved;
    }

    public CoastalStationCospasSarsat updateStation(UUID id, CoastalStationCospasSarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "coastalstationcospassarsat",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
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
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.UPDATE,
                null,
                "Cospas-Sarsat station updated",
                "system",
                LocalDateTime.now());
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));

        String stationCode = entity.getCode();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                stationCode,
                StationHistoryActionType.DELETE,
                "Active",
                "Cospas-Sarsat station deleted",
                "system",
                LocalDateTime.now());
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
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT &&
            entity.getApprovalStatus() != ApprovalStatus.REJECTED_LEVEL1 &&
            entity.getApprovalStatus() != ApprovalStatus.REJECTED_LEVEL2) {
            throw new IllegalStateException("Chỉ bản ghi ở trạng thái Lưu tạm hoặc Bị trả về mới được gửi phê duyệt");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();

        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        entity.setRejectionReason(null);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.UPDATE,
                "Lưu tạm",
                "Gửi phê duyệt cấp Cảng vụ/Chi cục",
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel1(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Bản ghi không ở trạng thái Chờ duyệt cấp Cảng vụ/Chi cục");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);

        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setStatus(StationStatus.APPROVED_L1);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
        entity.setApproverLevel1(currentUserId);
        entity.setApprovedDateLevel1(LocalDateTime.now());
        entity.setRejectionReason(null);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.APPROVE_L1,
                "Chờ duyệt C1",
                "Phê duyệt cấp 1 (Cảng vụ/Chi cục)",
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel2(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
            throw new IllegalStateException("Bản ghi không ở trạng thái Chờ duyệt cấp Cục");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);
        // 4 mắt: người đã duyệt vòng 1 không được duyệt tiếp vòng 2
        if (entity.getApproverLevel1() != null && entity.getApproverLevel1().equals(currentUserId)) {
            throw new IllegalStateException(
                    "Người phê duyệt cấp Cục không được trùng với người phê duyệt cấp Cảng vụ / Chi cục");
        }

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setStatus(StationStatus.APPROVED_L2);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
        entity.setApproverLevel2(currentUserId);
        entity.setApprovedDateLevel2(LocalDateTime.now());
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setRejectionReason(null);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.APPROVE_L2,
                "Chờ duyệt C2",
                "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam) - Ban hành chính thức",
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public CoastalStationCospasSarsat reject(UUID id, String rejectionReason) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL &&
            entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
            throw new IllegalStateException("Bản ghi không ở trạng thái Chờ duyệt để từ chối");
        }

        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);

        ApprovalStatus nextStatus = (entity.getApprovalStatus() == ApprovalStatus.PENDING_APPROVAL)
                ? ApprovalStatus.REJECTED_LEVEL1
                : ApprovalStatus.REJECTED_LEVEL2;

        entity.setApprovalStatus(nextStatus);
        entity.setStatus(StationStatus.REJECTED);
        entity.setRejectionReason(rejectionReason.trim());

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.REJECT,
                "Chờ duyệt",
                "Từ chối phê duyệt: " + rejectionReason.trim(),
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    // Tương thích ngược với endpoint /approve, /reject cũ
    public CoastalStationCospasSarsat approveStation(UUID id, boolean approved) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (!approved) {
            return reject(id, "Từ chối phê duyệt bởi quản trị viên");
        }
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            return approveLevel2(id);
        }
        return approveLevel1(id);
    }


    public List<CoastalStationCospasSarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException(
                        "Cospas-Sarsat station not found with id: " + id));
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

    // -- HELPERS --

    /** Chống tự duyệt (4 mắt) — quy tắc 8 của quy trình phê duyệt 2 cấp. */
    private void validateNotSelfApproval(UUID createdBy, UUID currentUserId) {
        if (createdBy != null && currentUserId != null && createdBy.equals(currentUserId)) {
            throw new IllegalStateException("Bạn không thể tự phê duyệt bản ghi do chính mình tạo (Nguyên tắc 4 mắt)");
        }
    }

    public CoastalStationCospasSarsatResponse buildResponse(CoastalStationCospasSarsat entity) {
        return CoastalStationCospasSarsatResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
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
