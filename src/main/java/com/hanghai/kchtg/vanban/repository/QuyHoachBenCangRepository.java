package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.QuyHoachBenCang;
import com.hanghai.kchtg.vanban.entity.TinhTrangQuyHoach;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface QuyHoachBenCangRepository extends JpaRepository<QuyHoachBenCang, Long> {

  boolean existsByTenDoAn(String tenDoAn);

  boolean existsByTenDoAnAndIdNot(String tenDoAn, Long id);

  /**
   * Find by planning status
   */
  List<QuyHoachBenCang> findByTinhTrang(TinhTrangQuyHoach tinhTrang);

  /**
   * Search by project name (partial match)
   */
  Page<QuyHoachBenCang> findByTenDoAnContaining(String tenDoAn, Pageable pageable);

  /**
   * Find by approval date range
   */
  List<QuyHoachBenCang> findByNgayPheDuyetBetween(LocalDate start, LocalDate end);

  /**
   * Dynamic JPQL search with pagination (F-133).
   */
  @Query("SELECT q FROM QuyHoachBenCang q WHERE " +
    "(cast(:keyword as string) IS NULL OR LOWER(q.tenDoAn) LIKE :keyword) AND " +
    "(:status IS NULL OR q.tinhTrang = :status) AND " +
    "(cast(:yearStart as date) IS NULL OR q.ngayPheDuyet >= :yearStart) AND " +
    "(cast(:yearEnd as date) IS NULL OR q.ngayPheDuyet <= :yearEnd)")
  Page<QuyHoachBenCang> findAllWithSearch(
    @Param("keyword") String keyword,
    @Param("status") TinhTrangQuyHoach status,
    @Param("yearStart") LocalDate yearStart,
    @Param("yearEnd") LocalDate yearEnd,
    Pageable pageable);
}
