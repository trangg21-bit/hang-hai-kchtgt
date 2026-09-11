package com.hanghai.kchtg.cctvasset.service;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.cctvasset.dto.CctvSystemAssetRequest;
import com.hanghai.kchtg.cctvasset.dto.CctvSystemAssetResponse;
import com.hanghai.kchtg.cctvasset.entity.CctvSystemAsset;
import com.hanghai.kchtg.cctvasset.repository.CctvSystemAssetRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
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
public class CctvSystemAssetService {

    private final CctvSystemAssetRepository repository;
    private final UserResolverService userResolverService;
    private final CctvRepository cctvRepository;
    private final OrgUnitRepository orgUnitRepository;

    @Transactional
    public CctvSystemAssetResponse create(CctvSystemAssetRequest request) {
        CctvSystemAsset entity = new CctvSystemAsset();
        copyEditableFields(request, entity);
        entity.setAssetCode(generateAssetCode(request.getAssetCode()));
        if (entity.getStatus() == null) {
            entity.setStatus(AssetStatus.MANAGED);
        }
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public CctvSystemAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<CctvSystemAssetResponse> findAll(String assetCode, String assetName,
                                                 UUID parentOrgUnitId, UUID orgUnitId,
                                                 UUID usingOrgUnitId, UUID cctvId,
                                                 String assetType, String assetCondition,
                                                 String approvalStatus,
                                                 LocalDate updatedFrom, LocalDate updatedTo,
                                                 Pageable pageable) {
        Specification<CctvSystemAsset> spec = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.toLowerCase(Locale.ROOT) + "%"));
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
            if (cctvId != null) {
                predicates.add(cb.equal(root.get("cctvId"), cctvId));
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
    public CctvSystemAssetResponse update(UUID id, CctvSystemAssetRequest request) {
        CctvSystemAsset entity = requireAsset(id);
        copyEditableFields(request, entity);
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        CctvSystemAsset entity = requireAsset(id);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);
    }

    private CctvSystemAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản hệ thống CCTV với ID: " + id));
    }

    private void copyEditableFields(CctvSystemAssetRequest request, CctvSystemAsset entity) {
        if (request.getAssetName() != null) entity.setAssetName(request.getAssetName());
        if (request.getParentOrgUnitId() != null) entity.setParentOrgUnitId(request.getParentOrgUnitId());
        if (request.getOrgUnitId() != null) entity.setOrgUnitId(request.getOrgUnitId());
        if (request.getUsingOrgUnitId() != null) entity.setUsingOrgUnitId(request.getUsingOrgUnitId());
        if (request.getCctvId() != null) entity.setCctvId(request.getCctvId());
        if (request.getAssetType() != null) entity.setAssetType(request.getAssetType());
        if (request.getBarcode() != null) entity.setBarcode(request.getBarcode());
        if (request.getAssetCondition() != null) entity.setAssetCondition(request.getAssetCondition());
        if (request.getUsageStatus() != null) entity.setUsageStatus(request.getUsageStatus());
        if (request.getAssetGroup() != null) entity.setAssetGroup(request.getAssetGroup());
        if (request.getAssetSubgroup() != null) entity.setAssetSubgroup(request.getAssetSubgroup());
        if (request.getAddress() != null) entity.setAddress(request.getAddress());
        if (request.getOrigin() != null) entity.setOrigin(request.getOrigin());
        if (request.getQuantity() != null) entity.setQuantity(request.getQuantity());
        if (request.getQuantityUnit() != null) entity.setQuantityUnit(request.getQuantityUnit());
        if (request.getModel() != null) entity.setModel(request.getModel());
        if (request.getSerialNumber() != null) entity.setSerialNumber(request.getSerialNumber());
        if (request.getCountryOfOrigin() != null) entity.setCountryOfOrigin(request.getCountryOfOrigin());
        if (request.getManufacturer() != null) entity.setManufacturer(request.getManufacturer());
        if (request.getConstructionYear() != null) entity.setConstructionYear(request.getConstructionYear());
        if (request.getUseDate() != null) entity.setUseDate(request.getUseDate());
        if (request.getLandArea() != null) entity.setLandArea(request.getLandArea());
        if (request.getFloorArea() != null) entity.setFloorArea(request.getFloorArea());
        if (request.getAssetLocation() != null) entity.setAssetLocation(request.getAssetLocation());
        if (request.getAttachmentName() != null) entity.setAttachmentName(request.getAttachmentName());
        if (request.getDeclarationDate() != null) entity.setDeclarationDate(request.getDeclarationDate());
        if (request.getOriginalValue() != null) entity.setOriginalValue(request.getOriginalValue());
        if (request.getDepreciationRate() != null) entity.setDepreciationRate(request.getDepreciationRate());
        if (request.getRemainingValue() != null) entity.setRemainingValue(request.getRemainingValue());
        if (request.getValueUnit() != null) entity.setValueUnit(request.getValueUnit());
        if (request.getAssignmentDecisionNumber() != null) entity.setAssignmentDecisionNumber(request.getAssignmentDecisionNumber());
        if (request.getDepreciationStartDate() != null) entity.setDepreciationStartDate(request.getDepreciationStartDate());
        if (request.getDepreciationMonths() != null) entity.setDepreciationMonths(request.getDepreciationMonths());
        if (request.getDepreciationEndDate() != null) entity.setDepreciationEndDate(request.getDepreciationEndDate());
        if (request.getAccumulatedDepreciation() != null) entity.setAccumulatedDepreciation(request.getAccumulatedDepreciation());
        if (request.getMonthlyDepreciation() != null) entity.setMonthlyDepreciation(request.getMonthlyDepreciation());
        if (request.getDisposalMethod() != null) entity.setDisposalMethod(request.getDisposalMethod());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        if (request.getApprovalStatus() != null) {
            handleApprovalTransition(entity, request.getApprovalStatus(), request);
        }
    }

    private void handleApprovalTransition(CctvSystemAsset entity, ApprovalStatus newStatus, CctvSystemAssetRequest request) {
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

    private void calculateValues(CctvSystemAsset entity) {
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
            code = "TS-CCTV-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private CctvSystemAssetResponse toResponse(CctvSystemAsset entity) {
        CctvSystemAssetResponse response = new CctvSystemAssetResponse();
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
        if (entity.getCctvId() != null) {
            cctvRepository.findById(entity.getCctvId()).ifPresent(c -> {
                response.setCctvCode(c.getDeviceCode());
                response.setCctvName(c.getDeviceName());
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
}
