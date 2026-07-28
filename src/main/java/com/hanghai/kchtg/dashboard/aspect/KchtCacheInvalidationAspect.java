package com.hanghai.kchtg.dashboard.aspect;

import com.hanghai.kchtg.dashboard.service.KchtAssetCountService;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Intercepts KCHT entity mutations (create, update, delete, status change)
 * and evicts the KCHT count cache after successful execution.
 * <p>
 * Covers all KCHT entity service packages.
 * </p>
 */
@Aspect
@Component
public class KchtCacheInvalidationAspect {

    private static final Logger log = LoggerFactory.getLogger(KchtCacheInvalidationAspect.class);

    private final KchtAssetCountService countService;

    public KchtCacheInvalidationAspect(KchtAssetCountService countService) {
        this.countService = countService;
    }

    /**
     * Any @Transactional method with create/save/update/delete/softDelete in its name
     * inside a KCHT entity service package.
     */
    @Pointcut("execution(* com.hanghai.kchtg.port.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.beacon.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.navigationchannel.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.dikerevetment.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.radarstation.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.vtssystem.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.shiprepairfacility.service..*.*(..)) || " +
              "execution(* com.hanghai.kchtg.station.service..*.*(..))")
    private void kchtServiceMethod() {}

    @Pointcut("@annotation(org.springframework.transaction.annotation.Transactional)")
    private void transactionalMethod() {}

    @Pointcut("execution(* *.create*(..)) || execution(* *.update*(..)) || " +
              "execution(* *.delete*(..)) || execution(* *.softDelete(..)) || " +
              "execution(* *.save(..)) || execution(* *.approve*(..))")
    private void mutationMethod() {}

    @After("kchtServiceMethod() && transactionalMethod() && mutationMethod()")
    public void evictAfterKchtMutation() {
        countService.evictCache();
    }
}
