package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TraCuuLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TraCuuLogRepository extends JpaRepository<TraCuuLog, Long> {
}
