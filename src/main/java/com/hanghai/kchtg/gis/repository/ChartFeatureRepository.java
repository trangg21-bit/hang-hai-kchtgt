package com.hanghai.kchtg.gis.repository;

import java.util.UUID;

import com.hanghai.kchtg.gis.entity.ChartFeature;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChartFeatureRepository extends JpaRepository<ChartFeature, UUID> {
    List<ChartFeature> findByCellId(UUID cellId);
    List<ChartFeature> findByFeatureCode(String featureCode);
    boolean existsByCellId(UUID cellId);

    @Modifying
    @Query("DELETE FROM ChartFeature f WHERE f.cellId = :cellId")
    void deleteByCellId(@Param("cellId") UUID cellId);

    @org.springframework.data.jpa.repository.Query(value = 
        "SELECT f.* FROM enc_features f " +
        "WHERE f.deleted_at IS NULL " +
        "AND ST_GeomFromText(f.coordinates, 4326) && ST_MakeEnvelope(:minLon, :minLat, :maxLon, :maxLat, 4326)", 
        nativeQuery = true)
    List<ChartFeature> findFeaturesInBoundingBox(
        @org.springframework.data.repository.query.Param("minLon") double minLon,
        @org.springframework.data.repository.query.Param("minLat") double minLat,
        @org.springframework.data.repository.query.Param("maxLon") double maxLon,
        @org.springframework.data.repository.query.Param("maxLat") double maxLat
    );
}
