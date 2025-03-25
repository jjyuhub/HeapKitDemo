/**
 * Main application entry point for the heap grooming toolkit
 * Initializes components and provides the demo application
 */

import HeapAnalyzer from './heap-analyzer.js';
import HeapVisualizer from './heap-visualizer.js';
import BugSimulator from './bug-simulator.js';
import GroomingStrategyGenerator from './grooming-strategies.js';
import HeapToolkitUI from './heap-toolkit-ui.js';

/**
 * Heap Grooming Toolkit main application
 */
class HeapGroomingToolkit {
  constructor() {
    // Initialize components
    this.analyzer = new HeapAnalyzer();
    this.bugSimulator = new BugSimulator(this.analyzer);
    this.visualizer = new HeapVisualizer(this.analyzer);
    this.strategyGenerator = new GroomingStrategyGenerator(this.analyzer, this.bugSimulator);
    
    // Initialize UI
    this.ui = new HeapToolkitUI({
      analyzer: this.analyzer,
      visualizer: this.visualizer,
      bugSimulator: this.bugSimulator,
      strategyGenerator: this.strategyGenerator
    });
    
    // Flag to track initialization state
    this.initialized = false;
    
    // Expose API for demos and testing
    window.heapToolkit = this;
  }
  
  /**
   * Initialize the toolkit and UI
   */
  initialize() {
    console.log('Initializing Heap Grooming Toolkit...');
    this.ui.initialize();
    
    // Set initialization flag
    this.initialized = true;
    
    // Wait a short time to ensure DOM elements are fully initialized before first update
    setTimeout(() => {
      if (this.ui && typeof this.ui.updateUI === 'function') {
        this.ui.updateUI();
      }
    }, 200);
  }
  
  /**
   * Run a demo with sample allocations
   */
  runDemo() {
    console.log('Running heap allocation demo...');
    
    // Clear any existing data
    this.reset();
    
    // Create sample allocations of various types and sizes
    this.createSampleAllocations();
    
    // Update UI, but only if initialized
    if (this.initialized && this.ui) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        if (this.ui && typeof this.ui.updateUI === 'function') {
          this.ui.updateUI();
        }
      }, 50);
    }
  }
  
  /**
   * Create sample allocations for demonstration
   */
  createSampleAllocations() {
    console.log('Creating sample allocations...');
    
    // ArrayBuffers of various sizes
    for (let i = 0; i < 10; i++) {
      const size = 32 * (i + 1);
      this.analyzer.recordAllocation(size, 'ArrayBuffer', { demo: true });
    }
    
    // Strings
    for (let i = 0; i < 5; i++) {
      const size = 24 + i * 16;
      this.analyzer.recordAllocation(size, 'String', { demo: true });
    }
    
    // Objects
    for (let i = 0; i < 8; i++) {
      const size = 48 + i * 24;
      this.analyzer.recordAllocation(size, 'Object', { demo: true });
    }
    
    // Functions
    for (let i = 0; i < 3; i++) {
      const size = 64 + i * 32;
      this.analyzer.recordAllocation(size, 'Function', { demo: true });
    }
    
    // Arrays
    for (let i = 0; i < 6; i++) {
      const size = 64 + i * 48;
      this.analyzer.recordAllocation(size, 'Array', { demo: true });
    }
    
    // Free some allocations
    const idsToFree = [3, 7, 12, 18, 23];
    idsToFree.forEach(id => {
      this.analyzer.recordDeallocation(id);
    });
    
    // Allocate after freeing to demonstrate reuse
    for (let i = 0; i < 3; i++) {
      const size = 32 + i * 32;
      this.analyzer.recordAllocation(size, 'Uint8Array', { demo: true });
    }
  }
  
  /**
   * Create a more complex demo with real-world allocation patterns
   */
  runComplexDemo() {
    console.log('Running complex allocation demo...');
    
    // Clear any existing data
    this.reset();
    
    // Simulate browser startup allocations
    this.simulateBrowserStartup();
    
    // Simulate a page load
    this.simulatePageLoad();
    
    // Simulate user interactions and DOM manipulations
    this.simulateUserInteractions();
    
    // Simulate an AJAX request
    this.simulateAjaxRequest();
    
    // Update UI, but only if initialized
    if (this.initialized && this.ui) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        if (this.ui && typeof this.ui.updateUI === 'function') {
          this.ui.updateUI();
        }
      }, 50);
    }
  }
  
  /**
   * Reset all data
   */
  reset() {
    console.log('Resetting toolkit...');
    
    // Reset components
    if (this.analyzer) {
      this.analyzer.reset();
    }
    
    if (this.bugSimulator) {
      this.bugSimulator.reset();
    }
    
    // Update UI only if already initialized
    if (this.initialized && this.ui) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        if (this.ui && typeof this.ui.updateUI === 'function') {
          this.ui.updateUI();
        }
      }, 50);
    }
  }
  
  /**
   * Simulate browser startup allocations
   * @private
   */
  simulateBrowserStartup() {
    // Runtime objects
    for (let i = 0; i < 20; i++) {
      const size = 64 + (i % 8) * 16;
      this.analyzer.recordAllocation(size, 'RuntimeObject', { category: 'browser' });
    }
    
    // JavaScript engine objects
    for (let i = 0; i < 15; i++) {
      const size = 32 + (i % 4) * 32;
      this.analyzer.recordAllocation(size, 'JSEngineObject', { category: 'browser' });
    }
    
    // Initial DOM objects
    for (let i = 0; i < 10; i++) {
      const size = 96 + (i % 3) * 48;
      this.analyzer.recordAllocation(size, 'DOMObject', { category: 'browser' });
    }
  }
  
  /**
   * Simulate a page load with various allocations
   * @private
   */
  simulatePageLoad() {
    // DOM nodes
    for (let i = 0; i < 50; i++) {
      const size = 64 + (i % 10) * 16;
      this.analyzer.recordAllocation(size, 'DOMNode', { category: 'page' });
    }
    
    // JavaScript objects from the page
    for (let i = 0; i < 30; i++) {
      const size = 32 + (i % 5) * 16;
      this.analyzer.recordAllocation(size, 'Object', { category: 'page' });
    }
    
    // ArrayBuffers (e.g., for images)
    for (let i = 0; i < 10; i++) {
      const size = 1024 + (i % 3) * 512;
      this.analyzer.recordAllocation(size, 'ArrayBuffer', { category: 'page' });
    }
    
    // Strings (e.g., text content)
    for (let i = 0; i < 25; i++) {
      const size = 24 + (i % 8) * 16;
      this.analyzer.recordAllocation(size, 'String', { category: 'page' });
    }
    
    // Functions (e.g., event handlers)
    for (let i = 0; i < 15; i++) {
      const size = 48 + (i % 4) * 24;
      this.analyzer.recordAllocation(size, 'Function', { category: 'page' });
    }
  }
  
  /**
   * Simulate user interactions and resulting allocations/deallocations
   * @private
   */
  simulateUserInteractions() {
    // Free some nodes (e.g., element removal)
    const nodeIdsToFree = [60, 65, 70, 75, 80];
    nodeIdsToFree.forEach(id => {
      this.analyzer.recordDeallocation(id);
    });
    
    // Allocate new nodes
    for (let i = 0; i < 8; i++) {
      const size = 64 + (i % 10) * 16;
      this.analyzer.recordAllocation(size, 'DOMNode', { category: 'interaction' });
    }
    
    // Event objects
    for (let i = 0; i < 10; i++) {
      const size = 48 + (i % 3) * 16;
      this.analyzer.recordAllocation(size, 'EventObject', { category: 'interaction' });
    }
    
    // Free event objects
    const eventIdsToFree = [];
    for (let i = 0; i < 8; i++) {
      eventIdsToFree.push(this.analyzer.nextId - i - 1);
    }
    eventIdsToFree.forEach(id => {
      this.analyzer.recordDeallocation(id);
    });
    
    // Allocate objects for handling interaction
    for (let i = 0; i < 5; i++) {
      const size = 32 + (i % 4) * 16;
      this.analyzer.recordAllocation(size, 'HandlerObject', { category: 'interaction' });
    }
  }
  
  /**
   * Simulate an AJAX request
   * @private
   */
  simulateAjaxRequest() {
    // XHR object
    this.analyzer.recordAllocation(128, 'XMLHttpRequest', { category: 'ajax' });
    
    // Request data
    this.analyzer.recordAllocation(256, 'ArrayBuffer', { category: 'ajax' });
    
    // Response data
    this.analyzer.recordAllocation(1024, 'ArrayBuffer', { category: 'ajax' });
    
    // JSON parsing objects
    for (let i = 0; i < 15; i++) {
      const size = 48 + (i % 5) * 16;
      this.analyzer.recordAllocation(size, 'Object', { category: 'ajax' });
    }
    
    // Free request data
    this.analyzer.recordDeallocation(this.analyzer.nextId - 17);
  }
}

