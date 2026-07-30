package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.PortCoordinate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for PortCoordinate entity.
 * Provides lookup by port ID and bulk delete operations.
 */
@Repository
public interface PortCoordinateRepository extends JpaRepository<PortCoordinate, Long> {

    /**
     * Find all coordinates for a given port, ordered by sort_order ascending.
     *
     * @param portId the port's UUID
     * @return ordered list of coordinates
     */
    List<PortCoordinate> findByPortIdOrderBySortOrder(UUID portId);

    /**
     * Delete all coordinates belonging to a given port.
     *
     * @param portId the port's UUID
     */
    void deleteByPortId(UUID portId);
}
