package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.KetQuaBaoTri;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KetQuaBaoTriRepository extends JpaRepository<KetQuaBaoTri, Long> {

    /** Find all results for a specific maintenance plan */
    List<KetQuaBaoTri> findByKeHoachId(Long keHoachId);
}
