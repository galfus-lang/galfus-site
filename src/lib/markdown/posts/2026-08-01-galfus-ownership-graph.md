---
title: 'Deep Dive: The Ownership-Graph Memory Model'
date: 2026-08-01
description: How Galfus manages memory deterministically without a Garbage Collector and without the rigidness of a Borrow Checker.
thumbnail: /images/char-transparent.png
---

A defining characteristic of Galfus Script is its memory model.

Most modern languages tend to fall into two categories: they either rely on a **Garbage Collector** (like Lua, JavaScript, and C#) or they enforce strict **Compile-time Lifetimes** (like Rust).

Galfus adopts a different approach for its runtime: the **Ownership-Graph**.

## The Trade-offs

- **Garbage Collectors (GC):** They are highly convenient, as they automatically clean up unreferenced variables. The trade-off is that traditional GCs can cause unpredictable pauses, which might be undesirable in embedded real-time applications like game engines.
- **Compile-time Validation (Rust):** It shifts the burden of memory validation to the compilation phase, guaranteeing safety with minimal runtime overhead. The trade-off is a stricter development experience, especially when dealing with complex cyclic data structures.

## The Ownership-Graph

The Ownership-Graph is a runtime memory model designed to balance flexibility and predictability. It allows for **multiple owners** and **cyclic references** while maintaining deterministic cleanup, although it does introduce specific runtime tracking costs.

It works using three core concepts:

### 1. Anchors

An **Anchor** is a root point in memory. Think of it as a solid pillar. As long as a value is reachable from an anchor, it is considered alive.

### 2. Edges

An **Edge** is a strong connection between an Anchor and a value, or between two values. If an Anchor holds an Edge to an object, that object stays in memory.

The beauty of the Galfus graph is that an object can have **multiple Edges** pointing to it from different sources. It has multiple owners, but as long as at least one path connects back to an Anchor, it survives.

### 3. Weak Properties

A **Weak Property** is a reference that does _not_ keep an object alive. If you need two objects to point at each other (a cycle), you can use weak properties to avoid reference cycles. When an object is no longer reachable from any Anchor via strong edges, it is destroyed, and any weak properties pointing to it are safely and automatically invalidated.

## Predictability and Runtime Cost

With the Ownership-Graph, memory is freed at deterministic points of execution once an object is no longer reachable from the root Anchors.

Unlike traditional GC sweeps, this prevents unpredictable "stop-the-world" pauses. However, unlike Rust's compile-time model, the Ownership-Graph requires active runtime tracking of edges and anchors, which incurs a performance cost. It offers a structured approach that prioritizes deterministic execution over raw native performance, providing a practical middle ground for scripting.
