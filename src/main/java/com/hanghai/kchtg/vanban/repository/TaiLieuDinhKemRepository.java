package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TaiLieuDinhKem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaiLieuDinhKemRepository extends JpaRepository<TaiLieuDinhKem, Long> {

    /** Find all attachments for a specific legal document */
    List<TaiLieuDinhKem> findByVanBanId(Long vanBanId);
}
