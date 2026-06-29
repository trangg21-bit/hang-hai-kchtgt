package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TinhTrangVanHanh;
import com.hanghai.kchtg.vanban.entity.KeHoachVanHanh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface KeHoachVanHanhRepository extends JpaRepository<KeHoachVanHanh, Long> {

    /** Find by operation date */
    List<KeHoachVanHanh> findByNgayVanHanh(LocalDate ngayVanHanh);

    /** Find by status */
    List<KeHoachVanHanh> findByTinhTrang(TinhTrangVanHanh tinhTrang);

    /** Find by structure (cầu cảng) */
    List<KeHoachVanHanh> findByCauCang(String cauCang);

    /** Find by equipment */
    List<KeHoachVanHanh> findByThietBi(String thietBi);

    /**
     * Find schedules that conflict with a given date range on the same structure/equipment.
     * A conflict exists when two plans overlap in time.
     */
    @Query("SELECT k FROM KeHoachVanHanh k WHERE " +
            "k.tinhTrang != 'HUY' AND " +
            "((:cauCang IS NULL OR k.cauCang = :cauCang) OR (:thietBi IS NULL OR k.thietBi = :thietBi)) AND " +
            "k.ngayVanHanh = :ngayVanHanh AND " +
            "k.thoiGianBatDau < :thoiGianKetThuc AND " +
            "k.thoiGianKetThuc > :thoiGianBatDau")
    List<KeHoachVanHanh> findConflictSchedule(
            @Param("ngayVanHanh") LocalDate ngayVanHanh,
            @Param("thoiGianBatDau") java.time.LocalTime thoiGianBatDau,
            @Param("thoiGianKetThuc") java.time.LocalTime thoiGianKetThuc,
            @Param("cauCang") String cauCang,
            @Param("thietBi") String thietBi);
}
