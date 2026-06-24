package com.hanghai.kchtg.gis.polygon.service;

import com.hanghai.kchtg.gis.polygon.dto.CreatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.dto.PolygonObjectResponse;
import com.hanghai.kchtg.gis.polygon.dto.UpdatePolygonObjectRequest;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ObjectType;
import com.hanghai.kchtg.gis.polygon.entity.PolygonObject.Status;
import com.hanghai.kchtg.gis.polygon.entity.PolygonHistory;
import com.hanghai.kchtg.gis.polygon.repository.PolygonHistoryRepository;
import com.hanghai.kchtg.gis.polygon.repository.PolygonObjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PolygonObjectService {

    private final PolygonObjectRepository repository;
    private final PolygonHistoryRepository historyRepository;

    public List<PolygonObjectResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PolygonObjectResponse findById(UUID id) {
        PolygonObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PolygonObject not found with id: " + id));
        return toResponse(entity);
    }

    public List<PolygonObjectResponse> findByObjectType(ObjectType objectType) {
        return repository.findByObjectType(objectType).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PolygonObjectResponse> findByStatus(Status status) {
        return repository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<PolygonObjectResponse> search(String name, String code, ObjectType objectType, Status status) {
        return repository.searchFiltered(name, code, objectType, status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public PolygonObjectResponse create(CreatePolygonObjectRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đối tượng đã tồn tại: " + request.getCode());
        }

        validateCoordinates(request.getCoordinates());

        PolygonObject entity = PolygonObject.builder()
                .name(request.getName())
                .code(request.getCode())
                .objectType(request.getObjectType())
                .categoryId(request.getCategoryId())
                .fillSymbolId(request.getFillSymbolId())
                .coordinates(request.getCoordinates())
                .description(request.getDescription())
                .status(request.getStatus())
                .unitId(request.getUnitId())
                .area(request.getArea())
                .purpose(request.getPurpose())
                .restrictionLevel(request.getRestrictionLevel())
                .build();

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public PolygonObjectResponse update(UUID id, UpdatePolygonObjectRequest request) {
        PolygonObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PolygonObject not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCode() != null) entity.setCode(request.getCode());
        if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
        if (request.getCategoryId() != null) entity.setCategoryId(request.getCategoryId());
        if (request.getFillSymbolId() != null) entity.setFillSymbolId(request.getFillSymbolId());
        if (request.getCoordinates() != null) {
            validateCoordinates(request.getCoordinates());
            entity.setCoordinates(request.getCoordinates());
        }
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getArea() != null) entity.setArea(request.getArea());
        if (request.getPurpose() != null) entity.setPurpose(request.getPurpose());
        if (request.getRestrictionLevel() != null) entity.setRestrictionLevel(request.getRestrictionLevel());

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID id) {
        PolygonObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PolygonObject not found with id: " + id));
        entity.setStatus(Status.DELETED);
        entity.softDelete();
        repository.save(entity);
    }

    @Transactional
    public void submitForApproval(UUID id) {
        PolygonObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PolygonObject not found with id: " + id));
        entity.setStatus(Status.PENDING_APPROVAL);
        entity.setApprovalStatus(com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ApprovalStatus.PENDING);
        repository.save(entity);
    }

    @Transactional
    public PolygonObjectResponse approveL1(UUID id, String approverId) {
        PolygonObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PolygonObject not found with id: " + id));

        if (entity.getStatus() != Status.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Chi co the duyet L1 khi status = PENDING_APPROVAL, hien tai: " + entity.getStatus());
        }

        entity.setStatus(Status.APPROVED_L1);
        entity.setApprovalStatus(com.hanghai.kchtg.gis.polygon.entity.PolygonObject.ApprovalStatus.APPROVED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(java.time.LocalDateTime.now());
        entity = repository.save(entity);

        // Log history
        historyRepository.save(PolygonHistory.builder()
                .objectId(entity.getId().toString())
                .actionType(PolygonHistory.ActionType.APPROVE)
                .previousValue(entity.getStatus() == null ? "null" : entity.getStatus().toString())
                .newValue("APPROVED_L1")
                .reason("Level 1 approval by: " + approverId)
                .build());

        return toResponse(entity);
    }

    @Transactional
    public PolygonObjectResponse approveL2(UUID id, String approverId) {
        PolygonObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("PolygonObject not found with id: " + id));

        if (entity.getStatus() != Status.APPROVED_L1) {
            throw new IllegalStateException(
                    "Chi co the duyet L2 khi status = APPROVED_L1, hien tai: " + entity.getStatus());
        }

        entity.setStatus(Status.PUBLISHED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(java.time.LocalDateTime.now());
        entity = repository.save(entity);

        // Log history
        historyRepository.save(PolygonHistory.builder()
                .objectId(entity.getId().toString())
                .actionType(PolygonHistory.ActionType.APPROVE)
                .previousValue("APPROVED_L1")
                .newValue("PUBLISHED")
                .reason("Level 2 approval by: " + approverId)
                .build());

        return toResponse(entity);
    }

    private PolygonObjectResponse toResponse(PolygonObject entity) {
        return PolygonObjectResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .objectType(entity.getObjectType())
                .categoryId(entity.getCategoryId())
                .fillSymbolId(entity.getFillSymbolId())
                .coordinates(entity.getCoordinates())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .unitId(entity.getUnitId())
                .area(entity.getArea())
                .purpose(entity.getPurpose())
                .restrictionLevel(entity.getRestrictionLevel())
                .approvalStatus(entity.getApprovalStatus())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private void validateCoordinates(String coordinates) {
        if (coordinates == null || coordinates.trim().isEmpty()) {
            throw new IllegalArgumentException("Tọa độ không được để trống");
        }
        String trimmed = coordinates.trim().toUpperCase();
        if (!(trimmed.startsWith("POLYGON") || trimmed.startsWith("GEOMETRYCOLLECTION")
              || trimmed.startsWith("{") || trimmed.startsWith("["))) {
            throw new IllegalArgumentException("Tọa độ phải ở định dạng WKT (POLYGON) hoặc GeoJSON");
        }
    }
}