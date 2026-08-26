---
id: AM-e18f7bbfdd726492
kind: gotcha
topic: broken-ai-kit-cli-shim
tags: []
importance: 0.6
agent: 
created: 2026-08-17T05:46:25.763Z
updated: 2026-08-17T05:46:25.763Z
---

CLI ai-kit trên máy này HỎNG: shim 'ai-kit' trỏ tới C:\Users\trangtt1\.ai-kit\bin\ai-kit.mjs (home của user khác) → MODULE_NOT_FOUND khi chạy. Không chạy được ai-kit sdlc harness (mint run-seal) từ bash — chỉ dùng được các tool MCP ai-kit-*.
