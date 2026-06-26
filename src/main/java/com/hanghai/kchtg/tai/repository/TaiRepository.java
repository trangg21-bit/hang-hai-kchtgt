package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.BaseTai;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaiRepository extends JpaRepository<BaseTai, UUID> {
    Optional<BaseTai> findByCode(String code);

    Optional<BaseTai> findByCodeAndDeletedFalse(String code);
}
