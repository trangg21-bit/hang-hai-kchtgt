package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.BenCang;
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
public interface BenCangRepository extends JpaRepository<BenCang, UUID> {

    Optional<BenCang> findByMaBen(String maBen);

    boolean existsByMaBen(String maBen);

    @Query("SELECT b FROM BenCang b WHERE b.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR b.orgUnitId = :orgUnitId)")
    Page<BenCang> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT b FROM BenCang b WHERE b.deletedAt IS NULL AND b.cangBienId = :cangBienId")
    List<BenCang> findByCangBienIdAndDeletedAtIsNull(@Param("cangBienId") UUID cangBienId);

    @Query("SELECT COUNT(b) FROM BenCang b WHERE b.deletedAt IS NULL AND b.cangBienId = :cangBienId")
    long countByCangBienIdAndDeletedAtIsNull(@Param("cangBienId") UUID cangBienId);

    /**
     * Paginated list of active BenCang filtered by parent CangBien ID.
     */
    @Query("SELECT b FROM BenCang b WHERE b.deletedAt IS NULL AND b.cangBienId = :cangBienId")
    Page<BenCang> findByCangBienId(@Param("cangBienId") UUID cangBienId, Pageable pageable);
}
