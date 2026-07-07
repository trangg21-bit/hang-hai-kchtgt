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

    @Query("SELECT b FROM BenCang b WHERE b.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR b.orgUnitId = :orgUnitId) " +
            "AND (:maBen IS NULL OR :maBen = '' OR LOWER(b.maBen) LIKE LOWER(CONCAT('%', :maBen, '%'))) " +
            "AND (:tenBen IS NULL OR :tenBen = '' OR LOWER(b.tenBen) LIKE LOWER(CONCAT('%', :tenBen, '%'))) " +
            "AND (:cangBienId IS NULL OR b.cangBienId = :cangBienId) " +
            "AND (:loaiBen IS NULL OR :loaiBen = '' OR LOWER(b.loaiBen) LIKE LOWER(CONCAT('%', :loaiBen, '%'))) " +
            "AND (:trangThaiHoatDong IS NULL OR :trangThaiHoatDong = '' OR b.trangThaiHoatDong = :trangThaiHoatDong OR (:trangThaiHoatDong = 'HIEN_HANH' AND b.trangThaiHoatDong = 'HIỆN_HÀNH') OR (:trangThaiHoatDong = 'HIỆN_HÀNH' AND b.trangThaiHoatDong = 'HIEN_HANH') OR (:trangThaiHoatDong = 'TAM_NGUNG' AND b.trangThaiHoatDong = 'TẠM_NGƯNG') OR (:trangThaiHoatDong = 'TẠM_NGƯNG' AND b.trangThaiHoatDong = 'TAM_NGUNG')) " +
            "AND (:trangThaiPheDuyet IS NULL OR :trangThaiPheDuyet = '' OR b.trangThaiPheDuyet = :trangThaiPheDuyet OR (:trangThaiPheDuyet = 'DUOC_PHE_DUYET' AND b.trangThaiPheDuyet = 'APPROVED') OR (:trangThaiPheDuyet = 'APPROVED' AND b.trangThaiPheDuyet = 'DUOC_PHE_DUYET'))")
    Page<BenCang> search(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("maBen") String maBen,
            @Param("tenBen") String tenBen,
            @Param("cangBienId") UUID cangBienId,
            @Param("loaiBen") String loaiBen,
            @Param("trangThaiHoatDong") String trangThaiHoatDong,
            @Param("trangThaiPheDuyet") String trangThaiPheDuyet,
            Pageable pageable);

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
