package com.hanghai.kchtg.gis.repository;

import java.util.UUID;

import com.hanghai.kchtg.gis.entity.ChartCell;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChartCellRepository extends JpaRepository<ChartCell, UUID> {
    Optional<ChartCell> findByCellName(String cellName);
}
