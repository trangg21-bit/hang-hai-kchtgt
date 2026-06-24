package com.hanghai.kchtg.mapicon.dto;

import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MapIconResponse {

    private UUID id;
    private String name;
    private String code;
    private Category category;
    private String iconUrl;
    private String size;
    private Status status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}