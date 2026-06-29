package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.TaiSanKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKiemKe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaiSanKiemKeRepository extends JpaRepository<TaiSanKiemKe, UUID> {

    List<TaiSanKiemKe> findByKeHoachId(UUID keHoachId);

    List<TaiSanKiemKe> findByTaiSanId(UUID taiSanId);

    List<TaiSanKiemKe> findByTrangThaiKiemKe(TrangThaiKiemKe trangThaiKiemKe);

    Page<TaiSanKiemKe> findByKeHoachId(UUID keHoachId, Pageable pageable);

    Page<TaiSanKiemKe> findByTaiSanId(UUID taiSanId, Pageable pageable);

    Page<TaiSanKiemKe> findByTrangThaiKiemKe(TrangThaiKiemKe trangThaiKiemKe, Pageable pageable);

    Page<TaiSanKiemKe> findByKeHoachIdAndTrangThai(UUID keHoachId, TrangThaiKiemKe trangThaiKiemKe, Pageable pageable);
}
