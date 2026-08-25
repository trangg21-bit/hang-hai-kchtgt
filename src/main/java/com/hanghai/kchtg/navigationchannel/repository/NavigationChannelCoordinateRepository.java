package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.NavigationChannelCoordinate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NavigationChannelCoordinateRepository extends JpaRepository<NavigationChannelCoordinate, UUID> {

    List<NavigationChannelCoordinate> findByNavigationChannelIdOrderBySequenceNoAsc(UUID navigationChannelId);
}
