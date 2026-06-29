package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.KetQuaPheDuyet;
import com.hanghai.kchtg.assetmovement.entity.LuuPheDuyet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

@Repository
public interface LuuPheDuyetRepository extends JpaRepository<LuuPheDuyet, UUID> {

    List<LuuPheDuyet> findByYeuCauId(UUID yeuCauId);

    Page<LuuPheDuyet> findByYeuCauId(UUID yeuCauId, Pageable pageable);

    List<LuuPheDuyet> findByKetQua(KetQuaPheDuyet ketQua);

    Page<LuuPheDuyet> findByKetQua(KetQuaPheDuyet ketQua, Pageable pageable);

    Page<LuuPheDuyet> findByYeuCauIdAndKetQua(UUID yeuCauId, KetQuaPheDuyet ketQua, Pageable pageable);

    List<LuuPheDuyet> findByCapPheDuyet(Integer capPheDuyet);
}
