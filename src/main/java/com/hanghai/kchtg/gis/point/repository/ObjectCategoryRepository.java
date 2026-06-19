package com.hanghai.kchtg.gis.point.repository;

import com.hanghai.kchtg.gis.point.entity.ObjectCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ObjectCategoryRepository extends JpaRepository<ObjectCategory, UUID> {
}
