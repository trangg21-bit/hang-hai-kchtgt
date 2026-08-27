package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.TransferAreaMooringWaterAreaAnchorPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TransferAreaMooringWaterAreaAnchorPointRepository extends JpaRepository<TransferAreaMooringWaterAreaAnchorPoint, UUID> {

    List<TransferAreaMooringWaterAreaAnchorPoint> findByTransferAreaMooringWaterAreaId(UUID transferAreaMooringWaterAreaId);
}
