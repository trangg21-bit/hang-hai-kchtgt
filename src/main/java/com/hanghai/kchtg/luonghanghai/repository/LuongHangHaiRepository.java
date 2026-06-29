package com.hanghai.kchtg.luonghanghai.repository;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHai;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface LuongHangHaiRepository extends JpaRepository<LuongHangHai, Long> {

    List<LuongHangHai> findByApprovalStatus(LuongHangHaiApprovalStatus status);

    List<LuongHangHai> findByLoaiTauContaining(String loaiTau);

    @Query("SELECT l FROM LuongHangHai l WHERE " +
            "(:keyword IS NULL OR l.loaiTau LIKE %:keyword%) AND " +
            "(:status IS NULL OR l.approvalStatus = :status) AND " +
            "(:start IS NULL OR l.ngayGhiNhan >= :start) AND " +
            "(:end IS NULL OR l.ngayGhiNhan <= :end) AND " +
            "l.isDeleted = false")
    Page<LuongHangHai> searchDocuments(
            @Param("keyword") String keyword,
            @Param("status") LuongHangHaiApprovalStatus status,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            Pageable pageable);

    List<LuongHangHai> findByApprovalStatusAndIsDeletedFalse(LuongHangHaiApprovalStatus status);
}
