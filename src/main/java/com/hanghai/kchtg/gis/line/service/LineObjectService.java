package com.hanghai.kchtg.gis.line.service;

import com.hanghai.kchtg.gis.line.dto.CreateLineObjectRequest;
import com.hanghai.kchtg.gis.line.dto.LineObjectResponse;
import com.hanghai.kchtg.gis.line.dto.UpdateLineObjectRequest;
import com.hanghai.kchtg.gis.line.entity.LineHistory;
import com.hanghai.kchtg.gis.line.entity.LineObject;
import com.hanghai.kchtg.gis.line.entity.LineObject.ObjectType;
import com.hanghai.kchtg.gis.line.entity.LineObject.Status;
import com.hanghai.kchtg.gis.line.repository.LineHistoryRepository;
import com.hanghai.kchtg.gis.line.repository.LineObjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LineObjectService {

    private final LineObjectRepository repository;
    private final LineHistoryRepository historyRepository;

    public List<LineObjectResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public LineObjectResponse findById(UUID id) {
        LineObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LineObject not found with id: " + id));
        return toResponse(entity);
    }

    public List<LineObjectResponse> findByObjectType(ObjectType objectType) {
        return repository.findByObjectType(objectType).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LineObjectResponse> findByStatus(Status status) {
        return repository.findByStatus(status).stream()
                .map(this::toResponse)
                .toList();
    }

    public List<LineObjectResponse> search(String name, String code, ObjectType objectType, Status status) {
        return repository.searchFiltered(name, code, objectType, status).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public LineObjectResponse create(CreateLineObjectRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đối tượng đã tồn tại: " + request.getCode());
        }

        validateCoordinates(request.getCoordinates());

        LineObject entity = LineObject.builder()
                .name(request.getName())
                .code(request.getCode())
                .objectType(request.getObjectType())
                .categoryId(request.getCategoryId())
                .lineSymbolId(request.getLineSymbolId())
                .coordinates(request.getCoordinates())
                .description(request.getDescription())
                .status(request.getStatus())
                .unitId(request.getUnitId())
                .length(request.getLength())
                .material(request.getMaterial())
                .yearBuilt(request.getYearBuilt())
                .build();

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public LineObjectResponse update(UUID id, UpdateLineObjectRequest request) {
        LineObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LineObject not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCode() != null) entity.setCode(request.getCode());
        if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
        if (request.getCategoryId() != null) entity.setCategoryId(request.getCategoryId());
        if (request.getLineSymbolId() != null) entity.setLineSymbolId(request.getLineSymbolId());
        if (request.getCoordinates() != null) {
            validateCoordinates(request.getCoordinates());
            entity.setCoordinates(request.getCoordinates());
        }
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getLength() != null) entity.setLength(request.getLength());
        if (request.getMaterial() != null) entity.setMaterial(request.getMaterial());
        if (request.getYearBuilt() != null) entity.setYearBuilt(request.getYearBuilt());

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID id) {
        LineObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LineObject not found with id: " + id));
        entity.setStatus(Status.DELETED);
        entity.softDelete();
        repository.save(entity);
    }

    @Transactional
    public void submitForApproval(UUID id) {
        LineObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LineObject not found with id: " + id));
        entity.setStatus(Status.PENDING_APPROVAL);
        entity.setApprovalStatus(com.hanghai.kchtg.gis.line.entity.LineObject.ApprovalStatus.PENDING);
        repository.save(entity);
    }

    @Transactional
    public LineObjectResponse approveL1(UUID id, String approverId) {
        LineObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LineObject not found with id: " + id));

        if (entity.getStatus() != Status.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Chỉ có thể duyệt L1 khi status = PENDING_APPROVAL, hien tai: " + entity.getStatus());
        }

        entity.setStatus(Status.APPROVED_L1);
        entity.setApprovalStatus(com.hanghai.kchtg.gis.line.entity.LineObject.ApprovalStatus.APPROVED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(java.time.LocalDateTime.now());
        entity = repository.save(entity);

        // Log history
        historyRepository.save(LineHistory.builder()
                .objectId(entity.getId().toString())
                .actionType(LineHistory.ActionType.APPROVE)
                .previousValue(entity.getStatus() == null ? "null" : entity.getStatus().toString())
                .newValue("APPROVED_L1")
                .reason("Level 1 approval by: " + approverId)
                .build());

        return toResponse(entity);
    }

    @Transactional
    public LineObjectResponse approveL2(UUID id, String approverId) {
        LineObject entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("LineObject not found with id: " + id));

        if (entity.getStatus() != Status.APPROVED_L1) {
            throw new IllegalStateException(
                    "Chỉ có thể duyệt L2 khi status = APPROVED_L1, hien tai: " + entity.getStatus());
        }

        entity.setStatus(Status.PUBLISHED);
        entity.setApprovedBy(Long.parseLong(approverId));
        entity.setApprovedDate(java.time.LocalDateTime.now());
        entity = repository.save(entity);

        // Log history
        historyRepository.save(LineHistory.builder()
                .objectId(entity.getId().toString())
                .actionType(LineHistory.ActionType.APPROVE)
                .previousValue("APPROVED_L1")
                .newValue("PUBLISHED")
                .reason("Level 2 approval by: " + approverId)
                .build());

        return toResponse(entity);
    }

    private LineObjectResponse toResponse(LineObject entity) {
        return LineObjectResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .objectType(entity.getObjectType())
                .categoryId(entity.getCategoryId())
                .lineSymbolId(entity.getLineSymbolId())
                .coordinates(entity.getCoordinates())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .unitId(entity.getUnitId())
                .length(entity.getLength())
                .material(entity.getMaterial())
                .yearBuilt(entity.getYearBuilt())
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
        if (!(trimmed.startsWith("LINESTRING") || trimmed.startsWith("POLYGON")
              || trimmed.startsWith("{") || trimmed.startsWith("["))) {
            throw new IllegalArgumentException("Tọa độ phải ở định dạng WKT (LINESTRING) hoặc GeoJSON");
        }
    }
}
