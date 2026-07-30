package com.hanghai.kchtg.gis.spatial.service;

import com.hanghai.kchtg.gis.spatial.dto.SpatialObjectCategoryDto;
import com.hanghai.kchtg.gis.spatial.entity.SpatialObjectCategory;
import com.hanghai.kchtg.gis.spatial.repository.SpatialObjectCategoryRepository;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SpatialObjectCategoryService {

    private final SpatialObjectCategoryRepository repository;
    private final MapSymbolRepository symbolRepository;

    @Transactional(readOnly = true)
    public Page<SpatialObjectCategoryDto> findAll(Integer geometryType, Integer status, String search, Pageable pageable) {
        return repository.findAllWithFilters(geometryType, status, search, pageable).map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public SpatialObjectCategoryDto findById(UUID id) {
        return repository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục có ID: " + id));
    }

    @Transactional
    public SpatialObjectCategoryDto create(SpatialObjectCategoryDto request) {
        if (repository.existsByCodeAndGeometryType(request.getCode(), request.getGeometryType())) {
            throw new IllegalArgumentException("Mã danh mục đã tồn tại cho loại hình học này");
        }

        SpatialObjectCategory entity = new SpatialObjectCategory();
        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setGeometryType(request.getGeometryType());
        entity.setIconId(request.getIconId());

        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        return mapToDto(repository.save(entity));
    }

    @Transactional
    public SpatialObjectCategoryDto update(UUID id, SpatialObjectCategoryDto request) {
        SpatialObjectCategory entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục có ID: " + id));

        if (!entity.getCode().equals(request.getCode()) && repository.existsByCodeAndGeometryType(request.getCode(), request.getGeometryType())) {
            throw new IllegalArgumentException("Mã danh mục đã tồn tại cho loại hình học này");
        }

        entity.setCode(request.getCode());
        entity.setName(request.getName());
        entity.setGeometryType(request.getGeometryType());
        entity.setIconId(request.getIconId());

        if (request.getStatus() != null) {
            entity.setStatus(request.getStatus());
        }

        return mapToDto(repository.save(entity));
    }

    @Transactional
    public void delete(UUID id) {
        SpatialObjectCategory entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục có ID: " + id));
        repository.delete(entity);
    }

    private SpatialObjectCategoryDto mapToDto(SpatialObjectCategory entity) {
        SpatialObjectCategoryDto dto = new SpatialObjectCategoryDto();
        dto.setId(entity.getId());
        dto.setCode(entity.getCode());
        dto.setName(entity.getName());
        dto.setGeometryType(entity.getGeometryType());
        dto.setIconId(entity.getIconId());
        if (entity.getIconId() != null) {
            symbolRepository.findById(entity.getIconId()).ifPresent(sym -> dto.setIconUrl(sym.getImage()));
        }
        dto.setStatus(entity.getStatus());
        dto.setCreatedAt(entity.getCreatedAt());
        dto.setCreatedBy(entity.getCreatedBy());
        dto.setUpdatedAt(entity.getUpdatedAt());
        dto.setUpdatedBy(entity.getUpdatedBy());
        return dto;
    }
}
