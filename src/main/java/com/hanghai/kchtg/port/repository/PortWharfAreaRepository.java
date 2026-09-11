package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.PortWharfArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PortWharfAreaRepository extends JpaRepository<PortWharfArea, UUID> {

    List<PortWharfArea> findByPortIdAndDeletedAtIsNull(UUID portId);

    List<PortWharfArea> findByWharfCodeStartingWithAndDeletedAtIsNull(String prefix);

    @Query("SELECT MAX(w.wharfCode) FROM PortWharfArea w WHERE w.portId = :portId AND w.deletedAt IS NULL")
    Optional<String> findMaxWharfCodeByPortId(@Param("portId") UUID portId);

    @Query("SELECT MAX(w.wharfCode) FROM PortWharfArea w WHERE w.wharfCode LIKE :prefix% AND w.deletedAt IS NULL")
    Optional<String> findMaxWharfCodeByPrefix(@Param("prefix") String prefix);
}
