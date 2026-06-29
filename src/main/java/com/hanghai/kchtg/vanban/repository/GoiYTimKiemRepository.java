package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.GoiYTimKiem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GoiYTimKiemRepository extends JpaRepository<GoiYTimKiem, Long> {

    List<GoiYTimKiem> findByTuKhoaContainingIgnoreCase(String tuKhoa);
}
