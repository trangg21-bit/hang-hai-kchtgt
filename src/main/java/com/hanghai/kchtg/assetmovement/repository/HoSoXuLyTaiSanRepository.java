package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.HoSoXuLyTaiSan;
import com.hanghai.kchtg.assetmovement.entity.LoaiXuLy;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiHoSoXuLy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HoSoXuLyTaiSanRepository extends JpaRepository<HoSoXuLyTaiSan, UUID> {

    List<HoSoXuLyTaiSan> findByTaiSanId(UUID taiSanId);

    List<HoSoXuLyTaiSan> findByLoaiXuLy(LoaiXuLy loaiXuLy);

    List<HoSoXuLyTaiSan> findByTrangThai(TrangThaiHoSoXuLy trangThai);

    Page<HoSoXuLyTaiSan> findByTaiSanId(UUID taiSanId, Pageable pageable);

    Page<HoSoXuLyTaiSan> findByLoaiXuLy(LoaiXuLy loaiXuLy, Pageable pageable);

    Page<HoSoXuLyTaiSan> findByTaiSanIdAndLoaiXuLy(UUID taiSanId, LoaiXuLy loaiXuLy, Pageable pageable);
}
