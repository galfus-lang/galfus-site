---
title: 'Why Galfus is Host-Agnostic and Extensible'
date: 2026-07-29
description: Exploring the VM-First architecture and how Galfus seamlessly embeds into any host environment.
thumbnail: /images/char-transparent.png
---

One of the defining features of Galfus Script is its **host-agnostic nature**. It is explicitly designed not to be tied down to any specific Operating System, browser, or environment.

## The VM-First Philosophy

At the heart of Galfus is a tiny, register-based Virtual Machine. This means that the entire language architecture—from its compiler pipeline to its runtime memory handling—is self-contained.

Instead of relying on a bloated "global standard library" that assumes you are running on Windows, Linux, or a Web Browser, Galfus is designed to be injected into a larger host application. Whether you want to embed it in a Game Engine, a Database, or compile it to WebAssembly, Galfus just works.

## Connecting to the World: Galfus Proxies (`.gfp`)

If Galfus has no global standard library, how does it interact with the outside world?

This is solved through a beautifully simple surface layer called the **Galfus Proxy** (`.gfp` files). These proxies act as interfaces that allow you to import and call external code as if it were native Galfus code.

Through these proxies, Galfus can bridge directly into:

- **C-ABI (`.dylib`, `.so`, `.dll`)**: Talk to highly optimized native C/C++ or Rust functions directly.
- **WebAssembly (`.wasm`)**: Seamlessly load and execute WASM modules.

This modular import strategy means the host controls exactly what the script is allowed to see and do.

## Providers: Sandboxing I/O

When a Galfus script requests to use basic I/O (like `std/io`), it relies on the host providing a **Provider** contract at execution time.

If the host (like a CLI tool) supplies a native stream provider, the script can print to the terminal. If the host supplies no provider, the script simply fails if it attempts I/O—giving developers a perfect, zero-effort sandbox.

Galfus gives you the ultimate control: a small runtime footprint with infinitely extensible modular borders.
