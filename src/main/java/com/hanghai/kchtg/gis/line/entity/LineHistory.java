package com.hanghai.kchtg.gis.line.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "line_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LineHistory extends BaseEntity {

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