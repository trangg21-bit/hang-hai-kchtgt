package com.hanghai.kchtg.tramradar.repository;

import com.hanghai.kchtg.tramradar.entity.PheDuyetLichSu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PheDuyetLichSuRepository extends JpaRepository<PheDuyetLichSu, Long> {

    List<PheDuyetLichSu> findByTramRadarIdOrderByNgayPheDuyetDesc(Long tramRadarId);
}
