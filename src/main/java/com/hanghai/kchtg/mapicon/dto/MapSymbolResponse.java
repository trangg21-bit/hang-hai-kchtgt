package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapSymbol;
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
    private String category;
    private String icon;
    private String color;
    private String value;
    private String status;
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
                .category(symbol.getCategory())
                .icon(symbol.getIcon())
                .color(symbol.getColor())
                .value(symbol.getValue())
                .status(symbol.getStatus())
                .createdBy(symbol.getCreatedBy())
                .createdAt(symbol.getCreatedAt())
                .updatedAt(symbol.getUpdatedAt())
                .build();
    }
}
