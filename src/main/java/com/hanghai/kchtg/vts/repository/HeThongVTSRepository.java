package com.hanghai.kchtg.vts.repository;

import com.hanghai.kchtg.vts.entity.HeThongVTS;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HeThongVTSRepository extends JpaRepository<HeThongVTS, Long> {

    List<HeThongVTS> findByTrangThaiAndIsDeletedFalse(String trangThai);

    @Query("""
        SELECT t FROM HeThongVTS t
        WHERE (:keyword IS NULL OR
            LOWER(t.tenHeThong) LIKE LOWER(CONCAT('%', :keyword, '%')) OR
            LOWER(t.viTri) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:tinhTrang IS NULL OR t.tinhTrang = :tinhTrang)
          AND (:trangThai IS NULL OR t.trangThai = :trangThai)
        ORDER BY t.ngayTao DESC
    """)
    Page<HeThongVTS> search(
        @Param("keyword") String keyword,
        @Param("tinhTrang") String tinhTrang,
        @Param("trangThai") String trangThai,
        Pageable pageable
    );
}
