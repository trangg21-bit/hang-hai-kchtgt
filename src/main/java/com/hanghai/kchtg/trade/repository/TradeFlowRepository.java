package com.hanghai.kchtg.trade.repository;

import com.hanghai.kchtg.trade.entity.TradeFlow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TradeFlowRepository extends JpaRepository<TradeFlow, Long> {

    /** Find all trade flows for a specific period */
    List<TradeFlow> findByPeriod(String period);

    /** Find flows from a source port */
    List<TradeFlow> findBySourcePort(String sourcePort);

    /** Find flows to a destination port */
    List<TradeFlow> findByDestPort(String destPort);

    /** Find flows by cargo type */
    List<TradeFlow> findByCargoType(String cargoType);

    /** Find flows between a source and destination port pair */
    List<TradeFlow> findBySourcePortAndDestPort(String sourcePort, String destPort);

    /** Count distinct source ports */
    long countDistinctSourcePort();

    /** Count distinct destination ports */
    long countDistinctDestPort();
}
