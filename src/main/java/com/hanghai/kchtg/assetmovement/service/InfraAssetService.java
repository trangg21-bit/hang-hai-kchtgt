package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
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
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InfraAssetService {
    private final InfraAssetRepository repository;
    private final UserResolverService userResolverService;

    @Transactional
    public InfraAssetResponse create(InfraAssetRequest request) {
        InfraAsset entity = new InfraAsset();
        copyEditableFields(request, entity);
        entity.setAssetCode(generateAssetCode(request.getAssetCode()));
        if (entity.getAssetType() == null) entity.setAssetType(InfraAssetType.PORT_TERMINAL);
        if (entity.getStatus() == null) entity.setStatus(AssetStatus.MANAGED);
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public InfraAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<InfraAssetResponse> findAll(String assetCode, String assetName, UUID parentOrgUnitId, UUID orgUnitId,
                                             UUID usingOrgUnitId, UUID berthId, InfraAssetType assetType,
                                             String assetCondition, String approvalStatus,
                                             LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {
        Specification<InfraAsset> specification = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (assetCode != null && !assetCode.isBlank()) predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.trim().toLowerCase(Locale.ROOT) + "%"));
            if (assetName != null && !assetName.isBlank()) predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.trim().toLowerCase(Locale.ROOT) + "%"));
            if (parentOrgUnitId != null) predicates.add(cb.equal(root.get("parentOrgUnitId"), parentOrgUnitId));
            if (orgUnitId != null) predicates.add(cb.equal(root.get("orgUnitId"), orgUnitId));
            if (usingOrgUnitId != null) predicates.add(cb.equal(root.get("usingOrgUnitId"), usingOrgUnitId));
            if (berthId != null) predicates.add(cb.equal(root.get("berthId"), berthId));
            if (assetType != null) predicates.add(cb.equal(root.get("assetType"), assetType));
            if (assetCondition != null && !assetCondition.isBlank()) predicates.add(cb.equal(root.get("assetCondition"), assetCondition));
            if (approvalStatus != null && !approvalStatus.isBlank()) {
                try { predicates.add(cb.equal(root.get("approvalStatus"), ApprovalStatus.fromString(approvalStatus))); }
                catch (IllegalArgumentException ignored) { /* unknown status returns the unfiltered page */ }
            }
            if (updatedFrom != null) predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), updatedFrom.atStartOfDay()));
            if (updatedTo != null) predicates.add(cb.lessThan(root.get("updatedAt"), updatedTo.plusDays(1).atStartOfDay()));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return repository.findAll(specification, pageable).map(this::toResponse);
    }

    @Transactional
    public InfraAssetResponse update(UUID id, InfraAssetRequest request) {
        InfraAsset entity = requireAsset(id);
        String assetCode = entity.getAssetCode();
        copyEditableFields(request, entity);
        entity.setAssetCode(assetCode);
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        repository.delete(requireAsset(id));
    }

    public long countByStatus(String status) {
        return repository.countByStatus(AssetStatus.valueOf(status));
    }

    private InfraAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kết cấu hạ tầng với id: " + id));
    }

    private String generateAssetCode(String requestedCode) {
        if (requestedCode != null && !requestedCode.isBlank() && repository.findByAssetCode(requestedCode.trim()).isEmpty()) {
            return requestedCode.trim();
        }
        String code;
        do {
            code = "TS-BC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private void copyEditableFields(InfraAssetRequest source, InfraAsset target) {
        BeanUtils.copyProperties(source, target, "assetCode", "status", "approvalStatus",
                "remainingValue", "createdAt", "createdBy", "updatedAt", "updatedBy");
        if (source.getStatus() != null && !source.getStatus().isBlank()) {
            try { target.setStatus(AssetStatus.valueOf(source.getStatus())); }
            catch (IllegalArgumentException ignored) { target.setStatus(AssetStatus.MANAGED); }
        }
        if (source.getApprovalStatus() != null && !source.getApprovalStatus().isBlank()) {
            try {
                ApprovalStatus status = ApprovalStatus.fromString(source.getApprovalStatus());
                target.setApprovalStatus(status);
                UUID currentUserId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
                if (status == ApprovalStatus.PENDING_APPROVAL) {
                    target.setSubmittedBy(currentUserId);
                    target.setSubmittedAt(java.time.Instant.now());
                } else if (status == ApprovalStatus.APPROVED) {
                    target.setDepartmentApprovedBy(currentUserId);
                    target.setDepartmentApprovedAt(java.time.Instant.now());
                }
            } catch (Exception ignored) {
                target.setApprovalStatus(ApprovalStatus.DRAFT);
            }
        }
    }

    private void calculateValues(InfraAsset entity) {
        BigDecimal original = entity.getOriginalValue() == null ? BigDecimal.ZERO : entity.getOriginalValue();
        BigDecimal accumulated = entity.getAccumulatedDepreciation() == null ? BigDecimal.ZERO : entity.getAccumulatedDepreciation();
        entity.setAccumulatedDepreciation(accumulated);
        entity.setRemainingValue(original.subtract(accumulated).max(BigDecimal.ZERO));
        if (entity.getMonthlyDepreciation() == null && entity.getDepreciationMonths() != null && entity.getDepreciationMonths() > 0) {
            entity.setMonthlyDepreciation(original.divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2, java.math.RoundingMode.HALF_UP));
        }
    }

    private InfraAssetResponse toResponse(InfraAsset entity) {
        InfraAssetResponse response = InfraAssetResponse.builder().build();
        BeanUtils.copyProperties(entity, response);
        response.setAssetType(entity.getAssetType() == null ? null : entity.getAssetType().name());
        response.setStatus(entity.getStatus() == null ? null : entity.getStatus().name());
        response.setApprovalStatus(entity.getApprovalStatus() == null ? null : entity.getApprovalStatus().name());
        response.setUpdatedByName(userResolverService.resolveName(entity.getUpdatedBy()));
        response.setSubmittedByName(userResolverService.resolveName(entity.getSubmittedBy()));
        response.setPortAuthorityApprovedByName(userResolverService.resolveName(entity.getPortAuthorityApprovedBy()));
        response.setDepartmentApprovedByName(userResolverService.resolveName(entity.getDepartmentApprovedBy()));
        return response;
    }
}
