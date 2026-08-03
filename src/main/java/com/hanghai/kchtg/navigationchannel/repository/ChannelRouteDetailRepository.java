package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.ChannelRouteDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ChannelRouteDetailRepository extends JpaRepository<ChannelRouteDetail, UUID> {
    List<ChannelRouteDetail> findByNavigationChannelIdOrderBySequenceNoAsc(UUID navigationChannelId);
}
