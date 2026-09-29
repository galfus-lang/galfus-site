---
title: 'Why Galfus is Host-Agnostic and Extensible'
date: 2026-07-29
description: Exploring the VM-First architecture and how Galfus seamlessly embeds into any host environment.
---

One of the defining features of Galfus Script is its **host-agnostic nature**. It is explicitly designed not to be tied down to any specific Operating System, browser, or environment.

## The VM-First Philosophy

At the heart of Galfus is a tiny, register-based Virtual Machine. This means that the entire language architecture—from its compiler pipeline to its runtime memory handling—is self-contained.

Instead of relying on a bloated "global standard library" that assumes you are running on Windows, Linux, or a Web Browser, Galfus is designed to be injected into a larger host application. Whether you want to embed it in a Game Engine, a Database, or compile it to WebAssembly, Galfus just works.

## Connecting to the World: Adapters (`.gfp`)

If the core, runtime, and VM have no knowledge of specific operating system or environment APIs, how does Galfus interact with the outside world?

This is solved through a surface layer defined by **Galfus Proxies** (`.gfp` files). A `.gfp` file describes the surface contract of an **Adapter**, allowing you to import it as an external module.

These files define what functions and structures the adapter exposes, and can also indicate execution requirements, such as requiring the main thread. The kernel driver's responsibility is simply to read this contract and apply the necessary execution protections.

A `.gfp` is not inherently a C-ABI or WebAssembly bridge by definition. Rather, things like C-ABI (`.dylib`, `.so`, `.dll`), WebAssembly (`.wasm`), WGPU, or audio libraries are merely possible concrete implementations of an adapter contract. This modular import strategy means the host controls exactly what the script is allowed to see and do.

## Providers: Optional Host Capabilities

While Adapters handle external module imports, **Providers** represent optional capabilities supplied directly by the host for internal standard library operations (like `std/io`).

If the host (like a CLI tool) supplies a native stream provider, the script can print to the terminal. If a certain provider is not supplied by the host, the corresponding capability is simply not available to the program, failing safely if requested. This ensures that the core language remains purely host-agnostic, giving developers a perfect, zero-effort sandbox.

Galfus gives you the ultimate control: a small runtime footprint with infinitely extensible modular borders.
