package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.MooringWaterArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MooringWaterAreaRepository extends JpaRepository<MooringWaterArea, UUID> {

    List<MooringWaterArea> findByAnchorageId(UUID anchorageId);

    long countByAnchorageIdAndDeletedAtIsNull(UUID anchorageId);
}
