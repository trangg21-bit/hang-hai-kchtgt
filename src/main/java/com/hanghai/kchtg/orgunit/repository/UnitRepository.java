package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

/**
 * Repository mở rộng cho entity {@link OrgUnit} với các phương thức truy vấn cây tổ chức.
 * <p>
 * Cung cấp các query method để xây dựng cây đơn vị tổ chức phân cấp,
 * bao gồm tìm node gốc, tìm tất cả node con của một node, và truy vấn toàn bộ cây.
 * </p>
 */
public interface UnitRepository extends JpaRepository<OrgUnit, UUID> {

    /**
     * Tìm tất cả các node gốc (không có đơn vị cha).
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.parentId IS NULL")
    List<OrgUnit> findAllRoots();

    /**
     * Tìm trực tiếp tất cả con của một đơn vị cụ thể.
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.parentId = :unitId")
    List<OrgUnit> findAllChildren(@Param("unitId") UUID unitId);

    /**
     * Truy vỏn toàn bộ cây tổ chức thông qua SELF-JOIN đệ quy.
     * Sử dụng {@code WITH RECURSIVE CTE} để lấy toàn bộ cây từ một node gốc.
     */
    @Query(value = """
        WITH RECURSIVE org_tree AS (
            SELECT id, name, code, parent_id, type, address, phone, status, 0 AS level
            FROM org_units
            WHERE id = :rootId
            UNION ALL
            SELECT u.id, u.name, u.code, u.parent_id, u.type, u.address, u.phone, u.status, ot.level + 1
            FROM org_units u
            INNER JOIN org_tree ot ON u.parent_id = ot.id
        )
        SELECT * FROM org_tree
        """, nativeQuery = true)
    List<Object[]> findTree(@Param("rootId") UUID rootId);

    /**
     * Đếm số đơn vị con trực tiếp của một đơn vị.
     */
    long countByParentIdIsNull();
}