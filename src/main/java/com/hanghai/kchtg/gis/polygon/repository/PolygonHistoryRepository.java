package com.hanghai.kchtg.gis.polygon.repository;

import com.hanghai.kchtg.gis.polygon.entity.PolygonHistory;
import com.hanghai.kchtg.gis.polygon.entity.PolygonHistory.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PolygonHistoryRepository extends JpaRepository<PolygonHistory, UUID> {

    List<PolygonHistory> findByObjectIdOrderByCreatedAtDesc(String objectId);

    List<PolygonHistory> findByActionType(ActionType actionType);

    long countByObjectId(String objectId);
}
