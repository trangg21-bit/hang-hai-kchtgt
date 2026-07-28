package com.hanghai.kchtg.mapicon.service;

import java.util.UUID;

import com.hanghai.kchtg.mapicon.dto.CreateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.dto.MapSymbolResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class MapSymbolServiceImpl implements MapSymbolService {

    private final MapSymbolRepository repository;

    @Override
    public Page<MapSymbolResponse> search(String search, MapSymbolStatus status, Pageable pageable) {
        String trimmedSearch = search != null ? search.trim() : null;
        return repository.search(
                trimmedSearch != null && trimmedSearch.isEmpty() ? null : trimmedSearch,
                status,
                pageable
        ).map(MapSymbolResponse::from);
    }

    @Override
    public MapSymbolResponse findById(UUID id) {
        MapSymbol symbol = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ký hiệu không tồn tại: " + id));
        return MapSymbolResponse.from(symbol);
    }

    @Override
    @Transactional
    public MapSymbolResponse create(CreateMapSymbolRequest request, java.util.UUID createdBy) {
        MapSymbol symbol = MapSymbol.builder()
                .name(request.getName())
                .description(request.getDescription())
                .image(request.getImage())
                .status(request.getStatus())
                .createdBy(createdBy)
                .build();
        return MapSymbolResponse.from(repository.save(symbol));
    }

    @Override
    @Transactional
    public MapSymbolResponse update(UUID id, UpdateMapSymbolRequest request) {
        MapSymbol symbol = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ký hiệu không tồn tại: " + id));
        symbol.setName(request.getName());
        symbol.setDescription(request.getDescription());
        symbol.setImage(request.getImage());
        symbol.setStatus(request.getStatus());
        return MapSymbolResponse.from(repository.save(symbol));
    }

    @Override
    @Transactional
    public void delete(UUID id) {
        MapSymbol symbol = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ký hiệu không tồn tại: " + id));
        symbol.setDeletedAt(LocalDateTime.now());
        repository.save(symbol);
    }
}
