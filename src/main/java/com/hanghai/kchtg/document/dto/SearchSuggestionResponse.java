package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

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
