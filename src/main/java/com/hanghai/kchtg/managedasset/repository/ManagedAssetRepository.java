package com.hanghai.kchtg.managedasset.repository;

import java.util.UUID;

import com.hanghai.kchtg.managedasset.entity.ManagedAsset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link ManagedAsset} (Tài sản Quản lý) entity.
 * Provides CRUD operations and query methods for financial/management asset data.
 */
@Repository
public interface ManagedAssetRepository extends JpaRepository<ManagedAsset, UUID> {

    /**
     * Find all assets for a given organisational unit.
     * @param orgUnitId the organisational unit UUID
     * @return list of ManagedAsset assets
     */
    List<ManagedAsset> findByOrgUnitId(UUID orgUnitId);

    /**
     * Find assets for a given organisational unit and asset group (assetGroup).
     * @param orgUnitId the organisational unit UUID
     * @param assetGroup the asset group code (e.g. CB, BC, CC, VTS, ...)
     * @return list of ManagedAsset assets matching the org unit and group
     */
    List<ManagedAsset> findByOrgUnitIdAndAssetGroup(UUID orgUnitId, String assetGroup);

    /**
     * Find all assets belonging to a given asset group (assetGroup).
     * @param assetGroup the asset group code
     * @return list of ManagedAsset assets in that group
     */
    List<ManagedAsset> findByAssetGroup(String assetGroup);

    /**
     * Find assets for a given organisational unit with declarationDate on or before a date.
     * Used by F-143 for "kê khai lần đầu" (bcNoiDung='1').
     * @param orgUnitId the organisational unit UUID
     * @param date the cut-off date (inclusive)
     * @return list of ManagedAsset assets
     */
    List<ManagedAsset> findByOrgUnitIdAndDeclarationDateLessThanEqual(UUID orgUnitId, LocalDate date);

    /**
     * Find assets for a given organisational unit with declarationDate after a date.
     * Used by F-143 for "kê khai bổ sung" (bcNoiDung='2').
     * @param orgUnitId the organisational unit UUID
     * @param date the cut-off date (exclusive)
     * @return list of ManagedAsset assets
     */
    List<ManagedAsset> findByOrgUnitIdAndDeclarationDateAfter(UUID orgUnitId, LocalDate date);
}
