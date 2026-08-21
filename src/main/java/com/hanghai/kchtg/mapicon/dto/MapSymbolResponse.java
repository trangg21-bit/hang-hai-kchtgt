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
    private String name;
    private String code;
    private String description;
    private String image;
    private MapSymbolStatus status;
    private UUID createdBy;
    private UUID updatedBy;
    private String createdByName;
    private String updatedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static MapSymbolResponse from(MapSymbol symbol) {
        if (symbol == null) return null;
        return MapSymbolResponse.builder()
                .id(symbol.getId())
                .name(symbol.getName())
                .code(symbol.getCode())
                .description(symbol.getDescription())
                .image(symbol.getImage())
                .status(symbol.getStatus())
                .createdBy(symbol.getCreatedBy())
                .createdAt(symbol.getCreatedAt())
                .updatedAt(symbol.getUpdatedAt())
                .build();
    }
}
