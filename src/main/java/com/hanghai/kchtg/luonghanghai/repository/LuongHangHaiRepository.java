package com.hanghai.kchtg.luonghanghai.repository;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHai;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LuongHangHaiRepository extends JpaRepository<LuongHangHai, Long> {

    List<LuongHangHai> findByApprovalStatusAndIsDeletedFalse(LuongHangHaiApprovalStatus approvalStatus);

    List<LuongHangHai> findByIsDeletedFalse(Sort sort);

    Page<LuongHangHai> findByIsDeletedFalse(Pageable pageable);

    List<LuongHangHai> findByLoaiTauContainingAndIsDeletedFalse(String loaiTau);

    @Query("SELECT l FROM LuongHangHai l WHERE " +
            "(:orgUnitId IS NULL OR l.donViId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(l.loaiTau) LIKE :keyword) AND " +
            "(:gioDien IS NULL OR l.gioDien = :gioDien) AND " +
            "(:taiTrong IS NULL OR l.taiTrong = :taiTrong) AND " +
            "(:trangThaiPheDuyet IS NULL OR l.approvalStatus = :trangThaiPheDuyet) AND " +
            "l.isDeleted = false")
    Page<LuongHangHai> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") java.util.UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("gioDien") String gioDien,
            @org.springframework.data.repository.query.Param("taiTrong") String taiTrong,
            @org.springframework.data.repository.query.Param("trangThaiPheDuyet") LuongHangHaiApprovalStatus trangThaiPheDuyet,
            Pageable pageable);
}
