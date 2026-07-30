package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.PortCoordinate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortCoordinateRepository extends JpaRepository<PortCoordinate, UUID> {

    List<PortCoordinate> findByPortIdAndDeletedAtIsNullOrderBySortOrderAsc(UUID portId);

    void deleteByPortId(UUID portId);
}
