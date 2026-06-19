package com.hanghai.kchtg.gis.layer.repository;

import com.hanghai.kchtg.gis.layer.entity.MapOverlay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MapOverlayRepository extends JpaRepository<MapOverlay, UUID> {

    List<MapOverlay> findByLayerName(String layerName);

    List<MapOverlay> findByVisibleTrue();

    @Query("SELECT m FROM MapOverlay m WHERE m.visible = :visible ORDER BY m.zIndex ASC")
    List<MapOverlay> findByVisibleOrderByZIndexAsc(@Param("visible") Boolean visible);

    long countByLayerName(String layerName);
}
