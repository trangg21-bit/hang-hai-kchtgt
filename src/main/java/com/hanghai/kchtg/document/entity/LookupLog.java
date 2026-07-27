package com.hanghai.kchtg.document.entity;

import java.util.UUID;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Tra cứu log — search/query log for planning records.
 * Used by F-133 Tra cứu quy hoạch.
 */
@Entity
@Table(name = "lookup_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LookupLog {

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
