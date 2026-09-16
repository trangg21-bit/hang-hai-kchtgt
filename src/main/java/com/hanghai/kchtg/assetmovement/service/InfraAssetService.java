package com.hanghai.kchtg.assetmovement.service;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;

@Service
@Transactional(readOnly = true)
public class InfraAssetService {
    private final InfraAssetRepository repository;
    private final UserResolverService userResolverService;
    private final AttachmentRepository attachmentRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final ChangeHistoryService changeHistoryService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    public InfraAssetService(
            InfraAssetRepository repository,
            UserResolverService userResolverService,
            AttachmentRepository attachmentRepository,
            InfrastructureHistoryRepository historyRepository,
            UserRepository userRepository) {
        this(repository, userResolverService, attachmentRepository, historyRepository, userRepository, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public InfraAssetService(
            InfraAssetRepository repository,
            UserResolverService userResolverService,
            AttachmentRepository attachmentRepository,
            InfrastructureHistoryRepository historyRepository,
            UserRepository userRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) ChangeHistoryService changeHistoryService) {
        this.repository = repository;
        this.userResolverService = userResolverService;
        this.attachmentRepository = attachmentRepository;
        this.historyRepository = historyRepository;
        this.userRepository = userRepository;
        this.changeHistoryService = changeHistoryService;
    }

    @Transactional
    public InfraAssetResponse create(InfraAssetRequest request) {
        InfraAsset entity = new InfraAsset();
        copyEditableFields(request, entity);

        if (entity.getAssetType() == null && entity.getTypes() != null) {
            try {
                entity.setAssetType(InfraAssetType.fromValue(entity.getTypes()));
            } catch (Exception ignored) {
            }
        }
        if (entity.getAssetType() == null) {
            entity.setAssetType(request.getAssetType() != null ? request.getAssetType() : InfraAssetType.PORT_TERMINAL);
        }
        if (entity.getTypes() == null && entity.getAssetType() != null) {
            entity.setTypes(entity.getAssetType().name());
        }
        entity.setAssetCode(generateAssetCode(request.getAssetCode(), entity.getAssetType()));
        if (entity.getStatus() == null) {
            entity.setStatus(AssetStatus.MANAGED);
        }

        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public InfraAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<InfraAssetResponse> findAll(
            String assetCode, String assetName, UUID parentOrgUnitId, UUID orgUnitId, UUID usingOrgUnitId,
            UUID berthId, UUID lritStationId, UUID ttdhStationId, UUID inmarsatStationId, UUID cospasSarsatStationId,
            UUID ttxlttStationId, UUID stationId, UUID dryPortId,
            UUID transferAreaId, UUID stormShelterId, UUID buoyBerthId, UUID pierId, UUID anchorageId,
            UUID beaconStationId, UUID dikeRevetmentId, UUID buoyId, UUID buoyStationId, UUID navigationChannelId,
            String types, InfraAssetType assetType, String assetCondition, String approvalStatus,
            LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {

        Specification<InfraAsset> specification = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")),
                        "%" + assetCode.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")),
                        "%" + assetName.trim().toLowerCase(Locale.ROOT) + "%"));
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
            if (berthId != null) {
                predicates.add(cb.equal(root.get("berthId"), berthId));
            }
            if (lritStationId != null) {
                predicates.add(cb.equal(root.get("lritStationId"), lritStationId));
            }
            if (ttdhStationId != null) {
                predicates.add(cb.equal(root.get("ttdhStationId"), ttdhStationId));
            }
            if (inmarsatStationId != null) {
                predicates.add(cb.equal(root.get("inmarsatStationId"), inmarsatStationId));
            }
            if (cospasSarsatStationId != null) {
                predicates.add(cb.equal(root.get("cospasSarsatStationId"), cospasSarsatStationId));
            }
            if (ttxlttStationId != null) {
                predicates.add(cb.equal(root.get("ttxlttStationId"), ttxlttStationId));
            }
            if (stationId != null) {
                predicates.add(cb.equal(root.get("stationId"), stationId));
            }
            if (dryPortId != null) {
                predicates.add(cb.equal(root.get("dryPortId"), dryPortId));
            }
            if (transferAreaId != null) {
                predicates.add(cb.equal(root.get("transferAreaId"), transferAreaId));
            }
            if (stormShelterId != null) {
                predicates.add(cb.equal(root.get("stormShelterId"), stormShelterId));
            }
            if (buoyBerthId != null) {
                predicates.add(cb.equal(root.get("buoyBerthId"), buoyBerthId));
            }
            if (pierId != null) {
                predicates.add(cb.equal(root.get("pierId"), pierId));
            }
            if (anchorageId != null) {
                predicates.add(cb.equal(root.get("anchorageId"), anchorageId));
            }
            if (beaconStationId != null) {
                predicates.add(cb.equal(root.get("beaconStationId"), beaconStationId));
            }
            if (dikeRevetmentId != null) {
                predicates.add(cb.equal(root.get("dikeRevetmentId"), dikeRevetmentId));
            }
            if (buoyId != null) {
                predicates.add(cb.equal(root.get("buoyId"), buoyId));
            }
            if (buoyStationId != null) {
                predicates.add(cb.equal(root.get("buoyStationId"), buoyStationId));
            }
            if (navigationChannelId != null) {
                predicates.add(cb.equal(root.get("navigationChannelId"), navigationChannelId));
            }
            if (types != null && !types.isBlank()) {
                predicates.add(cb.equal(root.get("types"), types.trim()));
            }
            if (assetType != null) {
                predicates.add(cb.equal(root.get("assetType"), assetType));
            }
            if (assetCondition != null && !assetCondition.isBlank()) {
                predicates.add(cb.equal(root.get("assetCondition"), assetCondition));
            }
            if (approvalStatus != null && !approvalStatus.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("approvalStatus"), ApprovalStatus.fromString(approvalStatus)));
                } catch (IllegalArgumentException ignored) {
                    /* unknown status returns the unfiltered page */
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
    public InfraAssetResponse update(UUID id, InfraAssetRequest request) {
        InfraAsset entity = requireAsset(id);
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        if (entity.getDeletedAt() != null
                || previousStatus == ApprovalStatus.ARCHIVED
                || previousStatus == ApprovalStatus.APPROVED_LEVEL1
                || previousStatus == ApprovalStatus.PENDING_APPROVAL
                || previousStatus == ApprovalStatus.PROPOSED) {
            String label = previousStatus != null ? previousStatus.getLabel() : "Đã xóa";
            throw new IllegalStateException("Hồ sơ ở trạng thái " + label + " không được phép chỉnh sửa");
        }
        boolean wasApproved = previousStatus == ApprovalStatus.APPROVED
                || previousStatus == ApprovalStatus.APPROVED_LEVEL2;

        String assetCode = entity.getAssetCode();

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        LocalDateTime now = LocalDateTime.now();
        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());

        if (wasApproved) {
            // Track changes in "Thông tin chung"
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "parentOrgUnitId", entity.getParentOrgUnitId(), request.getParentOrgUnitId());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "orgUnitId", entity.getOrgUnitId(), request.getOrgUnitId());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "usingOrgUnitId", entity.getUsingOrgUnitId(), request.getUsingOrgUnitId());

            // Station references (chọn đúng trường theo assetType, tránh nhân đôi)
            if (entity.getAssetType() == InfraAssetType.LRIT_STATION) {
                UUID oldStation = entity.getLritStationId() != null ? entity.getLritStationId() : entity.getStationId();
                UUID newStation = request.getLritStationId() != null ? request.getLritStationId() : request.getStationId();
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "lritStationId", oldStation, newStation);
            } else if (entity.getAssetType() == InfraAssetType.TTDH_STATION) {
                UUID oldStation = entity.getTtdhStationId() != null ? entity.getTtdhStationId() : entity.getStationId();
                UUID newStation = request.getTtdhStationId() != null ? request.getTtdhStationId() : request.getStationId();
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "ttdhStationId", oldStation, newStation);
            } else if (entity.getAssetType() == InfraAssetType.INMARSAT_STATION) {
                UUID oldStation = entity.getInmarsatStationId() != null ? entity.getInmarsatStationId() : entity.getStationId();
                UUID newStation = request.getInmarsatStationId() != null ? request.getInmarsatStationId() : request.getStationId();
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "inmarsatStationId", oldStation, newStation);
            } else if (entity.getAssetType() == InfraAssetType.COSPAS_SARSAT_STATION) {
                UUID oldStation = entity.getCospasSarsatStationId() != null ? entity.getCospasSarsatStationId() : entity.getStationId();
                UUID newStation = request.getCospasSarsatStationId() != null ? request.getCospasSarsatStationId() : request.getStationId();
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "cospasSarsatStationId", oldStation, newStation);
            } else if (entity.getAssetType() == InfraAssetType.TTXLTT_STATION) {
                UUID oldStation = entity.getTtxlttStationId() != null ? entity.getTtxlttStationId() : entity.getStationId();
                UUID newStation = request.getTtxlttStationId() != null ? request.getTtxlttStationId() : request.getStationId();
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "ttxlttStationId", oldStation, newStation);
            } else if (entity.getAssetType() == InfraAssetType.DRY_PORT) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "dryPortId", entity.getDryPortId(), request.getDryPortId());
            } else if (entity.getAssetType() == InfraAssetType.PORT_TERMINAL) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "berthId", entity.getBerthId(), request.getBerthId());
            } else if (entity.getAssetType() == InfraAssetType.ANCHORAGE) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "anchorageId", entity.getAnchorageId(), request.getAnchorageId());
            } else if (entity.getAssetType() == InfraAssetType.LIGHTHOUSE) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "beaconStationId", entity.getBeaconStationId(), request.getBeaconStationId());
            } else if (entity.getAssetType() == InfraAssetType.DIKE_REVETMENT) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "dikeRevetmentId", entity.getDikeRevetmentId(), request.getDikeRevetmentId());
            } else if (entity.getAssetType() == InfraAssetType.BUOY) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "buoyId", entity.getBuoyId(), request.getBuoyId());
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "buoyStationId", entity.getBuoyStationId(), request.getBuoyStationId());
            } else if (entity.getAssetType() == InfraAssetType.NAVIGATION_CHANNEL) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "navigationChannelId", entity.getNavigationChannelId(), request.getNavigationChannelId());
            } else if (entity.getAssetType() == InfraAssetType.TRANSFER_AREA) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "transferAreaId", entity.getTransferAreaId(), request.getTransferAreaId());
            } else if (entity.getAssetType() == InfraAssetType.STORM_SHELTER) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "stormShelterId", entity.getStormShelterId(), request.getStormShelterId());
            } else if (entity.getAssetType() == InfraAssetType.BUOY_BERTH) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "buoyBerthId", entity.getBuoyBerthId(), request.getBuoyBerthId());
            } else if (entity.getAssetType() == InfraAssetType.PIER) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "pierId", entity.getPierId(), request.getPierId());
            } else {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "stationId", entity.getStationId(), request.getStationId());
            }

            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "assetName", entity.getAssetName(), request.getAssetName());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "barcode", entity.getBarcode(), request.getBarcode());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "assetCondition", entity.getAssetCondition(), request.getAssetCondition());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "usageStatus", entity.getUsageStatus(), request.getUsageStatus());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "assetGroup", entity.getAssetGroup(), request.getAssetGroup());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "assetSubgroup", entity.getAssetSubgroup(), request.getAssetSubgroup());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "origin", entity.getOrigin(), request.getOrigin());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "quantity", entity.getQuantity(), request.getQuantity());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "quantityUnit", entity.getQuantityUnit(), request.getQuantityUnit());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "model", entity.getModel(), request.getModel());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "serialNumber", entity.getSerialNumber(), request.getSerialNumber());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "countryOfOrigin", entity.getCountryOfOrigin(), request.getCountryOfOrigin());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "manufacturer", entity.getManufacturer(), request.getManufacturer());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "constructionYear", entity.getConstructionYear(), request.getConstructionYear());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "useDate", entity.getUseDate(), request.getUseDate());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "landArea", entity.getLandArea(), request.getLandArea());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "floorArea", entity.getFloorArea(), request.getFloorArea());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "assetLocation", entity.getAssetLocation(), request.getAssetLocation());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "address", entity.getAddress(), request.getAddress());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "location", entity.getLocation(), request.getLocation());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "technicalSpecs", entity.getTechnicalSpecs(), request.getTechnicalSpecs());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "fundingSource", entity.getFundingSource(), request.getFundingSource());

            // Details tab & Financial fields
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "declarationDate", entity.getDeclarationDate(), request.getDeclarationDate());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "originalValue", entity.getOriginalValue(), request.getOriginalValue());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "depreciationRate", entity.getDepreciationRate(), request.getDepreciationRate());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "assignmentDecisionNumber", entity.getAssignmentDecisionNumber(), request.getAssignmentDecisionNumber());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "depreciationStartDate", entity.getDepreciationStartDate(), request.getDepreciationStartDate());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "depreciationMonths", entity.getDepreciationMonths(), request.getDepreciationMonths());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "depreciationEndDate", entity.getDepreciationEndDate(), request.getDepreciationEndDate());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "accumulatedDepreciation", entity.getAccumulatedDepreciation(), request.getAccumulatedDepreciation());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "monthlyDepreciation", entity.getMonthlyDepreciation(), request.getMonthlyDepreciation());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "disposalMethod", entity.getDisposalMethod(), request.getDisposalMethod());

            // Approval & Status
            String oldApproval = entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null;
            String newApproval = request.getApprovalStatus();
            if (newApproval != null && !newApproval.isBlank()) {
                recordFieldChangeIfDifferent(id, refType, currentUserId, now, "approvalStatus", oldApproval, newApproval);
            }
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "portAuthorityApprovalContent", entity.getPortAuthorityApprovalContent(), request.getPortAuthorityApprovalContent());
            recordFieldChangeIfDifferent(id, refType, currentUserId, now, "departmentApprovalContent", entity.getDepartmentApprovalContent(), request.getDepartmentApprovalContent());
        }

        copyEditableFields(request, entity);
        entity.setAssetCode(assetCode);
        if (entity.getTypes() == null && entity.getAssetType() != null) {
            entity.setTypes(entity.getAssetType().name());
        }
        calculateValues(entity);
        InfraAsset saved = repository.save(entity);

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        InfraAsset entity = requireAsset(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        String oldStatus = entity.getApprovalStatus() != null ? entity.getApprovalStatus().getLabel() : "Lưu tạm";
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repository.save(entity);

        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.DELETED)
                .approvedBy(currentUserId)
                .approvedDate(LocalDateTime.now())
                .changedField("approvalStatus")
                .previousValue(oldStatus)
                .newValue("Đã xóa")
                .build());
    }

    @Transactional
    public InfraAssetResponse submit(UUID id) {
        InfraAsset entity = requireAsset(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setSubmittedBy(currentUserId);
        entity.setSubmittedAt(Instant.now());
        InfraAsset saved = repository.save(entity);

        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.PROPOSED)
                .approvedBy(currentUserId)
                .approvedDate(LocalDateTime.now())
                .changedField("approvalStatus")
                .previousValue(previousStatus != null ? previousStatus.getLabel() : "Lưu tạm")
                .newValue("Chờ phê duyệt cấp Cảng vụ/Chi cục")
                .build());

        return toResponse(saved);
    }

    @Transactional
    public InfraAssetResponse approveC1(UUID id, String content) {
        InfraAsset entity = requireAsset(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setPortAuthorityApprovedBy(currentUserId);
        entity.setPortAuthorityApprovedAt(Instant.now());
        if (content != null && !content.isBlank()) {
            entity.setPortAuthorityApprovalContent(content.trim());
        }
        InfraAsset saved = repository.save(entity);

        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(currentUserId)
                .approvedDate(LocalDateTime.now())
                .changedField("approvalStatus")
                .previousValue(previousStatus != null ? previousStatus.getLabel() : "Chờ phê duyệt cấp Cảng vụ/Chi cục")
                .newValue("Chờ phê duyệt cấp Cục")
                .reason(content != null && !content.isBlank() ? content.trim() : null)
                .build());

        return toResponse(saved);
    }

    @Transactional
    public InfraAssetResponse rejectC1(UUID id, String reason) {
        InfraAsset entity = requireAsset(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        entity.setPortAuthorityApprovedBy(currentUserId);
        entity.setPortAuthorityApprovedAt(Instant.now());
        if (reason != null && !reason.isBlank()) {
            entity.setPortAuthorityApprovalContent(reason.trim());
        }
        InfraAsset saved = repository.save(entity);

        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(currentUserId)
                .approvedDate(LocalDateTime.now())
                .changedField("approvalStatus")
                .previousValue(previousStatus != null ? previousStatus.getLabel() : "Chờ phê duyệt cấp Cảng vụ/Chi cục")
                .newValue("Từ chối cấp Cảng vụ/Chi cục")
                .reason(reason != null && !reason.isBlank() ? reason.trim() : null)
                .build());

        return toResponse(saved);
    }

    @Transactional
    public InfraAssetResponse approveC2(UUID id, String content) {
        InfraAsset entity = requireAsset(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setDepartmentApprovedBy(currentUserId);
        entity.setDepartmentApprovedAt(Instant.now());
        if (content != null && !content.isBlank()) {
            entity.setDepartmentApprovalContent(content.trim());
        }
        InfraAsset saved = repository.save(entity);

        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(currentUserId)
                .approvedDate(LocalDateTime.now())
                .changedField("approvalStatus")
                .previousValue(previousStatus != null ? previousStatus.getLabel() : "Chờ phê duyệt cấp Cục")
                .newValue("Đã phê duyệt")
                .reason(content != null && !content.isBlank() ? content.trim() : null)
                .build());

        return toResponse(saved);
    }

    @Transactional
    public InfraAssetResponse rejectC2(UUID id, String reason) {
        InfraAsset entity = requireAsset(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy()
                    : (entity.getCreatedBy() != null ? entity.getCreatedBy() : UUID.fromString("00000000-0000-0000-0000-000000000001"));
        }
        ApprovalStatus previousStatus = entity.getApprovalStatus();
        entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL2);
        entity.setDepartmentApprovedBy(currentUserId);
        entity.setDepartmentApprovedAt(Instant.now());
        if (reason != null && !reason.isBlank()) {
            entity.setDepartmentApprovalContent(reason.trim());
        }
        InfraAsset saved = repository.save(entity);

        InfrastructureType refType = mapAssetTypeToInfrastructureType(entity.getAssetType());
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(currentUserId)
                .approvedDate(LocalDateTime.now())
                .changedField("approvalStatus")
                .previousValue(previousStatus != null ? previousStatus.getLabel() : "Chờ phê duyệt cấp Cục")
                .newValue("Từ chối cấp Cục")
                .reason(reason != null && !reason.isBlank() ? reason.trim() : null)
                .build());

        return toResponse(saved);
    }

    private boolean areValuesEqual(Object oldVal, Object newVal) {
        if (oldVal == null && newVal == null) return true;
        if (oldVal == null || newVal == null) {
            String sOld = oldVal != null ? String.valueOf(oldVal).trim() : "";
            String sNew = newVal != null ? String.valueOf(newVal).trim() : "";
            return sOld.isEmpty() && sNew.isEmpty();
        }

        if (oldVal instanceof BigDecimal || newVal instanceof BigDecimal ||
            oldVal instanceof Number || newVal instanceof Number) {
            try {
                BigDecimal bdOld = new BigDecimal(String.valueOf(oldVal).trim());
                BigDecimal bdNew = new BigDecimal(String.valueOf(newVal).trim());
                return bdOld.compareTo(bdNew) == 0;
            } catch (Exception ignored) {
            }
        }

        String sOld = String.valueOf(oldVal).trim();
        String sNew = String.valueOf(newVal).trim();
        return Objects.equals(sOld, sNew);
    }

    private String formatValueForHistory(Object val) {
        if (val == null) return "";
        if (val instanceof BigDecimal bd) {
            return bd.stripTrailingZeros().toPlainString();
        }
        return String.valueOf(val).trim();
    }

    private void recordFieldChangeIfDifferent(
            UUID assetId,
            InfrastructureType refType,
            UUID userId,
            LocalDateTime now,
            String fieldName,
            Object oldVal,
            Object newVal) {
        if (areValuesEqual(oldVal, newVal)) {
            return;
        }

        String oldStr = formatValueForHistory(oldVal);
        String newStr = formatValueForHistory(newVal);

        historyRepository.save(InfrastructureHistory.builder()
                .refId(assetId)
                .refType(refType)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(userId)
                .approvedDate(now)
                .changedField(fieldName)
                .previousValue(oldStr)
                .newValue(newStr)
                .build());
    }

    private InfrastructureType mapAssetTypeToInfrastructureType(InfraAssetType assetType) {
        if (assetType == null) return InfrastructureType.LRIT_STATION;
        return switch (assetType) {
            case LRIT_STATION -> InfrastructureType.LRIT_STATION;
            case TTDH_STATION -> InfrastructureType.DAI_TTDH;
            case INMARSAT_STATION -> InfrastructureType.INMARSAT_STATION;
            case COSPAS_SARSAT_STATION -> InfrastructureType.COSPAS_SARSAT_STATION;
            case TTXLTT_STATION -> InfrastructureType.HANOI_STATION;
            case DRY_PORT -> InfrastructureType.DRY_PORT;
            case TRANSFER_AREA -> InfrastructureType.TRANSSHIPMENT_AREA;
            case STORM_SHELTER -> InfrastructureType.STORM_SHELTER_AREA;
            case BUOY_BERTH -> InfrastructureType.BUOY_BERTH;
            case PIER -> InfrastructureType.PIER;
            case ANCHORAGE -> InfrastructureType.ANCHORAGE_AREA;
            case LIGHTHOUSE -> InfrastructureType.LIGHTHOUSE;
            case NAVIGATION_CHANNEL -> InfrastructureType.NAVIGATION_CHANNEL;
            case DIKE_REVETMENT -> InfrastructureType.DIKE_REVETMENT;
            case RADAR_STATION -> InfrastructureType.RADAR_STATION;
            case BUOY -> InfrastructureType.BUOY;
            default -> InfrastructureType.PORT_TERMINAL;
        };
    }

    public long countByStatus(String status) {
        return repository.countByStatus(AssetStatus.valueOf(status));
    }

    private InfraAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kết cấu hạ tầng với id: " + id));
    }

    private String generateAssetCode(String requestedCode, InfraAssetType assetType) {
        if (requestedCode != null && !requestedCode.isBlank()
                && repository.findByAssetCode(requestedCode.trim()).isEmpty()) {
            return requestedCode.trim();
        }
        if (assetType == null) {
            throw new IllegalArgumentException("Loại tài sản không được để trống khi sinh mã");
        }
        String prefix = switch (assetType) {
            case PORT_TERMINAL -> "TS-BC-";
            case LRIT_STATION -> "TS-LRIT-";
            case TTDH_STATION -> "TS-TTDH-";
            case INMARSAT_STATION -> "TS-INMARSAT-";
            case COSPAS_SARSAT_STATION -> "TS-COSPAS-";
            case TTXLTT_STATION -> "TS-TTXLTT-";
            case DRY_PORT -> "TS-CC-";
            case TRANSFER_AREA -> "TS-KCT-";
            case STORM_SHELTER -> "TS-TB-";
            case BUOY_BERTH -> "TS-BP-";
            case PIER -> "TS-CC-";
            case BUOY -> "TS-PT-";
            case ANCHORAGE -> "TS-ND-";
            case LIGHTHOUSE -> "TS-DB-";
            case NAVIGATION_CHANNEL -> "TS-LHH-";
            case DIKE_REVETMENT -> "TS-DK-";
            case RADAR_STATION -> "TS-RD-";
            case AUXILIARY_EQUIPMENT -> "TS-TBPT-";
        };
        String code;
        do {
            code = prefix + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private void copyEditableFields(InfraAssetRequest source, InfraAsset target) {
        BeanUtils.copyProperties(source, target, "assetCode", "status", "approvalStatus",
                "remainingValue", "createdAt", "createdBy", "updatedAt", "updatedBy",
                "submittedBy", "submittedAt", "portAuthorityApprovedBy", "portAuthorityApprovedAt",
                "portAuthorityApprovalContent", "departmentApprovedBy", "departmentApprovedAt",
                "departmentApprovalContent", "approvedBy", "approvedAt", "approvedRemarks");
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
                UUID currentUserId = com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId();
                if (status == ApprovalStatus.PENDING_APPROVAL) {
                    if (target.getSubmittedBy() == null) {
                        target.setSubmittedBy(
                                source.getSubmittedBy() != null ? source.getSubmittedBy() : currentUserId);
                    }
                    if (target.getSubmittedAt() == null) {
                        target.setSubmittedAt(
                                source.getSubmittedAt() != null ? source.getSubmittedAt() : java.time.Instant.now());
                    }
                } else if (status == ApprovalStatus.APPROVED) {
                    if (target.getDepartmentApprovedBy() == null) {
                        target.setDepartmentApprovedBy(
                                source.getDepartmentApprovedBy() != null ? source.getDepartmentApprovedBy()
                                        : currentUserId);
                    }
                    if (target.getDepartmentApprovedAt() == null) {
                        target.setDepartmentApprovedAt(
                                source.getDepartmentApprovedAt() != null ? source.getDepartmentApprovedAt()
                                        : java.time.Instant.now());
                    }
                }
            } catch (Exception ignored) {
                target.setApprovalStatus(ApprovalStatus.DRAFT);
            }
        }
        if (source.getPortAuthorityApprovedBy() != null) {
            target.setPortAuthorityApprovedBy(source.getPortAuthorityApprovedBy());
        }
        if (source.getPortAuthorityApprovedAt() != null) {
            target.setPortAuthorityApprovedAt(source.getPortAuthorityApprovedAt());
        }
        if (source.getDepartmentApprovedBy() != null) {
            target.setDepartmentApprovedBy(source.getDepartmentApprovedBy());
        }
        if (source.getDepartmentApprovedAt() != null) {
            target.setDepartmentApprovedAt(source.getDepartmentApprovedAt());
        }
        if (source.getSubmittedBy() != null) {
            target.setSubmittedBy(source.getSubmittedBy());
        }
        if (source.getSubmittedAt() != null) {
            target.setSubmittedAt(source.getSubmittedAt());
        }
    }

    private void calculateValues(InfraAsset entity) {
        BigDecimal original = entity.getOriginalValue() == null ? BigDecimal.ZERO : entity.getOriginalValue();
        BigDecimal accumulated = entity.getAccumulatedDepreciation() == null ? BigDecimal.ZERO
                : entity.getAccumulatedDepreciation();
        entity.setAccumulatedDepreciation(accumulated);
        entity.setRemainingValue(original.subtract(accumulated).max(BigDecimal.ZERO));
        if (entity.getMonthlyDepreciation() == null && entity.getDepreciationMonths() != null
                && entity.getDepreciationMonths() > 0) {
            entity.setMonthlyDepreciation(original.divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2,
                    java.math.RoundingMode.HALF_UP));
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

    @Transactional
    public List<InfraAssetAttachmentResponse> uploadAttachments(UUID assetId, List<MultipartFile> files, UUID userId) {
        InfraAsset asset = requireAsset(assetId);
        Path basePath = Paths.get(attachmentPath).toAbsolutePath().normalize();
        String oldNames = asset.getAttachmentName();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;
            try {
                Path dir = basePath.resolve("INFRA_ASSET").resolve(assetId.toString());
                Files.createDirectories(dir);
                Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
            }
            String storagePath = basePath.resolve("INFRA_ASSET").resolve(assetId.toString()).resolve(storageFileName).toString();

            Attachment attachment = new Attachment();
            attachment.setEntityType("INFRA_ASSET");
            attachment.setEntityId(assetId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(storagePath);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedBy(userId);
            attachmentRepository.save(attachment);
        }

        List<Attachment> allAttachments = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("INFRA_ASSET", assetId);
        String mergedNames = allAttachments.stream()
                .map(Attachment::getFileName)
                .collect(Collectors.joining(", "));
        asset.setAttachmentName(mergedNames);
        repository.save(asset);

        ApprovalStatus status = asset.getApprovalStatus();
        boolean wasApproved = status == ApprovalStatus.APPROVED || status == ApprovalStatus.APPROVED_LEVEL2;
        if (wasApproved) {
            InfrastructureType refType = mapAssetTypeToInfrastructureType(asset.getAssetType());
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(assetId)
                    .refType(refType)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("attachments")
                    .previousValue(oldNames)
                    .newValue(mergedNames)
                    .reason("Tải lên tệp đính kèm: " + files.stream()
                            .map(f -> f.getOriginalFilename() != null ? f.getOriginalFilename() : "unknown")
                            .collect(Collectors.joining(", ")))
                    .build());
        }

        return allAttachments.stream().map(this::toAttachmentResponse).collect(Collectors.toList());
    }

    public List<InfraAssetAttachmentResponse> listAttachments(UUID assetId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("INFRA_ASSET", assetId)
                .stream().map(this::toAttachmentResponse).collect(Collectors.toList());
    }

    public Attachment getAttachment(UUID assetId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(assetId) || !"INFRA_ASSET".equalsIgnoreCase(attachment.getEntityType())) {
            throw new IllegalArgumentException("File không thuộc tài sản này");
        }
        return attachment;
    }

    @Transactional
    public void deleteAttachment(UUID assetId, UUID attachmentId, UUID userId) {
        InfraAsset asset = requireAsset(assetId);
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(assetId)) {
            throw new IllegalArgumentException("File không thuộc tài sản này");
        }
        String oldNames = asset.getAttachmentName();
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (Exception ignored) {
        }
        attachmentRepository.delete(attachment);

        List<Attachment> remaining = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("INFRA_ASSET", assetId);
        String mergedNames = remaining.isEmpty() ? null : remaining.stream()
                .map(Attachment::getFileName)
                .collect(Collectors.joining(", "));
        asset.setAttachmentName(mergedNames);
        repository.save(asset);

        ApprovalStatus status = asset.getApprovalStatus();
        boolean wasApproved = status == ApprovalStatus.APPROVED || status == ApprovalStatus.APPROVED_LEVEL2;
        if (wasApproved) {
            InfrastructureType refType = mapAssetTypeToInfrastructureType(asset.getAssetType());
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(assetId)
                    .refType(refType)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .changedField("attachments")
                    .previousValue(oldNames)
                    .newValue(mergedNames)
                    .reason("Xóa tệp đính kèm: " + attachment.getFileName())
                    .build());
        }
    }

    private InfraAssetAttachmentResponse toAttachmentResponse(Attachment entity) {
        return InfraAssetAttachmentResponse.builder()
                .id(entity.getId())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .fileName(entity.getFileName())
                .filePath(entity.getFilePath())
                .fileSize(entity.getFileSize())
                .contentType(entity.getContentType())
                .uploadedBy(entity.getUploadedBy())
                .uploadedByName(userResolverService.resolveName(entity.getUploadedBy()))
                .uploadedAt(entity.getUploadedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        InfraAsset entity = requireAsset(id);
        if (entity.getApprovalStatus() == ApprovalStatus.DRAFT) {
            Map<String, Object> emptyResult = new HashMap<>();
            emptyResult.put("changeHistory", Collections.emptyList());
            emptyResult.put("approvalLog", Collections.emptyList());
            emptyResult.put("histories", Collections.emptyList());
            return emptyResult;
        }
        String entityId = id.toString();
        String entityType = entity.getAssetType() != null ? entity.getAssetType().name() : "InfraAsset";

        List<InfrastructureHistory> list = historyRepository.findByRefIdOrderByApprovedDateDesc(id);

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("refId", h.getRefId());
                    m.put("refType", h.getRefType());
                    m.put("status", h.getStatus() != null ? h.getStatus().name() : null);
                    m.put("fieldName", h.getChangedField());
                    m.put("changedField", h.getChangedField());
                    m.put("oldValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("previousValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
                    m.put("value", h.getNewValue() != null ? h.getNewValue() : "");
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("approvedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("changedAt", h.getApprovedDate());
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("reason", h.getReason());
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
                    m.put("decision", h.getStatus().name());
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
