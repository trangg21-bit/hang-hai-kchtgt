package com.hanghai.kchtg.dikerevetment.repository;

import com.hanghai.kchtg.dikerevetment.entity.DikeRevetmentAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DikeRevetmentAttachmentRepository extends JpaRepository<DikeRevetmentAttachment, Long> {

    List<DikeRevetmentAttachment> findByDikeRevetmentId(java.util.UUID dikeRevetmentId);
}
