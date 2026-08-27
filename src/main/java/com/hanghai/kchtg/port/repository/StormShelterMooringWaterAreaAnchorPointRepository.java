package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.StormShelterMooringWaterAreaAnchorPoint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StormShelterMooringWaterAreaAnchorPointRepository extends JpaRepository<StormShelterMooringWaterAreaAnchorPoint, UUID> {

    List<StormShelterMooringWaterAreaAnchorPoint> findByStormShelterMooringWaterAreaId(UUID stormShelterMooringWaterAreaId);
}
