package com.hanghai.kchtg.coastalstationasset.service;

import com.hanghai.kchtg.coastalstationasset.dto.*;
import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAsset;
import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAssetAdjustment;
import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAssetExploitation;
import com.hanghai.kchtg.coastalstationasset.repository.CoastalStationAssetAdjustmentRepository;
import com.hanghai.kchtg.coastalstationasset.repository.CoastalStationAssetExploitationRepository;
import com.hanghai.kchtg.coastalstationasset.repository.CoastalStationAssetRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.repository.DaiTtdhRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
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
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetAttachmentResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoastalStationAssetService {

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    private final CoastalStationAssetRepository repository;
    private final CoastalStationAssetExploitationRepository exploitationRepository;
    private final CoastalStationAssetAdjustmentRepository adjustmentRepository;
    private final DaiTtdhRepository daiTtdhRepository;
    private final CoastalStationInmarsatRepository inmarsatRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserResolverService userResolverService;

    @Transactional
    public CoastalStationAssetResponse create(CoastalStationAssetRequest request) {
        CoastalStationAsset entity = new CoastalStationAsset();
        copyEditableFields(request, entity);
        if (request.getAssetType() != null && !request.getAssetType().isBlank()) {
            entity.setAssetType(request.getAssetType());
        } else if (entity.getAssetType() == null || entity.getAssetType().isBlank()) {
            entity.setAssetType("Tài sản đài TTDH");
        }
        entity.setAssetCode(generateAssetCode(request.getAssetCode(), entity.getAssetType()));
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public CoastalStationAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<CoastalStationAssetResponse> findAll(String assetCode, String assetName, UUID parentOrgUnitId,
                                                    UUID orgUnitId, UUID usingOrgUnitId, UUID stationId,
                                                    String assetCondition, String approvalStatus, String assetType,
                                                    LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {
        Specification<CoastalStationAsset> specification = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            predicates.add(cb.isNull(root.get("deletedAt")));
            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (parentOrgUnitId != null) predicates.add(cb.equal(root.get("parentOrgUnitId"), parentOrgUnitId));
            if (orgUnitId != null) predicates.add(cb.equal(root.get("orgUnitId"), orgUnitId));
            if (usingOrgUnitId != null) predicates.add(cb.equal(root.get("usingOrgUnitId"), usingOrgUnitId));
            if (stationId != null) {
                predicates.add(cb.or(
                    cb.equal(root.get("stationId"), stationId),
                    cb.equal(root.get("daiTtdhId"), stationId),
                    cb.equal(root.get("inmarsatId"), stationId)
                ));
            }
            if (assetCondition != null && !assetCondition.isBlank()) {
                predicates.add(cb.equal(root.get("assetCondition"), assetCondition));
            }
            if (assetType != null && !assetType.isBlank()) {
                predicates.add(cb.equal(root.get("assetType"), assetType.trim()));
            }
            if (approvalStatus != null && !approvalStatus.isBlank()) {
                try {
                    predicates.add(cb.equal(root.get("approvalStatus"), ApprovalStatus.fromString(approvalStatus)));
                } catch (IllegalArgumentException ignored) {}
            }
            if (updatedFrom != null) predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), updatedFrom.atStartOfDay()));
            if (updatedTo != null) predicates.add(cb.lessThan(root.get("updatedAt"), updatedTo.plusDays(1).atStartOfDay()));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return repository.findAll(specification, pageable).map(this::toResponse);
    }

    @Transactional
    public CoastalStationAssetResponse update(UUID id, CoastalStationAssetRequest request) {
        CoastalStationAsset entity = requireAsset(id);
        String assetCode = entity.getAssetCode();
        copyEditableFields(request, entity);
        entity.setAssetCode(assetCode);
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        CoastalStationAsset entity = requireAsset(id);
        try {
            attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("COASTAL_STATION_ASSET", id)
                    .forEach(att -> {
                        try {
                            if (att.getFilePath() != null) {
                                Files.deleteIfExists(java.nio.file.Paths.get(att.getFilePath()));
                            }
                        } catch (Exception ignored) {}
                        attachmentRepository.delete(att);
                    });
        } catch (Exception ignored) {}
        repository.delete(entity);
    }

    // --- Exploitations (Tab 4) ---
    public List<CoastalStationAssetExploitation> getExploitations(UUID assetId) {
        requireAsset(assetId);
        return exploitationRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }

    @Transactional
    public CoastalStationAssetExploitation addExploitation(UUID assetId, CoastalStationExploitationRequest request) {
        requireAsset(assetId);
        CoastalStationAssetExploitation entity = new CoastalStationAssetExploitation();
        BeanUtils.copyProperties(request, entity);
        entity.setAssetId(assetId);
        return exploitationRepository.save(entity);
    }

    // --- Adjustments (Tab 5) ---
    public List<CoastalStationAssetAdjustment> getAdjustments(UUID assetId, String type) {
        requireAsset(assetId);
        if (type != null && !type.isBlank()) {
            return adjustmentRepository.findByAssetIdAndAdjustmentTypeOrderByCreatedAtDesc(assetId, type.toUpperCase(Locale.ROOT));
        }
        return adjustmentRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }

    @Transactional
    public CoastalStationAssetAdjustment addAdjustment(UUID assetId, CoastalStationAdjustmentRequest request) {
        CoastalStationAsset asset = requireAsset(assetId);
        CoastalStationAssetAdjustment entity = new CoastalStationAssetAdjustment();
        BeanUtils.copyProperties(request, entity);
        entity.setAssetId(assetId);
        entity.setStatus("CHO_PHE_DUYET");
        entity.setSubmittedBy(SecurityUtils.getCurrentUserId());
        entity.setSubmittedAt(Instant.now());

        if (request.getOriginalValueAfter() != null) {
            asset.setOriginalValue(request.getOriginalValueAfter());
        }
        if (request.getRemainingValueAfter() != null) {
            asset.setRemainingValue(request.getRemainingValueAfter());
        }
        repository.save(asset);

        return adjustmentRepository.save(entity);
    }

    private CoastalStationAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản đài với id: " + id));
    }

    private String generateAssetCode(String requestedCode, String assetType) {
        if (requestedCode != null && !requestedCode.isBlank() && repository.findByAssetCode(requestedCode.trim()).isEmpty()) {
            return requestedCode.trim();
        }
        String prefix = "TS-TTDH-";
        if (assetType != null && assetType.toLowerCase(Locale.ROOT).contains("inmarsat")) {
            prefix = "TS-INM-";
        }
        String code;
        do {
            code = prefix + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private void copyEditableFields(CoastalStationAssetRequest source, CoastalStationAsset target) {
        BeanUtils.copyProperties(source, target, "assetCode", "status", "approvalStatus",
                "remainingValue", "createdAt", "createdBy", "updatedAt", "updatedBy");
        if (source.getStatus() != null && !source.getStatus().isBlank()) {
            target.setStatus(source.getStatus());
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

    private void calculateValues(CoastalStationAsset entity) {
        BigDecimal original = entity.getOriginalValue() == null ? BigDecimal.ZERO : entity.getOriginalValue();
        BigDecimal accumulated = entity.getAccumulatedDepreciation() == null ? BigDecimal.ZERO : entity.getAccumulatedDepreciation();
        entity.setAccumulatedDepreciation(accumulated);
        entity.setRemainingValue(original.subtract(accumulated).max(BigDecimal.ZERO));
        if (entity.getMonthlyDepreciation() == null && entity.getDepreciationMonths() != null && entity.getDepreciationMonths() > 0) {
            entity.setMonthlyDepreciation(original.divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2, RoundingMode.HALF_UP));
        }
    }

    private CoastalStationAssetResponse toResponse(CoastalStationAsset entity) {
        CoastalStationAssetResponse response = CoastalStationAssetResponse.builder().build();
        BeanUtils.copyProperties(entity, response);
        response.setApprovalStatus(entity.getApprovalStatus() == null ? null : entity.getApprovalStatus().name());

        UUID targetStationId = entity.getStationId();
        if (targetStationId == null) {
            targetStationId = entity.getDaiTtdhId() != null ? entity.getDaiTtdhId() : entity.getInmarsatId();
        }

        if (targetStationId != null) {
            final UUID sid = targetStationId;
            daiTtdhRepository.findById(sid).ifPresentOrElse(
                d -> {
                    response.setStationCode(d.getDaiTtdhCode());
                    response.setStationName(d.getDaiTtdhName());
                },
                () -> inmarsatRepository.findById(sid).ifPresent(inm -> {
                    response.setStationCode(inm.getCode() != null ? inm.getCode() : inm.getDeviceCode());
                    response.setStationName(inm.getName() != null ? inm.getName() : inm.getStationName());
                })
            );
        }

        response.setUpdatedByName(userResolverService.resolveName(entity.getUpdatedBy()));
        response.setSubmittedByName(userResolverService.resolveName(entity.getSubmittedBy()));
        response.setPortAuthorityApprovedByName(userResolverService.resolveName(entity.getPortAuthorityApprovedBy()));
        response.setDepartmentApprovedByName(userResolverService.resolveName(entity.getDepartmentApprovedBy()));
        return response;
    }

    // ── Attachment methods ──────────────────────────────────────────────

    @Transactional
    public List<InfraAssetAttachmentResponse> uploadAttachments(UUID assetId, List<MultipartFile> files, UUID userId) {
        CoastalStationAsset asset = requireAsset(assetId);
        Path basePath = Paths.get(attachmentPath).toAbsolutePath().normalize();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;
            try {
                Path dir = basePath.resolve("COASTAL_STATION_ASSET").resolve(assetId.toString());
                Files.createDirectories(dir);
                Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
            }
            String storagePath = basePath.resolve("COASTAL_STATION_ASSET").resolve(assetId.toString()).resolve(storageFileName).toString();

            Attachment attachment = new Attachment();
            attachment.setEntityType("COASTAL_STATION_ASSET");
            attachment.setEntityId(assetId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(storagePath);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedBy(userId);
            attachmentRepository.save(attachment);
        }

        List<Attachment> allAttachments = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("COASTAL_STATION_ASSET", assetId);
        String mergedNames = allAttachments.stream()
                .map(a -> a.getFileName())
                .collect(Collectors.joining(", "));
        asset.setAttachmentName(mergedNames);
        repository.save(asset);

        return allAttachments.stream().map(this::toAttachmentResponse).collect(Collectors.toList());
    }

    public List<InfraAssetAttachmentResponse> listAttachments(UUID assetId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("COASTAL_STATION_ASSET", assetId)
                .stream().map(this::toAttachmentResponse).collect(Collectors.toList());
    }

    public Attachment getAttachment(UUID assetId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(assetId) || !"COASTAL_STATION_ASSET".equalsIgnoreCase(attachment.getEntityType())) {
            throw new IllegalArgumentException("File không thuộc tài sản này");
        }
        return attachment;
    }

    @Transactional
    public void deleteAttachment(UUID assetId, UUID attachmentId, UUID userId) {
        CoastalStationAsset asset = requireAsset(assetId);
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(assetId)) {
            throw new IllegalArgumentException("File không thuộc tài sản này");
        }
        try {
            Files.deleteIfExists(Paths.get(attachment.getFilePath()));
        } catch (Exception ignored) {
        }
        attachmentRepository.delete(attachment);

        List<Attachment> remaining = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("COASTAL_STATION_ASSET", assetId);
        String mergedNames = remaining.isEmpty() ? null
                : remaining.stream().map(a -> a.getFileName()).collect(Collectors.joining(", "));
        asset.setAttachmentName(mergedNames);
        repository.save(asset);
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
}
