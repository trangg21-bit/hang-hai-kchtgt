package com.hanghai.kchtg.security;

import com.hanghai.kchtg.security.annotation.DataScope;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * AOP aspect that enforces data scope filtering (F-275 3-Level RBAC).
 * <p>
 * Wave 2 stub: currently logs and proceeds. Full implementation will inspect the
 * {@link DataScope} annotation and apply organization-level filtering based on
 * the current user's role hierarchy.
 * </p>
 */
@Aspect
@Component
public class DataScopeAspect {

    private static final Logger log = LoggerFactory.getLogger(DataScopeAspect.class);

    @Around("@annotation(dataScope)")
    public Object applyDataScope(ProceedingJoinPoint joinPoint, DataScope dataScope) throws Throwable {
        log.debug("DataScope applied: orgField={}, ownerField={} on {}",
                dataScope.orgField(), dataScope.ownerField(), joinPoint.getSignature().toShortString());

        // Wave 2 stub: proceed without filtering
        return joinPoint.proceed();
    }
}
