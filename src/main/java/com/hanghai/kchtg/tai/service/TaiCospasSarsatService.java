package com.hanghai.kchtg.tai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.tai.dto.cospassarsat.CreateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.dto.cospassarsat.TaiCospasSarsatResponse;
import com.hanghai.kchtg.tai.dto.cospassarsat.UpdateTaiCospasSarsatRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

/**
 * Service cho CRUD + quy trinh phe duyet Cospas-Sarsat station (M-015).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TaiCospasSarsatService {

    private final TaiCospasSarsatRepository taiRepo;
    private final TaiRepository baseTaiRepo;
    private final TaiHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final TaiNotificationService notificationService;
    private final ObjectMapper objectMapper;

    // -- READ --

    public TaiCospasSarsatResponse findById(UUID id) {
        TaiCospasSarsat entity = taiRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai Cospas-Sarsat khong tim thay: " + id));
        return toResponse(entity);
    }

    public TaiCospasSarsatResponse findByCode(String code) {
        TaiCospasSarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai Cospas-Sarsat khong tim thay: " + code));
        return toResponse(entity);
    }

    public List<TaiCospasSarsatResponse> findAll() {
        return taiRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public TaiCospasSarsatResponse create(CreateTaiCospasSarsatRequest request) {
        if (taiRepo.existsByCode(request.getCode())
                || baseTaiRepo.findByCodeAndDeletedFalse(request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Da ton tai: " + request.getCode());
        }

        TaiCospasSarsat entity = TaiCospasSarsat.builder()
                .code(request.getCode())
                .name(request.getName())
                .taiType(request.getType())
                .frequency(request.getFrequency())
                .protocol(request.getProtocol())
                .country(request.getCountry())
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .build();

        entity = taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.CREATE, null, null);
        notificationService.sendApproveNotification("Tai Cospas-Sarsat: " + entity.getName(),
                entity.getCreatedBy());

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public TaiCospasSarsatResponse update(UUID id, UpdateTaiCospasSarsatRequest request) {
        TaiCospasSarsat entity = taiRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai Cospas-Sarsat khong tim thay: " + id));

        if (Boolean.TRUE.equals(entity.getDeleted())) {
            throw new EntityNotFoundException("Tai da bi xoa");
        }

        String oldJson = toJson(entity);

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getFrequency() != null) entity.setFrequency(request.getFrequency());
        if (request.getProtocol() != null) entity.setProtocol(request.getProtocol());
        if (request.getCountry() != null) entity.setCountry(request.getCountry());

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
        TaiCospasSarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai Cospas-Sarsat khong tim thay: " + code));

        if (Boolean.TRUE.equals(entity.getDeleted())) {
            throw new IllegalArgumentException("Tai nay da bi xoa truoc do");
        }

        entity.softDelete();
        entity.setDeletedAt(Instant.now());
        entity.setDeletedBy(UUID.randomUUID());
        taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.DELETE, null, null);
    }

    // -- APPROVAL --

    @Transactional
    public TaiCospasSarsatResponse approve(String code, String remarks, UUID approverId) {
        TaiCospasSarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai Cospas-Sarsat khong tim thay: " + code));

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
    public TaiCospasSarsatResponse reject(String code, String remarks, UUID approverId) {
        TaiCospasSarsat entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai Cospas-Sarsat khong tim thay: " + code));

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

    private void saveHistory(TaiCospasSarsat entity,
                             TaiHistoryActionType action, String remarks, String reason) {
        TaiHistory entry = TaiHistory.builder()
                .entityName("TaiCospasSarsat")
                .taiType(TaiType.COSPAS_SARSAT)
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

    private TaiCospasSarsatResponse toResponse(TaiCospasSarsat entity) {
        return TaiCospasSarsatResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getTaiType())
                .frequency(entity.getFrequency())
                .protocol(entity.getProtocol())
                .country(entity.getCountry())
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

    private String toJson(TaiCospasSarsat entity) {
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
