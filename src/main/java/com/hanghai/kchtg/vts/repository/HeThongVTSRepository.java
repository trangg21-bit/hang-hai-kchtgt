package com.hanghai.kchtg.vts.repository;

import com.hanghai.kchtg.vts.entity.HeThongVTS;
import com.hanghai.kchtg.vts.entity.HeThongVTSApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HeThongVTSRepository extends JpaRepository<HeThongVTS, java.util.UUID> {

    List<HeThongVTS> findByTrangThaiAndIsDeletedFalse(HeThongVTSApprovalStatus trangThai);

    @Query("""
        SELECT t FROM HeThongVTS t
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR
            LOWER(t.tenHeThong) LIKE :keyword OR
            LOWER(t.viTri) LIKE :keyword)
          AND (:tinhTrang IS NULL OR t.tinhTrang = :tinhTrang)
          AND (:trangThai IS NULL OR t.trangThai = :trangThai)
        ORDER BY t.ngayTao DESC
    """)
    Page<HeThongVTS> search(
        @Param("orgUnitId") java.util.UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("tinhTrang") com.hanghai.kchtg.vts.entity.TinhTrangVTS tinhTrang,
        @Param("trangThai") HeThongVTSApprovalStatus trangThai,
        Pageable pageable
    );
}
