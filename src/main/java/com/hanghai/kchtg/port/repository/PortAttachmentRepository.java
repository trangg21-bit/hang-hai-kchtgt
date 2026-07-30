package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.PortAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho entity PortAttachment (file đính kèm Cảng biển).
 */
@Repository
public interface PortAttachmentRepository extends JpaRepository<PortAttachment, UUID> {

    List<PortAttachment> findByPortIdOrderByUploadedAtDesc(UUID portId);

    @Modifying
    @Query("DELETE FROM PortAttachment a WHERE a.port.id = :portId")
    void deleteByPortId(@Param("portId") UUID portId);

    long countByPortId(UUID portId);
}
