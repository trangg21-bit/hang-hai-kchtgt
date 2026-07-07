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

    @Query("SELECT v FROM VungNuoc v WHERE v.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR v.orgUnitId = :orgUnitId) " +
            "AND (:maVungNuoc IS NULL OR :maVungNuoc = '' OR LOWER(v.maVungNuoc) LIKE LOWER(CONCAT('%', :maVungNuoc, '%'))) " +
            "AND (:tenVungNuoc IS NULL OR :tenVungNuoc = '' OR LOWER(v.tenVungNuoc) LIKE LOWER(CONCAT('%', :tenVungNuoc, '%'))) " +
            "AND (:cangBienId IS NULL OR v.cangBienId = :cangBienId) " +
            "AND (:loaiVungNuoc IS NULL OR :loaiVungNuoc = '' OR LOWER(v.loaiVungNuoc) LIKE LOWER(CONCAT('%', :loaiVungNuoc, '%'))) " +
            "AND (:trangThaiHoatDong IS NULL OR :trangThaiHoatDong = '' OR v.trangThaiHoatDong = :trangThaiHoatDong OR (:trangThaiHoatDong = 'HIEN_HANH' AND v.trangThaiHoatDong = 'HIỆN_HÀNH') OR (:trangThaiHoatDong = 'HIỆN_HÀNH' AND v.trangThaiHoatDong = 'HIEN_HANH') OR (:trangThaiHoatDong = 'TAM_NGUNG' AND v.trangThaiHoatDong = 'TẠM_NGƯNG') OR (:trangThaiHoatDong = 'TẠM_NGƯNG' AND v.trangThaiHoatDong = 'TAM_NGUNG')) " +
            "AND (:trangThaiPheDuyet IS NULL OR :trangThaiPheDuyet = '' OR v.trangThaiPheDuyet = :trangThaiPheDuyet OR (:trangThaiPheDuyet = 'DUOC_PHE_DUYET' AND v.trangThaiPheDuyet = 'APPROVED') OR (:trangThaiPheDuyet = 'APPROVED' AND v.trangThaiPheDuyet = 'DUOC_PHE_DUYET'))")
    Page<VungNuoc> search(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("maVungNuoc") String maVungNuoc,
            @Param("tenVungNuoc") String tenVungNuoc,
            @Param("cangBienId") UUID cangBienId,
            @Param("loaiVungNuoc") String loaiVungNuoc,
            @Param("trangThaiHoatDong") String trangThaiHoatDong,
            @Param("trangThaiPheDuyet") String trangThaiPheDuyet,
            Pageable pageable);

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
