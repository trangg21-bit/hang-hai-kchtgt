package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.KetQuaTimKiemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KetQuaTimKiemRepository extends JpaRepository<KetQuaTimKiemEntity, Long> {
}
