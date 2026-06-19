package com.hanghai.kchtg.gis.search.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "search_queries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchQuery extends BaseEntity {

    public enum QueryType {
        TEXT,
        LOCATION,
        RADIUS,
        POLYGON,
        COORDINATE
    }

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QueryType queryType;

    @Column(length = 1000)
    private String queryText;

    @Column(name = "query_params", columnDefinition = "TEXT")
    private String queryParams;

    @Column(name = "result_count")
    private Integer resultCount;

    @Column(name = "duration_ms")
    private Long durationMs;
}
