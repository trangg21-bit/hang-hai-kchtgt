package com.hanghai.kchtg.nhatram.repository;

import com.hanghai.kchtg.nhatram.entity.BeaconLightType;
import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface NhaTramDenRepository extends JpaRepository<NhaTramDen, UUID> {
       boolean existsByCode(String code);

       @Query("SELECT d FROM NhaTramDen d WHERE " +
                     "(cast(:name as string) IS NULL OR LOWER(d.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND "
                     +
                     "(cast(:code as string) IS NULL OR LOWER(d.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND "
                     +
                     "(:type IS NULL OR d.type = :type) AND " +
                     "(:status IS NULL OR d.status = :status)")
       List<NhaTramDen> searchFiltered(
                     @Param("name") String name,
                     @Param("code") String code,
                     @Param("type") BeaconLightType type,
                     @Param("status") NhaTramStatus status);
}
