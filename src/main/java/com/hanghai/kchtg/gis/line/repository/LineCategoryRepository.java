package com.hanghai.kchtg.gis.line.repository;

import com.hanghai.kchtg.gis.line.entity.LineCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.UUID;
public interface LineCategoryRepository extends JpaRepository<LineCategory, UUID> {
}