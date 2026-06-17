package com.hanghai.kchtg.mapicon.repository;

import com.hanghai.kchtg.mapicon.entity.MapIcon;
import com.hanghai.kchtg.mapicon.entity.MapIcon.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MapIconRepository extends JpaRepository<MapIcon, UUID> {

    List<MapIcon> findByCategory(Category category);

    Optional<MapIcon> findByCode(String code);

    boolean existsByCode(String code);
}
