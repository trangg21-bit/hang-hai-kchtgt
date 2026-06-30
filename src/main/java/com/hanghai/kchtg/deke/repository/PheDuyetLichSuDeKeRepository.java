package com.hanghai.kchtg.deke.repository;

import com.hanghai.kchtg.deke.entity.PheDuyetLichSu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PheDuyetLichSuDeKeRepository extends JpaRepository<PheDuyetLichSu, Long> {

    List<PheDuyetLichSu> findByDeKeIdOrderByNgayPheDuyetDesc(Long deKeId);
}
