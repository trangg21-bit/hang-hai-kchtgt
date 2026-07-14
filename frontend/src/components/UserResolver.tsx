import { useState, useEffect } from 'react';
import { userService } from '../services/userService';

const userCache: Record<string, string> = {};

interface UserResolverProps {
  userId?: string;
}

export default function UserResolver({ userId }: UserResolverProps) {
  const [name, setName] = useState<string>(userId || '—');

  useEffect(() => {
    if (!userId) {
      setName('—');
      return;
    }

    // Check if it's a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      setName(userId);
      return;
    }

    if (userCache[userId]) {
      setName(userCache[userId]);
      return;
    }

    let isMounted = true;
    userService.getById(userId)
      .then((res) => {
        if (res.success && res.data) {
          const displayName = res.data.fullName || res.data.username || userId;
          userCache[userId] = displayName;
          if (isMounted) {
            setName(displayName);
          }
        }
      })
      .catch(() => {
        userCache[userId] = userId; // Cache fallback to prevent repeated failing requests
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return <span>{name}</span>;
}
