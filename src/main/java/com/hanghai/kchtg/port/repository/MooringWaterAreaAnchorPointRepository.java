package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.MooringWaterAreaAnchorPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MooringWaterAreaAnchorPointRepository extends JpaRepository<MooringWaterAreaAnchorPoint, UUID> {

    List<MooringWaterAreaAnchorPoint> findByMooringWaterAreaId(UUID mooringWaterAreaId);
}
