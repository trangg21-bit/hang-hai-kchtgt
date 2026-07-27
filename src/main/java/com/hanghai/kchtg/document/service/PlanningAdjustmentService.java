package com.hanghai.kchtg.document.service;

import java.util.UUID;

import com.hanghai.kchtg.document.dto.*;
import com.hanghai.kchtg.document.entity.*;
import com.hanghai.kchtg.document.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlanningAdjustmentService {

    private final PlanningAdjustmentRepository planningAdjustmentRepository;
    private final AdjustmentApprovalRepository adjustmentApprovalRepository;
    private final PortPlanningService portPlanningService;

    // ── CRUD ──────────────────────────────────────────────────────────

    @Transactional
    public PlanningAdjustmentResponse create(PlanningAdjustmentCreateRequest request) {
        log.info("Creating PlanningAdjustment for planningId: {}", request.getPlanningId());
        PlanningAdjustment adjustment = PlanningAdjustment.builder()
                .portPlanning(PortPlanning.builder().id(request.getPlanningId()).build())
                .adjustmentType(request.getAdjustmentType())
                .reason(request.getReason())
                .detailedDescription(request.getDetailedDescription())
                .affectedScope(request.getAffectedScope())
                .status(request.getStatus() != null ? request.getStatus() : AdjustmentStatus.CHO_DOI_PHUY)
                .registrant(request.getRegistrant())
                .registeredAt(request.getRegisteredAt())
                .build();
        return toResponse(planningAdjustmentRepository.save(adjustment));
    }

    @Transactional(readOnly = true)
    public PlanningAdjustmentResponse getById(UUID id) {
        PlanningAdjustment adjustment = planningAdjustmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + id));
        return toResponse(adjustment);
    }

    @Transactional(readOnly = true)
    public List<PlanningAdjustmentResponse> findAll() {
        return planningAdjustmentRepository.findAll()
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PlanningAdjustmentResponse> findByPlanningId(UUID quyHoachId) {
        return planningAdjustmentRepository.findByPortPlanningId(quyHoachId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public PlanningAdjustmentResponse update(UUID id, PlanningAdjustmentCreateRequest request) {
        PlanningAdjustment adjustment = planningAdjustmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + id));

        if (request.getAdjustmentType() != null) adjustment.setAdjustmentType(request.getAdjustmentType());
        if (request.getReason() != null) adjustment.setReason(request.getReason());
        if (request.getDetailedDescription() != null) adjustment.setDetailedDescription(request.getDetailedDescription());
        if (request.getAffectedScope() != null) adjustment.setAffectedScope(request.getAffectedScope());
        if (request.getStatus() != null) adjustment.setStatus(request.getStatus());
        if (request.getRegistrant() != null) adjustment.setRegistrant(request.getRegistrant());
        if (request.getRegisteredAt() != null) adjustment.setRegisteredAt(request.getRegisteredAt());

        return toResponse(planningAdjustmentRepository.save(adjustment));
    }

    @Transactional
    public void delete(UUID id) {
        if (!planningAdjustmentRepository.existsById(id)) {
            throw new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + id);
        }
        planningAdjustmentRepository.deleteById(id);
        log.info("Deleted PlanningAdjustment with id: {}", id);
    }

    // ── Search / Filter ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PlanningAdjustmentResponse> findByStatus(AdjustmentStatus status) {
        return planningAdjustmentRepository.findByStatus(status)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ── Approval Workflow (F-134) ──────────────────────────────────────

    @Transactional
    public AdjustmentApprovalResponse addApproval(UUID dieuChinhId, AdjustmentApprovalRequest request) {
        log.info("Adding AdjustmentApproval for dieuChinhId: {}", dieuChinhId);
        PlanningAdjustment adjustment = planningAdjustmentRepository.findById(dieuChinhId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy điều chỉnh với id: " + dieuChinhId));

        AdjustmentApproval pd = AdjustmentApproval.builder()
                .planningAdjustment(adjustment)
                .approvalLevel(request.getApprovalLevel())
                .status(request.getStatus())
                .approver(request.getApprover())
                .approvalDate(request.getApprovalDate())
                .notes(request.getNotes())
                .build();

        AdjustmentApproval saved = adjustmentApprovalRepository.save(pd);

        // Auto-update adjustment status to approved if approval status is positive
        if ("DA_APPROVED".equals(request.getStatus())) {
            adjustment.setStatus(AdjustmentStatus.DA_APPROVED);
            planningAdjustmentRepository.save(adjustment);
        }

        return toApprovalResponse(saved);
    }

    // ── Helpers ───────────────────────────────────────────────────────

    private PlanningAdjustmentResponse toResponse(PlanningAdjustment adjustment) {
        List<AdjustmentApprovalResponse> pheDuyetList = new ArrayList<>();
        if (adjustment.getApprovals() != null) {
            pheDuyetList = adjustment.getApprovals().stream()
                    .map(pd -> AdjustmentApprovalResponse.builder()
                            .id(pd.getId())
                            .planningAdjustmentId(pd.getPlanningAdjustment().getId())
                            .approvalLevel(pd.getApprovalLevel())
                            .status(pd.getStatus())
                            .approver(pd.getApprover())
                            .approvalDate(pd.getApprovalDate())
                            .notes(pd.getNotes())
                            .build())
                    .collect(Collectors.toList());
        }
        return PlanningAdjustmentResponse.builder()
                .id(adjustment.getId())
                .planningId(adjustment.getPortPlanning().getId())
                .adjustmentType(adjustment.getAdjustmentType())
                .reason(adjustment.getReason())
                .detailedDescription(adjustment.getDetailedDescription())
                .affectedScope(adjustment.getAffectedScope())
                .status(adjustment.getStatus())
                .registrant(adjustment.getRegistrant())
                .registeredAt(adjustment.getRegisteredAt())
                .updatedAt(adjustment.getUpdatedAt())
                .approvals(pheDuyetList)
                .build();
    }

    private AdjustmentApprovalResponse toApprovalResponse(AdjustmentApproval pd) {
        return AdjustmentApprovalResponse.builder()
                .id(pd.getId())
                .planningAdjustmentId(pd.getPlanningAdjustment().getId())
                .approvalLevel(pd.getApprovalLevel())
                .status(pd.getStatus())
                .approver(pd.getApprover())
                .approvalDate(pd.getApprovalDate())
                .notes(pd.getNotes())
                .build();
    }
}
