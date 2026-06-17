package com.hanghai.kchtg.mapicon.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * L?ch s? s? d?ng bi?u tu?ng b?n d? — ghi l?i m?i l?n symbol du?c g?n
 * vào m?t d?i tu?ng (object) trong h? th?ng.
 */
@Entity
@Table(name = "symbol_usages")
@Getter
@Setter
@NoArgsConstructor
public class SymbolUsage extends BaseEntity {

    /** ID c?a symbol (map_icon) du?c s? d?ng. */
    @Column(name = "symbol_id", nullable = false)
    private UUID symbolId;

    /** ID c?a d?i tu?ng mà symbol du?c g?n vào (ví d?: navigation_point, hazard, etc.). */
    @Column(name = "object_id", nullable = false)
    private UUID objectId;

    /** Lo?i d?i tu?ng (ví d?: "NAVIGATION_POINT", "HAZARD", "WAYPOINT"). */
    @Column(name = "object_type", nullable = false, length = 50)
    private String objectType;

    /** Th?i di?m symbol du?c g?n vào d?i tu?ng. */
    @Column(name = "used_at", nullable = false)
    private java.time.LocalDateTime usedAt;

    /** ID ngu?i dùng th?c hi?n vi?c g?n symbol. */
    @Column(name = "used_by", nullable = false)
    private UUID usedBy;

    /**
     * T?o m?i SymbolUsage.
     */
    public static SymbolUsage create(UUID symbolId, UUID objectId, String objectType,
                                     UUID usedBy) {
        SymbolUsage usage = new SymbolUsage();
        usage.setSymbolId(symbolId);
        usage.setObjectId(objectId);
        usage.setObjectType(objectType);
        usage.setUsedBy(usedBy);
        usage.setUsedAt(java.time.LocalDateTime.now());
        return usage;
    }
}
