package com.hanghai.kchtg.statistics.service;

import com.hanghai.kchtg.statistics.dto.StatisticsFilter;
import com.hanghai.kchtg.statistics.dto.StatisticsFormRequest;
import com.hanghai.kchtg.statistics.dto.StatisticsFormResponse;
import com.hanghai.kchtg.statistics.dto.StatisticsSummary;
import com.hanghai.kchtg.statistics.entity.StatFormStatus;
import com.hanghai.kchtg.statistics.entity.StatFormType;
import com.hanghai.kchtg.statistics.entity.StatisticsForm;
import com.hanghai.kchtg.statistics.repository.StatisticsFormRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * Service core for statistics form CRUD and aggregation.
 * Covers all 28 biểu (form types) in the chuyên đề module.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StatisticsService {

    private final StatisticsFormRepository repository;

    // -- Create --

    @Transactional
    public StatisticsFormResponse createForm(StatisticsFormRequest request) {
        StatisticsForm entity = mapToEntity(request);
        entity.setFormStatus(StatFormStatus.DRAFT);
        StatisticsForm saved = repository.save(entity);
        log.info("Created statistics form [{}] type={} status=DRAFT",
                saved.getCode(), saved.getFormType());
        return toResponse(saved);
    }

    // -- Read --

    @Transactional(readOnly = true)
    public Optional<StatisticsFormResponse> findById(Long id) {
        return repository.findById(id).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Optional<StatisticsFormResponse> findByCode(String code) {
        return repository.findByFormCode(code).map(this::toResponse);
    }

    /**
     * Paginated list with optional status filter.
     */
    @Transactional(readOnly = true)
    public Page<StatisticsFormResponse> findAll(StatisticsFilter filter) {
        Pageable pageable = PageRequest.of(
                filter.getPage() != null ? filter.getPage() : 0,
                filter.getSize() != null ? filter.getSize() : 20,
                Sort.by("createdAt").descending()
        );

        if (filter.getFormStatus() != null && !filter.getFormStatus().isBlank()) {
            StatFormStatus status = StatFormStatus.valueOf(filter.getFormStatus());
            if (filter.getFormType() != null && !filter.getFormType().isBlank()) {
                return repository.findByFormTypeAndFormStatus(
                        StatFormType.valueOf(filter.getFormType()),
                        status,
                        pageable
                ).map(this::toResponse);
            }
            return repository.findByFormStatus(status, pageable).map(this::toResponse);
        }

        // No filter — return all
        return repository.findAll(pageable).map(this::toResponse);
    }

    /**
     * List all forms of a given type (unsorted, no pagination).
     */
    @Transactional(readOnly = true)
    public List<StatisticsFormResponse> findByFormType(String formType) {
        return repository.findByFormType(StatFormType.valueOf(formType))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // -- Update --

    @Transactional
    public void updateStatus(Long id, String status) {
        StatisticsForm entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("StatisticsForm not found: " + id));
        entity.setFormStatus(StatFormStatus.valueOf(status));
        entity.setUpdatedAt(Instant.now());
        repository.save(entity);
        log.info("Updated form [{}] status -> {}", id, status);
    }

    // -- Counts --

    @Transactional(readOnly = true)
    public Long countByStatus(String status) {
        return repository.countByStatus(StatFormStatus.valueOf(status));
    }

    // -- Summary --

    @Transactional(readOnly = true)
    public StatisticsSummary getSummary() {
        List<StatisticsForm> all = repository.findAll();
        long approved = repository.countByStatus(StatFormStatus.APPROVED);
        long pending = repository.countByStatus(StatFormStatus.DRAFT);

        return StatisticsSummary.builder()
                .totalForms((long) all.size())
                .approvedForms(approved)
                .pendingForms(pending)
                .totalValue(all.stream()
                        .map(StatisticsForm::getTotalValue)
                        .filter(Objects::nonNull)
                        .reduce(BigDecimal.ZERO, BigDecimal::add))
                .build();
    }

    // -- Internal helpers --

    private StatisticsForm mapToEntity(StatisticsFormRequest request) {
        return StatisticsForm.builder()
                .formCode(request.getFormCode())
                .formType(StatFormType.valueOf(request.getFormType()))
                .reportingPeriod(request.getReportingPeriod())
                .periodType(request.getPeriodType())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .totalValue(request.getTotalValue())
                .totalUnits(request.getTotalUnits())
                .portsCount(request.getPortsCount())
                .vesselsCount(request.getVesselsCount())
                .parameters(request.getParameters())
                .approvedBy(request.getApprovedBy())
                .approvedAt(request.getApprovedAt())
                .notes(request.getNotes())
                .build();
    }

    private StatisticsFormResponse toResponse(StatisticsForm entity) {
        return StatisticsFormResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .formCode(entity.getFormCode())
                .formType(entity.getFormType().name())
                .formStatus(entity.getFormStatus().name())
                .reportingPeriod(entity.getReportingPeriod())
                .periodType(entity.getPeriodType())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .totalValue(entity.getTotalValue())
                .totalUnits(entity.getTotalUnits())
                .portsCount(entity.getPortsCount())
                .vesselsCount(entity.getVesselsCount())
                .fileUrl(entity.getFileUrl())
                .approvedBy(entity.getApprovedBy())
                .approvedAt(entity.getApprovedAt())
                .notes(entity.getNotes())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
