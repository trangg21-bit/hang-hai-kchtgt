package com.hanghai.kchtg.dikerevetment.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.EntityUpdateUtils;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.dikerevetment.dto.*;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentAttachment;
import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentType;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentAttachmentRepository;
import com.hanghai.kchtg.dikerevetment.repository.DikeRevetmentRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemAttachmentResponse;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.multipart.MultipartFile;

import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Service for DikeRevetment (F-044 to F-049) complying with M-1006 2-level approval architecture.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DikeRevetmentService {

    private final DikeRevetmentRepository repo;
    private final DikeRevetmentAttachmentRepository attachmentRepo;
    private final InfrastructureHistoryRepository approvalHistoryRepo;
    private final InfrastructureApprovalService approvalService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final UserResolverService userResolverService;
    private final InfrastructureAttachmentRepository attachmentRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final int MAX_ATTACHMENTS = 10;
    private static final long MAX_ATTACHMENT_SIZE = 20L * 1024 * 1024;
    private static final List<String> ALLOWED_ATTACHMENT_TYPES = List.of(
            "application/pdf", "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg", "image/png", "image/gif", "image/tiff", "image/tif");
    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "gif", "tiff", "tif");

    private Scope resolveEffectiveScope(UUID explicitOrgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (explicitOrgUnitId == null) {
            return userScope;
        }
        if (!userScope.allows(explicitOrgUnitId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập dữ liệu của đơn vị này");
        }
        return userScope;
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        if (orgUnitId != null && !orgUnitScopeService.currentUserScope().allows(orgUnitId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền thao tác trên đơn vị này");
        }
    }

    @Transactional
    public DikeRevetmentResponse create(DikeRevetmentCreateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);
        validateAllowedOrgUnit(req.getOrgUnitId());

        String code = req.getCode() != null && !req.getCode().trim().isEmpty()
                ? req.getCode().trim()
                : generateDikeRevetmentCode();

        DikeRevetment dr = DikeRevetment.builder()
                .dikeRevetmentType(req.getDikeRevetmentType())
                .location(req.getLocation())
                .locationDetail(req.getLocationDetail())
                .dikeRevetmentName(req.getDikeRevetmentName())
                .code(code)
                .seaportId(req.getSeaportId())
                .operatingUnitId(req.getOperatingUnitId())
                .length(req.getLength())
                .crestElevation(req.getCrestElevation())
                .commissioningDate(req.getCommissioningDate())
                .height(req.getHeight())
                .surfaceMaterial(req.getSurfaceMaterial())
                .status(req.getStatus() != null ? req.getStatus() : "1")
                .note(req.getNote())
                .orgUnitId(req.getOrgUnitId())
                .symbolId(req.getSymbolId())
                .approvalStatus(ApprovalStatus.DRAFT)
                .createdBy(userId)
                .build();

        dr = repo.save(dr);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    dr.getDikeRevetmentName(),
                    dr.getCode(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    dr.getId(),
                    InfrastructureType.DIKE_REVETMENT
            );
            dr.setSpatialId(spatialObj.getId());
            dr = repo.save(dr);
        }

        // UC8 (approval-2-level-spec.md Mục 5): KHÔNG ghi nhật ký khi tạo Nháp/Lưu tạm —
        // Lịch sử chỉ phản ánh các thay đổi của hồ sơ ĐÃ DUYỆT (và mốc duyệt qua approvalService).

        return toResponse(dr);
    }

    @Transactional(readOnly = true)
    public DikeRevetmentResponse getById(UUID id) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        if (dr.getDeletedAt() != null || dr.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Đê kè đã bị xóa hoặc lưu trữ");
        }
        return toResponse(dr);
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentResponse> findAll(int page, int size) {
        Scope scope = resolveEffectiveScope(null);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));
        return repo.searchPaged(
                !scope.unrestricted(), scope.orgUnitIds(),
                null, null, null, null, null, null, null,
                null, null, null, null, null, null,
                pageable)
                .map(this::toResponse)
                .getContent();
    }

    @Transactional(readOnly = true)
    public Page<DikeRevetmentResponse> searchPaged(UUID orgUnitId, String keyword, UUID seaportId,
                                                   DikeRevetmentType dikeRevetmentType, String conditionStatus,
                                                   ApprovalStatus approvalStatus, UUID updatedBy,
                                                   LocalDateTime updatedFrom, LocalDateTime updatedTo,
                                                   String code, String location, Integer commissioningYear,
                                                   Pageable pageable) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        String codePattern = (code != null && !code.trim().isEmpty())
                ? "%" + code.trim().toLowerCase() + "%"
                : null;
        String locationValue = (location != null && !location.trim().isEmpty()) ? location.trim() : null;
        LocalDate commissioningFrom = null;
        LocalDate commissioningTo = null;
        if (commissioningYear != null) {
            commissioningFrom = LocalDate.of(commissioningYear, 1, 1);
            commissioningTo = LocalDate.of(commissioningYear, 12, 31);
        }
        return repo.searchPaged(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern,
                seaportId, dikeRevetmentType, conditionStatus, approvalStatus,
                updatedBy, updatedFrom, updatedTo,
                codePattern, locationValue, commissioningFrom, commissioningTo, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts(UUID orgUnitId, String keyword, String conditionStatus) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;
        List<Object[]> rows = repo.countByApprovalStatus(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId, keywordPattern, conditionStatus);

        Map<String, Long> counts = new HashMap<>();
        counts.put("", 0L);
        counts.put("DRAFT", 0L);
        counts.put("PENDING_APPROVAL", 0L);
        counts.put("APPROVED_LEVEL1", 0L);
        counts.put("REJECTED", 0L);
        counts.put("APPROVED", 0L);

        long total = 0L;
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            ApprovalStatus st = (ApprovalStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;
            switch (st) {
                case DRAFT, PROPOSED -> counts.put("DRAFT", counts.get("DRAFT") + count);
                case PENDING_APPROVAL -> counts.put("PENDING_APPROVAL", counts.get("PENDING_APPROVAL") + count);
                case APPROVED_LEVEL1 -> counts.put("APPROVED_LEVEL1", counts.get("APPROVED_LEVEL1") + count);
                case REJECTED_LEVEL1, REJECTED_LEVEL2, REJECTED -> counts.put("REJECTED", counts.get("REJECTED") + count);
                case APPROVED, APPROVED_LEVEL2 -> counts.put("APPROVED", counts.get("APPROVED") + count);
                default -> {}
            }
        }
        counts.put("", total);
        return counts;
    }

    @Transactional(readOnly = true)
    public List<DikeRevetmentOptionResponse> getOptions(UUID orgUnitId) {
        return repo.findAllApprovedOptions(orgUnitId).stream()
                .map(dr -> DikeRevetmentOptionResponse.builder()
                        .id(dr.getId())
                        .code(dr.getCode())
                        .dikeRevetmentName(dr.getDikeRevetmentName())
                        .orgUnitId(dr.getOrgUnitId())
                        .seaportId(dr.getSeaportId())
                        .build())
                .toList();
    }

    @Transactional
    public DikeRevetmentResponse update(UUID id, DikeRevetmentUpdateRequest req, UUID userId) {
        FieldWriteGuard.validateObject(req);
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));

        if (dr.getDeletedAt() != null || dr.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Không thể chỉnh sửa đê kè đã bị xóa hoặc lưu trữ");
        }

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(dr);

        validateAllowedOrgUnit(dr.getOrgUnitId());
        if (req.getOrgUnitId() != null && !req.getOrgUnitId().equals(dr.getOrgUnitId())) {
            validateAllowedOrgUnit(req.getOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = dr.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        // Chụp trạng thái GIS cũ để ghi lịch sử khác biệt (chuẩn /vts-operation-center)
        String oldCoordinates = null;
        GisGeometryType oldGeometryType = null;
        if (dr.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(dr.getSpatialId());
            if (spatialOpt.isPresent()) {
                oldCoordinates = spatialOpt.get().getCoordinates();
                oldGeometryType = spatialOpt.get().getGeometryType();
            }
        }

        // Áp dụng TƯỜNG MINH từng trường: request có giá trị mới khác cũ → gán entity + ghi CŨ vào map
        Map<String, String> previousValues = new LinkedHashMap<>();
        applyIfChanged("dikeRevetmentName", dr.getDikeRevetmentName(), req.getDikeRevetmentName(), dr::setDikeRevetmentName, previousValues);
        applyIfChanged("dikeRevetmentType", dr.getDikeRevetmentType(), req.getDikeRevetmentType(), dr::setDikeRevetmentType, previousValues);
        applyIfChanged("location", dr.getLocation(), req.getLocation(), dr::setLocation, previousValues);
        applyIfChanged("locationDetail", dr.getLocationDetail(), req.getLocationDetail(), dr::setLocationDetail, previousValues);
        applyIfChanged("seaportId", dr.getSeaportId(), req.getSeaportId(), dr::setSeaportId, previousValues);
        applyIfChanged("operatingUnitId", dr.getOperatingUnitId(), req.getOperatingUnitId(), dr::setOperatingUnitId, previousValues);
        applyIfChanged("length", dr.getLength(), req.getLength(), dr::setLength, previousValues);
        applyIfChanged("height", dr.getHeight(), req.getHeight(), dr::setHeight, previousValues);
        applyIfChanged("crestElevation", dr.getCrestElevation(), req.getCrestElevation(), dr::setCrestElevation, previousValues);
        applyIfChanged("commissioningDate", dr.getCommissioningDate(), req.getCommissioningDate(), dr::setCommissioningDate, previousValues);
        applyIfChanged("surfaceMaterial", dr.getSurfaceMaterial(), req.getSurfaceMaterial(), dr::setSurfaceMaterial, previousValues);
        applyIfChanged("status", dr.getStatus(), req.getStatus(), dr::setStatus, previousValues);
        applyIfChanged("note", dr.getNote(), req.getNote(), dr::setNote, previousValues);
        applyIfChanged("orgUnitId", dr.getOrgUnitId(), req.getOrgUnitId(), dr::setOrgUnitId, previousValues);
        applyIfChanged("symbolId", dr.getSymbolId(), req.getSymbolId(), dr::setSymbolId, previousValues);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()
                && !Objects.equals(req.getCoordinates().trim(), oldCoordinates != null ? oldCoordinates.trim() : null)) {
            previousValues.put("coordinates", oldCoordinates != null ? oldCoordinates : "Chưa có");
        }
        if (req.getGeometryType() != null && req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()
                && !Objects.equals(req.getGeometryType(), oldGeometryType)) {
            previousValues.put("geometryType", oldGeometryType != null ? oldGeometryType.name() : "Chưa có");
        }

        if (wasApproved) {
            dr.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        dr.setUpdatedBy(userId);
        DikeRevetment saved = repo.save(dr);

        if (req.getCoordinates() != null && !req.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = req.getGeometryType() != null ? req.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    dr.getSpatialId(),
                    dr.getDikeRevetmentName(),
                    dr.getCode(),
                    geomType,
                    objType,
                    req.getCoordinates(),
                    dr.getId(),
                    InfrastructureType.DIKE_REVETMENT
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repo.save(saved);
        }

        // Chuẩn /vts-operation-center: mỗi trường thay đổi = 1 dòng history (tên trường + giá trị cũ/mới)
        if (wasApproved) {
            if (!previousValues.isEmpty()) {
            for (Map.Entry<String, String> entry : previousValues.entrySet()) {
                String field = entry.getKey();
                String fieldName = getFieldDisplayName(field);
                String oldVal = entry.getValue() != null ? entry.getValue() : "";
                Object rawNew;
                if ("coordinates".equals(field)) {
                    rawNew = req.getCoordinates();
                } else if ("geometryType".equals(field)) {
                    rawNew = req.getGeometryType() != null ? req.getGeometryType().name() : null;
                } else {
                    rawNew = getEntityFieldValue(saved, field);
                }
                String newVal = rawNew != null ? String.valueOf(rawNew) : null;
                approvalHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.DIKE_REVETMENT)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(userId)
                        .changedField(fieldName)
                        .previousValue(oldVal)
                        .newValue(newVal)
                        .reason("Cập nhật thông tin " + fieldName)
                        .build());
            }
            } else {
                // Fallback: luôn ghi ít nhất 1 dòng khi sửa hồ sơ Đã duyệt (kể cả khi không bắt được diff)
                approvalHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.DIKE_REVETMENT)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(userId)
                        .reason("Cập nhật sau phê duyệt")
                        .build());
            }
        }

        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id, UUID userId) {
        DikeRevetment dr = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));

        validateAllowedOrgUnit(dr.getOrgUnitId());

        InfrastructureHistoryUtils.recordSoftDelete(approvalHistoryRepo, dr.getId(), InfrastructureType.DIKE_REVETMENT, userId, "Xóa đê kè");
        dr.setDeletedAt(LocalDateTime.now());
        dr.setDeletedBy(userId);
        dr.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repo.save(dr);
    }

    @Transactional
    public DikeRevetmentResponse submitForApproval(UUID id, UUID userId) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.DIKE_REVETMENT, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse approveLevel1(UUID id, UUID userId, String note) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.DIKE_REVETMENT, "APPROVED", note, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse approveLevel2(UUID id, UUID userId, String note) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.DIKE_REVETMENT, "APPROVED", note, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse rejectLevel1(UUID id, UUID userId, String reason) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.DIKE_REVETMENT, "REJECTED", reason, userId);
        return toResponse(repo.save(entity));
    }

    @Transactional
    public DikeRevetmentResponse rejectLevel2(UUID id, UUID userId, String reason) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.DIKE_REVETMENT, "REJECTED", reason, userId);
        return toResponse(repo.save(entity));
    }

    public String generateDikeRevetmentCode() {
        String maxCode = repo.findMaxCode();
        if (maxCode != null && maxCode.startsWith("DK-")) {
            try {
                int seq = Integer.parseInt(maxCode.substring(3));
                return String.format("DK-%06d", seq + 1);
            } catch (NumberFormatException ignored) {
                // Mã cũ không đúng số — rơi xuống bắt đầu chuẩn bên dưới.
            }
        }
        // Chuẩn mã đê kè: DK- + 6 chữ số (DK-000001, DK-000002, ...).
        return "DK-000001";
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        return getHistory(id, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
        return getHistory(id, page, pageSize, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
            LocalDateTime fromDate, LocalDateTime toDate) {
        List<InfrastructureHistory> historyList;
        if (page != null && pageSize != null && pageSize > 0) {
            Pageable pageable = PageRequest.of(page, pageSize);
            String normalizedKeyword = normalizeSearchKeyword(keyword);
            if (normalizedKeyword == null && fromDate == null && toDate == null) {
                historyList = approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.DIKE_REVETMENT, id, pageable);
            } else {
                historyList = approvalHistoryRepo.searchHistory(InfrastructureType.DIKE_REVETMENT, id, normalizedKeyword,
                        fromDate, toDate, pageable);
            }
        } else {
            historyList = approvalHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                    InfrastructureType.DIKE_REVETMENT, id);
        }
        Map<UUID, String> userNameMap = new HashMap<>();
        for (InfrastructureHistory h : historyList) {
            if (h.getApprovedBy() != null) {
                userNameMap.putIfAbsent(h.getApprovedBy(), userResolverService.resolveName(h.getApprovedBy()));
            }
        }
        return historyList.stream().map(h -> HistoryEntry.builder()
                .id(h.getId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approvedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null)
                .orgUnitName(null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .changedField(h.getChangedField())
                .previousValue(h.getPreviousValue())
                .newValue(h.getNewValue())
                .build())
                .toList();
    }

    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return null;
        return Normalizer.normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    private <T> void applyIfChanged(String field, T oldVal, T newVal, java.util.function.Consumer<T> setter,
            Map<String, String> previousValues) {
        if (newVal == null) return; // null = không gửi trường này khi update
        if (Objects.equals(newVal, oldVal)) return; // giá trị không đổi
        previousValues.put(field, oldVal != null ? String.valueOf(oldVal) : "Chưa có");
        setter.accept(newVal);
    }

    private String getFieldDisplayName(String field) {
        if (DikeRevetment.Fields.code.equals(field)) return "Mã đê kè";
        if (DikeRevetment.Fields.dikeRevetmentName.equals(field)) return "Tên đê kè";
        if (DikeRevetment.Fields.dikeRevetmentType.equals(field)) return "Loại kết cấu công trình";
        if (DikeRevetment.Fields.location.equals(field)) return "Địa điểm (Tỉnh/TP)";
        if (DikeRevetment.Fields.locationDetail.equals(field)) return "Địa điểm chi tiết";
        if (DikeRevetment.Fields.seaportId.equals(field)) return "Thuộc cảng biển";
        if (DikeRevetment.Fields.operatingUnitId.equals(field)) return "Đơn vị vận hành";
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)) return "Đơn vị quản lý";
        if (DikeRevetment.Fields.length.equals(field)) return "Chiều dài (m)";
        if (DikeRevetment.Fields.height.equals(field)) return "Chiều cao (m)";
        if (DikeRevetment.Fields.crestElevation.equals(field)) return "Cao trình đỉnh (m)";
        if (DikeRevetment.Fields.commissioningDate.equals(field)) return "Thời điểm đưa vào khai thác";
        if (DikeRevetment.Fields.surfaceMaterial.equals(field)) return "Vật liệu bề mặt";
        if (DikeRevetment.Fields.status.equals(field)) return "Tình trạng";
        if (DikeRevetment.Fields.note.equals(field)) return "Ghi chú";
        if (DikeRevetment.Fields.symbolId.equals(field)) return "Biểu tượng bản đồ";
        if ("coordinates".equals(field)) return "Tọa độ GIS";
        if ("geometryType".equals(field)) return "Loại đối tượng (GIS)";
        return field;
    }

    private Object getEntityFieldValue(DikeRevetment entity, String field) {
        if (entity == null) return null;
        if (DikeRevetment.Fields.code.equals(field)) return entity.getCode();
        if (DikeRevetment.Fields.dikeRevetmentName.equals(field)) return entity.getDikeRevetmentName();
        if (DikeRevetment.Fields.dikeRevetmentType.equals(field)) return entity.getDikeRevetmentType();
        if (DikeRevetment.Fields.location.equals(field)) return entity.getLocation();
        if (DikeRevetment.Fields.locationDetail.equals(field)) return entity.getLocationDetail();
        if (DikeRevetment.Fields.seaportId.equals(field)) return entity.getSeaportId();
        if (DikeRevetment.Fields.operatingUnitId.equals(field)) return entity.getOperatingUnitId();
        if (BaseApprovableEntity.Fields.orgUnitId.equals(field)) return entity.getOrgUnitId();
        if (DikeRevetment.Fields.length.equals(field)) return entity.getLength();
        if (DikeRevetment.Fields.height.equals(field)) return entity.getHeight();
        if (DikeRevetment.Fields.crestElevation.equals(field)) return entity.getCrestElevation();
        if (DikeRevetment.Fields.commissioningDate.equals(field)) return entity.getCommissioningDate();
        if (DikeRevetment.Fields.surfaceMaterial.equals(field)) return entity.getSurfaceMaterial();
        if (DikeRevetment.Fields.status.equals(field)) return entity.getStatus();
        if (DikeRevetment.Fields.note.equals(field)) return entity.getNote();
        if (DikeRevetment.Fields.symbolId.equals(field)) return entity.getSymbolId();
        return null;
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }

    @Transactional
    public List<VtsSystemAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.assertEditable(entity);
        // Chuẩn /vts-operation-center: chỉ ghi nhật ký 'Tài liệu đính kèm' khi hồ sơ ĐÃ DUYỆT
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        Path dir = Paths.get(uploadDir, "dike_revetment", id.toString()).toAbsolutePath().normalize();
        try {
            Files.createDirectories(dir);
        } catch (IOException e) {
            throw new RuntimeException("Không thể tạo thư mục lưu trữ file", e);
        }
        long existing = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.DIKE_REVETMENT).size();
        String uploaderName = userId == null ? null : userResolverService.resolveName(userId);
        List<VtsSystemAttachmentResponse> uploaded = new ArrayList<>();
        for (MultipartFile f : files) {
            if (f.isEmpty()) continue;
            if (existing + uploaded.size() >= MAX_ATTACHMENTS) {
                throw new IllegalArgumentException("Số lượng tài liệu đính kèm tối đa là " + MAX_ATTACHMENTS + " tệp theo quy định");
            }
            validateAttachment(f);
            String originalFilename = Objects.requireNonNullElse(f.getOriginalFilename(), "file_" + System.currentTimeMillis());
            String safeName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String storedFileName = UUID.randomUUID() + "_" + safeName;
            Path filePath = dir.resolve(storedFileName).normalize();
            if (!filePath.startsWith(dir)) {
                throw new IllegalArgumentException("Tên tệp không hợp lệ");
            }
            try {
                Files.copy(f.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException e) {
                throw new RuntimeException("Không thể lưu file " + originalFilename, e);
            }
            InfrastructureAttachment attachment = InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .fileName(originalFilename)
                    .filePath(filePath.toString())
                    .fileSize(f.getSize())
                    .fileType(AttachmentFileType.fromValue(f.getContentType()))
                    .uploadedBy(userId)
                    .uploadedDate(LocalDateTime.now())
                    .build();
            InfrastructureAttachment saved = attachmentRepository.save(attachment);
            uploaded.add(toAttachmentResponse(saved, uploaderName));
            if (approvalHistoryRepo != null && wasApproved) {
                approvalHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(id)
                        .refType(InfrastructureType.DIKE_REVETMENT)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .reason("Tải lên tài liệu đính kèm: " + originalFilename)
                        .changedField("Tài liệu đính kèm")
                        .previousValue("—")
                        .newValue(originalFilename)
                        .build());
            }
        }
        return uploaded;
    }

    @Transactional(readOnly = true)
    public List<VtsSystemAttachmentResponse> listAttachments(UUID id) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        return loadAttachments(id);
    }

    private List<VtsSystemAttachmentResponse> loadAttachments(UUID id) {
        List<InfrastructureAttachment> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.DIKE_REVETMENT);
        return attachments.stream()
                .map(att -> toAttachmentResponse(att,
                        att.getUploadedBy() != null ? userResolverService.resolveName(att.getUploadedBy()) : null))
                .toList();
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attId, UUID userId) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.assertEditable(entity);
        InfrastructureAttachment att = attachmentRepository.findById(attId)
                .orElseThrow(() -> new RuntimeException("File đính kèm không tồn tại"));
        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.DIKE_REVETMENT) {
            throw new IllegalArgumentException("File đính kèm không thuộc đê kè này");
        }
        try {
            Files.deleteIfExists(Paths.get(att.getFilePath()));
        } catch (IOException ignored) {
        }
        attachmentRepository.delete(att);
        if (approvalHistoryRepo != null) {
            approvalHistoryRepo.save(InfrastructureHistory.builder()
                    .refId(id)
                    .refType(InfrastructureType.DIKE_REVETMENT)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .reason("Xóa tài liệu đính kèm: " + att.getFileName())
                    .changedField("Tài liệu đính kèm")
                    .previousValue(att.getFileName())
                    .newValue("—")
                    .build());
        }
    }

    public InfrastructureAttachment getAttachment(UUID id, UUID attId) {
        DikeRevetment entity = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đê kè với id: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        InfrastructureAttachment att = attachmentRepository.findById(attId)
                .orElseThrow(() -> new RuntimeException("File đính kèm không tồn tại"));
        if (!Objects.equals(att.getRefId(), id) || att.getRefType() != InfrastructureType.DIKE_REVETMENT) {
            throw new IllegalArgumentException("File đính kèm không thuộc đê kè này");
        }
        return att;
    }

    private void validateAttachment(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được để trống");
        }
        if (file.getSize() > MAX_ATTACHMENT_SIZE) {
            throw new IllegalArgumentException("Tài liệu đính kèm không được vượt quá 20MB theo quy định");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        boolean typeOk = ALLOWED_ATTACHMENT_TYPES.contains(contentType);
        String original = file.getOriginalFilename();
        boolean extOk = original != null && original.contains(".")
                && ALLOWED_EXTENSIONS.contains(original.substring(original.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT));
        if (!typeOk && !extOk) {
            throw new IllegalArgumentException("Định dạng tài liệu không được hỗ trợ (chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TIFF)");
        }
    }

    private VtsSystemAttachmentResponse toAttachmentResponse(InfrastructureAttachment att, String uploadedByName) {
        return VtsSystemAttachmentResponse.builder()
                .id(att.getId())
                .fileName(att.getFileName())
                .filePath(att.getFilePath())
                .fileSize(att.getFileSize())
                .documentType(att.getFileType() != null ? att.getFileType().name() : null)
                .uploadedBy(att.getUploadedBy())
                .uploadedByName(uploadedByName)
                .uploadedDate(att.getUploadedDate())
                .build();
    }

    private DikeRevetmentResponse toResponse(DikeRevetment dr) {
        String orgUnitName = dr.getOrgUnitId() != null
                ? orgUnitCacheService.getName(dr.getOrgUnitId())
                : null;
        String seaportName = dr.getSeaportId() != null
                ? portCacheService.getName(dr.getSeaportId())
                : null;
        String updatedByName = dr.getUpdatedBy() != null
                ? userResolverService.resolveName(dr.getUpdatedBy())
                : null;
        String submittedByName = dr.getSubmittedBy() != null
                ? userResolverService.resolveName(dr.getSubmittedBy())
                : null;
        String approverNameLevel1 = dr.getApproverLevel1() != null
                ? userResolverService.resolveName(dr.getApproverLevel1())
                : null;
        String approverNameLevel2 = dr.getApproverLevel2() != null
                ? userResolverService.resolveName(dr.getApproverLevel2())
                : null;
        // Tọa độ/GIS được lưu ở bảng spatial — đọc ra để trả trong response (nếu thiếu mapping, UI không thấy dữ liệu)
        GisGeometryType geometryTypeOut = null;
        String coordinatesOut = null;
        if (dr.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialOut = gisSpatialObjectService.findById(dr.getSpatialId());
            if (spatialOut.isPresent()) {
                geometryTypeOut = spatialOut.get().getGeometryType();
                coordinatesOut = spatialOut.get().getCoordinates();
            }
        }

        return DikeRevetmentResponse.builder()
                .id(dr.getId())
                .dikeRevetmentType(dr.getDikeRevetmentType())
                .location(dr.getLocation())
                .locationDetail(dr.getLocationDetail())
                .dikeRevetmentName(dr.getDikeRevetmentName())
                .code(dr.getCode())
                .seaportId(dr.getSeaportId())
                .seaportName(seaportName)
                .operatingUnitId(dr.getOperatingUnitId())
                .length(dr.getLength())
                .crestElevation(dr.getCrestElevation())
                .commissioningDate(dr.getCommissioningDate())
                .height(dr.getHeight())
                .surfaceMaterial(dr.getSurfaceMaterial())
                .status(dr.getStatus())
                .note(dr.getNote())
                .orgUnitId(dr.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .approvalStatus(dr.getApprovalStatus())
                .isApprovedLevel1(dr.getApprovedDateLevel1() != null)
                .approverLevel1(dr.getApproverLevel1())
                .approvedByNameLevel1(approverNameLevel1)
                .approvedDateLevel1(dr.getApprovedDateLevel1() != null ? dr.getApprovedDateLevel1().toLocalDate() : null)
                .isApprovedLevel2(dr.getApprovedDateLevel2() != null)
                .approverLevel2(dr.getApproverLevel2())
                .approvedByNameLevel2(approverNameLevel2)
                .approvedDateLevel2(dr.getApprovedDateLevel2() != null ? dr.getApprovedDateLevel2().toLocalDate() : null)
                .approvalContentLevel1(dr.getLevel1ApprovalContent())
                .approvalContentLevel2(dr.getLevel2ApprovalContent())
                .rejectionReason(dr.getRejectionReason())
                .isDeleted(dr.getDeletedAt() != null)
                .createdAt(dr.getCreatedAt())
                .updatedAt(dr.getUpdatedAt())
                .createdBy(dr.getCreatedBy())
                .updatedBy(dr.getUpdatedBy())
                .updatedByName(updatedByName)
                .submittedBy(dr.getSubmittedBy())
                .submittedByName(submittedByName)
                .submittedAt(dr.getSubmittedAt())
                .deletedAt(dr.getDeletedAt())
                .deletedBy(dr.getDeletedBy())
                .spatialId(dr.getSpatialId())
                .geometryType(geometryTypeOut)
                .coordinates(coordinatesOut)
                .symbolId(dr.getSymbolId())
                .attachments(loadAttachments(dr.getId()))
                .build();
    }
}
