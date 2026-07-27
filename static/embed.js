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
    this.innerHTML = `
      <iframe 
        src="${src}" 
        width="100%" 
        height="100%" 
        frameborder="0" 
        style="border: 1px solid #2d3748; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);"
        allow="clipboard-write; clipboard-read;"
        title="Galfus REPL Environment"
      ></iframe>
    `;
  }
}

// Register the custom element
if (!customElements.get('galfus-repl')) {
  customElements.define('galfus-repl', GalfusRepl);
}
