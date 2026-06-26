package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiCospasSarsat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaiCospasSarsatRepository extends JpaRepository<TaiCospasSarsat, UUID> {
    Optional<TaiCospasSarsat> findByCodeAndDeletedFalse(String code);

    Optional<TaiCospasSarsat> findByCode(String code);

    List<TaiCospasSarsat> findByStatus(TaiStatus status);

    long countByStatus(TaiStatus status);

    long countByDeletedFalse();

    void deleteByCode(String code);

    boolean existsByCode(String code);
}
