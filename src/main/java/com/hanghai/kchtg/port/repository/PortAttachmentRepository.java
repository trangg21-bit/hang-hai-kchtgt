package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.PortAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortAttachmentRepository extends JpaRepository<PortAttachment, UUID> {

    List<PortAttachment> findByPortIdAndDeletedAtIsNull(UUID portId);

    long countByPortIdAndDeletedAtIsNull(UUID portId);

    void deleteByPortId(UUID portId);
}
