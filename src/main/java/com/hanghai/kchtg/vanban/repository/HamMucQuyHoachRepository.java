package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.HamMucQuyHoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HamMucQuyHoachRepository extends JpaRepository<HamMucQuyHoach, Long> {

    /** Find all metrics for a specific planning */
    List<HamMucQuyHoach> findByQuyHoachId(Long quyHoachId);
}
