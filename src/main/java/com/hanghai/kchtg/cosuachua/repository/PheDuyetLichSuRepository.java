package com.hanghai.kchtg.cosuachua.repository;

import com.hanghai.kchtg.cosuachua.entity.PheDuyetLichSu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PheDuyetLichSuRepository extends JpaRepository<PheDuyetLichSu, Long> {

    List<PheDuyetLichSu> findByCoSuaChuaIdOrderByNgayPheDuyetDesc(Long coSuaChuaId);
}
