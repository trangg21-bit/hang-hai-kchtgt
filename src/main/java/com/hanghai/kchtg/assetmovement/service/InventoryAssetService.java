package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InventoryAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InventoryAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.InventoryAsset;
import com.hanghai.kchtg.assetmovement.entity.InventoryStatus;
import com.hanghai.kchtg.assetmovement.repository.InventoryAssetRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InventoryAssetService {
    private final InventoryAssetRepository repository;

    @Transactional
    public InventoryAssetResponse create(InventoryAssetRequest request) {
        InventoryAsset entity = InventoryAsset.builder()
                .planId(request.getPlanId())
                .assetId(request.getAssetId())
                .inventoryStatus(parseInventoryStatus(request.getInventoryStatus()))
                .notes(request.getDescription())
                
                .build();
        InventoryAsset saved = repository.save(entity);
        return toResponse(saved);
    }

    public InventoryAssetResponse getById(UUID id) {
        InventoryAsset entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kiểm kê với id: " + id));
        return toResponse(entity);
    }

    public Page<InventoryAssetResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<InventoryAssetResponse> findByPlanId(UUID planId, Pageable pageable) {
        if (planId == null) return findAll(pageable);
        return repository.findByPlanId(planId, pageable).map(this::toResponse);
    }

    public Page<InventoryAssetResponse> findByAssetId(UUID assetId, Pageable pageable) {
        if (assetId == null) return findAll(pageable);
        return repository.findByAssetId(assetId, pageable).map(this::toResponse);
    }

    public Page<InventoryAssetResponse> findByStatus(InventoryStatus status, Pageable pageable) {
        if (status == null) return findAll(pageable);
        return repository.findByInventoryStatus(status, pageable).map(this::toResponse);
    }

    public Page<InventoryAssetResponse> findByPlanIdAndTrangThai(UUID planId, InventoryStatus status, Pageable pageable) {
        return repository.findByPlanIdAndInventoryStatus(planId, status, pageable).map(this::toResponse);
    }

    @Transactional
    public InventoryAssetResponse update(UUID id, InventoryAssetRequest request) {
        InventoryAsset entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kiểm kê với id: " + id));
        if (request.getInventoryStatus() != null) entity.setInventoryStatus(parseInventoryStatus(request.getInventoryStatus()));
        if (request.getDescription() != null) entity.setNotes(request.getDescription());
        InventoryAsset saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy tài sản kiểm kê với id: " + id);
        repository.deleteById(id);
    }

    private InventoryAssetResponse toResponse(InventoryAsset entity) {
        return InventoryAssetResponse.builder()
                .id(entity.getId())
                .planId(entity.getPlanId())
                .assetId(entity.getAssetId())
                .assetName(null)
                .inventoryStatus(entity.getInventoryStatus() != null ? entity.getInventoryStatus().name() : null)
                .soLuongKyHienTai(entity.getBookValue() != null ? entity.getBookValue().intValue() : 0)
                .soLuongKyThucTe(entity.getActualValue() != null ? entity.getActualValue().intValue() : 0)
                .description(entity.getNotes())
                .createdBy(entity.getCreatedBy())
                .createdByName(null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private InventoryStatus parseInventoryStatus(String value) {
        if (value == null) return null;
        try {
            return InventoryStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            return InventoryStatus.UNCHECKED;
        }
    }
}
