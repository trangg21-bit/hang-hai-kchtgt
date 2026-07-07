package com.hanghai.kchtg.vts.repository;

import com.hanghai.kchtg.vts.entity.PheDuyetLichSu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("vtsPheDuyetLichSuRepository")
public interface PheDuyetLichSuRepository extends JpaRepository<PheDuyetLichSu, Long> {

    List<PheDuyetLichSu> findByHeThongVTSIdOrderByNgayPheDuyetDesc(Long heThongVTSId);
}
