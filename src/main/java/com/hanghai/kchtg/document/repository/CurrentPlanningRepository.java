package com.hanghai.kchtg.document.repository;

import com.hanghai.kchtg.document.entity.CurrentPlanning;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CurrentPlanningRepository extends JpaRepository<CurrentPlanning, UUID> {
}
