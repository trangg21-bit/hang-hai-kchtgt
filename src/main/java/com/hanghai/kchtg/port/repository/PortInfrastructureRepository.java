package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.PortInfrastructure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PortInfrastructureRepository extends JpaRepository<PortInfrastructure, Long> {

    List<PortInfrastructure> findByPortIdOrderByStt(UUID portId);

    void deleteByPortId(UUID portId);
}
