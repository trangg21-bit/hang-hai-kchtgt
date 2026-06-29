package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.FileQuyHoach;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FileQuyHoachRepository extends JpaRepository<FileQuyHoach, Long> {
}
