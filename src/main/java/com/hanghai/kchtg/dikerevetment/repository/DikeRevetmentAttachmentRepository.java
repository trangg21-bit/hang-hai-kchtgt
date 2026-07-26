package com.hanghai.kchtg.dikerevetment.repository;

import java.util.UUID;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DikeRevetmentAttachmentRepository extends JpaRepository<DikeRevetmentAttachment, UUID> {

    List<DikeRevetmentAttachment> findByDikeRevetmentId(UUID dikeRevetmentId);
}
