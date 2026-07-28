---
title: 'Galfus & Lua: The Embeddable Kinship'
date: 2026-07-30
description: Exploring the spiritual succession between Lua's agile embedding and Galfus Script's typed approach.
thumbnail: /images/char-transparent.png
---

When building a language designed to be embedded into other applications, it is impossible to ignore the giant in the room: **Lua**.

Lua has been a major influence in embedded scripting for decades, powering video games, server infrastructures, and desktop apps. Galfus Script draws significant inspiration from its approach to embedding.

## Where Galfus Shines Like Lua

We heavily admired and adopted the core traits that made Lua legendary:

### 1. The Register-Based VM

Like modern Lua implementations, the core execution of Galfus relies on a highly efficient **register-based Virtual Machine**. This keeps the instruction set compact, drastically reduces the overhead of shuffling variables in memory, and allows execution to be incredibly fast and predictable.

### 2. Born to be Embedded

Galfus shares Lua's fundamental goal: it assumes it is not the main star of the show. It is meant to be a lightweight passenger running inside a larger host (written in C, C++, Rust, etc.). Its minimal footprint means it doesn't try to take over your system architecture.

### 3. Adapters and Interoperability

Interoperability is crucial. Just as Lua's C-API is celebrated for its simplicity, Galfus allows hosts to connect to external systems through **Adapters**. Using `.gfp` (Galfus Proxy) files to describe the contract of an importable adapter, Galfus can interface with various concrete implementations (like C-ABI or WASM). This allows the heavy lifting to be done externally while the high-level logic remains in the script.

## The Evolution: Static Validation vs. Flexibility

If Lua is so great, why build Galfus?

Because dynamic typing and static typing serve different goals. Dynamic languages like Lua prioritize maximum flexibility, which is fantastic for rapid prototyping and highly dynamic structures.

However, as codebases grow, ensuring structural correctness can become more challenging. Without static types, verifying the shape of data often relies on runtime execution.

Galfus opts for a different approach by introducing strict **Static Typing**.

While maintaining the goal of an embeddable architecture, Galfus prioritizes the robust predictability of explicit `struct` definitions and compile-time validation. It offers an alternative for environments that require static guarantees and early validation.
