package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.CangBien;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository for CangBien entity.
 * Supports org-unit filtering and code uniqueness checks.
 */
@Repository
public interface CangBienRepository extends JpaRepository<CangBien, UUID> {

    /**
     * Find by unique code.
     */
    Optional<CangBien> findByMaCang(String maCang);

    /**
     * Check if a code already exists (for duplicate detection).
     */
    boolean existsByMaCang(String maCang);

    /**
     * Paginated list with optional org-unit filter.
     * Filters by org_unit_id for role-based data isolation.
     */
    @Query("SELECT c FROM CangBien c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId)")
    Page<CangBien> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT c FROM CangBien c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) " +
            "AND (:maCang IS NULL OR LOWER(c.maCang) LIKE LOWER(CONCAT('%', :maCang, '%'))) " +
            "AND (:tenCang IS NULL OR LOWER(c.tenCang) LIKE LOWER(CONCAT('%', :tenCang, '%'))) " +
            "AND (:tinhThanhPho IS NULL OR LOWER(c.tinhThanhPho) LIKE LOWER(CONCAT('%', :tinhThanhPho, '%'))) " +
            "AND (:trangThaiHoatDong IS NULL OR LOWER(c.trangThaiHoatDong) = LOWER(:trangThaiHoatDong)) " +
            "AND (:trangThaiPheDuyet IS NULL OR LOWER(c.trangThaiPheDuyet) = LOWER(:trangThaiPheDuyet))")
    Page<CangBien> searchCangBien(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("maCang") String maCang,
            @Param("tenCang") String tenCang,
            @Param("tinhThanhPho") String tinhThanhPho,
            @Param("trangThaiHoatDong") String trangThaiHoatDong,
            @Param("trangThaiPheDuyet") String trangThaiPheDuyet,
            Pageable pageable);

}
