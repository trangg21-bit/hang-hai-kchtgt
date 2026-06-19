package com.hanghai.kchtg.gis.line.repository;

import com.hanghai.kchtg.gis.line.entity.LineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LineCategoryRepository extends JpaRepository<LineCategory, UUID> {
}
