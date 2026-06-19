package com.hanghai.kchtg.gis.polygon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "polygon_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PolygonHistory extends BaseEntity {

    public enum ActionType {
        CREATE, UPDATE, DELETE, APPROVE, REJECT, ATTACH, DETACH
    }

    @Column(name = "object_id", nullable = false)
    private String objectId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ActionType actionType;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(length = 500)
    private String reason;
}
