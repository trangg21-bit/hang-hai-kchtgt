package com.hanghai.kchtg.orgunit.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

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
 * </ul>
 * </p>
 */
@Entity
@Table(name = "org_units",
       indexes = {
           @Index(name = "idx_org_units_path", columnList = "path"),
           @Index(name = "idx_org_units_parent", columnList = "parent_id"),
           @Index(name = "idx_org_units_type_status", columnList = "type, status"),
           @Index(name = "idx_org_units_level", columnList = "level")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @Column(nullable = false, columnDefinition = "SMALLINT")
    private OrgUnitType type;

    /** Optional description of the unit */
    @Column(length = 1000)
    private String description;

    /** Province/city where unit is located (BA spec: tinh_thanh_pho). */
    @Column(name = "province", length = 100)
    private String province;

    /** Physical or mailing address (max 500 chars, optional). */
    @Column(length = 500)
    private String address;

    /** Detailed street address (optional). */
    @Column(name = "detail_address", length = 500)
    private String detailAddress;

    /** Contact phone number (max 20 chars, optional). */
    @Column(length = 20)
    private String phone;

    /** Contact person / representative of the unit (optional). */
    @Size(max = 200, message = "Trưởng đơn vị tối đa 200 ký tự")
    @Column(name = "contact_person", length = 200)
    private String contactPerson;

    /** Approval status. Defaults to DRAFT at creation time. */
    @Column(nullable = false, columnDefinition = "SMALLINT")
    private OrgUnitStatus status;

    /** Whether the unit is available for use, independent from approval status. */
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "operational_status", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private OrgUnitOperationalStatus operationalStatus = OrgUnitOperationalStatus.ACTIVE;

    // ── Materialized Path fields ─────────────────────────────────────

    /**
     * Materialized path for subtree traversal. Format: /1/5/12/ (trailing slash).
     * Root has path like /{id}/. Computed by MaterializedPathService.
     */
    /** Materialized path for subtree traversal. Auto-computed by service after persist. */
    @Size(max = 500, message = "Đường dẫn tối đa 500 ký tự")
    @Column(nullable = false, length = 500)
    private String path;

    /** Depth from root (root = 1, child of root = 2, grandchild = 3). Auto-computed. */
    @Column(nullable = false)
    private Integer level;

    /** Sibling ordering within same parent. */
    @Column(nullable = false)
    private Integer sortOrder;

    /** Timestamp when unit was approved (set on APPROVED transition). */
    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    // ── Factory methods ──────────────────────────────────────────────

    /**
     * Create a new root unit (no parent).
     */
    public static OrgUnit createRoot(String name, String code, OrgUnitType type,
                                      String description, String address, String phone) {
        OrgUnit unit = new OrgUnit();
        unit.setName(name);
        unit.setCode(code);
        unit.setType(type);
        unit.setDescription(description);
        unit.setAddress(address);
        unit.setPhone(phone);
        unit.setStatus(OrgUnitStatus.DRAFT);
        unit.setOperationalStatus(OrgUnitOperationalStatus.ACTIVE);
        unit.setPath("");   // set later by MaterializedPathService
        unit.setLevel(0);
        unit.setSortOrder(0);
        return unit;
    }
}
