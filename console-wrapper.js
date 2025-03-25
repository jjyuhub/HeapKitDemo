/**
 * Console Wrapper Utility
 * Exposes heap grooming toolkit functions to the browser console
 */

import HeapAnalyzer from './heap-analyzer.js';
import HeapVisualizer from './heap-visualizer.js';
import BugSimulator from './bug-simulator.js';
import GroomingStrategyGenerator from './grooming-strategies.js';
import HeapSpray from './heap-spray-utility.js';

/**
 * Console wrapper for easy access to heap toolkit functions
 */
class ConsoleWrapper {
  constructor() {
    this.analyzer = new HeapAnalyzer();
    this.visualizer = new HeapVisualizer(this.analyzer);
    this.bugSimulator = new BugSimulator(this.analyzer);
    this.strategyGenerator = new GroomingStrategyGenerator(this.analyzer, this.bugSimulator);
    this.heapSpray = new HeapSpray();
    
    // Track active objects
    this.objects = {
      arrayBuffers: [],
      typedArrays: [],
      arrays: [],
      strings: [],
      custom: []
    };
    
    // Create console function namespace
    this.console = {
      // Allocation functions
      allocate: this.allocate.bind(this),
      free: this.free.bind(this),
      createArrayBuffer: this.createArrayBuffer.bind(this),
      createTypedArray: this.createTypedArray.bind(this),
      createArray: this.createArray.bind(this),
      createString: this.createString.bind(this),
      createCustomObject: this.createCustomObject.bind(this),
      
      // Spray functions
      spray: this.spray.bind(this),
      sprayArrayBuffers: this.sprayArrayBuffers.bind(this),
      sprayPattern: this.sprayPattern.bind(this),
      
      // Bug simulation
      simulateOverflow: this.simulateOverflow.bind(this),
      simulateUAF: this.simulateUAF.bind(this),
      simulateTypeConfusion: this.simulateTypeConfusion.bind(this),
      
      // Analysis functions
      analyze: this.analyze.bind(this),
      getBucketStats: this.getBucketStats.bind(this),
      findAllocationById: this.findAllocationById.bind(this),
      findAdjacentAllocations: this.findAdjacentAllocations.bind(this),
      
      // Strategy functions
      generateStrategy: this.generateStrategy.bind(this),
      generateExploitCode: this.generateExploitCode.bind(this),
      
      // Utility functions
      clearAll: this.clearAll.bind(this),
      gcForce: this.gcForce.bind(this),
      help: this.help.bind(this)
    };
    
    // Expose to global scope
    if (typeof window !== 'undefined') {
      window.heapTools = this.console;
    }
  }
  
  /**
   * Record a manual allocation
   * @param {number} size - Size in bytes
   * @param {string} type - Object type
   * @param {Object} metadata - Additional metadata
   * @returns {number} Allocation ID
   */
  allocate(size, type = 'Custom', metadata = {}) {
    return this.analyzer.recordAllocation(size, type, metadata);
  }
  
  /**
   * Record a deallocation
   * @param {number} id - Allocation ID
   */
  free(id) {
    this.analyzer.recordDeallocation(id);
    console.log(`Freed allocation #${id}`);
  }
  
  /**
   * Create and track an ArrayBuffer
   * @param {number} size - Size in bytes
   * @returns {ArrayBuffer} The created ArrayBuffer
   */
  createArrayBuffer(size) {
    const buffer = new ArrayBuffer(size);
    const id = this.analyzer.recordAllocation(size, 'ArrayBuffer');
    
    this.objects.arrayBuffers.push({ id, buffer });
    console.log(`Created ArrayBuffer #${id} of ${size} bytes`);
    
    return buffer;
  }
  
