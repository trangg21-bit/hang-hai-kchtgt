package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.BaoCaoBaoTri;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BaoCaoBaoTriRepository extends JpaRepository<BaoCaoBaoTri, Long> {
}
