package com.hanghai.kchtg.dashboard.annotation;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Mark methods that mutate KCHT entity data (create, update, delete, status change).
 * An aspect intercepts these methods and evicts the KCHT count cache.
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface InvalidateKchtCache {
}
