package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.StormShelterMooringWaterArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StormShelterMooringWaterAreaRepository extends JpaRepository<StormShelterMooringWaterArea, UUID> {

    List<StormShelterMooringWaterArea> findByStormShelterAreaId(UUID stormShelterAreaId);

    long countByStormShelterAreaIdAndDeletedAtIsNull(UUID stormShelterAreaId);
}
