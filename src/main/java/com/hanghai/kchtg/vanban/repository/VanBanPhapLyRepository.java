package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.LoaiVanBan;
import com.hanghai.kchtg.vanban.entity.TinhTrangHieuLuc;
import com.hanghai.kchtg.vanban.entity.VanBanPhapLy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDate;
import java.util.List;

public interface VanBanPhapLyRepository extends JpaRepository<VanBanPhapLy, Long> {

        boolean existsBySoHieu(String soHieu);

        boolean existsBySoHieuAndIdNot(String soHieu, Long id);

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
                        "(cast(:keyword as string) IS NULL OR LOWER(v.tenVanBan) LIKE :keyword) AND " +
                        "(cast(:coQuan as string) IS NULL OR LOWER(v.coQuanBanHanh) LIKE :coQuan) AND " +
                        "(:loai IS NULL OR v.loaiVanBan = :loai) AND " +
                        "(:tinhTrang IS NULL OR v.tinhTrangHieuLuc = :tinhTrang) AND " +
                        "(cast(:yearStart as date) IS NULL OR v.ngayBanHanh >= :yearStart) AND " +
                        "(cast(:yearEnd as date) IS NULL OR v.ngayBanHanh <= :yearEnd)")
        Page<VanBanPhapLy> searchDocuments(
                        String keyword, String coQuan, LoaiVanBan loai, TinhTrangHieuLuc tinhTrang,
                        LocalDate yearStart, LocalDate yearEnd, Pageable pageable);
}
