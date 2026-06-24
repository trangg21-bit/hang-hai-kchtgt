package com.hanghai.kchtg.gis.repository;

import com.hanghai.kchtg.gis.entity.ChartFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChartFeatureRepository extends JpaRepository<ChartFeature, UUID> {
    List<ChartFeature> findByCellId(UUID cellId);
    List<ChartFeature> findByFeatureCode(String featureCode);
}
