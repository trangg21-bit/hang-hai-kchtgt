package com.hanghai.kchtg.assetmovement.repository;

import com.hanghai.kchtg.assetmovement.entity.BaoCaoKiemKe;
import com.hanghai.kchtg.assetmovement.entity.TrangThaiBaoCao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BaoCaoKiemKeRepository extends JpaRepository<BaoCaoKiemKe, UUID> {

    List<BaoCaoKiemKe> findByKeHoachId(UUID keHoachId);

    List<BaoCaoKiemKe> findByTrangThai(TrangThaiBaoCao trangThai);

    Page<BaoCaoKiemKe> findByKeHoachId(UUID keHoachId, Pageable pageable);
}
