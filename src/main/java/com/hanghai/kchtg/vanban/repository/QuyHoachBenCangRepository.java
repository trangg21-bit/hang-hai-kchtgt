package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TinhTrangQuyHoach;
import com.hanghai.kchtg.vanban.entity.QuyHoachBenCang;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface QuyHoachBenCangRepository extends JpaRepository<QuyHoachBenCang, Long> {

    /** Find by planning status */
    List<QuyHoachBenCang> findByTinhTrang(TinhTrangQuyHoach tinhTrang);

    /** Search by project name (partial match) */
    Page<QuyHoachBenCang> findByTenDoAnContaining(String tenDoAn, Pageable pageable);

    /** Find by approval date range */
    List<QuyHoachBenCang> findByNgayPheDuyetBetween(LocalDate start, LocalDate end);

    /**
     * Dynamic JPQL search with pagination (F-133).
     */
    @Query("SELECT q FROM QuyHoachBenCang q WHERE " +
            "(:keyword IS NULL OR q.tenDoAn LIKE %:keyword%) AND " +
            "(:status IS NULL OR q.tinhTrang = :status) AND " +
            "(:yearStart IS NULL OR q.ngayPheDuyet >= :yearStart) AND " +
            "(:yearEnd IS NULL OR q.ngayPheDuyet <= :yearEnd)")
    Page<QuyHoachBenCang> findAllWithSearch(
            @Param("keyword") String keyword,
            @Param("status") String status,
            @Param("yearStart") LocalDate yearStart,
            @Param("yearEnd") LocalDate yearEnd,
            Pageable pageable);
}
