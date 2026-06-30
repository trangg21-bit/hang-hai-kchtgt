package com.hanghai.kchtg.mapicon.service;

import com.hanghai.kchtg.mapicon.dto.CreateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.dto.MapSymbolResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;
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

    @Override
    public Page<MapSymbolResponse> search(String search, String category, String status, Pageable pageable) {
        return repository.search(
                search != null && search.trim().isEmpty() ? null : search,
                category != null && category.trim().isEmpty() ? null : category,
                status != null && status.trim().isEmpty() ? null : status,
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
    public MapSymbolResponse create(CreateMapSymbolRequest request, String username) {
        if (repository.findByCode(request.getCode()).isPresent()) {
            throw new IllegalArgumentException("Mã ký hiệu đã tồn tại: " + request.getCode());
        }
        MapSymbol symbol = MapSymbol.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .category(request.getCategory())
                .icon(request.getIcon())
                .color(request.getColor())
                .value(request.getValue())
                .status(request.getStatus())
                .createdBy(username)
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
        symbol.setCategory(request.getCategory());
        symbol.setIcon(request.getIcon());
        symbol.setColor(request.getColor());
        symbol.setValue(request.getValue());
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
