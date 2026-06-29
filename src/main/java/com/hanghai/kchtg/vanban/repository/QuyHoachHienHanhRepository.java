package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.QuyHoachHienHanh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuyHoachHienHanhRepository extends JpaRepository<QuyHoachHienHanh, Long> {
}
