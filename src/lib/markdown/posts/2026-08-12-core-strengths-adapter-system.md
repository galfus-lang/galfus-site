---
title: 'Core Strengths: The Adapter System'
date: 2026-08-12
description: Understanding Galfus' flexible Foreign Function Interface (FFI) and the power of Proxy Modules for extreme portability.
---

While the *Provider System* handles robust native capabilities supplied by the host, the **Adapter System** is specifically designed to power Galfus' highly flexible **Foreign Function Interface (FFI)**. 

When you need to interact with external systems, the Adapter System guarantees a clean boundary between the script and the outside world.

## Proxy Modules (`.gfp`)

Whenever the execution of a Galfus script needs to trigger arbitrary logic from an external application—whether it's a custom database query, a hook in a game engine, or a request to an AI API—it doesn't rely on loose `.gfs` code. Instead, it relies on the declaration of a *Proxy*.

Proxy modules use the `.gfp` file extension and act as "abstract interfaces". They inform the Galfus compiler about the function signatures that exist externally and what parameters those functions expect.

## How It Works

The Adapter lifecycle is clean and completely isolated from the runtime kernel:

1. **Compilation and Validation**: During compilation, the Workspace triggers a compatible `AdapterSchema` to ensure that the `.gfp` file is well-formed and semantically correct. Crucially, this happens without executing any *Host* logic.
2. **Loading (Preflight)**: When the execution is being prepared (Execution Host Preflight), the registered `AdapterModuleLoader` steps in, linking an `AdapterModuleBinding` directly to the `.gfp` declaration.
3. **Handle Management**: The adapter injects native resources and returns metadata and isolated calls cleanly, all without polluting the core language's kernel.

## The Portable Advantage

This clear separation has profound implications for developers:

You can compile your entire script, rigorously verify that everything is perfectly typed, and bundle the final product. You only have to worry about FFI binaries at the local orchestration time. 

This brings **extreme portability** to your Galfus applications, allowing the exact same `.gfs` logic to run seamlessly across both native and web environments, provided the adapter bindings are fulfilled by the host.
