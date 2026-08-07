---
title: 'Core Strengths: The Provider System'
date: 2026-08-11
description: How Galfus achieves absolute sandboxing and host-agnostic capabilities through its Provider System.
---

In Galfus, the core language and the virtual machine are designed to be perfectly isolated from the outside world. The base infrastructure assumes absolutely no access to the File System (FS), Network, or even visual/text I/O.

Everything that connects the executable code of a `.gfs` script to the "Capabilities" of the real world is handled by the **Provider System**.

## What is a Provider?

A _Provider_ is a concrete capability implementation hosted directly by the Execution Host. It functions almost like a **Standard Library**, but it is entirely optional and customizable by the host.

For example, you might write code like this to print to the screen:

```galfus
import { println } from "std/io"

export fn main(args: [[u8]]): i32 {
  println("Log!")
  return 0
}
```

In Galfus, this ability does not inherently exist within the interpreter. The host application embedding Galfus must explicitly inject the `std::io` provider package into the _Workspace_ during loading.

## Core Strengths

This architecture provides massive advantages when embedding Galfus in larger systems:

### 1. Absolute Security (Sandboxing)

The host running the VM retains final control over which Providers to install. You can run an untrusted script by injecting an empty or mocked `std::io` provider. This creates an impenetrable sandbox or test-bed environment with zero computational cost (no need for runtime hooks or VM security flags). The script runs normally according to the interfaces it was given, while the host safely dictates reality.

### 2. No Injected Magic

All internal capabilities are materialized in a completely host-agnostic way. Because there are no hardcoded standard libraries, Galfus behaves exactly the same on a Web page compiled to Wasm as it does on a native desktop OS or a microcontroller.

If a required Provider is supplied by the host, the script runs. If it isn't, the compilation aborts early and cleanly reports the absence before any code is ever executed.
