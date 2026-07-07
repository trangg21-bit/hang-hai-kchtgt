package com.hanghai.kchtg.luonghanghai.repository;

import com.hanghai.kchtg.luonghanghai.entity.PheDuyetLichSu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("luongHangHaiPheDuyetLichSuRepository")
public interface PheDuyetLichSuRepository extends JpaRepository<PheDuyetLichSu, Long> {

    List<PheDuyetLichSu> findByLuongHangHaiIdOrderByNgayPheDuyetDesc(Long luongHangHaiId);
}
