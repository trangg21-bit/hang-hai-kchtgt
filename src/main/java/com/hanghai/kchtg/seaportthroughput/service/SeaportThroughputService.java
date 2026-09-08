package com.hanghai.kchtg.seaportthroughput.service;

import com.hanghai.kchtg.common.dto.ApprovalRequest;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.seaportthroughput.dto.SearchResultResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputCreateRequest;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputFileResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputImportResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputResponse;
import com.hanghai.kchtg.seaportthroughput.dto.SeaportThroughputUpdateRequest;
import com.hanghai.kchtg.seaportthroughput.entity.SeaportThroughput;
import com.hanghai.kchtg.seaportthroughput.entity.SeaportThroughputFile;
import com.hanghai.kchtg.seaportthroughput.repository.SeaportThroughputFileRepository;
import com.hanghai.kchtg.seaportthroughput.repository.SeaportThroughputRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Consumer;

/**
 * Service nghiệp vụ Sản lượng cảng biển (M-028 / F-301).
 * Tái sử dụng {@link InfrastructureApprovalService} cho submit / approve C1-C2 / assert trạng thái;
 * DataScope gán + validate qua {@link OrgUnitScopeService}; tên đơn vị qua {@link OrgUnitCacheService}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SeaportThroughputService {

    private static final InfrastructureType REF_TYPE = InfrastructureType.SEAPORT_THROUGHPUT;
    private static final String ENTITY_STORAGE_DIR = "SEAPORT_THROUGHPUT";
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    private static final Set<ApprovalStatus> DEFAULT_LIST_STATUSES = EnumSet.of(
            ApprovalStatus.DRAFT,
            ApprovalStatus.PENDING_APPROVAL,
            ApprovalStatus.APPROVED_LEVEL1,
            ApprovalStatus.APPROVED,
            ApprovalStatus.REJECTED_LEVEL1,
            ApprovalStatus.REJECTED_LEVEL2);

    private final SeaportThroughputRepository repository;
    private final SeaportThroughputFileRepository fileRepository;
    private final InfrastructureApprovalService approvalService;
    private final InfrastructureHistoryRepository historyRepository;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;

    @Value("${attachment.path:./uploads}")
    private String attachmentPath;

    // ─────────────────────────────── CREATE ───────────────────────────────

    @Transactional
    public SeaportThroughputResponse create(SeaportThroughputCreateRequest req, UUID userId) {
        UUID orgUnitId = req.getOrgUnitId();
        if (orgUnitId == null) {
            throw new IllegalArgumentException("Vui lòng chọn Đơn vị quản lý");
        }
        requireOrganizationInScope(orgUnitId);

        LocalDate reportMonth = parseReportMonth(req.getReportMonth());
        validateMetrics(req.getDomesticContainerTon(), req.getDomesticContainerTonKm(),
                req.getDomesticDryTon(), req.getDomesticDryTonKm(),
                req.getDomesticLiquidTon(), req.getDomesticLiquidTonKm(),
                req.getDomesticOtherTon(), req.getDomesticOtherTonKm(),
                req.getForeignContainerTon(), req.getForeignContainerTonKm(),
                req.getForeignDryTon(), req.getForeignDryTonKm(),
                req.getForeignLiquidTon(), req.getForeignLiquidTonKm(),
                req.getForeignOtherTon(), req.getForeignOtherTonKm(),
                req.getRouteContainerTon(), req.getRouteContainerTonKm(),
                req.getRouteDryTon(), req.getRouteDryTonKm(),
                req.getRouteLiquidTon(), req.getRouteLiquidTonKm(),
                req.getRouteOtherTon(), req.getRouteOtherTonKm());
        validatePassengerTrips(req.getPassengerTrips());

        if (repository.existsByOrgUnitIdAndReportMonth(orgUnitId, reportMonth)) {
            throw new IllegalArgumentException("Đã tồn tại số liệu sản lượng của đơn vị trong tháng này");
        }

        SeaportThroughput entity = SeaportThroughput.builder()
                .orgUnitId(orgUnitId)
                .reportMonth(reportMonth)
                .note(trimToNull(req.getNote()))
                .domesticContainerTon(valueOrZero(req.getDomesticContainerTon()))
                .domesticContainerTonKm(valueOrZero(req.getDomesticContainerTonKm()))
                .domesticDryTon(valueOrZero(req.getDomesticDryTon()))
                .domesticDryTonKm(valueOrZero(req.getDomesticDryTonKm()))
                .domesticLiquidTon(valueOrZero(req.getDomesticLiquidTon()))
                .domesticLiquidTonKm(valueOrZero(req.getDomesticLiquidTonKm()))
                .domesticOtherTon(valueOrZero(req.getDomesticOtherTon()))
                .domesticOtherTonKm(valueOrZero(req.getDomesticOtherTonKm()))
                .foreignContainerTon(valueOrZero(req.getForeignContainerTon()))
                .foreignContainerTonKm(valueOrZero(req.getForeignContainerTonKm()))
                .foreignDryTon(valueOrZero(req.getForeignDryTon()))
                .foreignDryTonKm(valueOrZero(req.getForeignDryTonKm()))
                .foreignLiquidTon(valueOrZero(req.getForeignLiquidTon()))
                .foreignLiquidTonKm(valueOrZero(req.getForeignLiquidTonKm()))
                .foreignOtherTon(valueOrZero(req.getForeignOtherTon()))
                .foreignOtherTonKm(valueOrZero(req.getForeignOtherTonKm()))
                .routeContainerTon(valueOrZero(req.getRouteContainerTon()))
                .routeContainerTonKm(valueOrZero(req.getRouteContainerTonKm()))
                .routeDryTon(valueOrZero(req.getRouteDryTon()))
                .routeDryTonKm(valueOrZero(req.getRouteDryTonKm()))
                .routeLiquidTon(valueOrZero(req.getRouteLiquidTon()))
                .routeLiquidTonKm(valueOrZero(req.getRouteLiquidTonKm()))
                .routeOtherTon(valueOrZero(req.getRouteOtherTon()))
                .routeOtherTonKm(valueOrZero(req.getRouteOtherTonKm()))
                .passengerTrips(req.getPassengerTrips() != null ? req.getPassengerTrips() : 0L)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        SeaportThroughput saved = repository.save(entity);
        recordHistory(saved, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.DRAFT_SAVED, userId,
                "Lưu tạm sản lượng cảng biển", null, null, null);
        orgUnitCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    // ─────────────────────────────── UPDATE ───────────────────────────────

    @Transactional
    public SeaportThroughputResponse update(UUID id, SeaportThroughputUpdateRequest req, UUID userId) {
        SeaportThroughput entity = findById(id);

        LocalDate newReportMonth = null;
        if (req.getReportMonth() != null && !req.getReportMonth().trim().isEmpty()) {
            newReportMonth = parseReportMonth(req.getReportMonth());
            if (!newReportMonth.equals(entity.getReportMonth())
                    && repository.existsByOrgUnitIdAndReportMonthAndIdNot(
                    entity.getOrgUnitId(), newReportMonth, entity.getId())) {
                throw new IllegalArgumentException("Đã tồn tại số liệu sản lượng của đơn vị trong tháng này");
            }
        }

        validateMetrics(req.getDomesticContainerTon(), req.getDomesticContainerTonKm(),
                req.getDomesticDryTon(), req.getDomesticDryTonKm(),
                req.getDomesticLiquidTon(), req.getDomesticLiquidTonKm(),
                req.getDomesticOtherTon(), req.getDomesticOtherTonKm(),
                req.getForeignContainerTon(), req.getForeignContainerTonKm(),
                req.getForeignDryTon(), req.getForeignDryTonKm(),
                req.getForeignLiquidTon(), req.getForeignLiquidTonKm(),
                req.getForeignOtherTon(), req.getForeignOtherTonKm(),
                req.getRouteContainerTon(), req.getRouteContainerTonKm(),
                req.getRouteDryTon(), req.getRouteDryTonKm(),
                req.getRouteLiquidTon(), req.getRouteLiquidTonKm(),
                req.getRouteOtherTon(), req.getRouteOtherTonKm());
        validatePassengerTrips(req.getPassengerTrips());

        boolean approvedFlow = approvalService.requiresSaveAndApprove(entity);
        if (!approvedFlow) {
            // Đóng băng sửa khi PENDING_APPROVAL / APPROVED_LEVEL1; DRAFT + REJECTED_* được sửa.
            approvalService.assertEditable(entity);
        }

        if (newReportMonth != null) {
            entity.setReportMonth(newReportMonth);
        }
        if (req.getNote() != null) {
            entity.setNote(trimToNull(req.getNote()));
        }
        applyIfPresent(req.getDomesticContainerTon(), entity::setDomesticContainerTon);
        applyIfPresent(req.getDomesticContainerTonKm(), entity::setDomesticContainerTonKm);
        applyIfPresent(req.getDomesticDryTon(), entity::setDomesticDryTon);
        applyIfPresent(req.getDomesticDryTonKm(), entity::setDomesticDryTonKm);
        applyIfPresent(req.getDomesticLiquidTon(), entity::setDomesticLiquidTon);
        applyIfPresent(req.getDomesticLiquidTonKm(), entity::setDomesticLiquidTonKm);
        applyIfPresent(req.getDomesticOtherTon(), entity::setDomesticOtherTon);
        applyIfPresent(req.getDomesticOtherTonKm(), entity::setDomesticOtherTonKm);
        applyIfPresent(req.getForeignContainerTon(), entity::setForeignContainerTon);
        applyIfPresent(req.getForeignContainerTonKm(), entity::setForeignContainerTonKm);
        applyIfPresent(req.getForeignDryTon(), entity::setForeignDryTon);
        applyIfPresent(req.getForeignDryTonKm(), entity::setForeignDryTonKm);
        applyIfPresent(req.getForeignLiquidTon(), entity::setForeignLiquidTon);
        applyIfPresent(req.getForeignLiquidTonKm(), entity::setForeignLiquidTonKm);
        applyIfPresent(req.getForeignOtherTon(), entity::setForeignOtherTon);
        applyIfPresent(req.getForeignOtherTonKm(), entity::setForeignOtherTonKm);
        applyIfPresent(req.getRouteContainerTon(), entity::setRouteContainerTon);
        applyIfPresent(req.getRouteContainerTonKm(), entity::setRouteContainerTonKm);
        applyIfPresent(req.getRouteDryTon(), entity::setRouteDryTon);
        applyIfPresent(req.getRouteDryTonKm(), entity::setRouteDryTonKm);
        applyIfPresent(req.getRouteLiquidTon(), entity::setRouteLiquidTon);
        applyIfPresent(req.getRouteLiquidTonKm(), entity::setRouteLiquidTonKm);
        applyIfPresent(req.getRouteOtherTon(), entity::setRouteOtherTon);
        applyIfPresent(req.getRouteOtherTonKm(), entity::setRouteOtherTonKm);
        if (req.getPassengerTrips() != null) {
            entity.setPassengerTrips(req.getPassengerTrips());
        }
        entity.setUpdatedBy(userId);

        if (approvedFlow) {
            approvalService.recordSaveAndApprove(entity, REF_TYPE,
                    "Cập nhật thông tin sản lượng cảng biển sau ban hành", userId);
        } else {
            recordHistory(entity, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.UPDATED, userId,
                    "Cập nhật thông tin sản lượng cảng biển", null, null, null);
        }

        SeaportThroughput saved = repository.save(entity);
        orgUnitCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    // ─────────────────────────────── SUBMIT / APPROVE / REJECT ───────────────────────────────

    @Transactional
    public SeaportThroughputResponse submit(UUID id, UUID userId) {
        SeaportThroughput entity = findById(id);
        ApprovalStatus before = entity.getApprovalStatus();
        approvalService.submit(entity, REF_TYPE, userId);
        recordHistory(entity, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.PROPOSED, userId,
                "Gửi phê duyệt sản lượng cảng biển",
                BaseApprovableEntity.Fields.approvalStatus,
                before != null ? before.name() : null,
                entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null);
        SeaportThroughput saved = repository.save(entity);
        orgUnitCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    @Transactional
    public SeaportThroughputResponse approveLevel1(UUID id, ApprovalRequest req, UUID userId) {
        SeaportThroughput entity = findById(id);
        assertNotSelfApproval(entity, userId);
        ApprovalStatus before = entity.getApprovalStatus();
        approvalService.approveC1(entity, REF_TYPE,
                req != null ? req.resolveDecision(ApprovalStatus.APPROVED) : ApprovalStatus.APPROVED.name(),
                req != null ? req.getReason() : null, userId);
        recordHistory(entity, ApprovalLevel.LEVEL_1, InfrastructureHistoryStatus.APPROVED, userId,
                "Phê duyệt cấp Cảng vụ/Chi cục",
                BaseApprovableEntity.Fields.approvalStatus,
                before != null ? before.name() : null,
                entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null);
        SeaportThroughput saved = repository.save(entity);
        orgUnitCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    @Transactional
    public SeaportThroughputResponse approveLevel2(UUID id, ApprovalRequest req, UUID userId) {
        SeaportThroughput entity = findById(id);
        assertNotSelfApproval(entity, userId);
        ApprovalStatus before = entity.getApprovalStatus();
        approvalService.approveC2(entity, REF_TYPE,
                req != null ? req.resolveDecision(ApprovalStatus.APPROVED) : ApprovalStatus.APPROVED.name(),
                req != null ? req.getReason() : null, userId);
        recordHistory(entity, ApprovalLevel.LEVEL_2, InfrastructureHistoryStatus.APPROVED, userId,
                "Phê duyệt cấp Cục (ban hành)",
                BaseApprovableEntity.Fields.approvalStatus,
                before != null ? before.name() : null,
                entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null);
        SeaportThroughput saved = repository.save(entity);
        orgUnitCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    @Transactional
    public SeaportThroughputResponse reject(UUID id, ApprovalRequest req, UUID userId) {
        SeaportThroughput entity = findById(id);
        assertNotSelfApproval(entity, userId);
        String reason = req != null ? trimToNull(req.getReason()) : null;
        if (reason == null) {
            throw new IllegalArgumentException("Vui lòng nhập lý do từ chối");
        }
        ApprovalStatus before = entity.getApprovalStatus();
        ApprovalLevel level;
        String actionLabel;
        if (before == ApprovalStatus.PENDING_APPROVAL) {
            level = ApprovalLevel.LEVEL_1;
            actionLabel = "Từ chối cấp Cảng vụ/Chi cục";
            approvalService.approveC1(entity, REF_TYPE, ApprovalStatus.REJECTED.name(), reason, userId);
        } else if (before == ApprovalStatus.APPROVED_LEVEL1) {
            level = ApprovalLevel.LEVEL_2;
            actionLabel = "Từ chối cấp Cục";
            approvalService.approveC2(entity, REF_TYPE, ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            throw new IllegalStateException("Bản ghi không ở trạng thái chờ phê duyệt nên không thể từ chối");
        }
        recordHistory(entity, level, InfrastructureHistoryStatus.REJECTED, userId, actionLabel,
                BaseApprovableEntity.Fields.approvalStatus,
                before.name(), entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null);
        SeaportThroughput saved = repository.save(entity);
        orgUnitCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    // ─────────────────────────────── DELETE ───────────────────────────────

    @Transactional
    public void delete(UUID id, UUID userId) {
        SeaportThroughput entity = findById(id);
        approvalService.deleteDraft(entity, REF_TYPE, userId);
        entity.softDelete(userId);
        repository.save(entity);
        InfrastructureHistoryUtils.recordSoftDelete(historyRepository, entity.getId(), REF_TYPE, userId,
                "Xóa bản ghi sản lượng cảng biển");
        orgUnitCacheService.evictAfterCommit();
    }

    // ─────────────────────────────── FILES ───────────────────────────────

    @Transactional
    public List<SeaportThroughputFileResponse> uploadFiles(UUID id, List<MultipartFile> files, UUID userId) {
        SeaportThroughput entity = findById(id);
        approvalService.assertEditable(entity);
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file đính kèm");
        }
        List<SeaportThroughputFileResponse> responses = new ArrayList<>();
        Path basePath = Paths.get(attachmentPath).toAbsolutePath().normalize();
        for (MultipartFile file : files) {
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().trim() : "";
            if (originalName.isEmpty()) {
                originalName = "file_" + System.currentTimeMillis();
            }
            String storageName = System.currentTimeMillis() + "_" + originalName;
            try {
                Path dir = basePath.resolve(ENTITY_STORAGE_DIR).resolve(entity.getId().toString());
                Files.createDirectories(dir);
                file.transferTo(dir.resolve(storageName).toFile());
            } catch (Exception e) {
                throw new RuntimeException("Không thể lưu file: " + originalName);
            }
            SeaportThroughputFile fileEntity = SeaportThroughputFile.builder()
                    .throughputId(entity.getId())
                    .fileName(originalName)
                    .filePath(basePath.resolve(ENTITY_STORAGE_DIR).resolve(entity.getId().toString())
                            .resolve(storageName).toString())
                    .fileSize(file.getSize())
                    .fileType(file.getContentType())
                    .build();
            SeaportThroughputFile savedFile = fileRepository.save(fileEntity);
            recordHistory(entity, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.ATTACHMENT_UPLOADED, userId,
                    "Đính kèm file: " + originalName, null, null, null);
            responses.add(toFileResponse(savedFile));
        }
        orgUnitCacheService.evictAfterCommit();
        return responses;
    }

    @Transactional
    public void deleteFile(UUID id, UUID fileId, UUID userId) {
        SeaportThroughput entity = findById(id);
        approvalService.assertEditable(entity);
        SeaportThroughputFile fileEntity = fileRepository.findById(fileId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy file đính kèm"));
        if (!fileEntity.getThroughputId().equals(entity.getId())) {
            throw new IllegalArgumentException("File không thuộc bản ghi sản lượng cảng biển này");
        }
        try {
            Files.deleteIfExists(Paths.get(fileEntity.getFilePath()));
        } catch (Exception e) {
            log.warn("Không xóa được file vật lý {}: {}", fileEntity.getFilePath(), e.getMessage());
        }
        fileRepository.delete(fileEntity);
        recordHistory(entity, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.ATTACHMENT_DELETED, userId,
                "Xóa file đính kèm: " + fileEntity.getFileName(), null, null, null);
        orgUnitCacheService.evictAfterCommit();
    }

    // ─────────────────────────────── IMPORT (Excel) ───────────────────────────────

    /**
     * Nhập số liệu từ file Excel (.xlsx/.xls). Contract cột (đã chốt design §2.1 STT 4-27):
     * cột 0 = Tên đơn vị quản lý, cột 1 = Thời gian tổng hợp (yyyy-MM), cột 2-25 = 24 chỉ tiêu
     * theo đúng thứ tự §2.1 (domestic_* 8, foreign_* 8, route_* 8), cột 26 = passenger_trips,
     * cột 27 = note (tùy chọn). Dòng 0 là header được tự phát hiện và bỏ qua khi cột tháng
     * không đúng định dạng. BR-SLCB-09: báo lỗi theo dòng, KHÔNG ghi nửa chừng (validate toàn
     * bộ trước khi save); unique (org_unit_id, report_month) chống trùng cả trong file lẫn DB.
     */
    @Transactional
    public SeaportThroughputImportResponse importExcel(MultipartFile file, UUID userId) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn file Excel (.xlsx)");
        }
        String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase(Locale.ROOT) : "";
        if (!originalName.endsWith(".xlsx") && !originalName.endsWith(".xls")) {
            throw new IllegalArgumentException("File nhập phải là định dạng Excel (.xlsx hoặc .xls)");
        }

        Map<UUID, String> directory = orgUnitCacheService.getDirectory();
        Map<String, List<UUID>> orgIdsByName = new HashMap<>();
        for (Map.Entry<UUID, String> entry : directory.entrySet()) {
            if (entry.getValue() != null) {
                orgIdsByName.computeIfAbsent(entry.getValue().trim(), k -> new ArrayList<>()).add(entry.getKey());
            }
        }
        OrgUnitScopeService.Scope scope = orgUnitScopeService.currentUserScope();

        List<String> errors = new ArrayList<>();
        List<SeaportThroughput> toSave = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();
        DataFormatter formatter = new DataFormatter();

        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = workbook.getNumberOfSheets() > 0 ? workbook.getSheetAt(0) : null;
            if (sheet == null) {
                throw new IllegalArgumentException("File Excel không có sheet dữ liệu");
            }
            int firstRow = sheet.getFirstRowNum();
            int lastRow = sheet.getLastRowNum();

            // Header auto-detect: nếu dòng đầu tiên có cột tháng (index 1) không parse được yyyy-MM
            // thì xem là dòng tiêu đề và bỏ qua.
            if (firstRow >= 0 && isHeaderRow(sheet.getRow(firstRow), formatter)) {
                firstRow++;
            }

            for (int r = firstRow; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (isRowBlank(row, formatter)) {
                    continue;
                }
                String rowLabel = "Dòng " + (r + 1) + ": ";
                List<String> rowErrors = new ArrayList<>();

                String orgName = cellText(row, 0, formatter);
                UUID orgUnitId = null;
                if (orgName == null || orgName.isEmpty()) {
                    rowErrors.add("Vui lòng chọn Đơn vị quản lý");
                } else {
                    List<UUID> candidates = orgIdsByName.get(orgName);
                    if (candidates == null) {
                        rowErrors.add("Không tìm thấy đơn vị quản lý trong phạm vi được phép: " + orgName);
                    } else {
                        List<UUID> inScope = candidates.stream().filter(scope::allows).toList();
                        if (inScope.size() == 1) {
                            orgUnitId = inScope.get(0);
                        } else if (inScope.isEmpty()) {
                            rowErrors.add("Đơn vị quản lý nằm ngoài phạm vi được phép: " + orgName);
                        } else {
                            rowErrors.add("Tên đơn vị quản lý bị trùng trong hệ thống, không xác định được: " + orgName);
                        }
                    }
                }

                String monthText = cellText(row, 1, formatter);
                LocalDate reportMonth = null;
                if (monthText == null || monthText.isEmpty()) {
                    rowErrors.add("Vui lòng chọn Thời gian tổng hợp sản lượng");
                } else {
                    try {
                        reportMonth = YearMonth.parse(monthText.trim(), MONTH_FORMAT).atDay(1);
                    } catch (DateTimeParseException e) {
                        rowErrors.add("Thời gian tổng hợp sản lượng không đúng định dạng yyyy-MM: " + monthText);
                    }
                }

                BigDecimal[] metrics = new BigDecimal[24];
                for (int i = 0; i < 24; i++) {
                    String text = cellText(row, 2 + i, formatter);
                    if (text == null || text.trim().isEmpty()) {
                        metrics[i] = BigDecimal.ZERO;
                        continue;
                    }
                    try {
                        BigDecimal value = new BigDecimal(text.trim());
                        if (value.signum() < 0) {
                            rowErrors.add("Giá trị không được nhỏ hơn 0 (cột " + (3 + i) + ")");
                        } else {
                            metrics[i] = value;
                        }
                    } catch (NumberFormatException e) {
                        rowErrors.add("Giá trị cột " + (3 + i) + " không hợp lệ (cần số): " + text);
                    }
                }

                String passengerText = cellText(row, 26, formatter);
                long passengerTrips = 0L;
                if (passengerText != null && !passengerText.trim().isEmpty()) {
                    try {
                        passengerTrips = Long.parseLong(passengerText.trim());
                        if (passengerTrips < 0) {
                            rowErrors.add("Lượt hành khách không được nhỏ hơn 0");
                        }
                    } catch (NumberFormatException e) {
                        rowErrors.add("Lượt hành khách không hợp lệ (cần số nguyên): " + passengerText);
                    }
                }
                String note = cellText(row, 27, formatter);

                if (orgUnitId != null && reportMonth != null) {
                    String key = orgUnitId + "|" + reportMonth;
                    if (!seenKeys.add(key)) {
                        rowErrors.add("Đã tồn tại số liệu sản lượng của đơn vị trong tháng này (trùng trong file)");
                    } else if (repository.existsByOrgUnitIdAndReportMonth(orgUnitId, reportMonth)) {
                        rowErrors.add("Đã tồn tại số liệu sản lượng của đơn vị trong tháng này");
                    }
                }

                if (!rowErrors.isEmpty()) {
                    errors.add(rowLabel + String.join("; ", rowErrors));
                    continue;
                }

                toSave.add(SeaportThroughput.builder()
                        .orgUnitId(orgUnitId)
                        .reportMonth(reportMonth)
                        .note(trimToNull(note))
                        .domesticContainerTon(metrics[0])
                        .domesticContainerTonKm(metrics[1])
                        .domesticDryTon(metrics[2])
                        .domesticDryTonKm(metrics[3])
                        .domesticLiquidTon(metrics[4])
                        .domesticLiquidTonKm(metrics[5])
                        .domesticOtherTon(metrics[6])
                        .domesticOtherTonKm(metrics[7])
                        .foreignContainerTon(metrics[8])
                        .foreignContainerTonKm(metrics[9])
                        .foreignDryTon(metrics[10])
                        .foreignDryTonKm(metrics[11])
                        .foreignLiquidTon(metrics[12])
                        .foreignLiquidTonKm(metrics[13])
                        .foreignOtherTon(metrics[14])
                        .foreignOtherTonKm(metrics[15])
                        .routeContainerTon(metrics[16])
                        .routeContainerTonKm(metrics[17])
                        .routeDryTon(metrics[18])
                        .routeDryTonKm(metrics[19])
                        .routeLiquidTon(metrics[20])
                        .routeLiquidTonKm(metrics[21])
                        .routeOtherTon(metrics[22])
                        .routeOtherTonKm(metrics[23])
                        .passengerTrips(passengerTrips)
                        .approvalStatus(ApprovalStatus.DRAFT)
                        .build());
            }
        } catch (java.io.IOException e) {
            log.error("Không đọc được file Excel import sản lượng cảng biển: {}", e.getMessage());
            throw new RuntimeException("Không đọc được file Excel, vui lòng kiểm tra lại file");
        }

        // BR-SLCB-09: có bất kỳ lỗi dòng nào → không ghi gì cả (all-or-nothing)
        if (!errors.isEmpty()) {
            throw new IllegalArgumentException(
                    "Nhập dữ liệu không thành công, không có dòng nào được ghi:\n" + String.join("\n", errors));
        }
        if (toSave.isEmpty()) {
            throw new IllegalArgumentException("File không có dữ liệu hợp lệ để nhập");
        }

        List<SeaportThroughput> saved = repository.saveAll(toSave);
        for (SeaportThroughput entity : saved) {
            recordHistory(entity, ApprovalLevel.LEVEL_0, InfrastructureHistoryStatus.DRAFT_SAVED, userId,
                    "Nhập dữ liệu từ file Excel", null, null, null);
        }
        orgUnitCacheService.evictAfterCommit();
        return new SeaportThroughputImportResponse(saved.size());
    }

    private static boolean isHeaderRow(Row row, DataFormatter formatter) {
        String monthCell = cellText(row, 1, formatter);
        return monthCell == null || monthCell.trim().isEmpty()
                || !isValidMonthText(monthCell.trim());
    }

    private static boolean isValidMonthText(String value) {
        try {
            YearMonth.parse(value, MONTH_FORMAT);
            return true;
        } catch (DateTimeParseException e) {
            return false;
        }
    }

    private static boolean isRowBlank(Row row, DataFormatter formatter) {
        if (row == null) {
            return true;
        }
        for (int i = 0; i <= 27; i++) {
            String text = cellText(row, i, formatter);
            if (text != null && !text.trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private static String cellText(Row row, int index, DataFormatter formatter) {
        if (row == null) {
            return null;
        }
        Cell cell = row.getCell(index);
        if (cell == null) {
            return null;
        }
        String text = formatter.formatCellValue(cell);
        return text == null ? null : text.trim();
    }

    // ─────────────────────────────── READ ───────────────────────────────

    @Transactional(readOnly = true)
    public SearchResultResponse search(UUID orgUnitId, List<ApprovalStatus> statuses, YearMonth reportMonth,
                                       LocalDateTime updatedFrom, LocalDateTime updatedTo, String keyword,
                                       int page, int size) {
        List<ApprovalStatus> effectiveStatuses = statuses == null || statuses.isEmpty()
                ? new ArrayList<>(DEFAULT_LIST_STATUSES)
                : statuses;
        int safePage = Math.max(page, 0);
        int safeSize = size <= 0 ? 20 : Math.min(size, 200);
        PageRequest pageable = PageRequest.of(safePage, safeSize,
                Sort.by(Sort.Direction.DESC, EntityFields.UPDATED_AT));
        Page<SeaportThroughput> result = repository.search(effectiveStatuses, orgUnitId,
                reportMonth != null ? reportMonth.atDay(1) : null,
                updatedFrom, updatedTo, trimToNull(keyword), pageable);
        return SearchResultResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).toList())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    @Transactional(readOnly = true)
    public SeaportThroughputResponse getById(UUID id) {
        return toResponse(findById(id));
    }

    @Transactional(readOnly = true)
    public List<InfrastructureHistory> getHistory(UUID id) {
        SeaportThroughput entity = findById(id);
        return historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                REF_TYPE, entity.getId());
    }

    // ─────────────────────────────── HELPERS ───────────────────────────────

    private SeaportThroughput findById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi sản lượng cảng biển"));
    }

    private void requireOrganizationInScope(UUID orgUnitId) {
        if (!orgUnitScopeService.currentUserScope().allows(orgUnitId)) {
            throw new IllegalArgumentException("Đơn vị quản lý nằm ngoài phạm vi được phép");
        }
        if (orgUnitCacheService.getName(orgUnitId) == null) {
            throw new IllegalArgumentException("Không tìm thấy đơn vị quản lý");
        }
    }

    private void assertNotSelfApproval(SeaportThroughput entity, UUID userId) {
        if (userId != null && (userId.equals(entity.getCreatedBy()) || userId.equals(entity.getSubmittedBy()))) {
            throw new IllegalStateException("Người kê khai không được tự phê duyệt bản ghi của mình");
        }
    }

    private LocalDate parseReportMonth(String value) {
        String month = trimToNull(value);
        if (month == null) {
            throw new IllegalArgumentException("Vui lòng chọn Thời gian tổng hợp sản lượng");
        }
        try {
            return YearMonth.parse(month, MONTH_FORMAT).atDay(1);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Thời gian tổng hợp sản lượng không đúng định dạng yyyy-MM");
        }
    }

    private void validateMetrics(BigDecimal... values) {
        for (BigDecimal value : values) {
            if (value != null && value.signum() < 0) {
                throw new IllegalArgumentException("Giá trị không được nhỏ hơn 0");
            }
        }
    }

    private void validatePassengerTrips(Long passengerTrips) {
        if (passengerTrips != null && passengerTrips < 0) {
            throw new IllegalArgumentException("Lượt hành khách không được nhỏ hơn 0");
        }
    }

    private static BigDecimal valueOrZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static void applyIfPresent(BigDecimal value, java.util.function.Consumer<BigDecimal> setter) {
        if (value != null) {
            setter.accept(value);
        }
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private void recordHistory(SeaportThroughput entity, ApprovalLevel level, InfrastructureHistoryStatus status,
                               UUID userId, String reason, String changedField,
                               String previousValue, String newValue) {
        try {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(entity.getId())
                    .refType(REF_TYPE)
                    .approvalLevel(level)
                    .status(status)
                    .approvedBy(userId)
                    .reason(reason)
                    .changedField(changedField)
                    .previousValue(previousValue)
                    .newValue(newValue)
                    .build());
        } catch (Exception e) {
            log.error("Không thể ghi lịch sử cho sản lượng cảng biển refId={}: {}", entity.getId(), e.getMessage());
        }
    }

    private SeaportThroughputResponse toResponse(SeaportThroughput entity) {
        Map<UUID, String> orgNames = orgUnitCacheService.getDirectory();
        String orgUnitName = orgNames.get(entity.getOrgUnitId());
        List<SeaportThroughputFileResponse> files = fileRepository
                .findByThroughputIdOrderByCreatedAtAsc(entity.getId())
                .stream().map(this::toFileResponse).toList();
        return SeaportThroughputResponse.builder()
                .id(entity.getId())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .reportMonth(entity.getReportMonth())
                .note(entity.getNote())
                .domesticContainerTon(entity.getDomesticContainerTon())
                .domesticContainerTonKm(entity.getDomesticContainerTonKm())
                .domesticDryTon(entity.getDomesticDryTon())
                .domesticDryTonKm(entity.getDomesticDryTonKm())
                .domesticLiquidTon(entity.getDomesticLiquidTon())
                .domesticLiquidTonKm(entity.getDomesticLiquidTonKm())
                .domesticOtherTon(entity.getDomesticOtherTon())
                .domesticOtherTonKm(entity.getDomesticOtherTonKm())
                .foreignContainerTon(entity.getForeignContainerTon())
                .foreignContainerTonKm(entity.getForeignContainerTonKm())
                .foreignDryTon(entity.getForeignDryTon())
                .foreignDryTonKm(entity.getForeignDryTonKm())
                .foreignLiquidTon(entity.getForeignLiquidTon())
                .foreignLiquidTonKm(entity.getForeignLiquidTonKm())
                .foreignOtherTon(entity.getForeignOtherTon())
                .foreignOtherTonKm(entity.getForeignOtherTonKm())
                .routeContainerTon(entity.getRouteContainerTon())
                .routeContainerTonKm(entity.getRouteContainerTonKm())
                .routeDryTon(entity.getRouteDryTon())
                .routeDryTonKm(entity.getRouteDryTonKm())
                .routeLiquidTon(entity.getRouteLiquidTon())
                .routeLiquidTonKm(entity.getRouteLiquidTonKm())
                .routeOtherTon(entity.getRouteOtherTon())
                .routeOtherTonKm(entity.getRouteOtherTonKm())
                .passengerTrips(entity.getPassengerTrips())
                .approvalStatus(entity.getApprovalStatus())
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .approverLevel1(entity.getApproverLevel1())
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .approverLevel2(entity.getApproverLevel2())
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedAt(entity.getUpdatedAt())
                .files(files)
                .build();
    }

    private SeaportThroughputFileResponse toFileResponse(SeaportThroughputFile fileEntity) {
        return SeaportThroughputFileResponse.builder()
                .id(fileEntity.getId())
                .throughputId(fileEntity.getThroughputId())
                .fileName(fileEntity.getFileName())
                .fileSize(fileEntity.getFileSize())
                .fileType(fileEntity.getFileType())
                .build();
    }
}
