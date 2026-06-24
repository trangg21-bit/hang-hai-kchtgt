package com.hanghai.kchtg.gis.point.repository;

import com.hanghai.kchtg.gis.point.entity.ObjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface ObjectCategoryRepository extends JpaRepository<ObjectCategory, UUID> {
}