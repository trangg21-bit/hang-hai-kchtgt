package com.hanghai.kchtg.dashboard.aspect;

import jakarta.annotation.PostConstruct;
import jakarta.persistence.EntityManagerFactory;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.event.service.spi.EventListenerRegistry;
import org.hibernate.event.spi.EventType;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class HibernateListenerRegistry {

    private final EntityManagerFactory entityManagerFactory;
    private final KchtHibernateEventListener kchtHibernateEventListener;

    @PostConstruct
    public void registerListeners() {
        try {
            SessionFactoryImplementor sessionFactory = entityManagerFactory.unwrap(SessionFactoryImplementor.class);
            EventListenerRegistry registry = sessionFactory.getServiceRegistry().getService(EventListenerRegistry.class);

            registry.getEventListenerGroup(EventType.POST_INSERT).appendListener(kchtHibernateEventListener);
            registry.getEventListenerGroup(EventType.POST_UPDATE).appendListener(kchtHibernateEventListener);
            registry.getEventListenerGroup(EventType.POST_DELETE).appendListener(kchtHibernateEventListener);
            
            log.info("Successfully registered KchtHibernateEventListener for POST_INSERT, POST_UPDATE, POST_DELETE events.");
        } catch (Exception e) {
            log.error("Failed to register Hibernate Event Listeners: {}", e.getMessage(), e);
        }
    }
}
