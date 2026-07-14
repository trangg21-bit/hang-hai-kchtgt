package com.hanghai.kchtg.deke.repository;

import com.hanghai.kchtg.deke.entity.DeKe;
import com.hanghai.kchtg.deke.entity.LoaiDe;
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

    List<DeKe> findByLoaiDeAndIsDeletedFalse(LoaiDe loaiDe);

    List<DeKe> findByViTriContainingAndIsDeletedFalse(String viTri);

    @Query("SELECT d FROM DeKe d WHERE " +
            "(:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(d.viTri) LIKE :keyword) AND " +
            "(:loaiDe IS NULL OR d.loaiDe = :loaiDe) AND " +
            "(:tinhTrang IS NULL OR d.tinhTrang = :tinhTrang) AND " +
            "(:trangThaiPheDuyet IS NULL OR d.trangThaiPheDuyet = :trangThaiPheDuyet) AND " +
            "d.isDeleted = false")
    Page<DeKe> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") java.util.UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("loaiDe") LoaiDe loaiDe,
            @org.springframework.data.repository.query.Param("tinhTrang") String tinhTrang,
            @org.springframework.data.repository.query.Param("trangThaiPheDuyet") DeKeApprovalStatus trangThaiPheDuyet,
            Pageable pageable);
}
