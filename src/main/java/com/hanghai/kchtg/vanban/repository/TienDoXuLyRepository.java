package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TienDoXuLy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TienDoXuLyRepository extends JpaRepository<TienDoXuLy, Long> {

    /** Find all progress records for a specific incident */
    List<TienDoXuLy> findBySuCoId(Long suCoId);
}
