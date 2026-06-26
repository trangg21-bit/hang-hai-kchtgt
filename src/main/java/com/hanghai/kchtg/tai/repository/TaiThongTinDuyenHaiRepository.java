package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiThongTinDuyenHai;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaiThongTinDuyenHaiRepository extends JpaRepository<TaiThongTinDuyenHai, UUID> {
    Optional<TaiThongTinDuyenHai> findByCodeAndDeletedFalse(String code);

    Optional<TaiThongTinDuyenHai> findByCode(String code);

    List<TaiThongTinDuyenHai> findByStatus(TaiStatus status);

    long countByStatus(TaiStatus status);

    long countByDeletedFalse();

    void deleteByCode(String code);

    boolean existsByCode(String code);
}
