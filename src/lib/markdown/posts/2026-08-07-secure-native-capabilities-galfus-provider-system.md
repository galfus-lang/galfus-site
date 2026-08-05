---
title: 'Secure Native Capabilities: The Galfus Provider System'
date: 2026-08-07
description: Learn how the Galfus provider system bridges scripts to native host capabilities asynchronously while maintaining trivial sandboxing.
---

When building embeddable scripting languages, a core challenge is safely bridging the script environment to native host capabilities like file I/O or network access. Galfus takes a deliberate, secure-by-default approach to this through its **Provider System**.

In this post, we'll explore how the Galfus provider system works, why it is designed around asynchronous message passing, and how it enables trivial sandboxing.

## What is a Provider?

At its core, a provider in Galfus represents the boundary between the Galfus execution environment and the host platform (typically written in Rust). Galfus scripts cannot arbitrarily access the host's operating system; instead, they access native capabilities strictly through the `HostProvider` trait.

When your Galfus code makes a call to a built-in standard library function—like reading a file from `std/io`—that call is actually dispatched to a provider configured by the host.

### The Host-Provider Boundary

Providers process requests dispatched by Galfus code using a `MessageInjector`. The entire provider surface is asynchronous and message-based. This means that when a Galfus thread emits a side effect (a `VmEffect` like a `ProviderCall`), the runtime handles the asynchronous payload dispatching.

From the script author's perspective, this bridge is defined via specific native function declarations that must use the `__provider_<provider_alias>_<call_name>` naming convention:

```galfus
// Example of a provider bridge declaration
fn(async) __provider_fs_read_file(path: String) -> String;
```

These functions act as the `.gfs` bridge source that directly maps to the `HostProvider` implementation in the host language.

## Secure by Default: Trivial Sandboxing

One of the most powerful features of the Galfus provider architecture is its approach to security and sandboxing. Providers are entirely **optional**.

When you initialize a Galfus runtime, you choose whether to supply a provider:

```rust
use galfus_contract::{HostProvider, Providers};

// Implementing a custom host provider
struct Host;
impl HostProvider for Host {
    // ... capability implementations ...
}

// You can initialize execution with providers
let providers = Providers::with_host(Box::new(Host));
let mut execution = workspace.start_execution(&[], Some(providers), driver)?;
```

If you choose *not* to provide one, what happens? 

The compiler doesn't care—it does not validate the existence of a provider at compile time. However, if execution reaches a native call (like our `__provider_fs_read_file` above) and no host provider is configured, the call will fail deterministically with a structured missing-provider error.

This means you can trivially sandbox any Galfus script simply by withholding the `Providers` object. Scripts without native calls will run perfectly fine, while malicious or unintended I/O attempts will be safely blocked at runtime.

## Task Affinity and Scheduling

Galfus provides the host with fine-grained control over scheduling. Host providers default to a main-thread affinity (`TaskAffinity::Main`). This is a safe default, ensuring that native calls which might interact with non-thread-safe host state don't cause concurrency issues.

However, for providers that *can* safely run on worker executors concurrently, the host can override this behavior by returning `TaskAffinity::Any` from `HostProvider::affinity`. This flexibility allows performance optimization where appropriate without sacrificing safety.

## Conclusion

The Galfus provider system is a testament to the language's embeddable nature. By making native host capabilities explicit, asynchronous, and strictly optional, Galfus ensures that hosts remain in complete control of what the script is allowed to do. Whether you are building a highly secure sandboxed environment or a fully-featured application server, the provider system scales to meet those needs securely.
