package com.hanghai.kchtg.document.service;

import java.util.UUID;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OperationPlanService {

    private final OperationPlanRepository operationPlanRepository;
    private final OperationDetailRepository operationDetailRepository;
    private final OperationReportRepository operationReportRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public OperationPlanResponse create(OperationPlanCreateRequest request) {
        log.info("Creating OperationPlan: {}", request.getPier());
        OperationPlan operationPlan = OperationPlan.builder()
                .operationDate(request.getOperationDate())
                .pier(request.getPier())
                .equipment(request.getEquipment())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(request.getStatus())
                .createdBy(request.getCreatedBy())
                .build();
        return toResponse(operationPlanRepository.save(operationPlan));
    }

    @Transactional(readOnly = true)
    public OperationPlanResponse getById(UUID id) {
        OperationPlan operationPlan = operationPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id));
        return toResponse(operationPlan);
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findAll() {
        return operationPlanRepository.findAll(Sort.by(Sort.Direction.DESC, "createdDate"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<OperationPlanResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return operationPlanRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public OperationPlanResponse update(UUID id, OperationPlanCreateRequest request) {
        OperationPlan operationPlan = operationPlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id));

        if (request.getOperationDate() != null) operationPlan.setOperationDate(request.getOperationDate());
        if (request.getPier() != null) operationPlan.setPier(request.getPier());
        if (request.getEquipment() != null) operationPlan.setEquipment(request.getEquipment());
        if (request.getStartTime() != null) operationPlan.setStartTime(request.getStartTime());
        if (request.getEndTime() != null) operationPlan.setEndTime(request.getEndTime());
        if (request.getStatus() != null) operationPlan.setStatus(request.getStatus());

        return toResponse(operationPlanRepository.save(operationPlan));
    }

    @Transactional
    public void delete(UUID id) {
        if (!operationPlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kế hoạch vận hành với id: " + id);
        }
        operationPlanRepository.deleteById(id);
        log.info("Deleted OperationPlan with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByOperationDate(LocalDate operationDate) {
        return operationPlanRepository.findByOperationDate(operationDate)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByStatus(OperationStatus status) {
        return operationPlanRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByPier(String pier) {
        return operationPlanRepository.findByPier(pier)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<OperationPlanResponse> findByEquipment(String equipment) {
        return operationPlanRepository.findByEquipment(equipment)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Check for scheduling conflicts (F-129).
     * Returns true if any conflicting schedule is found.
     */
    @Transactional(readOnly = true)
    public boolean hasConflictSchedule(LocalDate operationDate, LocalTime startTime,
                                        LocalTime endTime, String pier, String equipment) {
        List<OperationPlan> conflicts = operationPlanRepository.findConflictSchedule(
                operationDate, startTime, endTime, pier, equipment);
        return !conflicts.isEmpty();
    }

    @Transactional
    public OperationReportResponse createReport(OperationReportCreateRequest request) {
        log.info("Creating OperationReport: {}", request.getReportType());
        OperationReport bc = OperationReport.builder()
                .reportType(request.getReportType())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .totalCost(request.getTotalCost())
                .filePath(request.getFilePath())
                .createdBy(request.getCreatedBy())
                .build();
        return toOperationReportResponse(operationReportRepository.save(bc));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private OperationPlanResponse toResponse(OperationPlan operationPlan) {
        List<OperationDetailResponse> chiTietList = new ArrayList<>();
        if (operationPlan.getOperationDetails() != null) {
            chiTietList = operationPlan.getOperationDetails().stream()
                    .map(vh -> OperationDetailResponse.builder()
                            .id(vh.getId())
                            .description(vh.getDescription())
                            .estimatedVolume(vh.getEstimatedVolume())
                            .actualVolume(vh.getActualVolume())
                            .notes(vh.getNotes())
                            .build())
                    .collect(Collectors.toList());
        }
        return OperationPlanResponse.builder()
                .id(operationPlan.getId())
                .operationDate(operationPlan.getOperationDate())
                .pier(operationPlan.getPier())
                .equipment(operationPlan.getEquipment())
                .startTime(operationPlan.getStartTime())
                .endTime(operationPlan.getEndTime())
                .status(operationPlan.getStatus())
                .createdBy(operationPlan.getCreatedBy())
                .createdDate(operationPlan.getCreatedDate())
                .updatedBy(operationPlan.getUpdatedBy())
                .updatedDate(operationPlan.getUpdatedDate())
                .operationDetails(chiTietList)
                .build();
    }

    private OperationReportResponse toOperationReportResponse(OperationReport bc) {
        return OperationReportResponse.builder()
                .id(bc.getId())
                .reportType(bc.getReportType())
                .periodStart(bc.getPeriodStart())
                .periodEnd(bc.getPeriodEnd())
                .totalCost(bc.getTotalCost())
                .filePath(bc.getFilePath())
                .createdBy(bc.getCreatedBy())
                .createdAt(bc.getCreatedAt())
                .build();
    }
}
