package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.VanHanhChiTiet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VanHanhChiTietRepository extends JpaRepository<VanHanhChiTiet, Long> {

    /** Find all detail records for a specific plan */
    List<VanHanhChiTiet> findByKeHoachId(Long keHoachId);
}
