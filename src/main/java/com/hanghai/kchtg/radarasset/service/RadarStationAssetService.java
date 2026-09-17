package com.hanghai.kchtg.radarasset.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.util.EntityCopyUtils;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.radarasset.dto.RadarStationAssetRequest;
import com.hanghai.kchtg.radarasset.dto.RadarStationAssetResponse;
import com.hanghai.kchtg.radarasset.entity.RadarStationAsset;
import com.hanghai.kchtg.radarasset.repository.RadarStationAssetRepository;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RadarStationAssetService {

    private final RadarStationAssetRepository repository;
    private final UserResolverService userResolverService;
    private final RadarStationRepository radarStationRepository;
    private final OrgUnitRepository orgUnitRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final ChangeHistoryService changeHistoryService;
    private final OrgUnitCacheService orgUnitCacheService;

    @Transactional
    public RadarStationAssetResponse create(RadarStationAssetRequest request) {
        RadarStationAsset entity = new RadarStationAsset();
        copyEditableFields(request, entity);
        entity.setAssetCode(generateAssetCode(request.getAssetCode()));
        if (entity.getStatus() == null) {
            entity.setStatus(AssetStatus.MANAGED);
        }
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public RadarStationAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<RadarStationAssetResponse> findAll(String assetCode, String assetName,
                                                UUID parentOrgUnitId, UUID orgUnitId,
                                                UUID usingOrgUnitId, UUID radarStationId,
                                                String assetType, String assetCondition,
                                                String approvalStatus, LocalDate updatedFrom,
                                                LocalDate updatedTo, Pageable pageable) {
        Specification<RadarStationAsset> specification = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            orgUnitCacheService.applySubtreePredicate(root, cb, predicates, "parentOrgUnitId", parentOrgUnitId);
            orgUnitCacheService.applySubtreePredicate(root, cb, predicates, "orgUnitId", orgUnitId);
            orgUnitCacheService.applySubtreePredicate(root, cb, predicates, "usingOrgUnitId", usingOrgUnitId);
            if (radarStationId != null) {
                predicates.add(cb.equal(root.get("radarStationId"), radarStationId));
            }
            if (assetType != null && !assetType.isBlank()) {
                predicates.add(cb.equal(root.get("assetType"), assetType.trim()));
            }
            if (assetCondition != null && !assetCondition.isBlank()) {
                predicates.add(cb.equal(root.get("assetCondition"), assetCondition.trim()));
            }
            if (approvalStatus != null && !approvalStatus.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("approvalStatus"), ApprovalStatus.fromString(approvalStatus)));
                } catch (IllegalArgumentException ignored) {
                    // bỏ qua nếu không hợp lệ
                }
            }
            if (updatedFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), updatedFrom.atStartOfDay()));
            }
            if (updatedTo != null) {
                predicates.add(cb.lessThan(root.get("updatedAt"), updatedTo.plusDays(1).atStartOfDay()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return repository.findAll(specification, pageable).map(this::toResponse);
    }

    @Transactional
    public RadarStationAssetResponse update(UUID id, RadarStationAssetRequest request) {
        RadarStationAsset entity = requireAsset(id);
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        if (entity.getDeletedAt() != null
                || previousStatus == ApprovalStatus.ARCHIVED
                || previousStatus == ApprovalStatus.APPROVED_LEVEL1
                || previousStatus == ApprovalStatus.PENDING_APPROVAL
                || previousStatus == ApprovalStatus.PROPOSED) {
            String label = previousStatus != null ? previousStatus.getLabel() : "Đã xóa";
            throw new IllegalStateException("Hồ sơ ở trạng thái " + label + " không được phép chỉnh sửa");
        }
        RadarStationAsset snapshot = new RadarStationAsset();
        BeanUtils.copyProperties(entity, snapshot);
        String assetCode = entity.getAssetCode();
        copyEditableFields(request, entity);
        entity.setAssetCode(assetCode);
        calculateValues(entity);
        RadarStationAsset saved = repository.save(entity);

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : null);
        }
        String actorId = currentUserId != null ? currentUserId.toString() : "system";
        changeHistoryService.recordChanges("RADAR_STATION", saved.getId().toString(), actorId, snapshot, saved);

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        RadarStationAsset entity = requireAsset(id);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);
    }

    private RadarStationAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản trạm radar với id: " + id));
    }

    private String generateAssetCode(String requestedCode) {
        if (requestedCode != null && !requestedCode.isBlank() && repository.findByAssetCode(requestedCode.trim()).isEmpty()) {
            return requestedCode.trim();
        }
        String code;
        do {
            code = "TS-RADAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private void copyEditableFields(RadarStationAssetRequest source, RadarStationAsset target) {
        EntityCopyUtils.copyDtoToEntity(source, target,
                "assetCode",
                "status",             // String DTO → enum entity
                "approvalStatus",     // String DTO → enum entity
                "remainingValue",
                "monthlyDepreciation"
        );
        if (source.getStatus() != null && !source.getStatus().isBlank()) {
            try {
                target.setStatus(AssetStatus.valueOf(source.getStatus()));
            } catch (IllegalArgumentException ignored) {
                target.setStatus(AssetStatus.MANAGED);
            }
        }
        if (source.getApprovalStatus() != null && !source.getApprovalStatus().isBlank()) {
            try {
                ApprovalStatus status = ApprovalStatus.fromString(source.getApprovalStatus());
                target.setApprovalStatus(status);
                UUID currentUserId = SecurityUtils.getCurrentUserId();
                if (status == ApprovalStatus.PENDING_APPROVAL && target.getSubmittedBy() == null) {
                    target.setSubmittedBy(currentUserId);
                    target.setSubmittedAt(Instant.now());
                } else if (status == ApprovalStatus.APPROVED && target.getDepartmentApprovedBy() == null) {
                    target.setDepartmentApprovedBy(currentUserId);
                    target.setDepartmentApprovedAt(Instant.now());
                }
            } catch (Exception ignored) {
                target.setApprovalStatus(ApprovalStatus.DRAFT);
            }
        }
    }

    private void calculateValues(RadarStationAsset entity) {
        BigDecimal original = entity.getOriginalValue() == null ? BigDecimal.ZERO : entity.getOriginalValue();
        BigDecimal accumulated = entity.getAccumulatedDepreciation() == null ? BigDecimal.ZERO : entity.getAccumulatedDepreciation();
        entity.setAccumulatedDepreciation(accumulated);
        entity.setRemainingValue(original.subtract(accumulated).max(BigDecimal.ZERO));
        if (entity.getMonthlyDepreciation() == null && entity.getDepreciationMonths() != null && entity.getDepreciationMonths() > 0) {
            entity.setMonthlyDepreciation(original.divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2, RoundingMode.HALF_UP));
        }
    }

    private RadarStationAssetResponse toResponse(RadarStationAsset entity) {
        RadarStationAssetResponse response = new RadarStationAssetResponse();
        BeanUtils.copyProperties(entity, response);
        response.setStatus(entity.getStatus() == null ? null : entity.getStatus().name());
        response.setApprovalStatus(entity.getApprovalStatus() == null ? null : entity.getApprovalStatus().name());

        if (entity.getParentOrgUnitId() != null) {
            orgUnitRepository.findById(entity.getParentOrgUnitId())
                    .ifPresent(u -> response.setParentOrgUnitName(u.getName()));
        }
        if (entity.getOrgUnitId() != null) {
            orgUnitRepository.findById(entity.getOrgUnitId())
                    .ifPresent(u -> response.setOrgUnitName(u.getName()));
        }
        if (entity.getUsingOrgUnitId() != null) {
            orgUnitRepository.findById(entity.getUsingOrgUnitId())
                    .ifPresent(u -> response.setUsingOrgUnitName(u.getName()));
        }
        if (entity.getRadarStationId() != null) {
            radarStationRepository.findById(entity.getRadarStationId())
                    .ifPresent(r -> {
                        response.setRadarStationCode(r.getCode());
                        response.setRadarStationName(r.getStationName());
                    });
        }

        response.setSubmittedByName(userResolverService.resolveName(entity.getSubmittedBy()));
        response.setPortAuthorityApprovedByName(userResolverService.resolveName(entity.getPortAuthorityApprovedBy()));
        response.setDepartmentApprovedByName(userResolverService.resolveName(entity.getDepartmentApprovedBy()));
        response.setUpdatedByName(userResolverService.resolveName(entity.getUpdatedBy()));
        response.setCreatedByName(userResolverService.resolveName(entity.getCreatedBy()));
        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        RadarStationAsset entity = requireAsset(id);
        String entityId = id.toString();
        String entityType = "RadarStationAsset";

        List<InfrastructureHistory> list = historyRepository.findByRefIdOrderByApprovedDateDesc(id);

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                User::getName
                        ));

        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("changedField", h.getChangedField());
                    m.put("oldValue", h.getPreviousValue() == null ? "" : h.getPreviousValue());
                    m.put("previousValue", h.getPreviousValue() == null ? "" : h.getPreviousValue());
                    m.put("newValue", h.getNewValue() == null ? "" : h.getNewValue());
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("changedAt", h.getApprovedDate());
                    m.put("orgUnitId", entity.getOrgUnitId());
                    return m;
                })
                .toList();

        List<Map<String, Object>> approvalLog = list.stream()
                .filter(h -> h.getStatus() != null && h.getChangedField() == null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("status", h.getStatus().name());
                    m.put("decidedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("decidedAt", h.getApprovedDate());
                    m.put("orgUnitId", entity.getOrgUnitId());
                    return m;
                })
                .toList();

        return Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : "",
                "changeHistory", changeHistory,
                "approvalLog", approvalLog,
                "histories", list
        );
    }
}
