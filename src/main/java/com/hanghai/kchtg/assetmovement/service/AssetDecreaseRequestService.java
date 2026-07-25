package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.AssetDecreaseRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetDecreaseRequestResponse;
import com.hanghai.kchtg.assetmovement.entity.DecreaseReason;
import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.assetmovement.entity.AssetDecreaseRequest;
import com.hanghai.kchtg.assetmovement.repository.AssetDecreaseRequestRepository;
import com.hanghai.kchtg.assetmovement.repository.InfraAssetRepository;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetDecreaseRequestService {
    private final AssetDecreaseRequestRepository repository;
    private final InfraAssetRepository taiSanRepository;
    private final UserRepository userRepository;

    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            return userRepository.findByUsername(auth.getName())
                    .map(com.hanghai.kchtg.user.entity.User::getId)
                    .orElse(null);
        }
        return null;
    }

    @Transactional
    public AssetDecreaseRequestResponse create(AssetDecreaseRequestRequest request) {
        UUID currentUserId = getCurrentUserId();
        AssetDecreaseRequest entity = AssetDecreaseRequest.builder()
                .assetId(request.getAssetId())
                .decreaseReason(parseDecreaseReason(request.getDecreaseReason()))
                .decreaseDate(Instant.now())
                .description(request.getReason())
                .status(RequestStatus.PENDING)
                .createdBy(currentUserId != null ? currentUserId.toString() : null)
                .updatedBy(currentUserId != null ? currentUserId.toString() : null)
                
                .build();
        AssetDecreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    public AssetDecreaseRequestResponse getById(UUID id) {
        AssetDecreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u giáº£m tÃ i sáº£n với id: " + id));
        return toResponse(entity);
    }

    public Page<AssetDecreaseRequestResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<AssetDecreaseRequestResponse> findByAssetId(UUID assetId, Pageable pageable) {
        if (assetId == null) return findAll(pageable);
        return repository.findByAssetId(assetId, pageable).map(this::toResponse);
    }

    @Transactional
    public AssetDecreaseRequestResponse update(UUID id, AssetDecreaseRequestRequest request) {
        AssetDecreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u giáº£m tÃ i sáº£n với id: " + id));
        if (request.getAssetId() != null) entity.setAssetId(request.getAssetId());
        if (request.getReason() != null) entity.setDescription(request.getReason());
        if (request.getDecreaseReason() != null) entity.setDecreaseReason(parseDecreaseReason(request.getDecreaseReason()));
        UUID currentUserId = getCurrentUserId();
        entity.setUpdatedBy(currentUserId != null ? currentUserId.toString() : null);
        AssetDecreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) throw new EntityNotFoundException("Không tìm thấy yÃªu cáº§u giáº£m tÃ i sáº£n với id: " + id);
        repository.deleteById(id);
    }

    @Transactional
    public AssetDecreaseRequestResponse approve(UUID id, String remarks) {
        AssetDecreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u giáº£m tÃ i sáº£n với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setStatus(RequestStatus.APPROVED);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        entity.setUpdatedBy((currentUserId != null ? currentUserId.toString() : null));

        if (entity.getAssetId() != null) {
            taiSanRepository.findById(entity.getAssetId()).ifPresent(taiSan -> {
                AssetStatus targetStatus = AssetStatus.CANCELED;
                if (entity.getDecreaseReason() != null) {
                    switch (entity.getDecreaseReason()) {
                        case DISSOLVED: targetStatus = AssetStatus.DISSOLVED; break;
                        case DEMOLISHED: targetStatus = AssetStatus.DEMOLISHED; break;
                        case DAMAGED: targetStatus = AssetStatus.CANCELED; break;
                        case EXPIRED: targetStatus = AssetStatus.DECOMMISSIONED; break;
                    }
                }
                taiSan.setStatus(targetStatus);
                taiSan.setApprovedBy(currentUserId);
                taiSan.setApprovedAt(Instant.now());
                taiSanRepository.save(taiSan);
            });
        }

        AssetDecreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public AssetDecreaseRequestResponse reject(UUID id, String remarks) {
        AssetDecreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u giáº£m tÃ i sáº£n với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setStatus(RequestStatus.REJECTED);
        entity.setUnapprovedBy(currentUserId);
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        entity.setUpdatedBy((currentUserId != null ? currentUserId.toString() : null));

        AssetDecreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    private AssetDecreaseRequestResponse toResponse(AssetDecreaseRequest entity) {
        String assetName = null;
        String donViTinh = "CÃ¡i";

        if (entity.getAssetId() != null) {
            var taiSanOpt = taiSanRepository.findById(entity.getAssetId());
            if (taiSanOpt.isPresent()) {
                assetName = taiSanOpt.get().getAssetName();
            }
        }

        String createdByName = null;
        if (entity.getCreatedBy() != null) {
            var userOpt = userRepository.findById(java.util.UUID.fromString(entity.getCreatedBy()));
            if (userOpt.isPresent()) {
                createdByName = userOpt.get().getFullName();
                if (createdByName == null || createdByName.isEmpty()) {
                    createdByName = userOpt.get().getUsername();
                }
            }
        }

        return AssetDecreaseRequestResponse.builder()
                .id(entity.getId())
                .assetId(entity.getAssetId())
                .assetName(assetName)
                .soLuong(1)
                .donViTinh(donViTinh)
                .reason(entity.getDescription())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .decreaseReason(entity.getDecreaseReason() != null ? entity.getDecreaseReason().name() : null)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private DecreaseReason parseDecreaseReason(String value) {
        if (value == null) return null;
        try {
            return DecreaseReason.valueOf(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}

