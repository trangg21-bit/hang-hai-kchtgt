package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NavigationChannelAttachmentRepository extends JpaRepository<NavigationChannelAttachment, UUID> {

    List<NavigationChannelAttachment> findByNavigationChannelId(UUID navigationChannelId);
}
