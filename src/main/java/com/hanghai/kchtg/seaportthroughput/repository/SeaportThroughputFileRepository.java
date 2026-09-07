package com.hanghai.kchtg.seaportthroughput.repository;

import com.hanghai.kchtg.seaportthroughput.entity.SeaportThroughputFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SeaportThroughputFileRepository extends JpaRepository<SeaportThroughputFile, UUID> {

    List<SeaportThroughputFile> findByThroughputIdOrderByCreatedAtAsc(UUID throughputId);

    boolean existsByThroughputId(UUID throughputId);
}
