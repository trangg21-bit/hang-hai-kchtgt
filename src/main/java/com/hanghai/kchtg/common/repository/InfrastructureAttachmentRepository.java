package com.hanghai.kchtg.common.repository;

import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InfrastructureAttachmentRepository extends JpaRepository<InfrastructureAttachment, UUID> {

    List<InfrastructureAttachment> findByRefIdAndRefTypeOrderByUploadedDateDesc(UUID refId, InfrastructureType refType);

    Optional<InfrastructureAttachment> findByIdAndRefIdAndRefType(UUID id, UUID refId, InfrastructureType refType);

    void deleteByRefIdAndRefType(UUID refId, InfrastructureType refType);
}
