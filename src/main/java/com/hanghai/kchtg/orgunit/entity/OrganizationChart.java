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
 * Sơ đồ tổ chức chi tiết - bổ sung thông tin thứ bậc và vị trí xếp hạng
 * cho mọi đơn vị trong cây tổ chức.
 * <p>
 * Entity này song song với {@link OrgUnit} nhưng cung cấp thêm metadata
 * cho các tính năng hiển thị cây tổ chức và tính năng phê duyệt phân cấp.
 * </p>
 */
@Entity
@Table(name = "organization_chart")
@Getter
@Setter
@NoArgsConstructor
public class OrganizationChart extends BaseEntity {

    /** ID của đơn vị tổ chức. */
    @Column(name = "unit_id", nullable = false, unique = true)
    private UUID unitId;

    /** ID của đơn vị cha trong cây tổ chức (nullable nếu là gốc). */
    @Column(name = "parent_id")
    private UUID parentId;

    /** Độ sâu của đơn vị trong cây (root = 0). */
    @Column(nullable = false)
    private int level;

    /** Thứ tự hiển thị trong cùng cấp (sort order). */
    @Column(nullable = false)
    private int sortOrder;

    /**
     * Tạo mới OrganizationChart vỏi level và sortOrder tự động.
     */
    public static OrganizationChart create(UUID unitId, UUID parentId, int sortOrder) {
        OrganizationChart chart = new OrganizationChart();
        chart.setUnitId(unitId);
        chart.setParentId(parentId);
        chart.setLevel(parentId != null ? 0 : 0); // được tính lại bởi service
        chart.setSortOrder(sortOrder);
        return chart;
    }

    /**
     * Tính level dựa vào parent.
     */
    public void recalculateLevel(int parentLevel) {
        this.level = parentLevel + 1;
    }
}