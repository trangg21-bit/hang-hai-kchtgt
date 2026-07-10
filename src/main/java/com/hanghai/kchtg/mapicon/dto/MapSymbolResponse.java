package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.entity.MapSymbolStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class MapSymbolResponse {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String hinhAnh;
    private MapSymbolStatus status;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MapSymbolResponse from(MapSymbol symbol) {
        if (symbol == null) return null;
        return MapSymbolResponse.builder()
                .id(symbol.getId())
                .code(symbol.getCode())
                .name(symbol.getName())
                .description(symbol.getDescription())
                .hinhAnh(symbol.getHinhAnh())
                .status(symbol.getStatus())
                .createdBy(symbol.getCreatedBy())
                .createdAt(symbol.getCreatedAt())
                .updatedAt(symbol.getUpdatedAt())
                .build();
    }
}