  /**
   * Create and track a typed array
   * @param {string} type - Type of array (Uint8Array, Float32Array, etc.)
   * @param {number} length - Length in elements
   * @returns {TypedArray} The created typed array
   */
  createTypedArray(type = 'Uint8Array', length) {
    const TypedArrayConstructor = globalThis[type];
    if (!TypedArrayConstructor) {
      throw new Error(`Unknown typed array type: ${type}`);
    }
    
    const array = new TypedArrayConstructor(length);
    const size = array.byteLength;
    const id = this.analyzer.recordAllocation(size, type);
    
    this.objects.typedArrays.push({ id, array });
    console.log(`Created ${type} #${id} of ${length} elements (${size} bytes)`);
    
    return array;
  }
  
  /**
   * Create and track a regular array
   * @param {number} length - Array length
   * @param {*} fillValue - Optional value to fill the array with
   * @returns {Array} The created array
   */
  createArray(length, fillValue = 0) {
    const array = new Array(length).fill(fillValue);
    // Approximate size calculation
    const size = length * 8;
    const id = this.analyzer.recordAllocation(size, 'Array');
    
    this.objects.arrays.push({ id, array });
    console.log(`Created Array #${id} of ${length} elements (approx. ${size} bytes)`);
    
    return array;
  }
  
  /**
   * Create and track a string
   * @param {number} length - String length
   * @param {string} char - Character to repeat
   * @returns {string} The created string
   */
  createString(length, char = 'A') {
    const string = char.repeat(length);
    // 2 bytes per character in JavaScript
    const size = length * 2;
    const id = this.analyzer.recordAllocation(size, 'String');
    
    this.objects.strings.push({ id, string });
    console.log(`Created String #${id} of ${length} characters (${size} bytes)`);
    
    return string;
  }
  
  /**
   * Create and track a custom object
   * @param {Object} obj - Object to track
   * @param {number} estimatedSize - Estimated size in bytes
   * @param {string} type - Object type
   * @returns {Object} The tracked object
   */
  createCustomObject(obj, estimatedSize = 64, type = 'CustomObject') {
    const id = this.analyzer.recordAllocation(estimatedSize, type);
    
    this.objects.custom.push({ id, obj });
    console.log(`Created ${type} #${id} (estimated ${estimatedSize} bytes)`);
    
    return obj;
  }
  
  /**
   * Spray memory using the heapSpray utility
   * @param {string} method - Spray method to use
   * @param {Array} args - Arguments to pass to the spray method
   * @returns {*} Result of the spray operation
   */
  spray(method, ...args) {
    if (typeof this.heapSpray[method] !== 'function') {
      console.error(`Unknown spray method: ${method}`);
      this.sprayHelp();
      return null;
    }
    
    try {
      const result = this.heapSpray[method](...args);
      console.log(`Executed ${method} spray successfully`);
      return result;
    } catch (e) {
      console.error(`Error in ${method} spray:`, e);
      return null;
    }
  }
  
  /**
   * Show help for spray methods
   */
  sprayHelp() {
    console.log('Available spray methods:');
    console.log('  - basicSpray(pattern, count, chunkSize)');
    console.log('  - addressSpray(baseAddress, count, chunkSize)');
    console.log('  - sizeDiversitySpray(sizes, countPerSize)');
    console.log('  - typedArraySpray(size, countPerType)');
    console.log('  - payloadSpray(payload, offset, count, chunkSize)');
    console.log('  - vtableSpray(vtable, count, chunkSize)');
    console.log('  - bucketTargetedSpray(bucketSizes, count)');
    console.log('  - jitSpray(count)');
    console.log('  - structuredObjectSpray(layout, count)');
    console.log('  - arrayBufferViewSpray(bufferSize, bufferCount, viewsPerBuffer)');
  }
  
  /**
   * Spray ArrayBuffers with specific pattern
   * @param {number} count - Number of buffers
   * @param {number} size - Size of each buffer
   * @returns {Array} Array of created buffers
   */
  sprayArrayBuffers(count = 100, size = 1024) {
    const buffers = [];
    
    console.log(`Spraying ${count} ArrayBuffers of ${size} bytes each`);
    
    for (let i = 0; i < count; i++) {
      const buffer = this.createArrayBuffer(size);
      buffers.push(buffer);
      
      if (i % 100 === 0 && i > 0) {
        console.log(`Created ${i} buffers so far...`);
      }
    }
    
    console.log(`Completed spraying ${buffers.length} ArrayBuffers`);
    return buffers;
  }
  
