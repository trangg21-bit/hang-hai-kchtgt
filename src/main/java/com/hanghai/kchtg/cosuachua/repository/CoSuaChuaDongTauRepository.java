package com.hanghai.kchtg.cosuachua.repository;

import com.hanghai.kchtg.cosuachua.entity.CoSuaChuaDongTau;
import com.hanghai.kchtg.cosuachua.entity.CoSuaChuaApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoSuaChuaDongTauRepository extends JpaRepository<CoSuaChuaDongTau, java.util.UUID> {

    List<CoSuaChuaDongTau> findByTrangThaiAndIsDeletedFalse(CoSuaChuaApprovalStatus trangThai);

    @Query("SELECT c FROM CoSuaChuaDongTau c WHERE " +
            "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
            "(:keyword IS NULL OR LOWER(c.tenCoSo) LIKE :keyword OR LOWER(c.diaChi) LIKE :keyword OR LOWER(c.tinhThanh) LIKE :keyword) AND " +
            "(:tinhThanh IS NULL OR LOWER(c.tinhThanh) LIKE :tinhThanh) AND " +
            "(:trangThai IS NULL OR c.trangThai = :trangThai) AND " +
            "(:trangThaiPheDuyet IS NULL OR c.trangThai = :trangThaiPheDuyet) AND " +
            "c.isDeleted = false")
    List<CoSuaChuaDongTau> search(@Param("orgUnitId") java.util.UUID orgUnitId,
                                    @Param("keyword") String keyword,
                                    @Param("tinhThanh") String tinhThanh,
                                    @Param("trangThai") CoSuaChuaApprovalStatus trangThai,
                                    @Param("trangThaiPheDuyet") CoSuaChuaApprovalStatus trangThaiPheDuyet);
    @Query("SELECT c FROM CoSuaChuaDongTau c WHERE " +
           "c.isDeleted = false AND " +
           "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(c.tenCoSo) LIKE :search OR LOWER(c.diaChi) LIKE :search)")
    List<CoSuaChuaDongTau> searchFiltered(
            @Param("orgUnitId") java.util.UUID orgUnitId,
            @Param("search") String search);
}
