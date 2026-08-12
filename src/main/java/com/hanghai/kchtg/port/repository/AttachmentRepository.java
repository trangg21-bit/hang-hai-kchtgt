package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {

    List<Attachment> findByEntityTypeAndEntityIdOrderByUploadedAtDesc(String entityType, UUID entityId);

    long countByEntityTypeAndEntityId(String entityType, UUID entityId);

    void deleteByEntityTypeAndEntityId(String entityType, UUID entityId);
}
