package com.hanghai.kchtg.tsql.repository;

import com.hanghai.kchtg.tsql.entity.TsQl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link TsQl} (Tài sản Quản lý) entity.
 * Provides CRUD operations and query methods for financial/management asset data.
 */
@Repository
public interface TsQlRepository extends JpaRepository<TsQl, UUID> {

    /**
     * Find all assets for a given organisational unit.
     * @param orgUnitId the organisational unit UUID
     * @return list of TsQl assets
     */
    List<TsQl> findByOrgUnitId(UUID orgUnitId);

    /**
     * Find assets for a given organisational unit and asset group (nhom).
     * @param orgUnitId the organisational unit UUID
     * @param nhom the asset group code (e.g. CB, BC, CC, VTS, ...)
     * @return list of TsQl assets matching the org unit and group
     */
    List<TsQl> findByOrgUnitIdAndNhom(UUID orgUnitId, String nhom);

    /**
     * Find all assets belonging to a given asset group (nhom).
     * @param nhom the asset group code
     * @return list of TsQl assets in that group
     */
    List<TsQl> findByNhom(String nhom);

    /**
     * Find assets for a given organisational unit with ngayKeKhai on or before a date.
     * Used by F-143 for "kê khai lần đầu" (bcNoiDung='1').
     * @param orgUnitId the organisational unit UUID
     * @param date the cut-off date (inclusive)
     * @return list of TsQl assets
     */
    List<TsQl> findByOrgUnitIdAndNgayKeKhaiLessThanEqual(UUID orgUnitId, LocalDate date);

    /**
     * Find assets for a given organisational unit with ngayKeKhai after a date.
     * Used by F-143 for "kê khai bổ sung" (bcNoiDung='2').
     * @param orgUnitId the organisational unit UUID
     * @param date the cut-off date (exclusive)
     * @return list of TsQl assets
     */
    List<TsQl> findByOrgUnitIdAndNgayKeKhaiAfter(UUID orgUnitId, LocalDate date);
}
