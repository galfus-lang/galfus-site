/**
 * Galfus REPL Embed Script
 * 
 * Allows users to embed the Galfus compiler and REPL on any website.
 * 
 * Usage:
 * <script src="https://galfus.com/embed.js"></script>
 * <galfus-repl>
 *   import { println } from 'std/io'
 *   export fn main() {
 *     println("Hello!")
 *   }
 * </galfus-repl>
 */
class GalfusRepl extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    // Prevent rendering multiple iframes if already initialized
    if (this.dataset.initialized) return;
    this.dataset.initialized = "true";

    // Defer execution to allow the browser to parse inner text nodes
    setTimeout(() => {
      // Extract the content written inside the custom element
      let code = this.textContent || "";
      // Remove leading/trailing empty lines that might have been added by HTML formatting
      code = code.replace(/^\s*\n/, "").replace(/\n\s*$/, "");

      // Prepare the iframe source
      const host = "https://galfus.com"; // Adjust this if testing locally or on other domains
      // In dev, you might want to use window.location.origin if it's the same site
      const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
        ? window.location.origin 
        : host;
        
      let src = `${baseUrl}/embed`;

      if (code.trim() !== "") {
        src += `#code=${encodeURIComponent(code)}`;
      }

      // Set styling for the wrapper
      this.style.display = "block";
      this.style.width = "100%";
      
      // Default height if none is provided via CSS/inline styles
      if (!this.style.height) {
        this.style.height = "500px";
      }

      // Clear the original text content and inject the iframe

      this.childNodes.forEach(el => el.remove())
      const shadow = this.attachShadow({ mode: "open" });
      const iframe = document.createElement('iframe')

      iframe.src = src
      iframe.width = "100%"
      iframe.height = "100%"
      iframe.frameborder = "0"
      iframe.style.border = "1px solid #2d3748"
      iframe.style.borderRadius = "8px"
      iframe.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      iframe.allow = "clipboard-write; clipboard-read;"
      iframe.title = "Galfus REPL Environment"

      shadow.appendChild(iframe)
    }, 0);
  }
}

// Register the custom element
if (!customElements.get('galfus-repl')) {
  customElements.define('galfus-repl', GalfusRepl);
}