  /**
   * Spray TypedArrays with a specific pattern
   * @param {string} type - TypedArray type
   * @param {number} count - Number of arrays
   * @param {number} length - Length of each array
   * @param {number} pattern - Pattern to fill with
   * @returns {Array} Array of created TypedArrays
   */
  sprayPattern(type = 'Uint32Array', count = 100, length = 256, pattern = 0x41414141) {
    const arrays = [];
    
    console.log(`Spraying ${count} ${type}s of ${length} elements with pattern 0x${pattern.toString(16)}`);
    
    for (let i = 0; i < count; i++) {
      const array = this.createTypedArray(type, length);
      
      // Fill with the pattern
      array.fill(pattern);
      
      arrays.push(array);
      
      if (i % 100 === 0 && i > 0) {
        console.log(`Created ${i} arrays so far...`);
      }
    }
    
    console.log(`Completed spraying ${arrays.length} ${type}s`);
    return arrays;
  }
  
  /**
   * Simulate a buffer overflow
   * @param {number} sourceId - Source allocation ID
   * @param {number} overflowSize - Size of overflow in bytes
   * @returns {Object} Simulation results
   */
  simulateOverflow(sourceId, overflowSize = 8) {
    return this.bugSimulator.simulateOverflow(sourceId, overflowSize);
  }
  
  /**
   * Simulate a use-after-free bug
   * @param {number} freedId - ID of freed allocation
   * @returns {Object} Simulation results
   */
  simulateUAF(freedId) {
    return this.bugSimulator.simulateUseAfterFree(freedId);
  }
  
  /**
   * Simulate a type confusion bug
   * @param {number} sourceId - Source allocation ID
   * @param {string} wrongType - Wrong type to confuse with
   * @returns {Object} Simulation results
   */
  simulateTypeConfusion(sourceId, wrongType) {
    return this.bugSimulator.simulateTypeConfusion(sourceId, wrongType);
  }
  
  /**
   * Generate an exploitation strategy for a bug
   * @param {number} bugId - Bug ID
   * @returns {Object} Generated strategy
   */
  generateStrategy(bugId) {
    return this.strategyGenerator.generateStrategyForBug(bugId);
  }
  
  /**
   * Generate exploit code for a bug
   * @param {number} bugId - Bug ID
   * @returns {string} Generated code
   */
  generateExploitCode(bugId) {
    return this.strategyGenerator.generateExploitTemplate(
      this.bugSimulator.activeBugs.get(bugId)
    );
  }
  
  /**
   * Analyze the current heap state
   * @returns {Object} Analysis results
   */
  analyze() {
    const result = {
      totalAllocations: this.analyzer.stats.totalAllocations,
      activeAllocations: this.analyzer.stats.currentLiveAllocations,
      freedAllocations: this.analyzer.stats.totalDeallocations,
      buckets: this.analyzer.generateBucketStats(),
      types: this.analyzer.generateTypeStats(),
      activeBugs: this.bugSimulator.getActiveBugs().length
    };
    
    console.log('=== Heap Analysis ===');
    console.log(`Total allocations: ${result.totalAllocations}`);
    console.log(`Active allocations: ${result.activeAllocations}`);
    console.log(`Freed allocations: ${result.freedAllocations}`);
    console.log(`Active bugs: ${result.activeBugs}`);
    console.log('Active buckets:');
    
    Object.entries(result.buckets).forEach(([size, stats]) => {
      console.log(`  ${size} bytes: ${stats.activeAllocations}/${stats.totalAllocations} (${Math.round(stats.utilizationRate * 100)}% utilization)`);
    });
    
    console.log('Allocation types:');
    Object.entries(result.types).forEach(([type, stats]) => {
      console.log(`  ${type}: ${stats.active}/${stats.count} (${stats.totalSize} bytes total)`);
    });
    
    return result;
  }
  
