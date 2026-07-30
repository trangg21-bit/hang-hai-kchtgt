package com.hanghai.kchtg.security.annotation;

import com.hanghai.kchtg.security.DataScopeAspect;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to mark methods that require data scope filtering (F-275 3-Level RBAC).
 * <p>
 * Applied by {@link DataScopeAspect} to enforce
 * organization-level data access restrictions based on the current user's role.
 * </p>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface DataScope {

    /**
     * The entity field name representing the organization (default: "orgUnit").
     */
    String orgField() default "orgUnit";

    /**
     * The entity field name representing the record owner (default: "createdBy").
     */
    String ownerField() default "createdBy";
}
