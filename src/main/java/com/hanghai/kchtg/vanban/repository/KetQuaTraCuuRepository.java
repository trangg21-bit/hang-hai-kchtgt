package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.KetQuaTraCuuEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KetQuaTraCuuRepository extends JpaRepository<KetQuaTraCuuEntity, Long> {
}
