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
public class SearchSuggestionResponse {

    private UUID id;
    private String keyword;
    private Integer searchCount;
    private LocalDateTime lastSearchedAt;
}