  /**
   * Get statistics for all buckets
   * @returns {Object} Bucket statistics
   */
  getBucketStats() {
    return this.analyzer.generateBucketStats();
  }
  
  /**
   * Find an allocation by ID
   * @param {number} id - Allocation ID
   * @returns {Object} Allocation details
   */
  findAllocationById(id) {
    return this.analyzer.allocations.get(id);
  }
  
  /**
   * Find adjacent allocations
   * @param {number} id - Allocation ID
   * @returns {Object} Previous and next allocations
   */
  findAdjacentAllocations(id) {
    return this.analyzer.findAdjacentAllocations(id);
  }
  
  /**
   * Clear all tracked objects and allocations
   */
  clearAll() {
    this.analyzer.reset();
    this.bugSimulator.reset();
    this.heapSpray.clear();
    
    this.objects.arrayBuffers = [];
    this.objects.typedArrays = [];
    this.objects.arrays = [];
    this.objects.strings = [];
    this.objects.custom = [];
    
    console.log('Cleared all allocations and tracked objects');
  }
  
  /**
   * Force garbage collection
   */
  gcForce() {
    console.log('Attempting to force garbage collection...');
    
    // Try explicit GC if available
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    } else {
      // Create memory pressure to induce GC
      const pressure = [];
      for (let i = 0; i < 10; i++) {
        pressure.push(new Uint8Array(1024 * 1024));
      }
      pressure.length = 0;
    }
    
    console.log('Garbage collection attempted');
  }
  
  /**
   * Show help information
   */
  help() {
    console.log('=== Heap Grooming Toolkit Console API ===');
    console.log('Allocation functions:');
    console.log('  heapTools.allocate(size, type, metadata) - Record a manual allocation');
    console.log('  heapTools.free(id) - Record a deallocation');
    console.log('  heapTools.createArrayBuffer(size) - Create and track an ArrayBuffer');
    console.log('  heapTools.createTypedArray(type, length) - Create and track a typed array');
    console.log('  heapTools.createArray(length, fillValue) - Create and track an array');
    console.log('  heapTools.createString(length, char) - Create and track a string');
    console.log('  heapTools.createCustomObject(obj, estimatedSize, type) - Track a custom object');
    
    console.log('\nSpray functions:');
    console.log('  heapTools.spray(method, ...args) - Use a spray method from HeapSpray');
    console.log('  heapTools.sprayArrayBuffers(count, size) - Spray ArrayBuffers');
    console.log('  heapTools.sprayPattern(type, count, length, pattern) - Spray TypedArrays with pattern');
    
    console.log('\nBug simulation:');
    console.log('  heapTools.simulateOverflow(sourceId, overflowSize) - Simulate a buffer overflow');
    console.log('  heapTools.simulateUAF(freedId) - Simulate a use-after-free bug');
    console.log('  heapTools.simulateTypeConfusion(sourceId, wrongType) - Simulate type confusion');
    
    console.log('\nAnalysis functions:');
    console.log('  heapTools.analyze() - Analyze the current heap state');
    console.log('  heapTools.getBucketStats() - Get statistics for all buckets');
    console.log('  heapTools.findAllocationById(id) - Find an allocation by ID');
    console.log('  heapTools.findAdjacentAllocations(id) - Find adjacent allocations');
    
    console.log('\nStrategy functions:');
    console.log('  heapTools.generateStrategy(bugId) - Generate an exploitation strategy');
    console.log('  heapTools.generateExploitCode(bugId) - Generate exploit code');
    
    console.log('\nUtility functions:');
    console.log('  heapTools.clearAll() - Clear all tracked objects and allocations');
    console.log('  heapTools.gcForce() - Force garbage collection');
    console.log('  heapTools.help() - Show this help information');
  }
}

// Initialize the console wrapper
const consoleWrapper = new ConsoleWrapper();

// Export the console wrapper
export default consoleWrapper;
