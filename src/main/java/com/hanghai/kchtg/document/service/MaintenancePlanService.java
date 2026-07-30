package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.MaintenancePlanRepository;
import com.hanghai.kchtg.document.repository.MaintenanceReportRepository;
import com.hanghai.kchtg.document.repository.MaintenanceResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenancePlanService {

    private final MaintenancePlanRepository maintenancePlanRepository;
    private final MaintenanceResultRepository maintenanceResultRepository;
    private final MaintenanceReportRepository maintenanceReportRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public MaintenancePlanResponse create(MaintenancePlanCreateRequest request) {
        log.info("Creating MaintenancePlan: {}", request.getEquipment());
        MaintenancePlan maintenancePlan = MaintenancePlan.builder()
                .equipment(request.getEquipment())
                .maintenanceType(request.getMaintenanceType())
                .estimatedStartDate(request.getEstimatedStartDate())
                .estimatedEndDate(request.getEstimatedEndDate())
                .status(request.getStatus())
                .estimatedCost(request.getEstimatedCost())
                .createdBy(request.getCreatedBy())
                .build();
        return toResponse(maintenancePlanRepository.save(maintenancePlan));
    }

    @Transactional(readOnly = true)
    public MaintenancePlanResponse getById(UUID id) {
        MaintenancePlan maintenancePlan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id));
        return toResponse(maintenancePlan);
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findAll() {
        return maintenancePlanRepository.findAll(Sort.by(Sort.Direction.DESC, "createdDate"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<MaintenancePlanResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdDate"));
        return maintenancePlanRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public MaintenancePlanResponse update(UUID id, MaintenancePlanCreateRequest request) {
        MaintenancePlan maintenancePlan = maintenancePlanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id));

        if (request.getEquipment() != null) maintenancePlan.setEquipment(request.getEquipment());
        if (request.getMaintenanceType() != null) maintenancePlan.setMaintenanceType(request.getMaintenanceType());
        if (request.getEstimatedStartDate() != null) maintenancePlan.setEstimatedStartDate(request.getEstimatedStartDate());
        if (request.getEstimatedEndDate() != null) maintenancePlan.setEstimatedEndDate(request.getEstimatedEndDate());
        if (request.getStatus() != null) maintenancePlan.setStatus(request.getStatus());
        if (request.getEstimatedCost() != null) maintenancePlan.setEstimatedCost(request.getEstimatedCost());

        return toResponse(maintenancePlanRepository.save(maintenancePlan));
    }

    @Transactional
    public void delete(UUID id) {
        if (!maintenancePlanRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + id);
        }
        maintenancePlanRepository.deleteById(id);
        log.info("Deleted MaintenancePlan with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByEquipment(String equipment) {
        return maintenancePlanRepository.findByEquipment(equipment)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByStatus(MaintenanceStatus status) {
        return maintenancePlanRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByMaintenanceType(MaintenanceType maintenanceType) {
        return maintenancePlanRepository.findByMaintenanceType(maintenanceType)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<MaintenancePlanResponse> findByNgayBatDauDuKienBetween(LocalDate start, LocalDate end) {
        return maintenancePlanRepository.findByEstimatedStartDateBetween(start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Result Recording ──────────────────────────────────────────────

    @Transactional
    public MaintenanceResultResponse recordResult(MaintenanceResultRequest request) {
        log.info("Recording MaintenanceResult for planId: {}", request.getMaintenancePlanId());
        MaintenancePlan maintenancePlan = maintenancePlanRepository.findById(request.getMaintenancePlanId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy kế hoạch bảo trì với id: " + request.getMaintenancePlanId()));

        MaintenanceResult kqb = MaintenanceResult.builder()
                .maintenancePlan(maintenancePlan)
                .actualStartDate(request.getActualStartDate())
                .actualEndDate(request.getActualEndDate())
                .resultDescription(request.getResultDescription())
                .replacedParts(request.getReplacedParts())
                .downtimeDuration(request.getDowntimeDuration())
                .recorder(request.getRecorder())
                .recordedDate(request.getRecordedDate())
                .build();

        return toResultResponse(maintenanceResultRepository.save(kqb));
    }

    // ── MaintenanceReport ──────────────────────────────────────────────────

    @Transactional
    public MaintenanceReportResponse createReport(MaintenanceReportCreateRequest request) {
        log.info("Creating MaintenanceReport: {}", request.getReportType());
        MaintenanceReport bc = MaintenanceReport.builder()
                .reportType(request.getReportType())
                .periodStart(request.getPeriodStart())
                .periodEnd(request.getPeriodEnd())
                .totalCost(request.getTotalCost())
                .filePath(request.getFilePath())
                .createdBy(request.getCreatedBy())
                .build();
        return toMaintenanceReportResponse(maintenanceReportRepository.save(bc));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private MaintenancePlanResponse toResponse(MaintenancePlan maintenancePlan) {
        return MaintenancePlanResponse.builder()
                .id(maintenancePlan.getId())
                .equipment(maintenancePlan.getEquipment())
                .maintenanceType(maintenancePlan.getMaintenanceType())
                .estimatedStartDate(maintenancePlan.getEstimatedStartDate())
                .estimatedEndDate(maintenancePlan.getEstimatedEndDate())
                .status(maintenancePlan.getStatus())
                .estimatedCost(maintenancePlan.getEstimatedCost())
                .createdBy(maintenancePlan.getCreatedBy())
                .createdDate(maintenancePlan.getCreatedDate())
                .updatedBy(maintenancePlan.getUpdatedBy())
                .updatedDate(maintenancePlan.getUpdatedDate())
                .build();
    }

    private MaintenanceReportResponse toMaintenanceReportResponse(MaintenanceReport bc) {
        return MaintenanceReportResponse.builder()
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

    private MaintenanceResultResponse toResultResponse(MaintenanceResult kqb) {
        return MaintenanceResultResponse.builder()
                .id(kqb.getId())
                .maintenancePlanId(kqb.getMaintenancePlan().getId())
                .actualStartDate(kqb.getActualStartDate())
                .actualEndDate(kqb.getActualEndDate())
                .resultDescription(kqb.getResultDescription())
                .replacedParts(kqb.getReplacedParts())
                .downtimeDuration(kqb.getDowntimeDuration())
                .recorder(kqb.getRecorder())
                .recordedDate(kqb.getRecordedDate())
                .build();
    }
}
