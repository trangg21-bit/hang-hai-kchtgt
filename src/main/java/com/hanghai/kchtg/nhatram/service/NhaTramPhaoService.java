package com.hanghai.kchtg.nhatram.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.nhatram.dto.phao.CreateNhaTramPhaoRequest;
import com.hanghai.kchtg.nhatram.dto.phao.NhaTramPhaoResponse;
import com.hanghai.kchtg.nhatram.dto.phao.UpdateNhaTramPhaoRequest;
import com.hanghai.kchtg.nhatram.entity.*;
import com.hanghai.kchtg.nhatram.repository.NhaTramHistoryRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramDenRepository;
import com.hanghai.kchtg.nhatram.repository.NhaTramPhaoRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Service cho CRUD + quy trinh phe duyet nha tram phao (F-080 den F-085).
 * Cau truc song song voi NhaTramDenService.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NhaTramPhaoService {

    private final NhaTramPhaoRepository phaoRepo;
    private final NhaTramDenRepository denRepo;
    private final NhaTramHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // -- READ --

    public List<NhaTramPhaoResponse> findAll() {
        return phaoRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public NhaTramPhaoResponse findById(UUID id) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));
        return toResponse(entity);
    }

    public List<NhaTramPhaoResponse> search(
            String name, String code, BuoyType type, NhaTramStatus status) {
        return phaoRepo.searchFiltered(name, code, type, status).stream()
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public NhaTramPhaoResponse create(CreateNhaTramPhaoRequest request) {
        if (phaoRepo.existsByCode(request.getCode())
                || denRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Da ton tai: " + request.getCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());
        validateInspectionDates(request.getLastInspectionDate(), request.getNextInspectionDate());

        NhaTramPhao entity = NhaTramPhao.builder()
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .color(request.getColor())
                .shape(request.getShape())
                .lightCharacteristic(request.getLightCharacteristic())
                .range(request.getRange())
                .description(request.getDescription())
                .unitId(request.getUnitId())
                .lastInspectionDate(request.getLastInspectionDate())
                .nextInspectionDate(request.getNextInspectionDate())
                .isActive(request.getIsActive())
                .status(NhaTramStatus.DRAFT)
                .approvalStatus(NhaTramApprovalStatus.PENDING)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus(NhaTramStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(1);
        }

        entity = phaoRepo.save(entity);

        logHistory(entity, NhaTramHistoryActionType.CREATE, null, null, toJson(entity));
        notificationService.sendApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public NhaTramPhaoResponse update(UUID id, UpdateNhaTramPhaoRequest request) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));

        if (entity.getStatus() == NhaTramStatus.DELETED) {
            throw new EntityNotFoundException("Nha tram phao da bi xoa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());

        // Handle type field update conditionally
        if (request.getType() != null && request.getType() != entity.getType()) {
            if (isApprovedStatus(entity.getStatus())) {
                throw new IllegalArgumentException(
                        "Loai nha tram phao khong the thay doi khi da duoc phe duyet.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates
        if (request.getLongitude() != null || request.getLatitude() != null) {
            Double finalLon = request.getLongitude() != null ? request.getLongitude() : entity.getLongitude();
            Double finalLat = request.getLatitude() != null ? request.getLatitude() : entity.getLatitude();
            validateCoordinates(finalLon, finalLat);
            entity.setLongitude(finalLon);
            entity.setLatitude(finalLat);
        }

        if (request.getColor() != null) entity.setColor(request.getColor());
        if (request.getShape() != null) entity.setShape(request.getShape());
        if (request.getLightCharacteristic() != null) {
            entity.setLightCharacteristic(request.getLightCharacteristic());
        }
        if (request.getRange() != null) entity.setRange(request.getRange());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getLastInspectionDate() != null) {
            entity.setLastInspectionDate(request.getLastInspectionDate());
        }
        if (request.getNextInspectionDate() != null) {
            entity.setNextInspectionDate(request.getNextInspectionDate());
        }
        if (request.getIsActive() != null) entity.setIsActive(request.getIsActive());

        // Status revert logic for approved states
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus(NhaTramStatus.DRAFT);
            entity.setApprovalStatus(NhaTramApprovalStatus.PENDING);
            entity.setApprovalLevel(1);
        }

        phaoRepo.save(entity);

        // Compare JSON for actual changes
        String newJson = toJson(entity);
        if (!compareJsonNodes(oldJson, newJson)) {
            logHistory(entity, NhaTramHistoryActionType.UPDATE,
                    getChangedFields(oldJson, newJson), oldJson, newJson);
        }
        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(UUID id) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));

        if (entity.getStatus() == NhaTramStatus.DELETED) {
            throw new IllegalArgumentException("Nha tram phao nay da bi xoa truoc do");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Khong the xoa nha tram phao dang cho phe duyet");
        }

        entity.setStatus(NhaTramStatus.DELETED);
        entity.softDelete();
        phaoRepo.save(entity);

        logHistory(entity, NhaTramHistoryActionType.SOFT_DELETE, null, null, toJson(entity));

        pointObjectSyncService.hideFromMapPhao(entity);
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));

        if (entity.getStatus() != NhaTramStatus.DRAFT) {
            throw new IllegalStateException(
                    "Chi co the gui phe duyet khi status = DRAFT");
        }

        entity.setStatus(NhaTramStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(NhaTramApprovalStatus.PENDING);
        entity.setApprovalLevel(1);
        phaoRepo.save(entity);

        notificationService.sendApprovalNotificationPhao(entity);
    }

    @Transactional
    public NhaTramPhaoResponse approveL1(UUID id, String approverId) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));

        if (entity.getStatus() != NhaTramStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Khong o trang thai cho phe duyet L1");
        }

        Long creatorId = resolveCreatedBy(entity);
        Long approverUserId = Long.parseLong(approverId);
        if (creatorId != null && creatorId.equals(approverUserId)) {
            throw new IllegalStateException(
                    "Ban khong the phe duyet ban do chinh minh gui");
        }

        entity.setStatus(NhaTramStatus.APPROVED_L1);
        entity.setApprovalStatus(NhaTramApprovalStatus.APPROVED);
        entity.setApprovedBy(approverUserId);
        entity.setApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        logHistory(entity, NhaTramHistoryActionType.APPROVE_L1, null, null, null);
        notificationService.sendL2ApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public NhaTramPhaoResponse approveL2(UUID id, String approverId) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));

        if (entity.getStatus() != NhaTramStatus.APPROVED_L1) {
            throw new IllegalStateException(
                    "Khong o trang thai cho phe duyet L2");
        }

        Long approverUserId = Long.parseLong(approverId);
        entity.setStatus(NhaTramStatus.PUBLISHED);
        entity.setApprovalStatus(NhaTramApprovalStatus.APPROVED);
        entity.setApprovedBy(approverUserId);
        entity.setApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        logHistory(entity, NhaTramHistoryActionType.APPROVE_L2, null, null, null);

        pointObjectSyncService.syncToMapPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public NhaTramPhaoResponse reject(UUID id, String rejectReason, String approverId) {
        NhaTramPhao entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nha tram phao khong tim thay: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Ly do tu choi phai co it nhat 10 ky tu");
        }

        entity.setStatus(NhaTramStatus.DRAFT);
        entity.setApprovalStatus(NhaTramApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        phaoRepo.save(entity);

        logHistory(entity, NhaTramHistoryActionType.REJECT, null, null, rejectReason);
        notificationService.sendRejectionNotificationPhao(entity, rejectReason);

        return toResponse(entity);
    }

    // -- HELPERS --

    private void validateCoordinates(Double longitude, Double latitude) {
        if (longitude == null || latitude == null) {
            throw new IllegalArgumentException("Toa do khong duoc de trong");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException(
                    "Kinh do phai trong khoang -180~180 (WGS84)");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException(
                    "Vi do phai trong khoang -90~90 (WGS84)");
        }
    }

    private void validateInspectionDates(LocalDate last, LocalDate next) {
        if (last != null && last.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngay kiem tra gan nhat khong duoc lon hon ngay hien tai");
        }
        if (last != null && next != null && next.isBefore(last)) {
            throw new IllegalArgumentException(
                    "Ngay kiem tra ke tiep khong duoc nho hon ngay kiem tra gan nhat");
        }
    }

    private void logHistory(NhaTramPhao entity,
                            NhaTramHistoryActionType action, String fields, String previousJson, String newJson) {
        NhaTramHistory entry = NhaTramHistory.builder()
                .tramType(NhaTramType.PHAO)
                .entityId(entity.getId())
                .actionType(action)
                .changedField(fields)
                .previousValue(previousJson)
                .newValue(newJson != null ? newJson : (action == NhaTramHistoryActionType.REJECT ? "REJECTED" : null))
                .changedBy(resolveCurrentUserId())
                .changedAt(LocalDateTime.now())
                .reason(action == NhaTramHistoryActionType.REJECT ? newJson : null)
                .build();
        historyRepo.save(entry);
    }

    private NhaTramPhaoResponse toResponse(NhaTramPhao entity) {
        return NhaTramPhaoResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getType())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .color(entity.getColor())
                .shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic())
                .range(entity.getRange())
                .description(entity.getDescription())
                .unitId(entity.getUnitId())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private boolean isApprovedStatus(NhaTramStatus status) {
        return status == NhaTramStatus.APPROVED_L1
                || status == NhaTramStatus.APPROVED_L2
                || status == NhaTramStatus.PUBLISHED;
    }

    private boolean isInApprovalProcess(NhaTramStatus status) {
        return status == NhaTramStatus.PENDING_APPROVAL
                || status == NhaTramStatus.APPROVED_L1
                || status == NhaTramStatus.APPROVED_L2;
    }

    private Long getCurrentUserUnitId() {
        return null;
    }

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private Long resolveCreatedBy(NhaTramPhao entity) {
        return entity.getApprovedBy();
    }

    // -- JSON Comparison (Bug fix patterns from M-013) --

    private String toJson(NhaTramPhao entity) {
        try {
            return objectMapper.writeValueAsString(toResponse(entity));
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * So sanh hai chuoi JSON bang JsonNode.equals() de tranh sai so do
     * cung gia tri ma serialize thanh chuoi khac nhau.
     */
    private boolean compareJsonNodes(String json1, String json2) {
        try {
            JsonNode node1 = objectMapper.readTree(json1);
            JsonNode node2 = objectMapper.readTree(json2);
            return node1.equals(node2);
        } catch (Exception e) {
            return true;
        }
    }

    private String getChangedFields(String oldJson, String newJson) {
        try {
            Map<String, Object> oldMap = objectMapper.readValue(oldJson, Map.class);
            Map<String, Object> newMap = objectMapper.readValue(newJson, Map.class);
            List<String> changed = new ArrayList<>();
            for (String key : newMap.keySet()) {
                Object oldVal = oldMap.get(key);
                Object newVal = newMap.get(key);
                if (!Objects.equals(oldVal, newVal)) {
                    changed.add(key);
                }
            }
            return changed.isEmpty() ? "fields_updated" : String.join(", ", changed);
        } catch (Exception e) {
            return "fields_updated";
        }
    }
}
