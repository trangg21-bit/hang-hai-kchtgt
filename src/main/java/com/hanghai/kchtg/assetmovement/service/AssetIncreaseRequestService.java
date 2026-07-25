package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.AssetIncreaseRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.AssetIncreaseRequestResponse;
import com.hanghai.kchtg.assetmovement.entity.InfraAssetType;
import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.assetmovement.entity.AssetIncreaseRequest;
import com.hanghai.kchtg.assetmovement.repository.AssetIncreaseRequestRepository;
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
public class AssetIncreaseRequestService {

    private final AssetIncreaseRequestRepository repository;
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
    public AssetIncreaseRequestResponse create(AssetIncreaseRequestRequest request) {
        UUID currentUserId = getCurrentUserId();
        AssetIncreaseRequest entity = AssetIncreaseRequest.builder()
                .assetId(request.getAssetId())
                .assetType(null)
                .description(request.getReason())
                .status(RequestStatus.PENDING)
                .createdBy(currentUserId != null ? currentUserId.toString() : null)
                .updatedBy(currentUserId != null ? currentUserId.toString() : null)
                
                .build();

        AssetIncreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    public AssetIncreaseRequestResponse getById(UUID id) {
        AssetIncreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u tÄƒng tÃ i sáº£n với id: " + id));
        return toResponse(entity);
    }

    public Page<AssetIncreaseRequestResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<AssetIncreaseRequestResponse> findByAssetId(UUID assetId, Pageable pageable) {
        return repository.findByAssetId(assetId, pageable).map(this::toResponse);
    }

    @Transactional
    public AssetIncreaseRequestResponse update(UUID id, AssetIncreaseRequestRequest request) {
        AssetIncreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u tÄƒng tÃ i sáº£n với id: " + id));

        if (request.getAssetId() != null) {
            entity.setAssetId(request.getAssetId());
        }
        if (request.getReason() != null) {
            entity.setDescription(request.getReason());
        }
        UUID currentUserId = getCurrentUserId();
        entity.setUpdatedBy(currentUserId != null ? currentUserId.toString() : null);

        AssetIncreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy yÃªu cáº§u tÄƒng tÃ i sáº£n với id: " + id);
        }
        repository.deleteById(id);
    }

    @Transactional
    public AssetIncreaseRequestResponse approve(UUID id, String remarks) {
        AssetIncreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u tÄƒng tÃ i sáº£n với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setStatus(RequestStatus.APPROVED);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedAt(Instant.now());
        entity.setApprovedRemarks(remarks);
        entity.setUpdatedBy((currentUserId != null ? currentUserId.toString() : null));

        if (entity.getAssetId() != null) {
            taiSanRepository.findById(entity.getAssetId()).ifPresent(taiSan -> {
                taiSan.setStatus(AssetStatus.MANAGED);
                taiSan.setApprovedBy(currentUserId);
                taiSan.setApprovedAt(Instant.now());
                taiSanRepository.save(taiSan);
            });
        }

        AssetIncreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public AssetIncreaseRequestResponse reject(UUID id, String remarks) {
        AssetIncreaseRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u tÄƒng tÃ i sáº£n với id: " + id));

        UUID currentUserId = getCurrentUserId();
        entity.setStatus(RequestStatus.REJECTED);
        entity.setUnapprovedBy(currentUserId);
        entity.setUnapprovedAt(Instant.now());
        entity.setUnapprovedRemarks(remarks);
        entity.setUpdatedBy((currentUserId != null ? currentUserId.toString() : null));

        AssetIncreaseRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private AssetIncreaseRequestResponse toResponse(AssetIncreaseRequest entity) {
        String assetName = null;
        String maSoTang = null;
        String donViTinh = "CÃ¡i";

        if (entity.getAssetId() != null) {
            var taiSanOpt = taiSanRepository.findById(entity.getAssetId());
            if (taiSanOpt.isPresent()) {
                assetName = taiSanOpt.get().getAssetName();
                maSoTang = taiSanOpt.get().getAssetCode();
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

        return AssetIncreaseRequestResponse.builder()
                .id(entity.getId())
                .assetId(entity.getAssetId())
                .assetName(assetName)
                .soLuong(1)
                .donViTinh(donViTinh)
                .reason(entity.getDescription())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .maSoTang(maSoTang)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}

