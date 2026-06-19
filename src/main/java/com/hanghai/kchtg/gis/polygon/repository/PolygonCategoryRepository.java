package com.hanghai.kchtg.gis.polygon.repository;

import com.hanghai.kchtg.gis.polygon.entity.PolygonCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PolygonCategoryRepository extends JpaRepository<PolygonCategory, UUID> {
}
