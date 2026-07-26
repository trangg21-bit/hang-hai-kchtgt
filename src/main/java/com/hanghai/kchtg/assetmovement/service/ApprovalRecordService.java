package com.hanghai.kchtg.assetmovement.service;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import com.hanghai.kchtg.assetmovement.dto.ApprovalRecordRequest;
import com.hanghai.kchtg.assetmovement.dto.ApprovalRecordResponse;
import com.hanghai.kchtg.assetmovement.entity.ApprovalResult;
import com.hanghai.kchtg.assetmovement.entity.ApprovalRecord;
import com.hanghai.kchtg.assetmovement.repository.ApprovalRecordRepository;
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
public class ApprovalRecordService {

    private final ApprovalRecordRepository repository;

    @Transactional
    public ApprovalRecordResponse create(ApprovalRecordRequest request) {
        validateRequest(request);

        ApprovalResult result;
        try {
            result = ApprovalResult.valueOf(request.getResult());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("result không hợp lệ: " + request.getResult());
        }

        ApprovalRecord entity = ApprovalRecord.builder()
                .requestId(request.getRequestId())
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .approverName(null)
                .result(result)
                .reason(request.getNotes())
                .approvalDate(Instant.now())
                .description(request.getNotes())
                
                .build();

        ApprovalRecord saved = repository.save(entity);
        return toResponse(saved);
    }

    public ApprovalRecordResponse getById(UUID id) {
        ApprovalRecord entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kết quả lưu phê duyệt với id: " + id));
        return toResponse(entity);
    }

    public Page<ApprovalRecordResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<ApprovalRecordResponse> findByRequestId(UUID requestId, Pageable pageable) {
        if (requestId == null) {
            throw new IllegalArgumentException("requestId không được để trống");
        }
        return repository.findByRequestId(requestId, pageable).map(this::toResponse);
    }

    public Page<ApprovalRecordResponse> findByResult(ApprovalResult result, Pageable pageable) {
        return repository.findByResult(result, pageable).map(this::toResponse);
    }

    public Page<ApprovalRecordResponse> findByRequestIdAndResult(UUID requestId, ApprovalResult result, Pageable pageable) {
        if (requestId == null) {
            throw new IllegalArgumentException("requestId không được để trống");
        }
        return repository.findByRequestIdAndResult(requestId, result, pageable).map(this::toResponse);
    }

    @Transactional
    public ApprovalRecordResponse update(UUID id, ApprovalRecordRequest request) {
        ApprovalRecord entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy kết quả lưu phê duyệt với id: " + id));

        if (request.getResult() != null && !request.getResult().isBlank()) {
            try {
                entity.setResult(ApprovalResult.valueOf(request.getResult()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("result không hợp lệ: " + request.getResult());
            }
        }
        if (request.getNotes() != null) {
            entity.setDescription(request.getNotes());
        }

        ApprovalRecord saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy kết quả lưu phê duyệt với id: " + id);
        }
        repository.deleteById(id);
    }

    private void validateRequest(ApprovalRecordRequest request) {
        if (request.getRequestId() == null) {
            throw new IllegalArgumentException("requestId không được để trống");
        }
        if (request.getResult() == null || request.getResult().isBlank()) {
            throw new IllegalArgumentException("result không được để trống");
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private ApprovalRecordResponse toResponse(ApprovalRecord entity) {
        return ApprovalRecordResponse.builder()
                .id(entity.getId())
                .requestId(entity.getRequestId())
                .requestType(null)
                .result(entity.getResult() != null ? entity.getResult().name() : null)
                .approverName(entity.getApproverName() != null ? entity.getApproverName().toString() : null)
                .notes(entity.getDescription())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
