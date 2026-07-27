---
title: 'TypeScript Vibes: Expressive Modularity and Threads'
date: 2026-08-02
description: How Galfus embraces the modern developer experience with powerful type constraints, isolated modules, and message-based threading.
thumbnail: /images/char-transparent.png
---

If Lua provided the engine block and Rust provided the safety frame, **TypeScript** provided the interior design and steering wheel for Galfus Script.

The Developer Experience (DX) of TypeScript is unmatched in the modern web era. It proved that you can take a highly dynamic, messy scripting environment and tame it with beautiful, expressive static typing. Galfus absorbed this lesson completely.

## Expressive Typing

Galfus doesn't just have basic types like `i32` or `[u8]`. It embraces the flexibility that makes TypeScript so beloved:

- **Unions:** Allow variables to hold one of several distinct types, making APIs flexible but safe.
- **Constraints:** Ensure that generic structures or functions adhere to specific shapes.
- **Type Aliases:** Keep your codebase readable by giving complex type signatures clean, semantic names.

You get the rigidity of Rust's structs, combined with the expressive flow of TypeScript's type system.

## Explicit Modularity

Galfus completely rejects the concept of a "global scope script."

Just like modern ES Modules in TypeScript, Galfus relies on explicit `import` and `export` statements. If a module doesn't export a function, another file cannot access it. There are no "magic globals" implicitly shared across files.

This guarantees that when you read a Galfus file, you know exactly where every dependency comes from.

## Isolated Threads and Message Passing

Finally, Galfus embraces the concept of Web Workers from the JavaScript ecosystem.

Because Galfus utilizes an isolated Ownership-Graph, it can run completely separate **isolated threads**. These threads do not share memory directly—preventing data races and complex lock fighting. Instead, they communicate strictly through **message passing**.

This makes building concurrent logic in Galfus as simple and safe as passing messages between isolated TypeScript workers, giving scripters immense power without the traditional concurrency headaches.
