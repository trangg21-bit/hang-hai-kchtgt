package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.ChiTietTuyenLuong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface ChiTietTuyenLuongRepository extends JpaRepository<ChiTietTuyenLuong, UUID> {
    List<ChiTietTuyenLuong> findByNavigationChannelIdOrderBySttAsc(UUID navigationChannelId);
}
