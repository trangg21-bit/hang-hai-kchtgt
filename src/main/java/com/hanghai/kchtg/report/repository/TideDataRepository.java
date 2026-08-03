package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.TideData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Repository for TideData entity (F-101: Báo cáo tổng hợp thủy văn).
 */
public interface TideDataRepository extends JpaRepository<TideData, UUID> {
}
