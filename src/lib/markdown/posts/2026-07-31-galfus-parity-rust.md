---
title: 'Rusty Roots: What Galfus Borrowed from Rust'
date: 2026-07-31
description: How Galfus Script utilizes Rust-inspired syntax and safe memory concepts without the complexity of a strict Borrow Checker.
thumbnail: /images/char-transparent.png
---

If you look at a snippet of Galfus Script, your first reaction might be: _"This looks a lot like Rust."_

And you wouldn't be wrong. Galfus borrows heavily from the strict, unambiguous structure of Rust, but actively avoids the features that make Rust notorious for its steep learning curve.

## The Syntactic DNA

Galfus values explicit declarations and robust data shapes over hidden magic. From Rust, we adopted:

- **`fn` and `let`**: Unambiguous, concise keywords for functions and variables.
- **Strict `struct` Definitions**: No "dynamically injected" fields at runtime. Data structures are rigid, predictable, and typed.
- **Type Safety**: A strong emphasis on ensuring that an `i32` is an `i32`, catching assignment and reference errors before the code ever executes.

## Predictability Over Magic

Rust's philosophy is "Safety through explicit control." Galfus adopts this mindset for scripting.

Many scripting languages try to be "helpful" by implicitly coercing types (like JavaScript turning `1 + "1"` into `"11"`). Galfus completely rejects this. There are no magic conventions or silent conversions. Everything must be declared explicitly, making the code vastly easier to audit and predict when embedded in a host system.

## The Memory Inspiration

Perhaps the biggest inspiration Galfus took from Rust is its **rejection of the Garbage Collector**.

Rust manages memory via a strict Ownership and Borrowing model evaluated entirely at compile-time. This guarantees safety but often forces developers to "fight the borrow checker" during rapid prototyping.

Galfus wanted that same level of deterministic memory freeing—where resources are released the exact moment they are no longer needed—but we recognized that scripting requires more flexibility.

This led to the creation of the **Ownership-Graph**. Inspired by Rust's ownership concepts, Galfus adapted the idea into a runtime structure using Anchors, Edges, and Weak Properties. It gives developers the safety and determinism of Rust, without the compile-time headaches, perfectly balancing power and ease of use.
