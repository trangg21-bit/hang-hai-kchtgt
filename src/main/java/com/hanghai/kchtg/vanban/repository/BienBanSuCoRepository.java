package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.BienBanSuCo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BienBanSuCoRepository extends JpaRepository<BienBanSuCo, Long> {
}
