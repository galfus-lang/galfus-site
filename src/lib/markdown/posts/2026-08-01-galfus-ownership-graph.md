---
title: 'Deep Dive: The Ownership-Graph Memory Model'
date: 2026-08-01
description: How Galfus manages memory deterministically without a Garbage Collector and without the rigidness of a Borrow Checker.
thumbnail: /images/char-transparent.png
---

One of the most revolutionary aspects of Galfus Script is how it handles memory.

Most modern languages fall into two extremes: they either rely on a **Garbage Collector** (like Lua, JavaScript, and C#) or they enforce strict **Compile-time Lifetimes** (like Rust).

Galfus chooses a highly effective middle ground: the **Ownership-Graph**.

## The Problem with the Extremes

- **Garbage Collectors (GC):** They are incredibly easy to use. You create variables, and eventually, the GC cleans them up. The problem? GCs cause unpredictable pauses. If you embed a script in a 60 FPS game engine, a sudden GC pause can cause a noticeable stutter.
- **Borrow Checker (Rust):** It guarantees memory is freed exactly when needed with zero runtime overhead. The problem? It enforces a strict "single owner" rule that makes writing complex relationships (like doubly-linked lists or graphs) notoriously difficult for scripters.

## The Galfus Solution: The Ownership-Graph

The Ownership-Graph is a runtime memory model inspired by Rust but designed for the flexibility required by scripting. It allows for **multiple owners** and **safe cyclic references** (loops) without ever leaking memory.

It works using three core concepts:

### 1. Anchors

An **Anchor** is a root point in memory. Think of it as a solid pillar. As long as a value is reachable from an anchor, it is considered alive.

### 2. Edges

An **Edge** is a strong connection between an Anchor and a value, or between two values. If an Anchor holds an Edge to an object, that object stays in memory.

The beauty of the Galfus graph is that an object can have **multiple Edges** pointing to it from different sources. It has multiple owners, but as long as at least one path connects back to an Anchor, it survives.

### 3. Weak Properties

A **Weak Property** is a reference that does _not_ prevent memory from being freed. If you need two objects to point at each other (a cycle), you can use weak properties to ensure they don't accidentally keep each other alive forever. If the main Anchor disappears, the objects are safely destroyed, and the weak properties are invalidated automatically.

## Deterministic Freedom

With the Ownership-Graph, the exact moment the last strong Edge to an object is cut (or its root Anchor is destroyed), the memory is freed instantly.

There are no GC sweeps. There are no sudden frame drops. But unlike Rust, you don't have to fight the compiler to prove your lifetimes are valid. You get the deterministic performance of native code with the fluid developer experience of a scripting language.
