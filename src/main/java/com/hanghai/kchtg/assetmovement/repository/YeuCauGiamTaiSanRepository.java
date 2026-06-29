package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.NguyenNhanGiam;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauGiamTaiSan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface YeuCauGiamTaiSanRepository extends JpaRepository<YeuCauGiamTaiSan, UUID> {

    List<YeuCauGiamTaiSan> findByTaiSanId(UUID taiSanId);

    List<YeuCauGiamTaiSan> findByTrangThai(TrangThaiYeuCau trangThai);

    List<YeuCauGiamTaiSan> findByNguyenNhanGiam(NguyenNhanGiam nguyenNhanGiam);

    Page<YeuCauGiamTaiSan> findByTaiSanId(UUID taiSanId, Pageable pageable);
}
