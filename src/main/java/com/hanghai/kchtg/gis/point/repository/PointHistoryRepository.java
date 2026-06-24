package com.hanghai.kchtg.gis.point.repository;

import com.hanghai.kchtg.gis.point.entity.PointHistory;
import com.hanghai.kchtg.gis.point.entity.PointHistory.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface PointHistoryRepository extends JpaRepository<PointHistory, UUID> {

    List<PointHistory> findByObjectIdOrderByCreatedAtDesc(String objectId);

    List<PointHistory> findByActionType(ActionType actionType);

    long countByObjectId(String objectId);
}