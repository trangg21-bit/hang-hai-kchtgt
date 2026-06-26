package com.hanghai.kchtg.datasharing.service;

import com.hanghai.kchtg.datasharing.dto.ShareFilter;
import com.hanghai.kchtg.datasharing.dto.ShareSummary;
import com.hanghai.kchtg.datasharing.dto.SharedDataRequest;
import com.hanghai.kchtg.datasharing.dto.SharedDataResponse;
import com.hanghai.kchtg.datasharing.entity.ShareDataType;
import com.hanghai.kchtg.datasharing.entity.ShareStatus;
import com.hanghai.kchtg.datasharing.entity.SharedData;
import com.hanghai.kchtg.datasharing.repository.SharedDataRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ShareService {
    private final SharedDataRepository repository;

    @Transactional
    public SharedDataResponse share(SharedDataRequest request) {
        SharedData entity = mapToEntity(request);
        entity.setStatus("DRAFT");
        SharedData saved = repository.save(entity);
        log.info("Shared data: code={}, dataType={}", saved.getCode(), saved.getDataType());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Optional<SharedDataResponse> findById(Long id) {
        return repository.findById(id).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Optional<SharedDataResponse> findByCode(String code) {
        return repository.findByCode(code).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<SharedDataResponse> findAll(ShareFilter filter) {
        Pageable pageable = PageRequest.of(
            filter.getPage() != null ? filter.getPage() : 0,
            filter.getSize() != null ? filter.getSize() : 20,
            Sort.by("createdAt").descending()
        );
        ShareStatus status = filter.getShareStatus() != null
            ? ShareStatus.valueOf(filter.getShareStatus()) : ShareStatus.DRAFT;
        return repository.findByShareStatus(status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<SharedDataResponse> findByDataType(String dataType) {
        return repository.findByDataType(ShareDataType.valueOf(dataType))
            .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SharedDataResponse> findBySharedWith(String sharedWith) {
        return repository.findBySharedWith(sharedWith)
            .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void revoke(Long id) {
        SharedData entity = repository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("SharedData not found: " + id));
        entity.setStatus("REVOKED");
        repository.save(entity);
        log.info("Revoked share: {}", id);
    }

    @Transactional(readOnly = true)
    public Long countByStatus(String status) {
        return repository.countByStatus(ShareStatus.valueOf(status));
    }

    @Transactional(readOnly = true)
    public ShareSummary getSummary() {
        ShareSummary summary = ShareSummary.builder()
            .totalShared((long) repository.findAll().size())
            .activeShares(repository.countByStatus(ShareStatus.SHARED))
            .revokedShares(repository.countByStatus(ShareStatus.REVOKED))
            .expiredShares(repository.countByStatus(ShareStatus.EXPIRED))
            .build();
        return summary;
    }

    private SharedData mapToEntity(SharedDataRequest request) {
        return SharedData.builder()
            .dataType(ShareDataType.valueOf(request.getDataType()))
            .shareStatus(ShareStatus.DRAFT)
            .sharedWith(request.getSharedWith())
            .sharedAt(request.getSharedAt())
            .expiresAt(request.getExpiresAt())
            .fileUrl(request.getFileUrl())
            .fileFormat(request.getFileFormat())
            .recordCount(request.getRecordCount())
            .description(request.getDescription())
            .approvedBy(request.getApprovedBy())
            .approvedAt(request.getApprovedAt())
            .build();
    }

    private SharedDataResponse toResponse(SharedData entity) {
        return SharedDataResponse.builder()
            .id(entity.getId())
            .code(entity.getCode())
            .name(entity.getName())
            .dataType(entity.getDataType().name())
            .shareStatus(entity.getStatus())
            .sharedWith(entity.getSharedWith())
            .sharedAt(entity.getSharedAt())
            .expiresAt(entity.getExpiresAt())
            .fileUrl(entity.getFileUrl())
            .fileFormat(entity.getFileFormat())
            .recordCount(entity.getRecordCount())
            .description(entity.getDescription())
            .approvedBy(entity.getApprovedBy())
            .approvedAt(entity.getApprovedAt())
            .createdBy(entity.getCreatedBy())
            .updatedBy(entity.getUpdatedBy())
            .build();
    }
}
