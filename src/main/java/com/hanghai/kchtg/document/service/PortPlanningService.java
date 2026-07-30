package com.hanghai.kchtg.document.service;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.LookupLog;
import com.hanghai.kchtg.document.entity.PlanningFile;
import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.entity.PortPlanning;
import com.hanghai.kchtg.document.repository.LookupLogRepository;
import com.hanghai.kchtg.document.repository.PlanningCategoryRepository;
import com.hanghai.kchtg.document.repository.PlanningFileRepository;
import com.hanghai.kchtg.document.repository.PortPlanningRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class PortPlanningService {

    private final PortPlanningRepository portPlanningRepository;
    private final PlanningCategoryRepository planningCategoryRepository;
    private final PlanningFileRepository planningFileRepository;
    private final LookupLogRepository lookupLogRepository;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public PortPlanningResponse create(PortPlanningCreateRequest request) {
        log.info("Creating PortPlanning: {}", request.getProjectName());

        if (request.getProjectName() != null && portPlanningRepository.existsByProjectName(request.getProjectName())) {
            throw new IllegalArgumentException("Tên đồ án quy hoạch bến cảng đã tồn tại: " + request.getProjectName());
        }

        PortPlanning planning = PortPlanning.builder()
                .projectName(request.getProjectName())
                .approvalAuthority(request.getApprovalAuthority())
                .approvalDate(request.getApprovalDate())
                .applicationScope(request.getApplicationScope())
                .mapScale(request.getMapScale())
                .status(request.getStatus())
                .filePath(request.getFilePath())
                .createdBy(request.getCreatedBy())
                .build();
        return toResponse(Objects.requireNonNull(portPlanningRepository.save(planning)));
    }

    @Transactional(readOnly = true)
    public PortPlanningResponse getById(UUID id) {
        PortPlanning planning = portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
        return toResponse(planning);
    }

    @Transactional(readOnly = true)
    public List<PortPlanningResponse> findAll() {
        return portPlanningRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PortPlanningResponse> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return portPlanningRepository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public PortPlanningResponse update(UUID id, PortPlanningCreateRequest request) {
        PortPlanning planning = portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));

        if (request.getProjectName() != null) {
            if (portPlanningRepository.existsByProjectNameAndIdNot(request.getProjectName(), id)) {
                throw new IllegalArgumentException("Tên đồ án quy hoạch bến cảng đã tồn tại: " + request.getProjectName());
            }
            planning.setProjectName(request.getProjectName());
        }
        if (request.getApprovalAuthority() != null) planning.setApprovalAuthority(request.getApprovalAuthority());
        if (request.getApprovalDate() != null) planning.setApprovalDate(request.getApprovalDate());
        if (request.getApplicationScope() != null) planning.setApplicationScope(request.getApplicationScope());
        if (request.getMapScale() != null) planning.setMapScale(request.getMapScale());
        if (request.getStatus() != null) planning.setStatus(request.getStatus());
        if (request.getFilePath() != null) planning.setFilePath(request.getFilePath());
        if (request.getCreatedBy() != null) planning.setUpdatedBy(request.getCreatedBy());

        return toResponse(Objects.requireNonNull(portPlanningRepository.save(planning)));
    }

    @Transactional
    public void delete(UUID id) {
        if (!portPlanningRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id);
        }
        portPlanningRepository.deleteById(id);
        log.info("Deleted PortPlanning with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PortPlanningResponse> findByStatus(PlanningStatus status) {
        return portPlanningRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PortPlanningResponse> searchByProjectNameContaining(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return portPlanningRepository.findByProjectNameContaining(keyword, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<PortPlanningResponse> findByApprovalDateBetween(LocalDate start, LocalDate end) {
        return portPlanningRepository.findByApprovalDateBetween(start, end)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Dynamic search with keyword, status, year range (F-133).
     */
    @Transactional(readOnly = true)
    public LookupResultResponse traCuu(String keyword, String status, LocalDate yearStart,
                                        LocalDate yearEnd, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        PlanningStatus statusEnum = (status != null && !status.isEmpty())
                ? PlanningStatus.valueOf(status) : null;

        String keywordLike = (keyword != null && !keyword.trim().isEmpty()) ? "%" + keyword.trim().toLowerCase() + "%" : null;

        Page<PortPlanning> result = portPlanningRepository.findAllWithSearch(
                keywordLike, statusEnum, yearStart, yearEnd, pageable);
        return LookupResultResponse.builder()
                .results(result.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .currentPage(result.getNumber())
                .pageSize(result.getSize())
                .build();
    }

    // ── Version Management ────────────────────────────────────────────

    @Transactional
    public PortPlanningResponse updateStatus(UUID id, PlanningStatus status) {
        PortPlanning planning = portPlanningRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy quy hoạch với id: " + id));
        planning.setStatus(status);
        return toResponse(portPlanningRepository.save(planning));
    }

    // ── File Management (F-132) ──────────────────────────────────────

    @Transactional
    public PlanningFileResponse uploadFile(PlanningFileCreateRequest request) {
        log.info("Uploading PlanningFile for planningId: {}", request.getPortPlanningId());
        PlanningFile fq = PlanningFile.builder()
                .portPlanningId(request.getPortPlanningId())
                .fileName(request.getFileName())
                .fileType(request.getFileType())
                .filePath(request.getFilePath())
                .fileSize(request.getFileSize())
                .uploadedBy(request.getUploadedBy())
                .build();
        return toPlanningFileResponse(planningFileRepository.save(fq));
    }

    // ── Search Logging (F-133) ───────────────────────────────────────

    @Transactional
    public void logTraCuu(LookupLog traCuuLog) {
        log.info("Logging LookupLog: {}", traCuuLog.getKeyword());
        lookupLogRepository.save(traCuuLog);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private PortPlanningResponse toResponse(PortPlanning planning) {
        List<PlanningCategoryResponse> hamMucList = new ArrayList<>();
        if (planning.getPlanningCategories() != null) {
            hamMucList = planning.getPlanningCategories().stream()
                    .map(hm -> PlanningCategoryResponse.builder()
                            .id(hm.getId())
                            .categoryName(hm.getCategoryName())
                            .unitOfMeasure(hm.getUnitOfMeasure())
                            .plannedValue(hm.getPlannedValue())
                            .actualValue(hm.getActualValue())
                            .status(hm.getStatus())
                            .build())
                    .collect(Collectors.toList());
        }
        return PortPlanningResponse.builder()
                .id(planning.getId())
                .projectName(planning.getProjectName())
                .approvalAuthority(planning.getApprovalAuthority())
                .approvalDate(planning.getApprovalDate())
                .applicationScope(planning.getApplicationScope())
                .mapScale(planning.getMapScale())
                .status(planning.getStatus())
                .filePath(planning.getFilePath())
                .createdBy(planning.getCreatedBy())
                .createdAt(planning.getCreatedAt())
                .updatedBy(planning.getUpdatedBy())
                .updatedAt(planning.getUpdatedAt())
                .planningCategories(hamMucList)
                .build();
    }

    private PlanningFileResponse toPlanningFileResponse(PlanningFile fq) {
        return PlanningFileResponse.builder()
                .id(fq.getId())
                .portPlanningId(fq.getPortPlanningId())
                .fileName(fq.getFileName())
                .fileType(fq.getFileType())
                .filePath(fq.getFilePath())
                .fileSize(fq.getFileSize())
                .uploadedAt(fq.getUploadedAt())
                .uploadedBy(fq.getUploadedBy())
                .build();
    }
}
