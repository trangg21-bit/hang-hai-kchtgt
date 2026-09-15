package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.cospas.*;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationCospasSarsatRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Service xử lý nghiệp vụ cho Đài thông tin vệ tinh Cospas-Sarsat.
 * Chuẩn hóa theo kiến trúc KCHTGT 3 tầng, DataScope phân cấp,
 * Quy trình phê duyệt 2 cấp C1/C2 và nguyên tắc 4 mắt (chống tự duyệt).
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CoastalStationCospasSarsatService {

    private final CoastalStationCospasSarsatRepository repository;
    private final HistoryService historyService;
    private final InfrastructureApprovalService approvalService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final UserRepository userRepository;
    private final OperatingOrganizationRepository operatingOrganizationRepository;

    private Scope resolveEffectiveScope(UUID selectedOrgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (selectedOrgUnitId == null) {
            return userScope;
        }
        if (!userScope.unrestricted() && !userScope.orgUnitIds().contains(selectedOrgUnitId)) {
            return Scope.restricted(List.of());
        }
        List<UUID> selectedSubtree = orgUnitScopeService.resolveSubtreeIds(selectedOrgUnitId);
        if (userScope.unrestricted()) {
            return Scope.restricted(selectedSubtree);
        }
        List<UUID> intersected = selectedSubtree.stream()
                .filter(userScope.orgUnitIds()::contains)
                .toList();
        return Scope.restricted(intersected);
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.orgUnitIds().contains(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
        }
    }

    private static String toKeywordLike(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        String normalized = java.text.Normalizer
                .normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
        return "%" + normalized + "%";
    }

    // --- TÌM KIẾM PHÂN TRANG & THỐNG KÊ (Chuẩn VTS) ---

    @Transactional(readOnly = true)
    public Page<CoastalStationCospasSarsatResponse> searchPaged(
            UUID orgUnitId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            String keyword,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {

        Scope effectiveScope = resolveEffectiveScope(orgUnitId);

        Page<CoastalStationCospasSarsat> page = repository.search(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgUnitId,
                provinceId,
                conditionStatus,
                approvalStatus,
                toKeywordLike(keyword),
                updatedFrom,
                updatedTo,
                pageable);

        List<CoastalStationCospasSarsatResponse> responses = page.getContent().stream()
                .map(this::buildResponse)
                .toList();

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(
            UUID orgUnitId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            String keyword,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo) {

        Scope effectiveScope = resolveEffectiveScope(orgUnitId);

        List<Object[]> rows = repository.countByApprovalStatus(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgUnitId,
                provinceId,
                conditionStatus,
                toKeywordLike(keyword),
                updatedFrom,
                updatedTo);

        Map<String, Long> counts = new HashMap<>();
        long total = 0;
        for (Object[] r : rows) {
            ApprovalStatus st = (ApprovalStatus) r[0];
            Long cnt = (Long) r[1];
            if (st != null && cnt != null) {
                counts.put(st.name(), cnt);
                total += cnt;
            }
        }
        counts.put("ALL", total);
        return counts;
    }

    // --- CRUD ---

    public CoastalStationCospasSarsat createStation(CoastalStationCospasSarsatRequest request) {
        FieldWriteGuard.validateObject(request);

        String effectiveCode = request.getEffectiveCode();
        if (effectiveCode == null || effectiveCode.isBlank()) {
            throw new IllegalArgumentException("Mã đài không được để trống");
        }
        if (repository.findByCode(effectiveCode).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + effectiveCode);
        }

        String effectiveName = request.getEffectiveName();
        if (effectiveName == null || effectiveName.isBlank()) {
            throw new IllegalArgumentException("Tên đài không được để trống");
        }

        UUID effectiveOrgUnitId = request.getEffectiveOrgUnitId();
        if (effectiveOrgUnitId != null) {
            validateAllowedOrgUnit(effectiveOrgUnitId);
        }

        CoastalStationCospasSarsat entity = new CoastalStationCospasSarsat();
        entity.setCode(effectiveCode);
        entity.setName(effectiveName);
        entity.setOrgUnitId(effectiveOrgUnitId);
        entity.setProvinceId(request.getProvinceId());
        entity.setConditionStatus(request.getConditionStatus() != null ? request.getConditionStatus() : ConditionStatus.OPERATIONAL);
        entity.setOperatingOrgId(request.getOperatingOrgId());
        entity.setOwningOrgId(request.getOwningOrgId());
        entity.setSymbolId(request.getSymbolId());
        entity.setCoordinateReferenceSystem(request.getCoordinateReferenceSystem());
        entity.setNote(request.getEffectiveNote());
        entity.setDescription(request.getEffectiveNote());
        entity.setSpatialId(request.getSpatialId());

        entity.setFrequency(request.getFrequency());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setBeaconProtocol(request.getBeaconProtocol());
        entity.setEmergencyChannel(request.getEmergencyChannel());
        entity.setAntennaType(request.getAntennaType());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setSignalRange(request.getSignalRange());
        entity.setOperatingMode(request.getOperatingMode());
        entity.setIsActive(true);

        if (request.getApprovalStatus() != null) {
            entity.setApprovalStatus(request.getApprovalStatus());
        } else {
            entity.setApprovalStatus(ApprovalStatus.DRAFT);
        }

        CoastalStationCospasSarsat saved = repository.save(entity);
        historyService.recordHistory(
                InfrastructureType.COSPAS_SARSAT_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Cospas-Sarsat station created",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    public CoastalStationCospasSarsat updateStation(UUID id, CoastalStationCospasSarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        if (request.getEffectiveOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getEffectiveOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        Map<String, String> oldValues = new LinkedHashMap<>();
        if (wasApproved) {
            if (request.getEffectiveName() != null && !Objects.equals(request.getEffectiveName(), entity.getName())) {
                oldValues.put("Tên đài", entity.getName());
            }
            if (request.getFrequency() != null && !Objects.equals(request.getFrequency(), entity.getFrequency())) {
                oldValues.put("Tần số", entity.getFrequency());
            }
            if (request.getCoverageArea() != null && !Objects.equals(request.getCoverageArea(), entity.getCoverageArea())) {
                oldValues.put("Vùng phủ sóng", entity.getCoverageArea());
            }
            if (request.getBeaconProtocol() != null && !Objects.equals(request.getBeaconProtocol(), entity.getBeaconProtocol())) {
                oldValues.put("Giao thức phát", entity.getBeaconProtocol());
            }
            if (request.getEmergencyChannel() != null && !Objects.equals(request.getEmergencyChannel(), entity.getEmergencyChannel())) {
                oldValues.put("Kênh khẩn cấp", entity.getEmergencyChannel());
            }
            if (request.getAntennaType() != null && !Objects.equals(request.getAntennaType(), entity.getAntennaType())) {
                oldValues.put("Loại anten", entity.getAntennaType());
            }
            if (request.getLocationAddress() != null && !Objects.equals(request.getLocationAddress(), entity.getLocationAddress())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationAddress());
            }
            if (request.getContactPerson() != null && !Objects.equals(request.getContactPerson(), entity.getContactPerson())) {
                oldValues.put("Người liên hệ", entity.getContactPerson());
            }
            if (request.getContactPhone() != null && !Objects.equals(request.getContactPhone(), entity.getContactPhone())) {
                oldValues.put("Số điện thoại liên hệ", entity.getContactPhone());
            }
            if (request.getSignalRange() != null && !Objects.equals(request.getSignalRange(), entity.getSignalRange())) {
                oldValues.put("Cự ly tín hiệu", String.valueOf(entity.getSignalRange()));
            }
            if (request.getOperatingMode() != null && !Objects.equals(request.getOperatingMode(), entity.getOperatingMode())) {
                oldValues.put("Chế độ hoạt động", entity.getOperatingMode());
            }
            if (request.getConditionStatus() != null && !Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) {
                oldValues.put("Tình trạng", entity.getConditionStatus() != null ? entity.getConditionStatus().name() : null);
            }
            if (request.getEffectiveNote() != null && !Objects.equals(request.getEffectiveNote(), entity.getNote())) {
                oldValues.put("Ghi chú", entity.getNote());
            }
        }

        if (request.getEffectiveName() != null) entity.setName(request.getEffectiveName());
        if (request.getEffectiveOrgUnitId() != null) entity.setOrgUnitId(request.getEffectiveOrgUnitId());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());
        if (request.getOperatingOrgId() != null) entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getOwningOrgId() != null) entity.setOwningOrgId(request.getOwningOrgId());
        if (request.getSymbolId() != null) entity.setSymbolId(request.getSymbolId());
        if (request.getCoordinateReferenceSystem() != null) entity.setCoordinateReferenceSystem(request.getCoordinateReferenceSystem());
        if (request.getSpatialId() != null) entity.setSpatialId(request.getSpatialId());
        if (request.getEffectiveNote() != null) {
            entity.setNote(request.getEffectiveNote());
            entity.setDescription(request.getEffectiveNote());
        }

        if (request.getFrequency() != null) entity.setFrequency(request.getFrequency());
        if (request.getCoverageArea() != null) entity.setCoverageArea(request.getCoverageArea());
        if (request.getBeaconProtocol() != null) entity.setBeaconProtocol(request.getBeaconProtocol());
        if (request.getEmergencyChannel() != null) entity.setEmergencyChannel(request.getEmergencyChannel());
        if (request.getAntennaType() != null) entity.setAntennaType(request.getAntennaType());
        if (request.getLocationAddress() != null) entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null) entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null) entity.setContactPhone(request.getContactPhone());
        if (request.getSignalRange() != null) entity.setSignalRange(request.getSignalRange());
        if (request.getOperatingMode() != null) entity.setOperatingMode(request.getOperatingMode());

        CoastalStationCospasSarsat saved = repository.save(entity);

        // T12 — sửa hồ sơ đã duyệt: giữ nguyên trạng thái "Đã duyệt", chỉ ghi vết thay đổi
        if (wasApproved) {
            saved.setApprovalStatus(ApprovalStatus.APPROVED);
            saved = repository.save(saved);
        }

        if (wasApproved && !oldValues.isEmpty()) {
            final CoastalStationCospasSarsat finalSaved = saved;
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            historyService.recordDeltaChanges(
                    InfrastructureType.COSPAS_SARSAT_STATION,
                    finalSaved.getId(),
                    oldValues,
                    field -> getNewValueDisplay(field, finalSaved),
                    currentUserId);
        }
        return saved;
    }

    private String getNewValueDisplay(String fieldName, CoastalStationCospasSarsat entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Tần số" -> entity.getFrequency() != null ? entity.getFrequency() : "—";
            case "Vùng phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
            case "Giao thức phát" -> entity.getBeaconProtocol() != null ? entity.getBeaconProtocol() : "—";
            case "Kênh khẩn cấp" -> entity.getEmergencyChannel() != null ? entity.getEmergencyChannel() : "—";
            case "Loại anten" -> entity.getAntennaType() != null ? entity.getAntennaType() : "—";
            case "Địa điểm chi tiết" -> entity.getLocationAddress() != null ? entity.getLocationAddress() : "—";
            case "Người liên hệ" -> entity.getContactPerson() != null ? entity.getContactPerson() : "—";
            case "Số điện thoại liên hệ" -> entity.getContactPhone() != null ? entity.getContactPhone() : "—";
            case "Cự ly tín hiệu" -> entity.getSignalRange() != null ? String.valueOf(entity.getSignalRange()) : "—";
            case "Chế độ hoạt động" -> entity.getOperatingMode() != null ? entity.getOperatingMode() : "—";
            case "Tình trạng" -> entity.getConditionStatus() != null ? entity.getConditionStatus().name() : "—";
            case "Ghi chú" -> entity.getNote() != null ? entity.getNote() : "—";
            default -> "—";
        };
    }

    public void deleteStation(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));

        // Kiểm tra quyền xóa: chỉ cho phép xóa khi DRAFT (quy tắc 11)
        approvalService.assertDeletable(entity);

        entity.softDelete(SecurityUtils.getCurrentUserId());
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.COSPAS_SARSAT_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Active",
                "Cospas-Sarsat station deleted",
                SecurityUtils.getCurrentUserId());
    }

    @Transactional(readOnly = true)
    public CoastalStationCospasSarsat getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsat> getAllStations() {
        return repository.findAllActive();
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsatOptionResponse> getOptions(UUID orgUnitId) {
        Scope effectiveScope = resolveEffectiveScope(orgUnitId);
        boolean orgFiltered = (orgUnitId != null);
        Collection<UUID> targetOrgUnitIds = orgFiltered
                ? orgUnitScopeService.resolveSubtreeIds(orgUnitId)
                : Collections.emptyList();

        return repository.findOptions(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgFiltered,
                targetOrgUnitIds);
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsat> searchStations(String keyword) {
        return repository.search(keyword);
    }

    @Transactional(readOnly = true)
    public Optional<CoastalStationCospasSarsat> findByCode(String code) {
        return repository.findByCode(code);
    }

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP (docs/conventions/approval-2-level-spec.md) ---

    public CoastalStationCospasSarsat submit(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        approvalService.submit(entity, InfrastructureType.COSPAS_SARSAT_STATION, currentUserId);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel1(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC1(entity, InfrastructureType.COSPAS_SARSAT_STATION, "APPROVED", null, currentUserId);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel2(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC2(entity, InfrastructureType.COSPAS_SARSAT_STATION, "APPROVED", null, currentUserId);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat reject(UUID id, String rejectionReason) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.COSPAS_SARSAT_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
            entity.setLevel2ApprovalContent(rejectionReason.trim());
        } else {
            approvalService.approveC1(entity, InfrastructureType.COSPAS_SARSAT_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
            entity.setLevel1ApprovalContent(rejectionReason.trim());
        }
        return repository.save(entity);
    }

    // Tương thích ngược với endpoint /approve cũ
    public CoastalStationCospasSarsat approveStation(UUID id, boolean approved) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (!approved) {
            return reject(id, "Từ chối phê duyệt bởi quản trị viên");
        }
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            return approveLevel2(id);
        }
        return approveLevel1(id);
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));
        return historyService.getHistory(InfrastructureType.COSPAS_SARSAT_STATION, entity.getId(), entity.getCode()).stream()
                .map(h -> {
                    CoastalStationCospasSarsatHistoryResponse r = new CoastalStationCospasSarsatHistoryResponse();
                    r.setId(h.getId());
                    r.setStationCode(h.getStationCode());
                    r.setActionType(h.getActionType());
                    r.setPreviousValue(h.getPreviousValue());
                    r.setNewValue(h.getNewValue());
                    r.setChangedBy(h.getChangedBy());
                    r.setChangedAt(h.getChangedAt());
                    return r;
                })
                .toList();
    }

    // --- MAPPER BUILD RESPONSE ---

    public CoastalStationCospasSarsatResponse buildResponse(CoastalStationCospasSarsat entity) {
        if (entity == null) return null;

        String orgUnitName = null;
        if (entity.getOrgUnitId() != null) {
            orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());
        }

        String operatingOrgName = null;
        if (entity.getOperatingOrgId() != null) {
            operatingOrgName = operatingOrganizationRepository.findById(entity.getOperatingOrgId())
                    .map(OperatingOrganization::getName)
                    .orElse(null);
        }

        String owningOrgName = null;
        if (entity.getOwningOrgId() != null) {
            owningOrgName = operatingOrganizationRepository.findById(entity.getOwningOrgId())
                    .map(OperatingOrganization::getName)
                    .orElse(null);
        }

        String createdByName = resolveUserName(entity.getCreatedBy());
        String updatedByName = resolveUserName(entity.getUpdatedBy());
        String submittedByName = resolveUserName(entity.getSubmittedBy());
        String approverLevel1Name = resolveUserName(entity.getApproverLevel1());
        String approverLevel2Name = resolveUserName(entity.getApproverLevel2());

        return CoastalStationCospasSarsatResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .stationCode(entity.getCode())
                .name(entity.getName())
                .stationName(entity.getName())
                .orgUnitId(entity.getOrgUnitId())
                .unitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .owningOrgId(entity.getOwningOrgId())
                .owningOrgName(owningOrgName)
                .provinceId(entity.getProvinceId())
                .conditionStatus(entity.getConditionStatus())
                .conditionStatusLabel(entity.getConditionStatus() != null ? entity.getConditionStatus().name() : null)
                .frequency(entity.getFrequency())
                .coverageArea(entity.getCoverageArea())
                .beaconProtocol(entity.getBeaconProtocol())
                .emergencyChannel(entity.getEmergencyChannel())
                .antennaType(entity.getAntennaType())
                .locationAddress(entity.getLocationAddress())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .signalRange(entity.getSignalRange())
                .operatingMode(entity.getOperatingMode())
                .description(entity.getDescription())
                .note(entity.getNote())
                .spatialId(entity.getSpatialId())
                .symbolId(entity.getSymbolId())
                .coordinateReferenceSystem(entity.getCoordinateReferenceSystem())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalStatusLabel(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null)
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedByName(approverLevel2Name)
                .approvedDate(entity.getApprovedDate())
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .submittedByName(submittedByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approverLevel1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approverLevel2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .deletedAt(entity.getDeletedAt())
                .build();
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(User::getFullName).orElse(null);
    }
}
