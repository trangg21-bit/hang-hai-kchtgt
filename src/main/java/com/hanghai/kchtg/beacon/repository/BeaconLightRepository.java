package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.BeaconLightType;
import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BeaconLightRepository extends JpaRepository<BeaconLight, UUID> {

    Optional<BeaconLight> findByCode(String code);
    boolean existsByCode(String code);

    Page<BeaconLight> findByStatus(BeaconStatus status, Pageable pageable);
    Page<BeaconLight> findByType(BeaconLightType type, Pageable pageable);
    List<BeaconLight> findByNameContainingIgnoreCase(String name);
    List<BeaconLight> findByCodeContainingIgnoreCase(String code);

    @Query(value = "SELECT * FROM beacon_light b WHERE " +
           "(:name IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
           "(:code IS NULL OR LOWER(b.code) LIKE LOWER(CONCAT('%', :code, '%'))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)", nativeQuery = true)
    List<BeaconLight> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("status") String status
    );

    long countByStatus(BeaconStatus status);
}
