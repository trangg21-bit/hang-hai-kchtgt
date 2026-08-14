package com.hanghai.kchtg.mapicon.service;

import com.hanghai.kchtg.mapicon.dto.CreateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.dto.MapSymbolResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MapSymbolServiceImpl implements MapSymbolService {

    private final MapSymbolRepository repository;
    private final UserResolverService userResolverService;

    @Override
    public Page<MapSymbolResponse> search(String search, MapSymbolStatus status, Pageable pageable) {
        String trimmedSearch = search != null ? search.trim() : null;
        return repository.search(
                trimmedSearch != null && trimmedSearch.isEmpty() ? null : trimmedSearch,
                status,
                pageable
        ).map(this::toResponse);
    }

    private MapSymbolResponse toResponse(MapSymbol symbol) {
        return MapSymbolResponse.builder()
                .id(symbol.getId())
                .name(symbol.getName())
                .description(symbol.getDescription())
                .image(symbol.getImage())
                .status(symbol.getStatus())
                .createdBy(symbol.getCreatedBy())
                .updatedBy(symbol.getUpdatedBy())
                .createdByName(userResolverService.resolveName(symbol.getCreatedBy()))
                .updatedByName(userResolverService.resolveName(symbol.getUpdatedBy()))
                .createdAt(symbol.getCreatedAt())
                .updatedAt(symbol.getUpdatedAt())
                .build();
    }

    @Override
    public MapSymbolResponse findById(UUID id) {
        MapSymbol symbol = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ký hiệu không tồn tại: " + id));
        return toResponse(symbol);
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
        return toResponse(repository.save(symbol));
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
        return toResponse(repository.save(symbol));
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
