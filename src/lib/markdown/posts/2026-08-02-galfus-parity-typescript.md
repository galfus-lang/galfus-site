---
title: 'TypeScript Vibes: Expressive Modularity and Threads'
date: 2026-08-02
description: How Galfus embraces the modern developer experience with powerful type constraints, isolated modules, and message-based threading.
thumbnail: /images/char-transparent.png
---

If Lua provided the engine block and Rust provided the safety frame, **TypeScript** provided the interior design and steering wheel for Galfus Script.

The Developer Experience (DX) of TypeScript is unmatched in the modern web era. It proved that you can take a highly dynamic, messy scripting environment and tame it with beautiful, expressive static typing. Galfus absorbed this lesson completely.

## Expressive Typing

Galfus is designed to support more than just basic types like `i32` or `[u8]`. It incorporates features for flexibility and safety:

- **Choices:** Provide a way to represent a value that can be one of several distinct variants, allowing for flexible but safe APIs.
- **Constraints:** Ensure that generic structures or functions adhere to specific trait shapes.
- **Type Aliases (Planned):** Future updates aim to introduce type aliases to help keep codebases readable by giving complex type signatures semantic names.

These features aim to provide rigidity where needed, combined with an expressive type system.

## Explicit Modularity

In Galfus, modularity is explicit.

Modules can have private declarations at their root, and Galfus relies on explicit `import` and `export` statements to share them. If a module doesn't export a function, another file cannot access it. Crucially, there is no implicit global sharing between modules.

This guarantees that when you read a Galfus file, you know exactly where every external dependency comes from.

## Concurrency Model (In Development)

Finally, Galfus is architecting a concurrency model inspired by Web Workers and actor systems.

The planned architecture for **Virtual Threads** leverages the isolated Ownership-Graph to run separate threads. The target model dictates that these threads will not share memory directly, aiming to prevent data races. Instead, they will communicate strictly through **message passing**.

While implementing a robust concurrent system is complex and presents its own challenges, this isolated heap model aims to provide a structured and predictable way to handle concurrency in the future.
