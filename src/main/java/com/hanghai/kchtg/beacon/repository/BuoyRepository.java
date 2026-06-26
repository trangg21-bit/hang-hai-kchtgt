package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.BeaconStatus;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.beacon.entity.BuoyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BuoyRepository extends JpaRepository<Buoy, UUID> {

    Optional<Buoy> findByCode(String code);
    boolean existsByCode(String code);

    Page<Buoy> findByStatus(BeaconStatus status, Pageable pageable);
    Page<Buoy> findByType(BuoyType type, Pageable pageable);
    List<Buoy> findByNameContainingIgnoreCase(String name);
    List<Buoy> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM Buoy b WHERE " +
           "(:name IS NULL OR b.name LIKE %:name%) AND " +
           "(:code IS NULL OR b.code LIKE %:code%) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status)")
    List<Buoy> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") BuoyType type,
        @Param("status") BeaconStatus status
    );

    long countByStatus(BeaconStatus status);
}
