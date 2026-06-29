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

    List<LuongHangHai> findByIsDeletedFalse();

    List<LuongHangHai> findByLoaiTauContainingAndIsDeletedFalse(String loaiTau);

    @Query("SELECT l FROM LuongHangHai l WHERE " +
            "(:keyword IS NULL OR l.loaiTau LIKE %:keyword%) AND " +
            "(:gioDien IS NULL OR l.gioDien = :gioDien) AND " +
            "(:taiTrong IS NULL OR l.taiTrong = :taiTrong) AND " +
            "(:trangThaiPheDuyet IS NULL OR l.approvalStatus = :trangThaiPheDuyet) AND " +
            "l.isDeleted = false")
    Page<LuongHangHai> searchDocuments(
            String keyword, String gioDien, String taiTrong, LuongHangHaiApprovalStatus trangThaiPheDuyet,
            Pageable pageable);
}