// Initialize the toolkit when the page loads
document.addEventListener('DOMContentLoaded', () => {
  // Wait for DOM to be fully loaded
  setTimeout(() => {
    try {
      const toolkit = new HeapGroomingToolkit();
      toolkit.initialize();
      
      // Add demo buttons to the page
      const demoButtons = document.createElement('div');
      demoButtons.className = 'demo-buttons';
      demoButtons.innerHTML = `
        <button id="run-demo">Run Simple Demo</button>
        <button id="run-complex-demo">Run Complex Demo</button>
        <button id="reset-toolkit">Reset</button>
      `;
      
      if (document.body.firstChild) {
        document.body.insertBefore(demoButtons, document.body.firstChild);
      } else {
        document.body.appendChild(demoButtons);
      }
      
      // Add event listeners
      const runDemoBtn = document.getElementById('run-demo');
      if (runDemoBtn) {
        runDemoBtn.addEventListener('click', () => {
          toolkit.runDemo();
        });
      }
      
      const runComplexDemoBtn = document.getElementById('run-complex-demo');
      if (runComplexDemoBtn) {
        runComplexDemoBtn.addEventListener('click', () => {
          toolkit.runComplexDemo();
        });
      }
      
      const resetToolkitBtn = document.getElementById('reset-toolkit');
      if (resetToolkitBtn) {
        resetToolkitBtn.addEventListener('click', () => {
          toolkit.reset();
        });
      }
      
      // Run a demo by default with a longer delay to ensure everything is ready
      setTimeout(() => {
        toolkit.runDemo();
      }, 800);
    } catch (error) {
      console.error('Error initializing toolkit:', error);
    }
  }, 300);
});

// Export the toolkit
export default HeapGroomingToolkit;
