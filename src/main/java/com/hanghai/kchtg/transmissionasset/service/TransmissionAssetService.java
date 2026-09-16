package com.hanghai.kchtg.transmissionasset.service;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
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
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.transmission.repository.TransmissionRepository;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAdjustmentRequest;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAssetRequest;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionAssetResponse;
import com.hanghai.kchtg.transmissionasset.dto.TransmissionExploitationRequest;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAsset;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetAdjustment;
import com.hanghai.kchtg.transmissionasset.entity.TransmissionAssetExploitation;
import com.hanghai.kchtg.transmissionasset.repository.TransmissionAssetAdjustmentRepository;
import com.hanghai.kchtg.transmissionasset.repository.TransmissionAssetExploitationRepository;
import com.hanghai.kchtg.transmissionasset.repository.TransmissionAssetRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtsassist.repository.VtsAssistRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TransmissionAssetService {

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    private final TransmissionAssetRepository repository;
    private final TransmissionAssetExploitationRepository exploitationRepository;
    private final TransmissionAssetAdjustmentRepository adjustmentRepository;
    private final TransmissionRepository transmissionRepository;
    private final VtsAssistRepository vtsAssistRepository;
    private final AttachmentRepository attachmentRepository;
    private final UserResolverService userResolverService;
    private final ChangeTrackingService changeTrackingService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final OrgUnitCacheService orgUnitCacheService;

    @Transactional
    public TransmissionAssetResponse create(TransmissionAssetRequest request) {
        TransmissionAsset entity = new TransmissionAsset();
        copyEditableFields(request, entity);
        if (request.getAssetType() != null && !request.getAssetType().isBlank()) {
            entity.setAssetType(request.getAssetType());
        } else if (entity.getAssetType() == null || entity.getAssetType().isBlank()) {
            entity.setAssetType("Tài sản HT truyền dẫn");
        }
        entity.setAssetCode(generateAssetCode(request.getAssetCode(), entity.getAssetType()));
        calculateValues(entity);
        return toResponse(repository.save(entity));
    }

    public TransmissionAssetResponse getById(UUID id) {
        return toResponse(requireAsset(id));
    }

    public Page<TransmissionAssetResponse> findAll(String assetCode, String assetName, UUID parentOrgUnitId,
                                                   UUID orgUnitId, UUID usingOrgUnitId, UUID transmissionId,
                                                   String assetCondition, String approvalStatus, String assetType,
                                                   LocalDate updatedFrom, LocalDate updatedTo, Pageable pageable) {
        Specification<TransmissionAsset> specification = (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (assetCode != null && !assetCode.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetCode")), "%" + assetCode.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (assetName != null && !assetName.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("assetName")), "%" + assetName.trim().toLowerCase(Locale.ROOT) + "%"));
            }
            if (parentOrgUnitId != null) predicates.add(cb.equal(root.get("parentOrgUnitId"), parentOrgUnitId));
            if (orgUnitId != null) predicates.add(cb.equal(root.get("orgUnitId"), orgUnitId));
            if (usingOrgUnitId != null) predicates.add(cb.equal(root.get("usingOrgUnitId"), usingOrgUnitId));
            if (transmissionId != null) predicates.add(cb.equal(root.get("transmissionId"), transmissionId));
            if (assetCondition != null && !assetCondition.isBlank()) predicates.add(cb.equal(root.get("assetCondition"), assetCondition));
            if (assetType != null && !assetType.isBlank()) predicates.add(cb.equal(root.get("assetType"), assetType.trim()));
            if (approvalStatus != null && !approvalStatus.isBlank()) {
                String upper = approvalStatus.trim().toUpperCase(Locale.ROOT);
                if ("ARCHIVED".equals(upper) || "DELETED".equals(upper) || "DA_XOA".equals(upper)) {
                    predicates.add(cb.or(
                        cb.isNotNull(root.get("deletedAt")),
                        cb.equal(root.get("approvalStatus"), ApprovalStatus.ARCHIVED)
                    ));
                } else {
                    predicates.add(cb.isNull(root.get("deletedAt")));
                    predicates.add(cb.notEqual(root.get("approvalStatus"), ApprovalStatus.ARCHIVED));
                    try {
                        predicates.add(cb.equal(root.get("approvalStatus"), ApprovalStatus.fromString(approvalStatus)));
                    } catch (IllegalArgumentException ignored) {}
                }
            } else {
                predicates.add(cb.isNull(root.get("deletedAt")));
                predicates.add(cb.notEqual(root.get("approvalStatus"), ApprovalStatus.ARCHIVED));
            }
            if (updatedFrom != null) predicates.add(cb.greaterThanOrEqualTo(root.get("updatedAt"), updatedFrom.atStartOfDay()));
            if (updatedTo != null) predicates.add(cb.lessThan(root.get("updatedAt"), updatedTo.plusDays(1).atStartOfDay()));
            return cb.and(predicates.toArray(Predicate[]::new));
        };
        return repository.findAll(specification, pageable).map(this::toResponse);
    }

    @Transactional
    public TransmissionAssetResponse update(UUID id, TransmissionAssetRequest request) {
        TransmissionAsset entity = requireAsset(id);
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

        TransmissionAsset oldEntity = new TransmissionAsset();
        BeanUtils.copyProperties(entity, oldEntity);

        String assetCode = entity.getAssetCode();
        copyEditableFields(request, entity);
        entity.setAssetCode(assetCode);
        calculateValues(entity);
        TransmissionAsset saved = repository.save(entity);

        if (wasApproved) {
            String actorId = SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : "system";
            changeTrackingService.recordChanges("TRANSMISSION", id.toString(), actorId, oldEntity, saved);
        }

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        TransmissionAsset entity = requireAsset(id);
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT && entity.getApprovalStatus() != ApprovalStatus.PROPOSED) {
            throw new IllegalStateException("Chỉ có thể xóa hồ sơ ở trạng thái Lưu tạm");
        }
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        entity.softDelete(currentUserId);
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repository.save(entity);

        InfrastructureHistoryUtils.recordSoftDelete(historyRepository, id, InfrastructureType.TRANSMISSION, currentUserId, "Xóa tài sản hệ thống truyền dẫn");
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        TransmissionAsset entity = requireAsset(id);
        if (entity.getApprovalStatus() == ApprovalStatus.DRAFT) {
            return java.util.Map.of("changeHistory", java.util.Collections.emptyList());
        }
        String entityId = id.toString();
        String entityType = "TransmissionAsset";

        List<InfrastructureHistory> list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.TRANSMISSION, id);

        java.util.Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());

        java.util.Map<UUID, User> userMap = userIds.isEmpty() ? java.util.Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        List<java.util.Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    java.util.Map<String, Object> m = new java.util.HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("refId", h.getRefId());
                    m.put("refType", h.getRefType());
                    m.put("status", h.getStatus() != null ? h.getStatus().name() : null);
                    m.put("fieldName", h.getChangedField() != null ? h.getChangedField() : "Trạng thái");
                    m.put("changedField", h.getChangedField() != null ? h.getChangedField() : "Trạng thái");
                    m.put("oldValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("previousValue", h.getPreviousValue());
                    m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
                    User u = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
                    String actorName = u != null && u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : (u != null ? u.getUsername() : (h.getApprovedBy() != null ? h.getApprovedBy().toString() : "Hệ thống"));
                    String orgUnitName = "";
                    if (u != null && u.getOrgUnit() != null) {
                        try {
                            orgUnitName = orgUnitCacheService.getName(u.getOrgUnit().getId());
                            if (orgUnitName == null || orgUnitName.isBlank()) {
                                orgUnitName = u.getOrgUnit().getName();
                            }
                        } catch (Exception e) {
                            orgUnitName = "";
                        }
                    }
                    m.put("changedBy", actorName);
                    m.put("approvedBy", actorName);
                    m.put("approvedByName", actorName);
                    m.put("actorName", actorName);
                    m.put("orgUnitName", orgUnitName != null ? orgUnitName : "");
                    m.put("unitName", orgUnitName != null ? orgUnitName : "");
                    if (u != null && u.getOrgUnit() != null) {
                        try {
                            m.put("userOrgUnitId", u.getOrgUnit().getId().toString());
                        } catch (Exception ignored) {}
                    }
                    m.put("changedAt", h.getApprovedDate());
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("reason", h.getReason());
                    return m;
                })
                .toList();

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("changeHistory", changeHistory);
        return result;
    }

    // --- Exploitations (Tab 4) ---
    public List<TransmissionAssetExploitation> getExploitations(UUID assetId) {
        requireAsset(assetId);
        return exploitationRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }

    @Transactional
    public TransmissionAssetExploitation addExploitation(UUID assetId, TransmissionExploitationRequest request) {
        requireAsset(assetId);
        TransmissionAssetExploitation entity = new TransmissionAssetExploitation();
        BeanUtils.copyProperties(request, entity);
        entity.setAssetId(assetId);
        return exploitationRepository.save(entity);
    }

    // --- Adjustments (Tab 5) ---
    public List<TransmissionAssetAdjustment> getAdjustments(UUID assetId, String type) {
        requireAsset(assetId);
        if (type != null && !type.isBlank()) {
            return adjustmentRepository.findByAssetIdAndAdjustmentTypeOrderByCreatedAtDesc(assetId, type.toUpperCase(Locale.ROOT));
        }
        return adjustmentRepository.findByAssetIdOrderByCreatedAtDesc(assetId);
    }

    @Transactional
    public TransmissionAssetAdjustment addAdjustment(UUID assetId, TransmissionAdjustmentRequest request) {
        TransmissionAsset asset = requireAsset(assetId);
        TransmissionAssetAdjustment entity = new TransmissionAssetAdjustment();
        BeanUtils.copyProperties(request, entity);
        entity.setAssetId(assetId);
        entity.setStatus("CHO_PHE_DUYET");
        entity.setSubmittedBy(SecurityUtils.getCurrentUserId());
        entity.setSubmittedAt(Instant.now());

        // Update asset values if adjustment is approved or tracked
        if (request.getOriginalValueAfter() != null) {
            asset.setOriginalValue(request.getOriginalValueAfter());
        }
        if (request.getRemainingValueAfter() != null) {
            asset.setRemainingValue(request.getRemainingValueAfter());
        }
        repository.save(asset);

        return adjustmentRepository.save(entity);
    }

    private TransmissionAsset requireAsset(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản HT truyền dẫn với id: " + id));
    }

    private String generateAssetCode(String requestedCode, String assetType) {
        if (requestedCode != null && !requestedCode.isBlank() && repository.findByAssetCode(requestedCode.trim()).isEmpty()) {
            return requestedCode.trim();
        }
        String prefix = "TS-TD-";
        if (assetType != null) {
            if (assetType.toLowerCase(Locale.ROOT).contains("vhf")) {
                prefix = "TS-VHF-";
            } else if (assetType.toLowerCase(Locale.ROOT).contains("vts")) {
                prefix = "TS-VTS-";
            }
        }
        String code;
        do {
            code = prefix + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT);
        } while (repository.findByAssetCode(code).isPresent());
        return code;
    }

    private void copyEditableFields(TransmissionAssetRequest source, TransmissionAsset target) {
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

    private void calculateValues(TransmissionAsset entity) {
        BigDecimal original = entity.getOriginalValue() == null ? BigDecimal.ZERO : entity.getOriginalValue();
        BigDecimal accumulated = entity.getAccumulatedDepreciation() == null ? BigDecimal.ZERO : entity.getAccumulatedDepreciation();
        entity.setAccumulatedDepreciation(accumulated);
        entity.setRemainingValue(original.subtract(accumulated).max(BigDecimal.ZERO));
        if (entity.getMonthlyDepreciation() == null && entity.getDepreciationMonths() != null && entity.getDepreciationMonths() > 0) {
            entity.setMonthlyDepreciation(original.divide(BigDecimal.valueOf(entity.getDepreciationMonths()), 2, RoundingMode.HALF_UP));
        }
    }

    private TransmissionAssetResponse toResponse(TransmissionAsset entity) {
        TransmissionAssetResponse response = TransmissionAssetResponse.builder().build();
        BeanUtils.copyProperties(entity, response);
        response.setApprovalStatus(entity.getApprovalStatus() == null ? null : entity.getApprovalStatus().name());

        if (entity.getTransmissionId() != null) {
            transmissionRepository.findById(entity.getTransmissionId()).ifPresentOrElse(
                t -> {
                    response.setTransmissionCode(t.getDeviceCode());
                    response.setTransmissionName(t.getDeviceName());
                },
                () -> vtsAssistRepository.findById(entity.getTransmissionId()).ifPresent(v -> {
                    response.setTransmissionCode(v.getDeviceCode());
                    response.setTransmissionName(v.getDeviceName());
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
        TransmissionAsset asset = requireAsset(assetId);
        Path basePath = Paths.get(attachmentPath).toAbsolutePath().normalize();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;
            try {
                Path dir = basePath.resolve("TRANSMISSION_ASSET").resolve(assetId.toString());
                Files.createDirectories(dir);
                Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
            }
            String storagePath = basePath.resolve("TRANSMISSION_ASSET").resolve(assetId.toString()).resolve(storageFileName).toString();

            Attachment attachment = new Attachment();
            attachment.setEntityType("TRANSMISSION_ASSET");
            attachment.setEntityId(assetId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(storagePath);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedBy(userId);
            attachmentRepository.save(attachment);
        }

        List<Attachment> allAttachments = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("TRANSMISSION_ASSET", assetId);
        String mergedNames = allAttachments.stream()
                .filter(Objects::nonNull)
                .map(att -> att.getFileName())
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));
        asset.setAttachmentName(mergedNames);
        repository.save(asset);

        return allAttachments.stream()
                .filter(Objects::nonNull)
                .map(att -> toAttachmentResponse(att))
                .collect(Collectors.toList());
    }

    public List<InfraAssetAttachmentResponse> listAttachments(UUID assetId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("TRANSMISSION_ASSET", assetId)
                .stream()
                .filter(Objects::nonNull)
                .map(att -> toAttachmentResponse(att))
                .collect(Collectors.toList());
    }

    public Attachment getAttachment(UUID assetId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(assetId) || !"TRANSMISSION_ASSET".equalsIgnoreCase(attachment.getEntityType())) {
            throw new IllegalArgumentException("File không thuộc tài sản này");
        }
        return attachment;
    }

    @Transactional
    public void deleteAttachment(UUID assetId, UUID attachmentId, UUID userId) {
        TransmissionAsset asset = requireAsset(assetId);
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

        List<Attachment> remaining = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("TRANSMISSION_ASSET", assetId);
        String mergedNames = remaining.isEmpty() ? null
                : remaining.stream()
                        .filter(Objects::nonNull)
                        .map(att -> att.getFileName())
                        .filter(Objects::nonNull)
                        .collect(Collectors.joining(", "));
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
