package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository m? r?ng cho entity {@link OrgUnit} v?i các phuong th?c truy v?n cây t? ch?c.
 * <p>
 * Cung c?p các query method d? xây d?ng cây don v? t? ch?c phân c?p,
 * bao g?m t́m node g?c, t́m t?t c? node con c?a m?t node, và truy v?n toàn b? cây.
 * </p>
 */
@Repository
public interface UnitRepository extends JpaRepository<OrgUnit, UUID> {

    /**
     * T́m t?t c? các node g?c (không có don v? cha).
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.parentId IS NULL")
    List<OrgUnit> findAllRoots();

    /**
     * T́m tr?c ti?p t?t c? con c?a m?t don v? c? th?.
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.parentId = :unitId")
    List<OrgUnit> findAllChildren(@Param("unitId") UUID unitId);

    /**
     * Truy v?n toàn b? cây t? ch?c thông qua SELF-JOIN d? quy.
     * S? d?ng {@code WITH RECURSIVE CTE} d? l?y toàn b? cây t? m?t node g?c.
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
     * Đ?m s? don v? con tr?c ti?p c?a m?t don v?.
     */
    long countByParentIdIsNull();
}
