package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.LoaiBienDong;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiYeuCau;
import com.hanghai.kchtg.assetmovement.entity.YeuCauBienDong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Repository
public interface YeuCauBienDongRepository extends JpaRepository<YeuCauBienDong, UUID> {

    List<YeuCauBienDong> findByLoaiBienDong(LoaiBienDong loaiBienDong);

    Page<YeuCauBienDong> findByLoaiBienDong(LoaiBienDong loaiBienDong, Pageable pageable);

    List<YeuCauBienDong> findByTrangThai(TrangThaiYeuCau trangThai);

    Page<YeuCauBienDong> findByTrangThai(TrangThaiYeuCau trangThai, Pageable pageable);

    Page<YeuCauBienDong> findByLoaiBienDongAndTrangThai(LoaiBienDong loaiBienDong, TrangThaiYeuCau trangThai, Pageable pageable);

    List<YeuCauBienDong> findByNguoiTao(UUID nguoiTao);
}
