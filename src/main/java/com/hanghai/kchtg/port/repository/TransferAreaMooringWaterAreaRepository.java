package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.TransferAreaMooringWaterArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransferAreaMooringWaterAreaRepository extends JpaRepository<TransferAreaMooringWaterArea, UUID> {

    List<TransferAreaMooringWaterArea> findByTransferAreaId(UUID transferAreaId);

    long countByTransferAreaIdAndDeletedAtIsNull(UUID transferAreaId);
}
