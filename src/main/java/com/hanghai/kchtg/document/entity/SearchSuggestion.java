package com.hanghai.kchtg.document.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Gợi ý tìm kiếm — search suggestion records.
 * Used by F-135 Tìm kiếm văn bản pháp lý.
 */
@Entity
@Table(name = "search_suggestions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchSuggestion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "keyword", length = 200, unique = true)
    private String keyword;

    @Column(name = "search_count")
    private Integer searchCount;

    @Column(name = "last_searched")
    private LocalDateTime lastSearchedAt;
}
