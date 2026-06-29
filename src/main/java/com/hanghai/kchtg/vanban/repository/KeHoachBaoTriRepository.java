package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.LoaiBaoTri;
import com.hanghai.kchtg.vanban.entity.TinhTrangBaoTri;
import com.hanghai.kchtg.vanban.entity.KeHoachBaoTri;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface KeHoachBaoTriRepository extends JpaRepository<KeHoachBaoTri, Long> {

    /** Find by equipment */
    List<KeHoachBaoTri> findByThietBi(String thietBi);

    /** Find by status */
    List<KeHoachBaoTri> findByTinhTrang(TinhTrangBaoTri tinhTrang);

    /** Find by maintenance type */
    List<KeHoachBaoTri> findByLoaiBaoTri(LoaiBaoTri loaiBaoTri);

    /** Find by expected start date range */
    List<KeHoachBaoTri> findByNgayBatDauDuKienBetween(LocalDate start, LocalDate end);
}
