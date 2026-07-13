package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.LoaiBen;
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

    long countByTrangThaiPheDuyetAndDeletedAtIsNull(TrangThaiPheDuyet trangThaiPheDuyet);

    @Query("SELECT b FROM BenCang b WHERE b.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR b.orgUnitId = :orgUnitId) " +
            "AND (CAST(:maBen AS string) IS NULL OR LOWER(b.maBen) LIKE LOWER(CONCAT('%', CAST(:maBen AS string), '%'))) " +
            "AND (CAST(:tenBen AS string) IS NULL OR LOWER(b.tenBen) LIKE LOWER(CONCAT('%', CAST(:tenBen AS string), '%'))) " +
            "AND (:cangBienId IS NULL OR b.cangBienId = :cangBienId) " +
            "AND (CAST(:tuyenDuongThuy AS string) IS NULL OR LOWER(b.tuyenDuongThuy) LIKE LOWER(CONCAT('%', CAST(:tuyenDuongThuy AS string), '%'))) " +
            "AND (:loaiBen IS NULL OR b.loaiBen = :loaiBen) " +
            "AND (:trangThaiHoatDong IS NULL OR b.trangThaiHoatDong = :trangThaiHoatDong) " +
            "AND (:trangThaiPheDuyet IS NULL OR b.trangThaiPheDuyet = :trangThaiPheDuyet)")
    Page<BenCang> searchBenCang(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("maBen") String maBen,
            @Param("tenBen") String tenBen,
            @Param("cangBienId") UUID cangBienId,
            @Param("tuyenDuongThuy") String tuyenDuongThuy,
            @Param("loaiBen") LoaiBen loaiBen,
            @Param("trangThaiHoatDong") TrangThaiHoatDong trangThaiHoatDong,
            @Param("trangThaiPheDuyet") TrangThaiPheDuyet trangThaiPheDuyet,
            Pageable pageable);
}
