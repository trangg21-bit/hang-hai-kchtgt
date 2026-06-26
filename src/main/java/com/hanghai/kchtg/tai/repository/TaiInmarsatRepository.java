package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.TaiInmarsat;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaiInmarsatRepository extends JpaRepository<TaiInmarsat, UUID> {
    Optional<TaiInmarsat> findByCodeAndDeletedFalse(String code);

    Optional<TaiInmarsat> findByCode(String code);

    List<TaiInmarsat> findByStatus(TaiStatus status);

    long countByStatus(TaiStatus status);

    long countByDeletedFalse();

    void deleteByCode(String code);

    boolean existsByCode(String code);
}
