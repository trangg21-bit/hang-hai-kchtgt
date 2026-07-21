package com.hanghai.kchtg.luonghanghai.repository;

import com.hanghai.kchtg.luonghanghai.entity.LuongHangHai;
import com.hanghai.kchtg.luonghanghai.entity.LuongHangHaiApprovalStatus;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface LuongHangHaiRepository extends JpaRepository<LuongHangHai, java.util.UUID> {

    long countByDonViId(java.util.UUID donViId);

    List<LuongHangHai> findByApprovalStatusAndIsDeletedFalse(LuongHangHaiApprovalStatus approvalStatus);

    List<LuongHangHai> findByIsDeletedFalse(Sort sort);

    Page<LuongHangHai> findByIsDeletedFalse(Pageable pageable);

    List<LuongHangHai> findByTenContainingAndIsDeletedFalse(String ten);

    @Query("SELECT l FROM LuongHangHai l WHERE " +
            "(:orgUnitId IS NULL OR l.donViId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(l.ten) LIKE :keyword) AND " +
            "(:trangThaiPheDuyet IS NULL OR l.approvalStatus = :trangThaiPheDuyet) AND " +
            "l.isDeleted = false")
    Page<LuongHangHai> searchDocuments(
            @org.springframework.data.repository.query.Param("orgUnitId") java.util.UUID orgUnitId,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("trangThaiPheDuyet") LuongHangHaiApprovalStatus trangThaiPheDuyet,
            Pageable pageable);
    @Query("SELECT l FROM LuongHangHai l WHERE " +
            "l.isDeleted = false AND " +
            "(:orgUnitId IS NULL OR l.donViId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(l.ten) LIKE :search)")
    List<LuongHangHai> searchFiltered(
            @org.springframework.data.repository.query.Param("orgUnitId") java.util.UUID orgUnitId,
            @org.springframework.data.repository.query.Param("search") String search);
}
