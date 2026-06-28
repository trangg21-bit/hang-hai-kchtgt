package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;
import org.hibernate.annotations.Where;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing an organisational unit in the hierarchical org chart.
 * <p>
 * Self-referencing via {@code parentId} (nullable for root nodes).
 * Uses Materialized Path pattern for O(log N) subtree traversal.
 * Extends {@link BaseEntity} for audit fields (id, createdAt, updatedAt, deletedAt).
 * </p>
 *
 * <p>
 * Business rules enforced:
 * <ul>
 *   <li>BR-013: unique code per scope</li>
 *   <li>BR-016: parent-child hierarchy with circular ref detection</li>
 *   <li>BR-017: coefficient > 0, max 2 decimal places</li>
 * </ul>
 * </p>
 */
@Entity
@Table(name = "org_units",
       indexes = {
           @Index(name = "idx_org_units_path", columnList = "path"),
           @Index(name = "idx_org_units_parent", columnList = "parent_id"),
           @Index(name = "idx_org_units_type_status", columnList = "unit_type, status"),
           @Index(name = "idx_org_units_level", columnList = "level")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Where(clause = "deleted_at IS NULL")
public class OrgUnit extends BaseEntity {

    /** Display name of the organisational unit (max 200 chars). BR-003-08 */
    @NotBlank(message = "Tên đơn vị không được để trống")
    @Size(max = 200, message = "Tên đơn vị tối đa 200 ký tự")
    @Column(nullable = false, length = 200)
    private String name;

    /** Unique business code for the unit. BR-013 */
    @NotBlank(message = "Mã đơn vị không được để trống")
    @Size(max = 50, message = "Mã đơn vị tối đa 50 ký tự")
    @Column(nullable = false, unique = true, length = 50)
    private String code;

    /** Parent unit ID for hierarchical organisation. null indicates a root-level unit. BR-016 */
    @Column
    private UUID parentId;

    /** Organisational unit type (CUC, CHI_CUC, CANG_VU, TCT). BR-003-04 */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrgUnitType type;

    /** Optional description of the unit */
    @Column(length = 1000)
    private String description;

    /** Physical or mailing address (max 500 chars, optional). */
    @Column(length = 500)
    private String address;

    /** Contact phone number (max 20 chars, optional). */
    @Column(length = 20)
    private String phone;

    /** Approval status. Defaults to DRAFT at creation time. */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private OrgUnitStatus status;

    // ── Materialized Path fields ─────────────────────────────────────

    /**
     * Materialized path for subtree traversal. Format: /1/5/12/ (trailing slash).
     * Root has path like /{id}/. Computed by MaterializedPathService.
     */
    @NotBlank(message = "Đường dẫn không được để trống")
    @Size(max = 500, message = "Đường dẫn tối đa 500 ký tự")
    @Column(nullable = false, length = 500)
    private String path;

    /** Depth from root (root = 1, child of root = 2, grandchild = 3). Auto-computed. */
    @Column(nullable = false)
    private Integer level;

    /** Scope identifier for multi-tenant isolation. 0 = single root (current). */
    @Column(nullable = false)
    private Long scopeId;

    /** Sibling ordering within same parent. */
    @Column(nullable = false)
    private Integer sortOrder;

    /** Coefficient for calculations/reports. Must be > 0 with max 2 decimal places (BR-017). */
    @DecimalMin(value = "0.01", message = "Hệ số phải lớn hơn 0")
    @Column(precision = 5, scale = 2)
    private Double coefficient;

    /** Timestamp when unit was approved (set on APPROVED transition). */
    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    // ── Factory methods ──────────────────────────────────────────────

    /**
     * Create a new root unit (no parent).
     */
    public static OrgUnit createRoot(String name, String code, OrgUnitType type,
                                     String description, String address, String phone,
                                     Double coefficient) {
        OrgUnit unit = new OrgUnit();
        unit.setName(name);
        unit.setCode(code);
        unit.setType(type);
        unit.setDescription(description);
        unit.setAddress(address);
        unit.setPhone(phone);
        unit.setCoefficient(coefficient);
        unit.setStatus(OrgUnitStatus.DRAFT);
        unit.setPath("");   // set later by MaterializedPathService
        unit.setLevel(0);
        unit.setScopeId(0L);
        unit.setSortOrder(0);
        return unit;
    }
}
