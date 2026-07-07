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
            "AND (:maCang IS NULL OR :maCang = '' OR LOWER(c.maCang) LIKE LOWER(CONCAT('%', :maCang, '%'))) " +
            "AND (:tenCang IS NULL OR :tenCang = '' OR LOWER(c.tenCang) LIKE LOWER(CONCAT('%', :tenCang, '%'))) " +
            "AND (:tinhThanhPho IS NULL OR :tinhThanhPho = '' OR LOWER(c.tinhThanhPho) LIKE LOWER(CONCAT('%', :tinhThanhPho, '%'))) " +
            "AND (:trangThaiHoatDong IS NULL OR :trangThaiHoatDong = '' OR c.trangThaiHoatDong = :trangThaiHoatDong OR (:trangThaiHoatDong = 'HIEN_HANH' AND c.trangThaiHoatDong = 'HIỆN_HÀNH') OR (:trangThaiHoatDong = 'HIỆN_HÀNH' AND c.trangThaiHoatDong = 'HIEN_HANH') OR (:trangThaiHoatDong = 'TAM_NGUNG' AND c.trangThaiHoatDong = 'TẠM_NGƯNG') OR (:trangThaiHoatDong = 'TẠM_NGƯNG' AND c.trangThaiHoatDong = 'TAM_NGUNG')) " +
            "AND (:trangThaiPheDuyet IS NULL OR :trangThaiPheDuyet = '' OR c.trangThaiPheDuyet = :trangThaiPheDuyet OR (:trangThaiPheDuyet = 'DUOC_PHE_DUYET' AND c.trangThaiPheDuyet = 'APPROVED') OR (:trangThaiPheDuyet = 'APPROVED' AND c.trangThaiPheDuyet = 'DUOC_PHE_DUYET'))")
    Page<CangBien> search(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("maCang") String maCang,
            @Param("tenCang") String tenCang,
            @Param("tinhThanhPho") String tinhThanhPho,
            @Param("trangThaiHoatDong") String trangThaiHoatDong,
            @Param("trangThaiPheDuyet") String trangThaiPheDuyet,
            Pageable pageable);
}
