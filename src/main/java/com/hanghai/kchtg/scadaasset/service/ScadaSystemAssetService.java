package com.hanghai.kchtg.scadaasset.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.scada.repository.ScadaRepository;
import com.hanghai.kchtg.scadaasset.dto.ScadaSystemAssetRequest;
import com.hanghai.kchtg.scadaasset.dto.ScadaSystemAssetResponse;
import com.hanghai.kchtg.scadaasset.entity.ScadaSystemAsset;
import com.hanghai.kchtg.scadaasset.repository.ScadaSystemAssetRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScadaSystemAssetService {

    private final ScadaSystemAssetRepository repository;
    private final OrgUnitRepository orgUnitRepository;
    private final ScadaRepository scadaRepository;
    private final UserResolverService userResolverService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final ChangeHistoryService changeHistoryService;
    private final OrgUnitCacheService orgUnitCacheService;

    @Transactional
    public ScadaSystemAssetResponse create(ScadaSystemAssetRequest request) {
        String assetCode = generateAssetCode(request.getAssetCode());
        ScadaSystemAsset entity = ScadaSystemAsset.builder()
                .assetCode(assetCode)
                .build();
        copyEditableFields(request, entity);
        calculateValues(entity);

        if (entity.getApprovalStatus() == null) {
            entity.setApprovalStatus(ApprovalStatus.DRAFT);
        }
        return toResponse(repository.save(entity));
    }

    public ScadaSystemAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<ScadaSystemAssetResponse> findAll(String assetCode, String assetName,
                                                  UUID parentOrgUnitId, UUID orgUnitId,
                                                  UUID usingOrgUnitId, UUID scadaId,
                                                  String assetType, String assetCondition,
                                                  String approvalStatus,
                                                  LocalDate updatedFrom, LocalDate updatedTo,
                                                  Pageable pageable) {
        Specification<ScadaSystemAsset> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.toLowerCase(Locale.ROOT) + "%"));
            }
            orgUnitCacheService.applySubtreePredicate(root, cb, predicates, "parentOrgUnitId", parentOrgUnitId);
            orgUnitCacheService.applySubtreePredicate(root, cb, predicates, "orgUnitId", orgUnitId);
            orgUnitCacheService.applySubtreePredicate(root, cb, predicates, "usingOrgUnitId", usingOrgUnitId);
            if (scadaId != null) {
                predicates.add(cb.equal(root.get("scadaId"), scadaId));
            }
            if (assetType != null && !assetType.isBlank()) {
                predicates.add(cb.equal(root.get("assetType"), assetType.trim()));
            }
            if (assetCondition != null && !assetCondition.isBlank()) {
                predicates.add(cb.equal(root.get("assetCondition"), assetCondition.trim()));
            }
            if (approvalStatus != null && !approvalStatus.isBlank()) {
                try {
                    ApprovalStatus statusEnum = ApprovalStatus.fromString(approvalStatus);
                    if (statusEnum != null) {
                        predicates.add(cb.equal(root.get("approvalStatus"), statusEnum));
                    }
                } catch (IllegalArgumentException ignored) {
                }
            }
            if (updatedFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), updatedFrom.atStartOfDay()));
            }
            if (updatedTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("updatedAt"), updatedTo.plusDays(1).atStartOfDay()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return repository.findAll(spec, pageable).map(this::toResponse);
    }

    @Transactional
    public ScadaSystemAssetResponse update(UUID id, ScadaSystemAssetRequest request) {
        ScadaSystemAsset entity = requireAsset(id);
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        if (entity.getDeletedAt() != null
                || previousStatus == ApprovalStatus.ARCHIVED
                || previousStatus == ApprovalStatus.APPROVED_LEVEL1
                || previousStatus == ApprovalStatus.PENDING_APPROVAL
                || previousStatus == ApprovalStatus.PROPOSED) {
            String label = previousStatus != null ? previousStatus.getLabel() : "Đã xóa";
            throw new IllegalStateException("Hồ sơ ở trạng thái " + label + " không được phép chỉnh sửa");
        }
        ScadaSystemAsset snapshot = new ScadaSystemAsset();
        BeanUtils.copyProperties(entity, snapshot);
        copyEditableFields(request, entity);
        calculateValues(entity);
        ScadaSystemAsset saved = repository.save(entity);

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : null);
        }
        String actorId = currentUserId != null ? currentUserId.toString() : "system";
        changeHistoryService.recordChanges("SCADA", saved.getId().toString(), actorId, snapshot, saved);

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        ScadaSystemAsset entity = requireAsset(id);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);
    }

    private ScadaSystemAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản hệ thống SCADA với ID: " + id));
    }

    private void copyEditableFields(ScadaSystemAssetRequest request, ScadaSystemAsset entity) {
        BeanUtils.copyProperties(request, entity, "assetCode", "status", "approvalStatus",
                "remainingValue", "createdAt", "createdBy", "updatedAt", "updatedBy", "lockVersion");
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getApprovalStatus() != null) {
            handleApprovalTransition(entity, request.getApprovalStatus(), request);
        }
    }

    private void handleApprovalTransition(ScadaSystemAsset entity, ApprovalStatus newStatus, ScadaSystemAssetRequest request) {
        UUID currentUser = SecurityUtils.getCurrentUserId();
        Instant now = Instant.now();
        entity.setApprovalStatus(newStatus);

        switch (newStatus) {
            case PENDING_APPROVAL -> {
                entity.setSubmittedBy(currentUser);
                entity.setSubmittedAt(now);
            }
            case APPROVED_LEVEL1 -> {
                entity.setPortAuthorityApprovedBy(currentUser);
                entity.setPortAuthorityApprovedAt(now);
                if (request.getPortAuthorityApprovalContent() != null) {
                    entity.setPortAuthorityApprovalContent(request.getPortAuthorityApprovalContent());
                }
            }
            case APPROVED -> {
                entity.setDepartmentApprovedBy(currentUser);
                entity.setDepartmentApprovedAt(now);
                if (request.getDepartmentApprovalContent() != null) {
                    entity.setDepartmentApprovalContent(request.getDepartmentApprovalContent());
                }
            }
            case REJECTED_LEVEL1, REJECTED_LEVEL2 -> {
                if (request.getRejectionReason() != null) {
                    entity.setRejectionReason(request.getRejectionReason());
                }
            }
            default -> {}
        }
    }

    private void calculateValues(ScadaSystemAsset entity) {
        if (entity.getOriginalValue() != null) {
            BigDecimal accum = entity.getAccumulatedDepreciation() != null ? entity.getAccumulatedDepreciation() : BigDecimal.ZERO;
            entity.setRemainingValue(entity.getOriginalValue().subtract(accum).max(BigDecimal.ZERO));

            if (entity.getDepreciationMonths() != null && entity.getDepreciationMonths() > 0) {
                entity.setMonthlyDepreciation(entity.getOriginalValue().divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2, RoundingMode.HALF_UP));
            }
        }
    }

    private String generateAssetCode(String providedCode) {
        if (providedCode != null && !providedCode.isBlank() && repository.findByAssetCode(providedCode.trim()).isEmpty()) {
            return providedCode.trim();
        }
        String code;
        do {
            code = "TS-SCADA-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private ScadaSystemAssetResponse toResponse(ScadaSystemAsset entity) {
        ScadaSystemAssetResponse response = new ScadaSystemAssetResponse();
        BeanUtils.copyProperties(entity, response);
        response.setStatus(entity.getStatus() == null ? null : entity.getStatus().name());
        response.setApprovalStatus(entity.getApprovalStatus() == null ? null : entity.getApprovalStatus().name());

        if (entity.getParentOrgUnitId() != null) {
            orgUnitRepository.findById(entity.getParentOrgUnitId()).ifPresent(ou -> response.setParentOrgUnitName(ou.getName()));
        }
        if (entity.getOrgUnitId() != null) {
            orgUnitRepository.findById(entity.getOrgUnitId()).ifPresent(ou -> response.setOrgUnitName(ou.getName()));
        }
        if (entity.getUsingOrgUnitId() != null) {
            orgUnitRepository.findById(entity.getUsingOrgUnitId()).ifPresent(ou -> response.setUsingOrgUnitName(ou.getName()));
        }
        if (entity.getScadaId() != null) {
            scadaRepository.findById(entity.getScadaId()).ifPresent(s -> {
                response.setScadaCode(s.getDeviceCode());
                response.setScadaName(s.getDeviceName());
            });
        }

        if (entity.getSubmittedBy() != null) {
            response.setSubmittedByName(userResolverService.resolveName(entity.getSubmittedBy()));
        }
        if (entity.getPortAuthorityApprovedBy() != null) {
            response.setPortAuthorityApprovedByName(userResolverService.resolveName(entity.getPortAuthorityApprovedBy()));
        }
        if (entity.getDepartmentApprovedBy() != null) {
            response.setDepartmentApprovedByName(userResolverService.resolveName(entity.getDepartmentApprovedBy()));
        }
        if (entity.getCreatedBy() != null) {
            response.setCreatedByName(userResolverService.resolveName(entity.getCreatedBy()));
        }
        if (entity.getUpdatedBy() != null) {
            response.setUpdatedByName(userResolverService.resolveName(entity.getUpdatedBy()));
        }

        return response;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        ScadaSystemAsset entity = requireAsset(id);
        String entityId = id.toString();
        String entityType = "ScadaSystemAsset";

        if (entity.getApprovalStatus() == ApprovalStatus.DRAFT) {
            return Map.of(
                    "entityId", entityId,
                    "entityType", entityType,
                    "currentApprovalStatus", ApprovalStatus.DRAFT.name(),
                    "changeHistory", Collections.emptyList(),
                    "approvalLog", Collections.emptyList(),
                    "histories", Collections.emptyList()
            );
        }

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
