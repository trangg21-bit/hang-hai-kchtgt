package com.hanghai.kchtg.deke.repository;

import com.hanghai.kchtg.deke.entity.DeKeAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeKeAttachmentRepository extends JpaRepository<DeKeAttachment, Long> {

    List<DeKeAttachment> findByDeKeId(Long deKeId);
}
