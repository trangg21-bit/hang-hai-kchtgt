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

    @Query("SELECT c FROM CangCan c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) " +
            "AND (:maCangCan IS NULL OR :maCangCan = '' OR LOWER(c.maCangCan) LIKE LOWER(CONCAT('%', :maCangCan, '%'))) " +
            "AND (:tenCangCan IS NULL OR :tenCangCan = '' OR LOWER(c.tenCangCan) LIKE LOWER(CONCAT('%', :tenCangCan, '%'))) " +
            "AND (:tinhThanhPho IS NULL OR :tinhThanhPho = '' OR LOWER(c.tinhThanhPho) LIKE LOWER(CONCAT('%', :tinhThanhPho, '%'))) " +
            "AND (:trangThaiHoatDong IS NULL OR :trangThaiHoatDong = '' OR c.trangThaiHoatDong = :trangThaiHoatDong OR (:trangThaiHoatDong = 'HIEN_HANH' AND c.trangThaiHoatDong = 'HIỆN_HÀNH') OR (:trangThaiHoatDong = 'HIỆN_HÀNH' AND c.trangThaiHoatDong = 'HIEN_HANH') OR (:trangThaiHoatDong = 'TAM_NGUNG' AND c.trangThaiHoatDong = 'TẠM_NGƯNG') OR (:trangThaiHoatDong = 'TẠM_NGƯNG' AND c.trangThaiHoatDong = 'TAM_NGUNG')) " +
            "AND (:trangThaiPheDuyet IS NULL OR :trangThaiPheDuyet = '' OR c.trangThaiPheDuyet = :trangThaiPheDuyet OR (:trangThaiPheDuyet = 'DUOC_PHE_DUYET' AND c.trangThaiPheDuyet = 'APPROVED') OR (:trangThaiPheDuyet = 'APPROVED' AND c.trangThaiPheDuyet = 'DUOC_PHE_DUYET'))")
    Page<CangCan> search(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("maCangCan") String maCangCan,
            @Param("tenCangCan") String tenCangCan,
            @Param("tinhThanhPho") String tinhThanhPho,
            @Param("trangThaiHoatDong") String trangThaiHoatDong,
            @Param("trangThaiPheDuyet") String trangThaiPheDuyet,
            Pageable pageable);
}
