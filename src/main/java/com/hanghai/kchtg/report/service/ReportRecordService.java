package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.report.dto.ReportRecordDto;
import com.hanghai.kchtg.report.entity.ReportRecord;
import com.hanghai.kchtg.report.repository.ReportRecordRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service quản lý nhập/lưu dữ liệu snapshot cho các báo cáo nghiệp vụ (BCPTTV, BCDN, BCTT48...).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@Slf4j
public class ReportRecordService {

    private final ReportRecordRepository repository;
    private final OrgUnitCacheService orgUnits;

    public List<ReportRecordDto> search(String reportCode, UUID orgUnitId, Integer reportYear, String reportPeriod) {
        return repository.findAll((root, query, cb) -> {
            var predicates = cb.conjunction();
            if (reportCode != null && !reportCode.isBlank()) {
                predicates = cb.and(predicates, cb.equal(root.get("reportCode"), reportCode));
            }
            if (orgUnitId != null) {
                predicates = cb.and(predicates, cb.equal(root.get("orgUnitId"), orgUnitId));
            }
            if (reportYear != null) {
                predicates = cb.and(predicates, cb.equal(root.get("reportYear"), reportYear));
            }
            if (reportPeriod != null && !reportPeriod.isBlank()) {
                predicates = cb.and(predicates, cb.equal(root.get("reportPeriod"), reportPeriod));
            }
            return predicates;
        }).stream().map(this::toDto).collect(Collectors.toList());
    }

    public ReportRecordDto getById(UUID id) {
        ReportRecord entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bản ghi báo cáo"));
        return toDto(entity);
    }

    public Optional<ReportRecord> findSnapshot(UUID orgUnitId, String reportCode, Integer reportYear, String reportPeriod) {
        if (orgUnitId == null || reportCode == null || reportYear == null) {
            return Optional.empty();
        }
        String period = (reportPeriod != null && !reportPeriod.isBlank()) ? reportPeriod : "ANNUAL";
        return repository.findByOrgUnitIdAndReportCodeAndReportYearAndReportPeriod(
                orgUnitId, reportCode, reportYear, period);
    }

    @Transactional
    public ReportRecordDto save(ReportRecordDto dto) {
        String period = (dto.getReportPeriod() != null && !dto.getReportPeriod().isBlank()) ? dto.getReportPeriod() : "ANNUAL";
        String status = (dto.getStatus() != null && !dto.getStatus().isBlank()) ? dto.getStatus() : "APPROVED";

        ReportRecord entity;
        if (dto.getId() != null) {
            entity = repository.findById(dto.getId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bản ghi báo cáo"));
            entity.setReportData(dto.getReportData());
            entity.setNotes(dto.getNotes());
            entity.setStatus(status);
        } else {
            // Check existing
            Optional<ReportRecord> existing = repository.findByOrgUnitIdAndReportCodeAndReportYearAndReportPeriod(
                    dto.getOrgUnitId(), dto.getReportCode(), dto.getReportYear(), period);
            if (existing.isPresent()) {
                entity = existing.get();
                entity.setReportData(dto.getReportData());
                entity.setNotes(dto.getNotes());
                entity.setStatus(status);
            } else {
                entity = ReportRecord.builder()
                        .orgUnitId(dto.getOrgUnitId())
                        .reportCode(dto.getReportCode())
                        .reportYear(dto.getReportYear())
                        .reportPeriod(period)
                        .status(status)
                        .reportData(dto.getReportData())
                        .notes(dto.getNotes())
                        .build();
            }
        }
        ReportRecord saved = repository.save(entity);
        return toDto(saved);
    }

    @Transactional
    public void delete(UUID id) {
        ReportRecord entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bản ghi báo cáo"));
        entity.setDeletedAt(LocalDateTime.now());
        repository.save(entity);
    }

    private ReportRecordDto toDto(ReportRecord entity) {
        String orgName = orgUnits.getName(entity.getOrgUnitId());
        return ReportRecordDto.builder()
                .id(entity.getId())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgName)
                .reportCode(entity.getReportCode())
                .reportPeriod(entity.getReportPeriod())
                .reportYear(entity.getReportYear())
                .status(entity.getStatus())
                .reportData(entity.getReportData())
                .notes(entity.getNotes())
                .version(entity.getVersion())
                .createdDate(entity.getCreatedAt())
                .lastModifiedDate(entity.getUpdatedAt())
                .build();
    }
}
