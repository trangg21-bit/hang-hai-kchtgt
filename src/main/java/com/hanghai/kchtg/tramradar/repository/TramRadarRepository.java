package com.hanghai.kchtg.tramradar.repository;

import com.hanghai.kchtg.tramradar.entity.TramRadar;
import com.hanghai.kchtg.tramradar.entity.TramRadarApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TramRadarRepository extends JpaRepository<TramRadar, java.util.UUID> {

    List<TramRadar> findByTrangThaiAndIsDeletedFalse(TramRadarApprovalStatus trangThai);

    List<TramRadar> findByHeThongVtsId(java.util.UUID heThongVtsId);

    long countByHeThongVtsId(java.util.UUID heThongVtsId);

    @Query("""
        SELECT t FROM TramRadar t
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR
            LOWER(t.tenTram) LIKE :keyword OR
            LOWER(t.viTri) LIKE :keyword OR
            LOWER(t.loaiTram) LIKE :keyword)
          AND (:tinhTrang IS NULL OR t.tinhTrang = :tinhTrang)
          AND (:trangThai IS NULL OR t.trangThai = :trangThai)
        ORDER BY t.ngayTao DESC
    """)
    Page<TramRadar> search(
        @Param("orgUnitId") java.util.UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("tinhTrang") String tinhTrang,
        @Param("trangThai") TramRadarApprovalStatus trangThai,
        Pageable pageable
    );
    @Query("SELECT t FROM TramRadar t WHERE " +
           "t.isDeleted = false AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(t.tenTram) LIKE :search OR LOWER(t.viTri) LIKE :search)")
    List<TramRadar> searchFiltered(
            @Param("orgUnitId") java.util.UUID orgUnitId,
            @Param("search") String search);
}