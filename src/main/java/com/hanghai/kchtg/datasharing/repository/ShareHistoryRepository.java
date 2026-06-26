package com.hanghai.kchtg.datasharing.repository;

import com.hanghai.kchtg.datasharing.entity.ShareHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ShareHistoryRepository extends JpaRepository<ShareHistory, Long> {

    List<ShareHistory> findBySharedDataIdOrderByCreatedAtDesc(Long sharedDataId);
}
