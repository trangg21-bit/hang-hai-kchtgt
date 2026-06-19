package com.hanghai.kchtg.gis.layer.repository;

import com.hanghai.kchtg.gis.layer.entity.MapLayer;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.LayerType;
import com.hanghai.kchtg.gis.layer.entity.MapLayer.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MapLayerRepository extends JpaRepository<MapLayer, UUID> {

    Optional<MapLayer> findByCode(String code);

    boolean existsByCode(String code);

    List<MapLayer> findByLayerType(LayerType layerType);

    List<MapLayer> findByStatus(Status status);

    List<MapLayer> findByVisibleTrueOrderByOrderAsc();

    long countByStatus(Status status);
}
