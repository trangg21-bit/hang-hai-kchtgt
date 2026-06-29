package com.hanghai.kchtg.vanban.repository;

import com.hanghai.kchtg.vanban.entity.TimKiemLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimKiemLogRepository extends JpaRepository<TimKiemLog, Long> {
}
