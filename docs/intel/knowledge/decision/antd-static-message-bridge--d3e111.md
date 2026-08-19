---
id: AM-d3e11143473a0635
kind: decision
topic: antd-static-message-bridge
tags: []
importance: 0.9
agent: 
created: 2026-08-17T05:03:53.207Z
updated: 2026-08-17T05:03:53.207Z
---

AntD v6 static-function warning fix (M-1003, released): frontend must NOT call static message/Modal.confirm from 'antd' — they warn 'Static function can not consume context' under the themed ConfigProvider. The canonical path is frontend/src/components/ToastNotification.tsx, which exports live-forwarding `message` and `modal` proxies bound to the App.useApp() context instance (captured in App.tsx RegisterAntdStatic via setStaticMessage/setStaticModal), plus the existing `toast` object. New code should import { message } / { modal } / toast from that bridge, never from 'antd' (antd v6 has no named `modal` export; static confirm lives on Modal.confirm).
