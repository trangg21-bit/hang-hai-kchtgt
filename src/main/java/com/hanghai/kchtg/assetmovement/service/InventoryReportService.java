package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InventoryReportRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryReportResponse;
import com.hanghai.kchtg.assetmovement.entity.InventoryReport;
import com.hanghai.kchtg.assetmovement.entity.ReportStatus;
import com.hanghai.kchtg.assetmovement.repository.InventoryReportRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryReportService {
    private final InventoryReportRepository repository;
    private final UserRepository userRepository;

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName())
                    .map(User::getId)
                    .orElse(null);
        }
        return null;
    }

    @Transactional
    public InventoryReportResponse create(InventoryReportRequest request) {
        UUID currentUserId = getCurrentUserId();
        InventoryReport entity = InventoryReport.builder()
                .planId(request.getPlanId())
                .totalAssets(request.getTongSoLuong())
                .surplusCount(request.getSoLuongChenhLech() > 0 ? request.getSoLuongChenhLech() : 0)
                .missingCount(request.getSoLuongChenhLech() < 0 ? -request.getSoLuongChenhLech() : 0)
                .description(request.getDescription())
                .status(ReportStatus.PENDING)
                .createdBy(currentUserId != null ? currentUserId.toString() : null)
                .updatedBy(currentUserId != null ? currentUserId.toString() : null)
                
                .build();
        InventoryReport saved = repository.save(entity);
        return toResponse(saved);
    }

    public InventoryReportResponse getById(UUID id) {
        InventoryReport entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bÃ¡o cÃ¡o kiá»ƒm kÃª với id: " + id));
        return toResponse(entity);
    }

    public Page<InventoryReportResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<InventoryReportResponse> findByPlanId(UUID planId, Pageable pageable) {
        if (planId == null)
            return findAll(pageable);
        return repository.findByPlanId(planId, pageable).map(this::toResponse);
    }

    @Transactional
    public InventoryReportResponse update(UUID id, InventoryReportRequest request) {
        InventoryReport entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bÃ¡o cÃ¡o kiá»ƒm kÃª với id: " + id));
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        InventoryReport saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id))
            throw new EntityNotFoundException("Không tìm thấy bÃ¡o cÃ¡o kiá»ƒm kÃª với id: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public InventoryReportResponse approve(UUID id, String remarks) {
        InventoryReport entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bÃ¡o cÃ¡o kiá»ƒm kÃª với id: " + id));
        entity.setStatus(ReportStatus.APPROVED);
        entity.setApprovedBy(getCurrentUserId());
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        InventoryReport saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public InventoryReportResponse reject(UUID id, String remarks) {
        InventoryReport entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bÃ¡o cÃ¡o kiá»ƒm kÃª với id: " + id));
        entity.setStatus(ReportStatus.REJECTED);
        entity.setUnapprovedBy(getCurrentUserId());
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        InventoryReport saved = repository.save(entity);
        return toResponse(saved);
    }

    private InventoryReportResponse toResponse(InventoryReport entity) {
        String createdByName = null;
        if (entity.getCreatedBy() != null) {
            java.util.Optional<User> userOpt = userRepository.findById(java.util.UUID.fromString(entity.getCreatedBy()));
            if (userOpt.isPresent()) {
                createdByName = userOpt.get().getFullName();
                if (createdByName == null || createdByName.isEmpty()) {
                    createdByName = userOpt.get().getUsername();
                }
            }
        }

        return InventoryReportResponse.builder()
                .id(entity.getId())
                .planId(entity.getPlanId())
                .tenBaoCao(null)
                .tongSoLuong(entity.getTotalAssets() != null ? entity.getTotalAssets() : 0)
                .soLuongChenhLech(entity.getSurplusCount() != null ? entity.getSurplusCount() - entity.getMissingCount() : 0)
                .result(entity.getStatus() != null ? entity.getStatus().name() : null)
                .description(entity.getDescription())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private java.time.LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null)
            return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
