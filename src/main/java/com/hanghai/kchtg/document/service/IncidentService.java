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

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final ProcessingProgressRepository processingProgressRepository;
    private final IncidentRecordRepository incidentRecordRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public IncidentResponse create(IncidentCreateRequest request) {
        log.info("Creating Incident: {}", request.getLocation());
        LocalDateTime thoiGian = null;
        if (request.getDiscoveryTime() != null && !request.getDiscoveryTime().isBlank()) {
            try {
                thoiGian = java.time.Instant.parse(request.getDiscoveryTime())
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime();
            } catch (Exception e) {
                log.warn("Failed to parse discoveryTime: {}", request.getDiscoveryTime());
            }
        }
        Incident sc = Incident.builder()
                .discoveryTime(thoiGian)
                .location(request.getLocation())
                .description(request.getDescription())
                .severityLevel(request.getSeverityLevel())
                .processingStatus(request.getProcessingStatus() != null ? request.getProcessingStatus() : ProcessingStatus.TIEP_NHAN)
                .reporter(request.getReporter())
                .build();
        return toResponse(Objects.requireNonNull(incidentRepository.save(sc)));
    }

    @Transactional(readOnly = true)
    public IncidentResponse getById(UUID id) {
        Incident sc = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));
        return toResponse(sc);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findAll() {
        return incidentRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return incidentRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public IncidentResponse update(UUID id, IncidentCreateRequest request) {
        Incident sc = incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + id));

        if (request.getDiscoveryTime() != null && !request.getDiscoveryTime().isBlank()) {
            try {
                sc.setDiscoveryTime(java.time.Instant.parse(request.getDiscoveryTime())
                        .atZone(java.time.ZoneId.systemDefault())
                        .toLocalDateTime());
            } catch (Exception e) {
                log.warn("Failed to parse discoveryTime: {}", request.getDiscoveryTime());
            }
        }
        if (request.getLocation() != null) sc.setLocation(request.getLocation());
        if (request.getDescription() != null) sc.setDescription(request.getDescription());
        if (request.getSeverityLevel() != null) sc.setSeverityLevel(request.getSeverityLevel());
        if (request.getProcessingStatus() != null) sc.setProcessingStatus(request.getProcessingStatus());
        if (request.getReporter() != null) sc.setReporter(request.getReporter());
 
        return toResponse(Objects.requireNonNull(incidentRepository.save(sc)));
    }

    @Transactional
    public void delete(UUID id) {
        if (!incidentRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy sự cố với id: " + id);
        }
        incidentRepository.deleteById(id);
        log.info("Deleted Incident with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<IncidentResponse> findByProcessingStatus(ProcessingStatus status) {
        return incidentRepository.findByProcessingStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> findBySeverityLevel(SeverityLevel severity) {
        return incidentRepository.findBySeverityLevel(severity)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> searchByViTriContaining(String location, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return incidentRepository.findByLocationContainingIgnoreCase(location, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<IncidentResponse> searchByMoTaContaining(String description, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return incidentRepository.findByDescriptionContainingIgnoreCase(description, pageable).map(this::toResponse);
    }

    // ── Progress Updates ──────────────────────────────────────────────

    @Transactional
    public ProcessingProgressResponse addProgress(ProcessingProgressRequest request) {
        log.info("Adding ProcessingProgress for incidentId: {}", request.getIncidentId());
        Incident sc = incidentRepository.findById(request.getIncidentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sự cố với id: " + request.getIncidentId()));

        ProcessingProgress td = ProcessingProgress.builder()
                .incident(sc)
                .updatedAt(request.getUpdatedAt() != null ? request.getUpdatedAt() : LocalDateTime.now())
                .progressDescription(request.getProgressDescription())
                .updatedBy(request.getUpdatedBy())
                .build();

        return toTienDoResponse(processingProgressRepository.save(td));
    }

    @Transactional(readOnly = true)
    public List<ProcessingProgressResponse> getProgressByIncident(java.util.UUID id) {
        return processingProgressRepository.findByIncidentId(id).stream()
                .map(this::toTienDoResponse).collect(Collectors.toList());
    }

    // ── IncidentRecord ───────────────────────────────────────────────────

    @Transactional
    public IncidentRecordResponse createBienBan(IncidentRecordCreateRequest request) {
        log.info("Creating IncidentRecord for incidentId: {}", request.getIncidentId());
        IncidentRecord bb = IncidentRecord.builder()
                .incidentId(request.getIncidentId())
                .detailedDescription(request.getDetailedDescription())
                .remedialMeasures(request.getRemedialMeasures())
                .processingEndTime(request.getProcessingEndTime())
                .recorder(request.getRecorder())
                .attachedDocuments(request.getAttachedDocuments())
                .build();
        return toBienBanResponse(incidentRecordRepository.save(bb));
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private IncidentResponse toResponse(Incident sc) {
        List<ProcessingProgressResponse> progressList = new ArrayList<>();
        if (sc.getProcessingProgress() != null) {
            progressList = sc.getProcessingProgress().stream()
                    .map(t -> ProcessingProgressResponse.builder()
                            .id(t.getId())
                            .incidentId(t.getIncident().getId())
                            .updatedAt(t.getUpdatedAt())
                            .progressDescription(t.getProgressDescription())
                            .updatedBy(t.getUpdatedBy())
                            .build())
                    .collect(Collectors.toList());
        }
        return IncidentResponse.builder()
                .id(sc.getId())
                .discoveryTime(sc.getDiscoveryTime())
                .location(sc.getLocation())
                .severityLevel(sc.getSeverityLevel())
                .description(sc.getDescription())
                .processingStatus(sc.getProcessingStatus())
                .reporter(sc.getReporter())
                .createdAt(sc.getCreatedAt())
                .updatedBy(sc.getUpdatedBy())
                .updatedAt(sc.getUpdatedAt())
                .processingProgress(progressList)
                .build();
    }

    private ProcessingProgressResponse toTienDoResponse(ProcessingProgress td) {
        return ProcessingProgressResponse.builder()
                .id(td.getId())
                .incidentId(td.getIncident().getId())
                .updatedAt(td.getUpdatedAt())
                .progressDescription(td.getProgressDescription())
                .updatedBy(td.getUpdatedBy())
                .build();
    }

    private IncidentRecordResponse toBienBanResponse(IncidentRecord bb) {
        return IncidentRecordResponse.builder()
                .id(bb.getId())
                .incidentId(bb.getIncidentId())
                .detailedDescription(bb.getDetailedDescription())
                .remedialMeasures(bb.getRemedialMeasures())
                .processingEndTime(bb.getProcessingEndTime())
                .recorder(bb.getRecorder())
                .recordedAt(bb.getRecordedAt())
                .attachedDocuments(bb.getAttachedDocuments())
                .build();
    }
}
