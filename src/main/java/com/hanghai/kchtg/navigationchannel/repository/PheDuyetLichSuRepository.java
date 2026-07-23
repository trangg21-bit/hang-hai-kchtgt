package com.hanghai.kchtg.navigationchannel.repository;

import com.hanghai.kchtg.navigationchannel.entity.PheDuyetLichSu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("navigationChannelPheDuyetLichSuRepository")
public interface PheDuyetLichSuRepository extends JpaRepository<PheDuyetLichSu, Long> {

    List<PheDuyetLichSu> findByNavigationChannelIdOrderByNgayPheDuyetDesc(java.util.UUID navigationChannelId);
}
