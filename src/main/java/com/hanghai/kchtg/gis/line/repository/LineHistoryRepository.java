package com.hanghai.kchtg.gis.line.repository;

import com.hanghai.kchtg.gis.line.entity.LineHistory;
import com.hanghai.kchtg.gis.line.entity.LineHistory.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;
public interface LineHistoryRepository extends JpaRepository<LineHistory, UUID> {

    List<LineHistory> findByObjectIdOrderByCreatedAtDesc(String objectId);

    List<LineHistory> findByActionType(ActionType actionType);

    long countByObjectId(String objectId);
}