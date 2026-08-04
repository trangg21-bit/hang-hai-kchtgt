package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.vtssystem.entity.VtsSystemAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VtsSystemAttachmentRepository extends JpaRepository<VtsSystemAttachment, UUID> {

    List<VtsSystemAttachment> findByVtsSystemIdOrderByUploadedDateDesc(UUID vtsSystemId);

    Optional<VtsSystemAttachment> findByIdAndVtsSystemId(UUID id, UUID vtsSystemId);
}
