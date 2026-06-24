package com.hanghai.kchtg.gis.point.service;

import com.hanghai.kchtg.gis.point.dto.CreatePointObjectRequest;
import com.hanghai.kchtg.gis.point.dto.PointObjectResponse;
import com.hanghai.kchtg.gis.point.dto.UpdatePointObjectRequest;
import com.hanghai.kchtg.gis.point.entity.PointObject;
import com.hanghai.kchtg.gis.point.entity.PointObject.ObjectType;
import com.hanghai.kchtg.gis.point.entity.PointObject.Status;
import com.hanghai.kchtg.gis.point.entity.PointHistory;
import com.hanghai.kchtg.gis.point.repository.PointHistoryRepository;
import com.hanghai.kchtg.gis.point.repository.PointObjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointObjectService {

    private final PointObjectRepository repository;
    private final PointHistoryRepository historyRepository;

    public List<PointObjectResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PointObjectResponse findById(UUID id) {
        PointObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PointObject not found with id: " + id));
        return toResponse(entity);
    }

    public List<PointObjectResponse> findByObjectType(ObjectType objectType) {
        return repository.findByObjectType(objectType).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PointObjectResponse> findByStatus(Status status) {
        return repository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PointObjectResponse> search(String name, String code, ObjectType objectType, Status status) {
        return repository.searchFiltered(name, code, objectType, status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PointObjectResponse create(CreatePointObjectRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đối tượng đã tồn tại: " + request.getCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());

        PointObject entity = PointObject.builder()
                .name(request.getName())
                .code(request.getCode())
                .objectType(request.getObjectType())
                .categoryId(request.getCategoryId())
                .iconId(request.getIconId())
                .longitude(request.getLongitude())
                .latitude(request.getLatitude())
                .description(request.getDescription())
                .status(request.getStatus())
                .unitId(request.getUnitId())
                .build();

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public PointObjectResponse update(UUID id, UpdatePointObjectRequest request) {
        PointObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PointObject not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCode() != null) entity.setCode(request.getCode());
        if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
        if (request.getCategoryId() != null) entity.setCategoryId(request.getCategoryId());
        if (request.getIconId() != null) entity.setIconId(request.getIconId());
        if (request.getLongitude() != null) {
            validateCoordinates(request.getLongitude(), request.getLatitude());
            entity.setLongitude(request.getLongitude());
            entity.setLatitude(request.getLatitude());
        }
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID id) {
        PointObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PointObject not found with id: " + id));
        entity.setStatus(Status.DELETED);
        entity.softDelete();
        repository.save(entity);
    }

    @Transactional
    public void submitForApproval(UUID id) {
        PointObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PointObject not found with id: " + id));
        entity.setStatus(Status.PENDING_APPROVAL);
        entity.setApprovalStatus(com.hanghai.kchtg.gis.point.entity.PointObject.ApprovalStatus.PENDING);
        repository.save(entity);
    }

    @Transactional
    public PointObjectResponse approveL1(UUID id, String approverId) {
        PointObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PointObject not found with id: " + id));

        if (entity.getStatus() != Status.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Chi co the duyet L1 khi status = PENDING_APPROVAL, hien tai: " + entity.getStatus());
        }

        entity.setStatus(Status.APPROVED_L1);
        entity.setApprovalStatus(com.hanghai.kchtg.gis.point.entity.PointObject.ApprovalStatus.APPROVED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(java.time.LocalDateTime.now());
        entity = repository.save(entity);

        // Log history
        historyRepository.save(PointHistory.builder()
                .objectId(entity.getId().toString())
                .actionType(PointHistory.ActionType.APPROVE)
                .previousValue(entity.getStatus() == null ? "null" : entity.getStatus().toString())
                .newValue("APPROVED_L1")
                .reason("Level 1 approval by: " + approverId)
                .build());

        return toResponse(entity);
    }

    @Transactional
    public PointObjectResponse approveL2(UUID id, String approverId) {
        PointObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PointObject not found with id: " + id));

        if (entity.getStatus() != Status.APPROVED_L1) {
            throw new IllegalStateException(
                    "Chi co the duyet L2 khi status = APPROVED_L1, hien tai: " + entity.getStatus());
        }

        entity.setStatus(Status.PUBLISHED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(java.time.LocalDateTime.now());
        entity = repository.save(entity);

        // Log history
        historyRepository.save(PointHistory.builder()
                .objectId(entity.getId().toString())
                .actionType(PointHistory.ActionType.APPROVE)
                .previousValue("APPROVED_L1")
                .newValue("PUBLISHED")
                .reason("Level 2 approval by: " + approverId)
                .build());

        return toResponse(entity);
    }

    private PointObjectResponse toResponse(PointObject entity) {
        return PointObjectResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .objectType(entity.getObjectType())
                .categoryId(entity.getCategoryId())
                .iconId(entity.getIconId())
                .longitude(entity.getLongitude())
                .latitude(entity.getLatitude())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .unitId(entity.getUnitId())
                .approvalStatus(entity.getApprovalStatus())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private void validateCoordinates(Double longitude, Double latitude) {
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException("Kinh độ phải trong khoảng -180~180 (WGS84)");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException("Vĩ độ phải trong khoảng -90~90 (WGS84)");
        }
    }
}