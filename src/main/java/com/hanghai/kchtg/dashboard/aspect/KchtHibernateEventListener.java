package com.hanghai.kchtg.dashboard.aspect;

import com.hanghai.kchtg.dashboard.service.KchtAssetCountService;
import lombok.RequiredArgsConstructor;
import org.hibernate.event.spi.*;
import org.hibernate.persister.entity.EntityPersister;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class KchtHibernateEventListener implements PostInsertEventListener, PostUpdateEventListener, PostDeleteEventListener {

    private final KchtAssetCountService kchtAssetCountService;

    @Override
    public void onPostInsert(PostInsertEvent event) {
        evictIfKcht(event.getEntity());
    }

    @Override
    public void onPostUpdate(PostUpdateEvent event) {
        evictIfKcht(event.getEntity());
    }

    @Override
    public void onPostDelete(PostDeleteEvent event) {
        evictIfKcht(event.getEntity());
    }

    private void evictIfKcht(Object entity) {
        if (entity != null) {
            String pkg = entity.getClass().getPackageName();
            if (pkg.startsWith("com.hanghai.kchtg") && !pkg.contains(".accesslog.") && !pkg.contains(".security.") && !pkg.contains(".admin.")) {
                kchtAssetCountService.evictCache();
            }
        }
    }

    @Override
    public boolean requiresPostCommitHandling(EntityPersister persister) {
        return false;
    }
}
