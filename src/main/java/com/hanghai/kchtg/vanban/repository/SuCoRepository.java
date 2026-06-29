package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.MucDoNghiemTrong;
import com.hanghai.kchtg.vanban.entity.TinhTrangXuLy;
import com.hanghai.kchtg.vanban.entity.SuCo;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SuCoRepository extends JpaRepository<SuCo, Long> {

    /** Find by processing status */
    List<SuCo> findByTinhTrangXuLy(TinhTrangXuLy tinhTrangXuLy);

    /** Find by severity level */
    List<SuCo> findByMucDoNghiemTrong(MucDoNghiemTrong mucDoNghiemTrong);

    /** Search by location (partial match) */
    Page<SuCo> findByViTriContaining(String viTri, Pageable pageable);

    /** Search by description (partial match) */
    Page<SuCo> findByMoTaContaining(String moTa, Pageable pageable);
}
