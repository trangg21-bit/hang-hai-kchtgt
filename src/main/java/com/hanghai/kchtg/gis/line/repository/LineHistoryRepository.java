package com.hanghai.kchtg.gis.line.repository;

import com.hanghai.kchtg.gis.line.entity.LineHistory;
import com.hanghai.kchtg.gis.line.entity.LineHistory.ActionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LineHistoryRepository extends JpaRepository<LineHistory, UUID> {

    List<LineHistory> findByObjectIdOrderByCreatedAtDesc(String objectId);

    List<LineHistory> findByActionType(ActionType actionType);

    long countByObjectId(String objectId);
}
