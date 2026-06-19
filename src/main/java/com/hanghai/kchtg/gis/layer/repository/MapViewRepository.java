package com.hanghai.kchtg.gis.layer.repository;

import com.hanghai.kchtg.gis.layer.entity.MapView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MapViewRepository extends JpaRepository<MapView, UUID> {

    List<MapView> findByUserIdOrderByCreatedAtDesc(Long userId);

    long countByUserId(Long userId);
}
