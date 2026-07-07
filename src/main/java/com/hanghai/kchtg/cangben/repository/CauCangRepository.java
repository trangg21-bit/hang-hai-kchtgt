package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.CauCang;
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

    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) " +
            "AND (:search IS NULL OR :search = '' OR LOWER(c.maCau) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(c.tenCau) LIKE LOWER(CONCAT('%', :search, '%'))) " +
            "AND (:trangThaiHoatDong IS NULL OR :trangThaiHoatDong = '' OR c.trangThaiHoatDong = :trangThaiHoatDong OR (:trangThaiHoatDong = 'HIEN_HANH' AND c.trangThaiHoatDong = 'HIỆN_HÀNH') OR (:trangThaiHoatDong = 'HIỆN_HÀNH' AND c.trangThaiHoatDong = 'HIEN_HANH') OR (:trangThaiHoatDong = 'TAM_NGUNG' AND c.trangThaiHoatDong = 'TẠM_NGƯNG') OR (:trangThaiHoatDong = 'TẠM_NGƯNG' AND c.trangThaiHoatDong = 'TAM_NGUNG')) " +
            "AND (:trangThaiPheDuyet IS NULL OR :trangThaiPheDuyet = '' OR c.trangThaiPheDuyet = :trangThaiPheDuyet OR (:trangThaiPheDuyet = 'DUOC_PHE_DUYET' AND c.trangThaiPheDuyet = 'APPROVED') OR (:trangThaiPheDuyet = 'APPROVED' AND c.trangThaiPheDuyet = 'DUOC_PHE_DUYET')) " +
            "AND (:benCangId IS NULL OR c.benCangId = :benCangId)")
    Page<CauCang> search(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("trangThaiHoatDong") String trangThaiHoatDong,
            @Param("trangThaiPheDuyet") String trangThaiPheDuyet,
            @Param("benCangId") UUID benCangId,
            Pageable pageable);

    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL AND c.benCangId = :benCangId")
    List<CauCang> findByBenCangIdAndDeletedAtIsNull(@Param("benCangId") UUID benCangId);

    @Query("SELECT COUNT(c) FROM CauCang c WHERE c.deletedAt IS NULL AND c.benCangId = :benCangId")
    long countByBenCangIdAndDeletedAtIsNull(@Param("benCangId") UUID benCangId);

    /**
     * Paginated list of active CauCang filtered by parent BenCang ID.
     */
    @Query("SELECT c FROM CauCang c WHERE c.deletedAt IS NULL AND c.benCangId = :benCangId")
    Page<CauCang> findByBenCangId(@Param("benCangId") UUID benCangId, Pageable pageable);
}
