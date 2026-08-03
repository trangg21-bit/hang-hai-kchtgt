package com.hanghai.kchtg.document.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tìm kiếm log — search activity log.
 * Used by F-135 Tìm kiếm văn bản pháp lý.
 */
@Entity
@Table(name = "search_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "searched_by", length = 100)
    private String searchedBy;

    @Column(name = "keyword", length = 300)
    private String keyword;

    @Column(name = "filters", length = 200)
    private String filters;

    @Column(name = "result_count")
    private Integer resultCount;

    @Column(name = "searched_at", updatable = false)
    private LocalDateTime searchedAt;

    @PrePersist
    protected void onCreate() {
        this.searchedAt = LocalDateTime.now();
    }
}
