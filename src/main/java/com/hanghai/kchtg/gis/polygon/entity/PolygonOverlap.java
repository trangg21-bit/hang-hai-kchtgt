package com.hanghai.kchtg.gis.polygon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "polygon_overlaps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolygonOverlap extends BaseEntity {

    @Column(name = "polygon_id_a", nullable = false)
    private String polygonIdA;

    @Column(name = "polygon_id_b", nullable = false)
    private String polygonIdB;

    @Column(name = "overlap_area")
    private BigDecimal overlapArea;
}
