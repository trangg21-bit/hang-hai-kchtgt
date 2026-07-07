package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.VungNuoc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VungNuocRepository extends JpaRepository<VungNuoc, UUID> {

    Optional<VungNuoc> findByMaVungNuoc(String maVungNuoc);

    boolean existsByMaVungNuoc(String maVungNuoc);

    @Query("SELECT v FROM VungNuoc v WHERE v.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR v.orgUnitId = :orgUnitId)")
    Page<VungNuoc> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    /**
     * Paginated list filtered by orgUnitId and optional parent CangBien ID (INT-004).
     */
    @Query("SELECT v FROM VungNuoc v WHERE v.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR v.orgUnitId = :orgUnitId) " +
            "AND (:cangBienId IS NULL OR v.cangBienId = :cangBienId)")
    Page<VungNuoc> findAllActive(@Param("orgUnitId") UUID orgUnitId,
                                 @Param("cangBienId") UUID cangBienId,
                                 Pageable pageable);

    @Query("SELECT v FROM VungNuoc v WHERE v.deletedAt IS NULL AND v.cangBienId = :cangBienId")
    List<VungNuoc> findByCangBienIdAndDeletedAtIsNull(@Param("cangBienId") UUID cangBienId);

    @Query("SELECT COUNT(v) FROM VungNuoc v WHERE v.deletedAt IS NULL AND v.cangBienId = :cangBienId")
    long countByCangBienIdAndDeletedAtIsNull(@Param("cangBienId") UUID cangBienId);
}
