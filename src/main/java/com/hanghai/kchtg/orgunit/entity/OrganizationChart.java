package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * So d? t? ch?c chi ti?t — b? sung thông tin th? b?c và v? trí x?p h?ng
 * cho m?i don v? trong cây t? ch?c.
 * <p>
 * Entity này song song v?i {@link OrgUnit} nhung cung c?p thêm metadata
 * cho các tính nang hi?n th? cây t? ch?c và tính nang phê duy?t phân c?p.
 * </p>
 */
@Entity
@Table(name = "organization_chart")
@Getter
@Setter
@NoArgsConstructor
public class OrganizationChart extends BaseEntity {

    /** ID c?a don v? t? ch?c. */
    @Column(name = "unit_id", nullable = false, unique = true)
    private UUID unitId;

    /** ID c?a don v? cha trong cây t? ch?c (nullable n?u là g?c). */
    @Column(name = "parent_id")
    private UUID parentId;

    /** Đ? sâu c?a don v? trong cây (root = 0). */
    @Column(nullable = false)
    private int level;

    /** Th? t? hi?n th? trong cùng c?p (sort order). */
    @Column(nullable = false)
    private int sortOrder;

    /**
     * T?o m?i OrganizationChart v?i level và sortOrder t? d?ng.
     */
    public static OrganizationChart create(UUID unitId, UUID parentId, int sortOrder) {
        OrganizationChart chart = new OrganizationChart();
        chart.setUnitId(unitId);
        chart.setParentId(parentId);
        chart.setLevel(parentId != null ? 0 : 0); // du?c tính l?i b?i service
        chart.setSortOrder(sortOrder);
        return chart;
    }

    /**
     * Tính level d?a vào parent.
     */
    public void recalculateLevel(int parentLevel) {
        this.level = parentLevel + 1;
    }
}
