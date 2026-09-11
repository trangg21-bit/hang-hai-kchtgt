package com.hanghai.kchtg.vtsasset.service;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.vtsasset.dto.VtsSystemAssetRequest;
import com.hanghai.kchtg.vtsasset.dto.VtsSystemAssetResponse;
import com.hanghai.kchtg.vtsasset.entity.VtsSystemAsset;
import com.hanghai.kchtg.vtsasset.repository.VtsSystemAssetRepository;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
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
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VtsSystemAssetService {

    private final VtsSystemAssetRepository repository;
    private final UserResolverService userResolverService;
    private final VtsSystemRepository vtsSystemRepository;
    private final OrgUnitRepository orgUnitRepository;

    @Transactional
    public VtsSystemAssetResponse create(VtsSystemAssetRequest request) {
        VtsSystemAsset entity = new VtsSystemAsset();
        copyEditableFields(request, entity);
        entity.setAssetCode(generateAssetCode(request.getAssetCode()));
        if (entity.getStatus() == null) {
            entity.setStatus(AssetStatus.MANAGED);
        }
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public VtsSystemAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<VtsSystemAssetResponse> findAll(String assetCode, String assetName,
                                                UUID parentOrgUnitId, UUID orgUnitId,
                                                UUID usingOrgUnitId, UUID vtsSystemId,
                                                String assetType, String assetCondition,
                                                String approvalStatus, LocalDate updatedFrom,
                                                LocalDate updatedTo, Pageable pageable) {
        Specification<VtsSystemAsset> specification = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (parentOrgUnitId != null) {
                predicates.add(cb.equal(root.get("parentOrgUnitId"), parentOrgUnitId));
            }
            if (orgUnitId != null) {
                predicates.add(cb.equal(root.get("orgUnitId"), orgUnitId));
            }
            if (usingOrgUnitId != null) {
                predicates.add(cb.equal(root.get("usingOrgUnitId"), usingOrgUnitId));
            }
            if (vtsSystemId != null) {
                predicates.add(cb.equal(root.get("vtsSystemId"), vtsSystemId));
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
    public VtsSystemAssetResponse update(UUID id, VtsSystemAssetRequest request) {
        VtsSystemAsset entity = requireAsset(id);
        String assetCode = entity.getAssetCode();
        copyEditableFields(request, entity);
        entity.setAssetCode(assetCode);
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        VtsSystemAsset entity = requireAsset(id);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);
    }

    private VtsSystemAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản hệ thống VTS với id: " + id));
    }

    private String generateAssetCode(String requestedCode) {
        if (requestedCode != null && !requestedCode.isBlank() && repository.findByAssetCode(requestedCode.trim()).isEmpty()) {
            return requestedCode.trim();
        }
        String code;
        do {
            code = "TS-VTS-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private void copyEditableFields(VtsSystemAssetRequest source, VtsSystemAsset target) {
        BeanUtils.copyProperties(source, target, "assetCode", "status", "approvalStatus",
                "remainingValue", "createdAt", "createdBy", "updatedAt", "updatedBy");
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
                if (status == ApprovalStatus.PENDING_APPROVAL) {
                    target.setSubmittedBy(currentUserId);
                    target.setSubmittedAt(Instant.now());
                } else if (status == ApprovalStatus.APPROVED) {
                    target.setDepartmentApprovedBy(currentUserId);
                    target.setDepartmentApprovedAt(Instant.now());
                }
            } catch (Exception ignored) {
                target.setApprovalStatus(ApprovalStatus.DRAFT);
            }
        }
    }

    private void calculateValues(VtsSystemAsset entity) {
        BigDecimal original = entity.getOriginalValue() == null ? BigDecimal.ZERO : entity.getOriginalValue();
        BigDecimal accumulated = entity.getAccumulatedDepreciation() == null ? BigDecimal.ZERO : entity.getAccumulatedDepreciation();
        entity.setAccumulatedDepreciation(accumulated);
        entity.setRemainingValue(original.subtract(accumulated).max(BigDecimal.ZERO));
        if (entity.getMonthlyDepreciation() == null && entity.getDepreciationMonths() != null && entity.getDepreciationMonths() > 0) {
            entity.setMonthlyDepreciation(original.divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2, RoundingMode.HALF_UP));
        }
    }

    private VtsSystemAssetResponse toResponse(VtsSystemAsset entity) {
        VtsSystemAssetResponse response = new VtsSystemAssetResponse();
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
        if (entity.getVtsSystemId() != null) {
            vtsSystemRepository.findById(entity.getVtsSystemId())
                    .ifPresent(v -> {
                        response.setVtsSystemCode(v.getCode());
                        response.setVtsSystemName(v.getSystemName());
                    });
        }

        response.setSubmittedByName(userResolverService.resolveName(entity.getSubmittedBy()));
        response.setPortAuthorityApprovedByName(userResolverService.resolveName(entity.getPortAuthorityApprovedBy()));
        response.setDepartmentApprovedByName(userResolverService.resolveName(entity.getDepartmentApprovedBy()));
        response.setUpdatedByName(userResolverService.resolveName(entity.getUpdatedBy()));
        response.setCreatedByName(userResolverService.resolveName(entity.getCreatedBy()));
        return response;
    }
}
