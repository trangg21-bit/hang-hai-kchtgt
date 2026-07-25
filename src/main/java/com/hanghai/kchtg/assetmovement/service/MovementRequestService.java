package com.hanghai.kchtg.assetmovement.service;

import com.hanghai.kchtg.assetmovement.dto.MovementRequestRequest;
import com.hanghai.kchtg.assetmovement.dto.MovementRequestResponse;
import com.hanghai.kchtg.assetmovement.entity.MovementType;
import com.hanghai.kchtg.assetmovement.entity.RequestStatus;
import com.hanghai.kchtg.assetmovement.entity.MovementRequest;
import com.hanghai.kchtg.assetmovement.repository.MovementRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MovementRequestService {

    private final MovementRequestRepository repository;

    @Transactional
    public MovementRequestResponse create(MovementRequestRequest request) {
        validateRequest(request);

        MovementType movementType;
        try {
            movementType = MovementType.valueOf(request.getMovementType());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("movementType không hợp lệ: " + request.getMovementType());
        }

        MovementRequest entity = MovementRequest.builder()
                .movementType(movementType)
                .title(request.getAssetName())
                .description(request.getDescription())
                .status(RequestStatus.PENDING)
                
                .build();

        MovementRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    public MovementRequestResponse getById(UUID id) {
        MovementRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u biáº¿n Ä‘á»™ng với id: " + id));
        return toResponse(entity);
    }

    public Page<MovementRequestResponse> findAll(Pageable pageable) {
        return repository.findAll(pageable).map(this::toResponse);
    }

    public Page<MovementRequestResponse> findByMovementType(MovementType movementType, Pageable pageable) {
        return repository.findByMovementType(movementType, pageable).map(this::toResponse);
    }

    public Page<MovementRequestResponse> findByStatus(RequestStatus status, Pageable pageable) {
        return repository.findByStatus(status, pageable).map(this::toResponse);
    }

    public Page<MovementRequestResponse> findByMovementTypeAndStatus(MovementType movementType, RequestStatus status, Pageable pageable) {
        return repository.findByMovementTypeAndStatus(movementType, status, pageable).map(this::toResponse);
    }

    @Transactional
    public MovementRequestResponse update(UUID id, MovementRequestRequest request) {
        MovementRequest entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy yÃªu cáº§u biáº¿n Ä‘á»™ng với id: " + id));

        validateRequest(request);

        if (request.getMovementType() != null) {
            try {
                entity.setMovementType(MovementType.valueOf(request.getMovementType()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("movementType không hợp lệ: " + request.getMovementType());
            }
        }
        if (request.getAssetName() != null) {
            entity.setTitle(request.getAssetName());
        }
        if (request.getDescription() != null) {
            entity.setDescription(request.getDescription());
        }

        MovementRequest saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        if (!repository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy yÃªu cáº§u biáº¿n Ä‘á»™ng với id: " + id);
        }
        repository.deleteById(id);
    }

    private void validateRequest(MovementRequestRequest request) {
        if (request.getMovementType() == null) {
            throw new IllegalArgumentException("movementType khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
        if (request.getAssetName() == null || request.getAssetName().isBlank()) {
            throw new IllegalArgumentException("TÃªn tÃ i sáº£n (tiÃªu Ä‘á») khÃ´ng Ä‘Æ°á»£c Ä‘á»ƒ trá»‘ng");
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        if (instant == null) return null;
        return instant.atZone(ZoneId.systemDefault()).toLocalDateTime();
    }

    private MovementRequestResponse toResponse(MovementRequest entity) {
        return MovementRequestResponse.builder()
                .id(entity.getId())
                .assetId(null)
                .movementType(entity.getMovementType() != null ? entity.getMovementType().name() : null)
                .assetName(entity.getTitle())
                .soLuong(0)
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .description(entity.getDescription())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
