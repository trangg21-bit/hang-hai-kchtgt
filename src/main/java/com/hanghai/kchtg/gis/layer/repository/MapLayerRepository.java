package com.hanghai.kchtg.gis.layer.repository;

import java.util.UUID;

import com.hanghai.kchtg.gis.layer.entity.MapLayer;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MapLayerRepository extends JpaRepository<MapLayer, UUID> {

    Optional<MapLayer> findByCode(String code);

    boolean existsByCode(String code);

    List<MapLayer> findByLayerType(LayerType layerType);

    List<MapLayer> findByStatus(Boolean status);

    List<MapLayer> findByVisibleTrueOrderByOrderAsc();

    long countByStatus(Boolean status);
}