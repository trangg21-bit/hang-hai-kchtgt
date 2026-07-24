package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NavigationChannelAttachmentRepository extends JpaRepository<NavigationChannelAttachment, Long> {

    List<NavigationChannelAttachment> findByNavigationChannelId(java.util.UUID navigationChannelId);
}
