package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.TaiLRIT;
import com.hanghai.kchtg.tai.entity.TaiStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaiLRITRepository extends JpaRepository<TaiLRIT, UUID> {
    Optional<TaiLRIT> findByCodeAndDeletedFalse(String code);

    Optional<TaiLRIT> findByCode(String code);

    List<TaiLRIT> findByStatus(TaiStatus status);

    long countByStatus(TaiStatus status);

    long countByDeletedFalse();

    void deleteByCode(String code);

    boolean existsByCode(String code);
}
