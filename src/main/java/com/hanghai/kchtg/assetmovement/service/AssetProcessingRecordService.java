package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.AssetProcessingRecordRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetProcessingRecordResponse;
import com.hanghai.kchtg.assetmovement.entity.AssetProcessingRecord;
import com.hanghai.kchtg.assetmovement.entity.ProcessingRecordStatus;
import com.hanghai.kchtg.assetmovement.entity.ProcessingType;
import com.hanghai.kchtg.assetmovement.repository.AssetProcessingRecordRepository;
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
public class AssetProcessingRecordService {
    private final AssetProcessingRecordRepository repository;

    @Transactional
    public AssetProcessingRecordResponse create(AssetProcessingRecordRequest request) {
        AssetProcessingRecord entity = AssetProcessingRecord.builder()
                .assetId(request.getAssetId())
                .processingType(parseProcessingType(request.getProcessingType()))
                .description(request.getDescription())
                .status(ProcessingRecordStatus.PENDING)

                .build();
        AssetProcessingRecord saved = repository.save(entity);
        return toResponse(saved);
    }

    public AssetProcessingRecordResponse getById(UUID id) {
        AssetProcessingRecord entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hồ sơ xử lý tài sản với id: " + id));
        return toResponse(entity);
    }

    public Page<AssetProcessingRecordResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<AssetProcessingRecordResponse> findByAssetId(UUID assetId, Pageable pageable) {
        if (assetId == null) return findAll(pageable);
        return repository.findByAssetId(assetId, pageable).map(this::toResponse);
    }

    public Page<AssetProcessingRecordResponse> findByProcessingType(ProcessingType processingType, Pageable pageable) {
        if (processingType == null) return findAll(pageable);
        return repository.findByProcessingType(processingType, pageable).map(this::toResponse);
    }

    public Page<AssetProcessingRecordResponse> findByAssetIdAndProcessingType(UUID assetId, ProcessingType processingType, Pageable pageable) {
        return repository.findByAssetIdAndProcessingType(assetId, processingType, pageable).map(this::toResponse);
    }

    @Transactional
    public AssetProcessingRecordResponse update(UUID id, AssetProcessingRecordRequest request) {
        AssetProcessingRecord entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hồ sơ xử lý tài sản với id: " + id));
        if (request.getProcessingType() != null) entity.setProcessingType(parseProcessingType(request.getProcessingType()));
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        AssetProcessingRecord saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy hồ sơ xử lý tài sản với id: " + id);
        repository.deleteById(id);
    }

    private AssetProcessingRecordResponse toResponse(AssetProcessingRecord entity) {
        return AssetProcessingRecordResponse.builder()
                .id(entity.getId())
                .assetId(entity.getAssetId())
                .assetName(null)
                .processingType(entity.getProcessingType() != null ? entity.getProcessingType().name() : null)
                .description(entity.getDescription())
                .documentStatus(entity.getStatus() != null ? entity.getStatus().name() : null)
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

    private ProcessingType parseProcessingType(String value) {
        if (value == null) return null;
        try {
            return ProcessingType.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
