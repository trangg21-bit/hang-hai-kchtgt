package com.hanghai.kchtg.tai.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.CreateTaiThongTinDuyenHaiRequest;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.TaiThongTinDuyenHaiResponse;
import com.hanghai.kchtg.tai.dto.thongtinduyenhai.UpdateTaiThongTinDuyenHaiRequest;
import com.hanghai.kchtg.tai.entity.*;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import com.hanghai.kchtg.tai.repository.TaiRepository;
import com.hanghai.kchtg.tai.repository.TaiThongTinDuyenHaiRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Service cho CRUD + quy trinh phe duyet ThongTinDuyenHai station (M-015).
 * Cau truc song song voi NhaTramPhaoService (M-014).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class TaiThongTinDuyenHaiService {

    private final TaiThongTinDuyenHaiRepository taiRepo;
    private final TaiHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final TaiNotificationService notificationService;
    private final ObjectMapper objectMapper;

    // -- READ --

    public TaiThongTinDuyenHaiResponse findById(UUID id) {
        TaiThongTinDuyenHai entity = taiRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai thong tin duyen hai khong tim thay: " + id));
        return toResponse(entity);
    }

    public TaiThongTinDuyenHaiResponse findByCode(String code) {
        TaiThongTinDuyenHai entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai thong tin duyen hai khong tim thay: " + code));
        return toResponse(entity);
    }

    public List<TaiThongTinDuyenHaiResponse> findAll() {
        return taiRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public List<TaiThongTinDuyenHaiResponse> search(String name, String code) {
        return taiRepo.findAll().stream()
                .filter(e -> (name == null || e.getName().contains(name))
                        && (code == null || e.getCode().contains(code)))
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public TaiThongTinDuyenHaiResponse create(CreateTaiThongTinDuyenHaiRequest request) {
        if (taiRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Da ton tai: " + request.getCode());
        }

        TaiThongTinDuyenHai entity = TaiThongTinDuyenHai.builder()
                .code(request.getCode())
                .name(request.getName())
                .taiType(request.getType())
                .frequency(request.getFrequency())
                .range(request.getRange())
                .country(request.getCountry())
                .contactInfo(request.getContactInfo())
                .status(TaiStatus.ACTIVE)
                .approvalStatus(TaiApprovalStatus.PENDING)
                .deleted(false)
                .build();

        entity = taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.CREATE, null, null);
        notificationService.sendApproveNotification("Tai Thong Tin Duyen Hai: " + entity.getName(),
                entity.getCreatedBy());

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public TaiThongTinDuyenHaiResponse update(UUID id, UpdateTaiThongTinDuyenHaiRequest request) {
        TaiThongTinDuyenHai entity = taiRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai thong tin duyen hai khong tim thay: " + id));

        if (Boolean.TRUE.equals(entity.getDeleted())) {
            throw new EntityNotFoundException("Tai da bi xoa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());
        if (request.getFrequency() != null) entity.setFrequency(request.getFrequency());
        if (request.getRange() != null) entity.setRange(request.getRange());
        if (request.getCountry() != null) entity.setCountry(request.getCountry());
        if (request.getContactInfo() != null) entity.setContactInfo(request.getContactInfo());

        taiRepo.save(entity);

        // Compare JSON for actual changes
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
        TaiThongTinDuyenHai entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai thong tin duyen hai khong tim thay: " + code));

        if (Boolean.TRUE.equals(entity.getDeleted())) {
            throw new IllegalArgumentException("Tai nay da bi xoa truoc do");
        }

        entity.softDelete();
        entity.setDeletedAt(Instant.now());
        entity.setDeletedBy(UUID.randomUUID());
        taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.DELETE, null, null);
        pointObjectSyncService.hideFromMapPhao(entity.getId());
    }

    // -- APPROVAL --

    @Transactional
    public TaiThongTinDuyenHaiResponse approve(String code, String remarks, UUID approverId) {
        TaiThongTinDuyenHai entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai thong tin duyen hai khong tim thay: " + code));

        entity.setStatus(TaiStatus.ACTIVE);
        entity.setApprovalStatus(TaiApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        taiRepo.save(entity);

        saveHistory(entity, TaiHistoryActionType.APPROVE, remarks, null);
        pointObjectSyncService.syncToMapPhao(entity.getId());

        return toResponse(entity);
    }

    @Transactional
    public TaiThongTinDuyenHaiResponse reject(String code, String remarks, UUID approverId) {
        TaiThongTinDuyenHai entity = taiRepo.findByCodeAndDeletedFalse(code)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Tai thong tin duyen hai khong tim thay: " + code));

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

    public long countAllActive() {
        return taiRepo.countByDeletedFalse();
    }

    // -- DELETE BY CODE --

    public void deleteByCode(String code) {
        taiRepo.deleteByCode(code);
    }

    // -- MAP SYNC STUBS --

    public void syncToMapPhao(UUID id) {
        log.info("syncToMapPhao: {}", id);
        // Post-M-007 integration: upsert vao point_objects khi approve L2
    }

    public void hideFromMapPhao(UUID id) {
        log.info("hideFromMapPhao: {}", id);
        // Post-M-007 integration: set status = DELETED trong point_objects
    }

    // -- HELPERS --

    private void saveHistory(TaiThongTinDuyenHai entity,
                             TaiHistoryActionType action, String remarks, String reason) {
        TaiHistory entry = TaiHistory.builder()
                .entityName("TaiThongTinDuyenHai")
                .taiType(TaiType.COASTAL)
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

    private TaiThongTinDuyenHaiResponse toResponse(TaiThongTinDuyenHai entity) {
        return TaiThongTinDuyenHaiResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getTaiType())
                .frequency(entity.getFrequency())
                .range(entity.getRange())
                .country(entity.getCountry())
                .contactInfo(entity.getContactInfo())
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

    private String toJson(TaiThongTinDuyenHai entity) {
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
