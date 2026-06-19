package com.hanghai.kchtg.gis.layer.repository;

import com.hanghai.kchtg.gis.layer.entity.MapStyle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MapStyleRepository extends JpaRepository<MapStyle, UUID> {

    List<MapStyle> findByLayerId(String layerId);

    long countByLayerId(String layerId);
}
