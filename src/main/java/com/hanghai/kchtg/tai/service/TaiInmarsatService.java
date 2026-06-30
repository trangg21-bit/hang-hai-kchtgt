package com.hanghai.kchtg.tai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.tai.dto.inmarsat.CreateTaiInmarsatRequest;
import com.hanghai.kchtg.tai.dto.inmarsat.TaiInmarsatResponse;
import com.hanghai.kchtg.tai.dto.inmarsat.UpdateTaiInmarsatRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.repository.TaiInmarsatRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service cho CRUD + quy trinh phe duyet Inmarsat station (M-015).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TaiInmarsatService {

    private final TaiInmarsatRepository taiRepo;
    private final TaiHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final TaiNotificationService notificationService;
    private final ObjectMapper objectMapper;

    // -- READ --

    public TaiInmarsatResponse findById(UUID id) {
        TaiInmarsat entity = taiRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đài Inmarsat không tìm thấy: " + id));
        return toResponse(entity);
    }

    public TaiInmarsatResponse findByCode(String code) {
        TaiInmarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đài Inmarsat không tìm thấy: " + code));
        return toResponse(entity);
    }

    public List<TaiInmarsatResponse> findAll() {
        return taiRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public TaiInmarsatResponse create(CreateTaiInmarsatRequest request) {
        if (taiRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Đã tồn tại: " + request.getCode());
        }

        TaiInmarsat entity = TaiInmarsat.builder()
                .code(request.getCode())
                .name(request.getName())
                .taiType(request.getType())
                .satelliteId(request.getSatelliteId())
                .signalStrength(request.getSignalStrength())
                .serviceType(request.getServiceType())
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .build();

        entity = taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.CREATE, null, null);
        notificationService.sendApproveNotification("Đài Inmarsat: " + entity.getName(),
                entity.getCreatedBy());

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public TaiInmarsatResponse update(UUID id, UpdateTaiInmarsatRequest request) {
        TaiInmarsat entity = taiRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đài Inmarsat không tìm thấy: " + id));

        if (Boolean.TRUE.equals(entity.getDeleted())) {
            throw new EntityNotFoundException("Đài đã bị xóa");
        }

        String oldJson = toJson(entity);

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getSatelliteId() != null) entity.setSatelliteId(request.getSatelliteId());
        if (request.getSignalStrength() != null) entity.setSignalStrength(request.getSignalStrength());
        if (request.getServiceType() != null) entity.setServiceType(request.getServiceType());

        taiRepo.save(entity);

        String newJson = toJson(entity);
        if (!compareJsonNodes(oldJson, newJson)) {
            String changedFields = getChangedFields(oldJson, newJson);
            saveHistory(entity, TaiHistoryActionType.UPDATE, changedFields, null);
        }
        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(String code) {
        TaiInmarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đài Inmarsat không tìm thấy: " + code));

        if (Boolean.TRUE.equals(entity.getDeleted())) {
            throw new IllegalArgumentException("Đài này đã bị xóa trước đó");
        }

        entity.softDelete();
        entity.setDeletedAt(Instant.now());
        entity.setDeletedBy(UUID.randomUUID());
        taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.DELETE, null, null);
    }

    // -- APPROVAL --

    @Transactional
    public TaiInmarsatResponse approve(String code, String remarks, UUID approverId) {
        TaiInmarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đài Inmarsat không tìm thấy: " + code));

        entity.setStatus(TaiStatus.ACTIVE);
        entity.setApprovalStatus(TaiApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.APPROVE, remarks, null);

        return toResponse(entity);
    }

    @Transactional
    public TaiInmarsatResponse reject(String code, String remarks, UUID approverId) {
        TaiInmarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đài Inmarsat không tìm thấy: " + code));

        entity.setApprovalStatus(TaiApprovalStatus.REJECTED);
        entity.setUnapprovedBy(approverId);
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.REJECT, remarks, null);

        return toResponse(entity);
    }

    // -- COUNTS --

    public long countByStatus(TaiStatus status) {
        return taiRepo.countByStatus(status);
    }

    public void deleteByCode(String code) {
        taiRepo.deleteByCode(code);
    }

    // -- MAP SYNC STUBS --

    public void syncToMapPhao(UUID id) {
        log.info("syncToMapPhao: {}", id);
    }

    public void hideFromMapPhao(UUID id) {
        log.info("hideFromMapPhao: {}", id);
    }

    // -- HELPERS --

    private void saveHistory(TaiInmarsat entity,
                             TaiHistoryActionType action, String remarks, String reason) {
        TaiHistory entry = TaiHistory.builder()
                .entityName("TaiInmarsat")
                .taiType(TaiType.INMARSAT)
                .entityId(entity.getId())
                .actionType(action)
                .changedField("action=" + action)
                .previousValue(null)
                .newValue(null)
                .changedBy(entity.getCreatedBy())
                .changedAt(Instant.now())
                .reason(reason != null ? reason : remarks)
                .build();
        historyRepo.save(entry);
    }

    private TaiInmarsatResponse toResponse(TaiInmarsat entity) {
        return TaiInmarsatResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getTaiType())
                .satelliteId(entity.getSatelliteId())
                .signalStrength(entity.getSignalStrength())
                .serviceType(entity.getServiceType())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .approvedRemarks(entity.getApprovedRemarks())
                .unapprovedBy(entity.getUnapprovedBy())
                .unapprovedAt(entity.getUnapprovedAt())
                .unapprovedRemarks(entity.getUnapprovedRemarks())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String toJson(TaiInmarsat entity) {
        try {
            return objectMapper.writeValueAsString(toResponse(entity));
        } catch (Exception e) {
            return "{}";
        }
    }

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
