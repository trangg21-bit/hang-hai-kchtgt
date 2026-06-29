package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.BaoCaoVanHanh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BaoCaoVanHanhRepository extends JpaRepository<BaoCaoVanHanh, Long> {
}
