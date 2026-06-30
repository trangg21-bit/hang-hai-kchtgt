package com.hanghai.kchtg.mapicon.service;

import com.hanghai.kchtg.mapicon.dto.CreateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.dto.MapSymbolResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapSymbolRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MapSymbolService {
    Page<MapSymbolResponse> search(String search, String category, String status, Pageable pageable);
    MapSymbolResponse findById(UUID id);
    MapSymbolResponse create(CreateMapSymbolRequest request, String username);
    MapSymbolResponse update(UUID id, UpdateMapSymbolRequest request);
    void delete(UUID id);
}
