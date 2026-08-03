package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.InfraAssetRequest;
import com.hanghai.kchtg.assetmovement.dto.InfraAssetResponse;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.assetmovement.entity.InfraAsset;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
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
public class InfraAssetService {
    private final InfraAssetRepository repository;

    @Transactional
    public InfraAssetResponse create(InfraAssetRequest request) {
        InfraAsset entity = InfraAsset.builder()
                .assetCode(request.getAssetCode())
                .assetName(request.getAssetName())
                .assetType(null)
                .location(request.getLocation())
                .technicalSpecs(request.getTechnicalSpecs())
                .fundingSource(request.getFundingSource())
                .originalValue(request.getOriginalValue())
                .status(AssetStatus.MANAGED)

                .build();
        InfraAsset saved = repository.save(entity);
        return toResponse(saved);
    }

    public InfraAssetResponse getById(UUID id) {
        InfraAsset entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kết cấu hạ tầng với id: " + id));
        return toResponse(entity);
    }

    public Page<InfraAssetResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    @Transactional
    public InfraAssetResponse update(UUID id, InfraAssetRequest request) {
        InfraAsset entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy tài sản kết cấu hạ tầng với id: " + id));
        if (request.getAssetName() != null) entity.setAssetName(request.getAssetName());
        if (request.getLocation() != null) entity.setLocation(request.getLocation());
        InfraAsset saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy tài sản kết cấu hạ tầng với id: " + id);
        repository.deleteById(id);
    }

    public Page<InfraAssetResponse> findByAssetCode(String assetCode, Pageable pageable) {
        if (assetCode == null) return findAll(pageable);
        return repository.findByAssetCode(assetCode, pageable).map(this::toResponse);
    }

    public long countByStatus(String status) {
        return repository.countByStatus(AssetStatus.valueOf(status));
    }

    private InfraAssetResponse toResponse(InfraAsset entity) {
        return InfraAssetResponse.builder()
                .id(entity.getId())
                .assetCode(entity.getAssetCode())
                .assetName(entity.getAssetName())
                .assetType(entity.getAssetType() != null ? entity.getAssetType().name() : null)
                .location(entity.getLocation())
                .technicalSpecs(entity.getTechnicalSpecs())
                .fundingSource(entity.getFundingSource())
                .originalValue(entity.getOriginalValue())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
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
}
