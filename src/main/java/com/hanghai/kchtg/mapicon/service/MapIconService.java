package com.hanghai.kchtg.mapicon.service;

import com.hanghai.kchtg.mapicon.dto.CreateMapIconRequest;
import com.hanghai.kchtg.mapicon.dto.MapIconResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapIconRequest;
import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import com.hanghai.kchtg.mapicon.repository.MapIconRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MapIconService {

    private final MapIconRepository repository;

    public List<MapIconResponse> findAll() {
        return repository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public MapIconResponse findById(UUID id) {
        MapIcon entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapIcon not found with id: " + id));
        return toResponse(entity);
    }

    public List<MapIconResponse> findByCategory(Category category) {
        return repository.findByCategory(category).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MapIconResponse create(CreateMapIconRequest request) {
        if (repository.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Code already exists: " + request.getCode());
        }

        MapIcon entity = MapIcon.builder()
                .name(request.getName())
                .code(request.getCode())
                .category(request.getCategory())
                .iconUrl(request.getIconUrl())
                .size(request.getSize())
                .status(request.getStatus())
                .build();

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public MapIconResponse update(UUID id, UpdateMapIconRequest request) {
        MapIcon entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapIcon not found with id: " + id));

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getCode() != null) entity.setCode(request.getCode());
        if (request.getCategory() != null) entity.setCategory(request.getCategory());
        if (request.getIconUrl() != null) entity.setIconUrl(request.getIconUrl());
        if (request.getSize() != null) entity.setSize(request.getSize());
        if (request.getStatus() != null) entity.setStatus(request.getStatus());

        entity = repository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID id) {
        MapIcon entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("MapIcon not found with id: " + id));
        entity.softDelete();
        repository.save(entity);
    }

    private MapIconResponse toResponse(MapIcon entity) {
        return MapIconResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .code(entity.getCode())
                .category(entity.getCategory())
                .iconUrl(entity.getIconUrl())
                .size(entity.getSize())
                .status(entity.getStatus())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
