package com.hanghai.kchtg.gis.polygon.repository;

import com.hanghai.kchtg.gis.polygon.entity.PolygonCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface PolygonCategoryRepository extends JpaRepository<PolygonCategory, UUID> {
}