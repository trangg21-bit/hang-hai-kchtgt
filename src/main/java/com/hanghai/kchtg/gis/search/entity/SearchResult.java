package com.hanghai.kchtg.gis.search.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "search_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchResult extends BaseEntity {

    @Column(name = "query_id", nullable = false)
    private String queryId;

    @Column(name = "object_id", nullable = false)
    private String objectId;

    @Column(name = "object_type", nullable = false, length = 30)
    private String objectType;

    @Column(length = 200)
    private String name;

    @Column(length = 50)
    private String code;

    @Column
    private Double distance;

    @Column
    @Builder.Default
    private Boolean highlighted = false;
}
