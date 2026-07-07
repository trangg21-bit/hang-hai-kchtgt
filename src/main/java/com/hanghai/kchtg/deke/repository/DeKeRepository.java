package com.hanghai.kchtg.deke.repository;

import com.hanghai.kchtg.deke.entity.DeKe;
import com.hanghai.kchtg.deke.entity.DeKeApprovalStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeKeRepository extends JpaRepository<DeKe, Long> {

    List<DeKe> findByTrangThaiPheDuyetAndIsDeletedFalse(DeKeApprovalStatus trangThaiPheDuyet);

    List<DeKe> findByIsDeletedFalse(Sort sort);

    Page<DeKe> findByIsDeletedFalse(Pageable pageable);

    List<DeKe> findByLoaiDeContainingAndIsDeletedFalse(String loaiDe);

    List<DeKe> findByViTriContainingAndIsDeletedFalse(String viTri);

    @Query("SELECT d FROM DeKe d WHERE " +
            "(:keyword IS NULL OR d.loaiDe LIKE %:keyword% OR d.viTri LIKE %:keyword%) AND " +
            "(:loaiDe IS NULL OR d.loaiDe = :loaiDe) AND " +
            "(:tinhTrang IS NULL OR d.tinhTrang = :tinhTrang) AND " +
            "(:trangThaiPheDuyet IS NULL OR d.trangThaiPheDuyet = :trangThaiPheDuyet) AND " +
            "d.isDeleted = false")
    Page<DeKe> searchDocuments(
            String keyword, String loaiDe, String tinhTrang, DeKeApprovalStatus trangThaiPheDuyet,
            Pageable pageable);
}
