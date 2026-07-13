package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.CauCang;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
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
public interface CauCangRepository extends JpaRepository<CauCang, UUID> {

    Optional<CauCang> findByMaCau(String maCau);

    boolean existsByMaCau(String maCau);

    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId)")
    Page<CauCang> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL AND c.benCangId = :benCangId")
    List<CauCang> findByBenCangIdAndDeletedAtIsNull(@Param("benCangId") UUID benCangId);

    @Query("SELECT COUNT(c) FROM CauCang c WHERE c.deletedAt IS NULL AND c.benCangId = :benCangId")
    long countByBenCangIdAndDeletedAtIsNull(@Param("benCangId") UUID benCangId);

    /**
     * Paginated list of active CauCang filtered by parent BenCang ID.
     */
    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL AND c.benCangId = :benCangId")
    Page<CauCang> findByBenCangId(@Param("benCangId") UUID benCangId, Pageable pageable);

    long countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet trangThaiPheDuyet);

    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) " +
            "AND (CAST(:search AS string) IS NULL OR LOWER(c.maCau) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) " +
            "     OR LOWER(c.tenCau) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:benCangId IS NULL OR c.benCangId = :benCangId) " +
            "AND (:status IS NULL OR c.trangThaiHoatDong = :status) " +
            "AND (:approvalStatus IS NULL OR c.trangThaiPheDuyet = :approvalStatus)")
    Page<CauCang> searchCauCang(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("benCangId") UUID benCangId,
            @Param("status") TrangThaiHoatDong status,
            @Param("approvalStatus") TrangThaiPheDuyet approvalStatus,
            Pageable pageable);
}
