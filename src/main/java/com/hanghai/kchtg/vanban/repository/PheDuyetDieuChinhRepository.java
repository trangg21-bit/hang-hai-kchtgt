package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.PheDuyetDieuChinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PheDuyetDieuChinhRepository extends JpaRepository<PheDuyetDieuChinh, Long> {

    /** Find all approvals for a specific adjustment */
    List<PheDuyetDieuChinh> findByDieuChinhId(Long dieuChinhId);
}
