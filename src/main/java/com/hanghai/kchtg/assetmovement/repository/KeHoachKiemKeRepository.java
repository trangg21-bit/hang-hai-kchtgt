package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.KeHoachKiemKe;
import com.hanghai.kchtg.assetmovement.entity.LoaiKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiKeHoach;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KeHoachKiemKeRepository extends JpaRepository<KeHoachKiemKe, java.util.UUID> {

    List<KeHoachKiemKe> findByTrangThai(TrangThaiKeHoach trangThai);

    List<KeHoachKiemKe> findByLoaiKiemKe(LoaiKiemKe loaiKiemKe);

    Page<KeHoachKiemKe> findByTrangThai(TrangThaiKeHoach trangThai, Pageable pageable);

    long countByTrangThai(TrangThaiKeHoach trangThai);
}
