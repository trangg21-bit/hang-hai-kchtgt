package com.hanghai.kchtg.report.repository;

import com.hanghai.kchtg.report.entity.CargoTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

/**
 * Repository for CargoTransaction entity (F-104: Báo cáo hàng hóa XNK).
 */
public interface CargoTransactionRepository extends JpaRepository<CargoTransaction, UUID> {
}
