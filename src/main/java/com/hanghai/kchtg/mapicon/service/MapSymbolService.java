package com.hanghai.kchtg.mapicon.service;

import com.hanghai.kchtg.mapicon.dto.CreateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.dto.MapSymbolResponse;
import com.hanghai.kchtg.mapicon.dto.UpdateMapSymbolRequest;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.hanghai.kchtg.mapicon.dto.MapSymbolOptionResponse;
import java.util.List;
import java.util.UUID;

public interface MapSymbolService {
    Page<MapSymbolResponse> search(String search, String code, MapSymbolStatus status, Pageable pageable);
    List<MapSymbolOptionResponse> getOptions();
    MapSymbolResponse findById(UUID id);
    MapSymbolResponse create(CreateMapSymbolRequest request, java.util.UUID createdBy);
    MapSymbolResponse update(UUID id, UpdateMapSymbolRequest request);
    void delete(UUID id, java.util.UUID deletedBy);
}
