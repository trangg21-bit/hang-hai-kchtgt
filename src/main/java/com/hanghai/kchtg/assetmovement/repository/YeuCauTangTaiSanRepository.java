package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauTangTaiSan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface YeuCauTangTaiSanRepository extends JpaRepository<YeuCauTangTaiSan, UUID> {

    List<YeuCauTangTaiSan> findByTaiSanId(UUID taiSanId);

    List<YeuCauTangTaiSan> findByTrangThai(TrangThaiYeuCau trangThai);

    Page<YeuCauTangTaiSan> findByTaiSanId(UUID taiSanId, Pageable pageable);
}
