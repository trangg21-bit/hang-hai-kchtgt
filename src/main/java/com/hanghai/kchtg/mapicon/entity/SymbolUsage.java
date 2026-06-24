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
 * Lịch sử sử dụng biểu tượng bản đồ - ghi lại mọi lần symbol được gắn
 * vào một đối tượng (object) trong hệ thống.
 */
@Entity
@Table(name = "symbol_usages")
@Getter
@Setter
@NoArgsConstructor
public class SymbolUsage extends BaseEntity {

    /** ID của symbol (map_icon) được sử dụng. */
    @Column(name = "symbol_id", nullable = false)
    private UUID symbolId;

    /** ID của đối tượng mà symbol được gắn vào (ví dụ: navigation_point, hazard, etc.). */
    @Column(name = "object_id", nullable = false)
    private UUID objectId;

    /** Loại đối tượng (ví dụ: "NAVIGATION_POINT", "HAZARD", "WAYPOINT"). */
    @Column(name = "object_type", nullable = false, length = 50)
    private String objectType;

    /** Thời điểm symbol được gắn vào đối tượng. */
    @Column(name = "used_at", nullable = false)
    private java.time.LocalDateTime usedAt;

    /** ID người dùng thực hiện việc gắn symbol. */
    @Column(name = "used_by", nullable = false)
    private UUID usedBy;

    /**
     * Tạo mới SymbolUsage.
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