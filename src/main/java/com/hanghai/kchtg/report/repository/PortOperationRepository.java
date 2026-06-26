package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.PortOperation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Repository for PortOperation entity (F-103: Báo cáo khánh tác cảng).
 */
public interface PortOperationRepository extends JpaRepository<PortOperation, UUID> {
}
