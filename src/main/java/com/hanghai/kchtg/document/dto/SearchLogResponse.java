package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchLogResponse {

    private UUID id;
    private String searchedBy;
    private String keyword;
    private String filters;
    private Integer resultCount;
    private LocalDateTime searchedAt;
}
