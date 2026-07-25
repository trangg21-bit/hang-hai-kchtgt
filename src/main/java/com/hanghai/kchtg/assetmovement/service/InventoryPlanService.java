package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InventoryPlanRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryPlanResponse;
import com.hanghai.kchtg.assetmovement.entity.InventoryPlan;
import com.hanghai.kchtg.assetmovement.entity.PlanStatus;
import com.hanghai.kchtg.assetmovement.repository.InventoryPlanRepository;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryPlanService {
    private final InventoryPlanRepository repository;
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
    public InventoryPlanResponse create(InventoryPlanRequest request) {
        if (request.getStartDate() != null && request.getEndDate() != null) {
            LocalDate startDate = LocalDate.ofInstant(request.getStartDate(), ZoneId.systemDefault());
            LocalDate endDate = LocalDate.ofInstant(request.getEndDate(), ZoneId.systemDefault());
            if (startDate.isAfter(endDate)) {
                throw new IllegalArgumentException("NgÃ y báº¯t Ä‘áº§u khÃ´ng Ä‘Æ°á»£c lá»›n hÆ¡n ngÃ y káº¿t thÃºc");
            }
        }
        UUID currentUserId = getCurrentUserId();
        InventoryPlan entity = InventoryPlan.builder()
                .planName(request.getPlanName())
                .inventoryType(request.getInventoryType())
                .scope(request.getScope())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .inventoryLeader(request.getInventoryLeader())
                .description(request.getDescription())
                .status(PlanStatus.PENDING)
                .createdBy(currentUserId != null ? currentUserId.toString() : null)
                .updatedBy(currentUserId != null ? currentUserId.toString() : null)
                
                .build();
        InventoryPlan saved = repository.save(entity);
        return toResponse(saved);
    }

    public InventoryPlanResponse getById(UUID id) {
        InventoryPlan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id));
        return toResponse(entity);
    }

    public Page<InventoryPlanResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<InventoryPlanResponse> findByStatus(PlanStatus status, Pageable pageable) {
        if (status == null)
            return findAll(pageable);
        return repository.findByStatus(status, pageable).map(this::toResponse);
    }

    @Transactional
    public InventoryPlanResponse update(UUID id, InventoryPlanRequest request) {
        InventoryPlan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id));
        if (request.getScope() != null)
            entity.setScope(request.getScope());
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        if (request.getPlanName() != null)
            entity.setPlanName(request.getPlanName());
        InventoryPlan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id))
            throw new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id);
        repository.deleteById(id);
    }

    public long countByStatus(PlanStatus status) {
        return repository.countByStatus(status);
    }

    @Transactional
    public InventoryPlanResponse approve(UUID id, String remarks) {
        InventoryPlan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id));
        entity.setStatus(PlanStatus.APPROVED);
        entity.setApprovedBy(getCurrentUserId());
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        InventoryPlan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public InventoryPlanResponse reject(UUID id, String remarks) {
        InventoryPlan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id));
        entity.setStatus(PlanStatus.REJECTED);
        entity.setUnapprovedBy(getCurrentUserId());
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        InventoryPlan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public InventoryPlanResponse startExecution(UUID id) {
        InventoryPlan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id));
        entity.setStatus(PlanStatus.IN_PROGRESS);
        InventoryPlan saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public InventoryPlanResponse completeExecution(UUID id) {
        InventoryPlan entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy káº¿ hoáº¡ch kiá»ƒm kÃª với id: " + id));
        entity.setStatus(PlanStatus.COMPLETED);
        InventoryPlan saved = repository.save(entity);
        return toResponse(saved);
    }

    private InventoryPlanResponse toResponse(InventoryPlan entity) {
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

        return InventoryPlanResponse.builder()
                .id(entity.getId())
                .planName(entity.getPlanName())
                .description(entity.getDescription())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null)
            return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }
}
