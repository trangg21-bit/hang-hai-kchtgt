package com.hanghai.kchtg.tai.repository;

import com.hanghai.kchtg.tai.entity.TaiStatus;
import com.hanghai.kchtg.tai.entity.TaiThongTinHangHaiHN;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TaiThongTinHangHaiHNRepository extends JpaRepository<TaiThongTinHangHaiHN, UUID> {
    Optional<TaiThongTinHangHaiHN> findByCodeAndDeletedFalse(String code);

    Optional<TaiThongTinHangHaiHN> findByCode(String code);

    List<TaiThongTinHangHaiHN> findByStatus(TaiStatus status);

    long countByStatus(TaiStatus status);

    long countByDeletedFalse();

    void deleteByCode(String code);

    boolean existsByCode(String code);
}
