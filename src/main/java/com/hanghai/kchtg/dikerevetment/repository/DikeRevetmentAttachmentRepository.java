package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DikeRevetmentAttachmentRepository extends JpaRepository<DikeRevetmentAttachment, UUID> {

    List<DikeRevetmentAttachment> findByDikeRevetmentId(UUID dikeRevetmentId);
}
