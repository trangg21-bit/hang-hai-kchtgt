package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TinhTrangDieuChinh;
import com.hanghai.kchtg.vanban.entity.DieuChinhQuyHoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DieuChinhQuyHoachRepository extends JpaRepository<DieuChinhQuyHoach, Long> {

    /** Find all adjustments for a specific planning */
    List<DieuChinhQuyHoach> findByQuyHoachId(Long quyHoachId);

    /** Find by adjustment status */
    List<DieuChinhQuyHoach> findByTinhTrang(TinhTrangDieuChinh tinhTrang);
}
