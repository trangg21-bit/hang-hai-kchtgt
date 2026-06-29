package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.KhaiThacTaiSan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface KhaiThacTaiSanRepository extends JpaRepository<KhaiThacTaiSan, UUID> {

    List<KhaiThacTaiSan> findByTaiSanId(UUID taiSanId);

    Page<KhaiThacTaiSan> findByTaiSanId(UUID taiSanId, Pageable pageable);

    Page<KhaiThacTaiSan> findByNamKhaiThac(Integer namKhaiThac, Pageable pageable);

    Page<KhaiThacTaiSan> findByTaiSanIdAndNamKhaiThac(UUID taiSanId, Integer namKhaiThac, Pageable pageable);

    Optional<KhaiThacTaiSan> findByNamKhaiThacAndThangKhaiThac(Integer namKhaiThac, Integer thangKhaiThac);
}
