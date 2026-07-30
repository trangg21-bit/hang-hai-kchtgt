package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity Document (giấy tờ / tài liệu đính kèm).
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);

    long countByEntityTypeAndEntityId(String entityType, String entityId);

    @Modifying
    @Query("UPDATE Document d SET d.deletedAt = CURRENT_TIMESTAMP WHERE d.entityType = :entityType AND d.entityId = :entityId AND d.deletedAt IS NULL")
    void softDeleteByEntityTypeAndEntityId(@Param("entityType") String entityType,
                                           @Param("entityId") String entityId);
}
