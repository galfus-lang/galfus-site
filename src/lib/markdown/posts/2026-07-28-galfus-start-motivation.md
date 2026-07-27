---
title: 'The Motivation Behind Galfus Script'
date: 2026-07-28
description: Why create another language? Exploring the search for the perfect middle ground between Lua, Rust, and TypeScript.
thumbnail: /images/char-transparent.png
---

The creation of a new programming language usually stems from a deep-rooted frustration. For Galfus Script, it was the endless search for the "perfect middle ground" for scripting within larger host environments.

## The Good, The Bad, and The Garbage Collector

When building modular software—like game engines, databases, or extensible platforms—you inevitably need a scripting language. We looked at the industry standards and saw three distinct profiles, each with its own fatal flaw for our specific needs:

### 1. Lua (The Agile Chaos)

**The Good:** Lua is compact, incredibly easy to embed, and its C-ABI is fantastic for optimization.
**The Bad:** It lacks static typing. As your project grows, maintaining a large Lua codebase becomes chaotic. You never truly know the shape of your data until runtime.

### 2. Rust (The Stiff Shield)

**The Good:** Rust is strongly typed, structured, and memory-safe thanks to its strict ownership and borrowing model.
**The Bad:** The learning curve is notoriously steep. The "magic" and syntactic sugar, combined with fighting the borrow checker, make it a nightmare for quick, iterative scripting tasks.

### 3. TypeScript (The Dynamic Dream)

**The Good:** TypeScript brings beautiful structure, familiar syntax, and expressive modularity to the dynamic world. It is incredibly close to our ideal developer experience (DX).
**The Bad:** It's still fundamentally tied to JavaScript. It inherits certain unpredictabilities and, crucially, relies heavily on a global Garbage Collector (GC), which causes non-deterministic pauses.

## Finding the Sweet Spot

We needed a language that was as **embeddable and tiny** as Lua, as **safe and structured** as Rust, and as **expressive and modular** as TypeScript.

Most importantly, we wanted to completely eliminate the unpredictable pauses caused by traditional Garbage Collectors (like in JS and Lua), without forcing developers to manually fight a strict borrow checker (like in Rust).

This led to the birth of Galfus Script and its signature feature: the **Ownership-Graph memory model**. By carefully taking the best parts of these three languages, Galfus carves out a niche for developers who want robust, strongly-typed scripts running deterministically inside any host application.
