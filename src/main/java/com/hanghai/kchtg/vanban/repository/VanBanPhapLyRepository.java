package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.LoaiVanBan;
import com.hanghai.kchtg.vanban.entity.TinhTrangHieuLuc;
import com.hanghai.kchtg.vanban.entity.VanBanPhapLy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface VanBanPhapLyRepository extends JpaRepository<VanBanPhapLy, Long> {

    /** Find by legal status */
    List<VanBanPhapLy> findByTinhTrangHieuLuc(TinhTrangHieuLuc tinhTrangHieuLuc);

    /** Find by document type */
    List<VanBanPhapLy> findByLoaiVanBan(LoaiVanBan loaiVanBan);

    /** Search by document name (partial match) */
    List<VanBanPhapLy> findByTenVanBanContaining(String tenVanBan);

    /** Search by issuing body (partial match) */
    List<VanBanPhapLy> findByCoQuanBanHanhContaining(String coQuanBanHanh);

    /**
     * Dynamic JPQL search with pagination (F-135).
     */
    @Query("SELECT v FROM VanBanPhapLy v WHERE " +
            "(:keyword IS NULL OR v.tenVanBan LIKE %:keyword%) AND " +
            "(:coQuan IS NULL OR v.coQuanBanHanh LIKE %:coQuan%) AND " +
            "(:loai IS NULL OR v.loaiVanBan = :loai) AND " +
            "(:tinhTrang IS NULL OR v.tinhTrangHieuLuc = :tinhTrang) AND " +
            "(:yearStart IS NULL OR v.ngayBanHanh >= :yearStart) AND " +
            "(:yearEnd IS NULL OR v.ngayBanHanh <= :yearEnd)")
    Page<VanBanPhapLy> searchDocuments(
            String keyword, String coQuan, String loai, String tinhTrang,
            LocalDate yearStart, LocalDate yearEnd, Pageable pageable);
}
