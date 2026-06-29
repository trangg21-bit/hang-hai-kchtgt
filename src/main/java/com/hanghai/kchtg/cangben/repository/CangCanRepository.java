package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.CangCan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CangCanRepository extends JpaRepository<CangCan, UUID> {

    Optional<CangCan> findByMaCangCan(String maCangCan);

    boolean existsByMaCangCan(String maCangCan);

    @Query("SELECT c FROM CangCan c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId)")
    Page<CangCan> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);
}
