package com.hanghai.kchtg.cosuachua.repository;

import com.hanghai.kchtg.cosuachua.entity.CoSuaChuaDongTau;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoSuaChuaDongTauRepository extends JpaRepository<CoSuaChuaDongTau, Long> {

    List<CoSuaChuaDongTau> findByTrangThaiAndIsDeletedFalse(String trangThai);

    @Query("SELECT c FROM CoSuaChuaDongTau c WHERE " +
           "(:keyword IS NULL OR c.tenCoSo LIKE %:keyword% OR c.diaChi LIKE %:keyword% OR c.tinhThanh LIKE %:keyword%) AND " +
           "(:tinhThanh IS NULL OR c.tinhThanh = :tinhThanh) AND " +
           "(:trangThai IS NULL OR c.trangThai = :trangThai) AND " +
           "c.isDeleted = false")
    List<CoSuaChuaDongTau> search(@Param("keyword") String keyword,
                                   @Param("tinhThanh") String tinhThanh,
                                   @Param("trangThai") String trangThai);
}
