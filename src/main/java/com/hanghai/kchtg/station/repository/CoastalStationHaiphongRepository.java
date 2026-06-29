package com.hanghai.kchtg.station.repository;
import java.util.UUID;

import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoastalStationHaiphongRepository extends JpaRepository<CoastalStationHaiphong, UUID> {

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.portName = :portName AND c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findByPortName(@Param("portName") String portName);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findAllActive();

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.portName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationHaiphong> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findByDeletedAtIsNull();
}
