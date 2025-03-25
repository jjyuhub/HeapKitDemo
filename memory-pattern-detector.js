/**
 * Memory Pattern Detector
 * Scans memory for specific patterns to help identify successful exploitation
 */

/**
 * PatternDetector class for finding patterns in memory
 */
class PatternDetector {
  /**
   * Create a new pattern detector
   */
  constructor() {
    // Known pattern types
    this.patternTypes = {
      SHELLCODE: 'shellcode',
      VTABLE: 'vtable',
      HEAP_METADATA: 'heap_metadata',
      FAKE_OBJECT: 'fake_object',
      STRING: 'string',
      CUSTOM: 'custom'
    };
    
    // Predefined patterns
    this.predefinedPatterns = {
      // Common shellcode markers
      [this.patternTypes.SHELLCODE]: [
        { name: 'NOP sled', pattern: new Uint8Array([0x90, 0x90, 0x90, 0x90, 0x90, 0x90, 0x90, 0x90]) },
        { name: 'NOP alternative', pattern: new Uint8Array([0x66, 0x90, 0x66, 0x90, 0x66, 0x90, 0x66, 0x90]) },
        { name: 'INT3 breakpoint', pattern: new Uint8Array([0xCC, 0xCC, 0xCC, 0xCC]) }
      ],
      
      // Potential vtable structures
      [this.patternTypes.VTABLE]: [
        { name: 'Function pointers', pattern: new Uint32Array([0x08080808, 0x08080808, 0x08080808, 0x08080808]) },
        { name: 'Fake vtable header', pattern: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00]) }
      ],
      
      // Heap metadata signatures
      [this.patternTypes.HEAP_METADATA]: [
        { name: 'FreeMagic', pattern: new Uint8Array([0xEF, 0xEF, 0xEF, 0xEF]) },
        { name: 'AllocMagic', pattern: new Uint8Array([0xCD, 0xCD, 0xCD, 0xCD]) },
        { name: 'PartitionAlloc Free', pattern: new Uint8Array([0xFD, 0xFD, 0xFD, 0xFD]) }
      ],
      
      // Fake object structures
      [this.patternTypes.FAKE_OBJECT]: [
        { name: 'ArrayBuffer header', pattern: new Uint8Array([0x00, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0xFF]) },
        { name: 'DOM Node signature', pattern: new Uint8Array([0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]) }
      ],
      
      // String markers
      [this.patternTypes.STRING]: [
        { name: 'ASCII pattern', pattern: new TextEncoder().encode('AAAABBBBCCCCDDDD') },
        { name: 'Unicode pattern', pattern: new TextEncoder().encode('AÀAÀBÀBÀCÀCÀ') }
      ]
    };
  }
  
  /**
   * Scan a buffer for a specific pattern
   * @param {ArrayBuffer|TypedArray} buffer - Buffer to scan
   * @param {Uint8Array|Uint16Array|Uint32Array} pattern - Pattern to find
   * @param {number} tolerance - Number of mismatches allowed (for fuzzy matching)
   * @returns {Array} Array of match positions
   */
  findPattern(buffer, pattern, tolerance = 0) {
    // Ensure we have ArrayBuffer and Uint8Array views
    const arrayBuffer = buffer instanceof ArrayBuffer ? buffer : buffer.buffer;
    const bufferView = new Uint8Array(arrayBuffer);
    
    // Convert pattern to Uint8Array if needed
    let patternView;
    if (pattern instanceof Uint8Array) {
      patternView = pattern;
    } else if (pattern instanceof Uint16Array || pattern instanceof Uint32Array) {
      patternView = new Uint8Array(pattern.buffer);
    } else {
      throw new Error('Pattern must be a TypedArray');
    }
    
    // Results array
    const matches = [];
    
    // Scan for pattern
    const limit = bufferView.length - patternView.length + 1;
    
    for (let i = 0; i < limit; i++) {
      let mismatches = 0;
      
      for (let j = 0; j < patternView.length; j++) {
        if (bufferView[i + j] !== patternView[j]) {
          mismatches++;
          if (mismatches > tolerance) {
            break;
          }
        }
      }
      
      if (mismatches <= tolerance) {
        matches.push({
          offset: i,
          exactMatch: mismatches === 0
        });
      }
    }
    
    return matches;
  }
  
  /**
   * Scan a buffer for all predefined patterns of a specific type
   * @param {ArrayBuffer|TypedArray} buffer - Buffer to scan
   * @param {string} patternType - Type of patterns to scan for
   * @param {number} tolerance - Tolerance for fuzzy matching
   * @returns {Object} Results with all pattern matches
   */
  scanForPatternType(buffer, patternType, tolerance = 0) {
    const patterns = this.predefinedPatterns[patternType];
    if (!patterns) {
      throw new Error(`Unknown pattern type: ${patternType}`);
    }
    
    const results = {
      patternType,
      buffer,
      bufferSize: buffer instanceof ArrayBuffer ? buffer.byteLength : buffer.buffer.byteLength,
      patterns: []
    };
    
    for (const { name, pattern } of patterns) {
      const matches = this.findPattern(buffer, pattern, tolerance);
      
      if (matches.length > 0) {
        results.patterns.push({
          name,
          patternSize: pattern.length,
          matches
        });
      }
    }
    
    return results;
  }
  
  /**
   * Scan a buffer for all predefined pattern types
   * @param {ArrayBuffer|TypedArray} buffer - Buffer to scan
   * @param {number} tolerance - Tolerance for fuzzy matching
   * @returns {Object} Results with all pattern matches
   */
  scanBuffer(buffer, tolerance = 0) {
    const results = {
      buffer,
      bufferSize: buffer instanceof ArrayBuffer ? buffer.byteLength : buffer.buffer.byteLength,
      patternTypes: {}
    };
    
    for (const patternType of Object.values(this.patternTypes)) {
      const typeResults = this.scanForPatternType(buffer, patternType, tolerance);
      
      if (typeResults.patterns.length > 0) {
        results.patternTypes[patternType] = typeResults.patterns;
      }
    }
    
    return results;
  }
  
  /**
   * Scan multiple buffers for patterns
   * @param {Array} buffers - Array of buffers to scan
   * @param {number} tolerance - Tolerance for fuzzy matching
   * @returns {Array} Results for each buffer
   */
  scanBuffers(buffers, tolerance = 0) {
    return buffers.map((buffer, index) => {
      const result = this.scanBuffer(buffer, tolerance);
      result.index = index;
      return result;
    }).filter(result => Object.keys(result.patternTypes).length > 0);
  }
  
  /**
   * Create a custom pattern from a string
   * @param {string} str - String to convert to pattern
   * @returns {Uint8Array} Pattern as Uint8Array
   */
  createStringPattern(str) {
    return new TextEncoder().encode(str);
  }
  
  /**
   * Create a custom pattern from hex string
   * @param {string} hexStr - Hex string (e.g., "41424344")
   * @returns {Uint8Array} Pattern as Uint8Array
   */
  createHexPattern(hexStr) {
    hexStr = hexStr.replace(/\s/g, '');
    if (hexStr.length % 2 !== 0) {
      throw new Error('Hex string must have an even length');
    }
    
    const buffer = new Uint8Array(hexStr.length / 2);
    
    for (let i = 0; i < hexStr.length; i += 2) {
      buffer[i / 2] = parseInt(hexStr.substr(i, 2), 16);
    }
    
    return buffer;
  }
  
  /**
   * Add a custom pattern to a pattern type
   * @param {string} patternType - Pattern type
   * @param {string} name - Pattern name
   * @param {Uint8Array} pattern - Pattern data
   */
  addCustomPattern(patternType, name, pattern) {
    if (!this.predefinedPatterns[patternType]) {
      this.predefinedPatterns[patternType] = [];
    }
    
    this.predefinedPatterns[patternType].push({ name, pattern });
    console.log(`Added custom pattern "${name}" to type "${patternType}"`);
  }
  
  /**
   * Find repeated sequences in a buffer
   * @param {ArrayBuffer|TypedArray} buffer - Buffer to scan
   * @param {number} minLength - Minimum sequence length
   * @param {number} minRepetitions - Minimum number of repetitions
   * @returns {Array} Array of repeated sequences
   */
  findRepeatedSequences(buffer, minLength = 4, minRepetitions = 3) {
    // Ensure we have a Uint8Array view
    const bufferView = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer);
    
    const sequences = {};
    const results = [];
    
    // Scan for sequences
    for (let length = minLength; length <= 16; length++) {
      sequences[length] = {};
      
      for (let i = 0; i <= bufferView.length - length; i++) {
        // Create a key for this sequence
        const bytes = [];
        for (let j = 0; j < length; j++) {
          bytes.push(bufferView[i + j]);
        }
        const key = bytes.join(',');
        
        // Count occurrences
        if (!sequences[length][key]) {
          sequences[length][key] = {
            sequence: bytes,
            offsets: []
          };
        }
        
        sequences[length][key].offsets.push(i);
      }
      
      // Filter sequences that appear at least minRepetitions times
      for (const [key, data] of Object.entries(sequences[length])) {
        if (data.offsets.length >= minRepetitions) {
          results.push({
            sequence: new Uint8Array(data.sequence),
            length: length,
            repetitions: data.offsets.length,
            offsets: data.offsets
          });
        }
      }
    }
    
    // Sort by number of repetitions (descending)
    results.sort((a, b) => b.repetitions - a.repetitions);
    
    return results;
  }
  
  /**
   * Look for pointers in a buffer
   * @param {ArrayBuffer|TypedArray} buffer - Buffer to scan
   * @param {number} baseAddress - Base address to check against
   * @param {number} range - Range from base address to consider
   * @returns {Array} Array of potential pointers
   */
  findPointers(buffer, baseAddress = 0x08000000, range = 0x1000000) {
    // Ensure we have a Uint32Array view (for 32-bit pointers)
    const bufferView = buffer instanceof ArrayBuffer ? new Uint32Array(buffer) : 
                      (buffer instanceof Uint32Array ? buffer : new Uint32Array(buffer.buffer));
    
    const pointers = [];
    
    // Define potential pointer range
    const minAddress = baseAddress;
    const maxAddress = baseAddress + range;
    
    // Scan for values in the potential pointer range
    for (let i = 0; i < bufferView.length; i++) {
      const value = bufferView[i];
      
      if (value >= minAddress && value <= maxAddress) {
        pointers.push({
          offset: i * 4, // 4 bytes per Uint32
          value: value,
          relativeOffset: value - baseAddress
        });
      }
    }
    
    return pointers;
  }
  
  /**
   * Look for strings in a buffer
   * @param {ArrayBuffer|TypedArray} buffer - Buffer to scan
   * @param {number} minLength - Minimum string length
   * @returns {Array} Array of potential strings
   */
  findStrings(buffer, minLength = 4) {
    // Ensure we have a Uint8Array view
    const bufferView = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer);
    
    const strings = [];
    let currentString = [];
    
    // Scan for ASCII strings
    for (let i = 0; i < bufferView.length; i++) {
      const byte = bufferView[i];
      
      // Check if byte is a printable ASCII character
      if (byte >= 32 && byte <= 126) {
        currentString.push(byte);
      } else {
        // End of string
        if (currentString.length >= minLength) {
          const str = String.fromCharCode(...currentString);
          strings.push({
            offset: i - currentString.length,
            length: currentString.length,
            string: str
          });
        }
        
        currentString = [];
      }
    }
    
    // Check if we have a string at the end
    if (currentString.length >= minLength) {
      const str = String.fromCharCode(...currentString);
      strings.push({
        offset: bufferView.length - currentString.length,
        length: currentString.length,
        string: str
      });
    }
    
    return strings;
  }
  
  /**
   * Scan an array of typed arrays for potential corruption
   * @param {Array} arrays - Array of typed arrays to scan
   * @param {Function} checkFn - Function to check for corruption
   * @returns {Array} Array of potentially corrupted arrays
   */
  scanForCorruption(arrays, checkFn) {
    if (!checkFn || typeof checkFn !== 'function') {
      // Default check function looks for unexpected non-zero values
      checkFn = (array) => {
        const view = new Uint8Array(array.buffer);
        let unexpectedCount = 0;
        
        for (let i = 0; i < view.length; i++) {
          if (view[i] !== 0 && view[i] !== 0x41) { // 0x41 = 'A'
            unexpectedCount++;
            if (unexpectedCount > 3) {
              return true;
            }
          }
        }
        
        return false;
      };
    }
    
    const corrupted = [];
    
    for (let i = 0; i < arrays.length; i++) {
      try {
        const array = arrays[i];
        
        if (checkFn(array)) {
          corrupted.push({
            index: i,
            array: array,
            buffer: array.buffer
          });
        }
      } catch (e) {
        // If we get an exception, the array might be corrupted
        corrupted.push({
          index: i,
          error: e.message
        });
      }
    }
    
    return corrupted;
  }
  
  /**
   * Scan for type-specific violations (e.g., unexpected values in typed arrays)
   * @param {TypedArray} array - Array to scan
   * @returns {Object} Scan results with potential violations
   */
  scanForTypeViolations(array) {
    const violations = {
      typeViolations: false,
      outOfRange: false,
      nonStandardPattern: false,
      signs: false,
      details: []
    };
    
    try {
      // Check array type
      if (array instanceof Int8Array || array instanceof Int16Array || array instanceof Int32Array) {
        // Signed integer arrays - check for impossible bit patterns
        const view = new Uint8Array(array.buffer);
        
        for (let i = 0; i < view.length; i++) {
          // This is a simplification - in reality, you'd do more sophisticated checks
          if (view[i] > 127 && view[i] < 256) {
            violations.signs = true;
            violations.details.push({
              offset: i,
              value: view[i],
              issue: 'Suspicious bit pattern for signed array'
            });
          }
        }
      } else if (array instanceof Float32Array || array instanceof Float64Array) {
        // Float arrays - check for non-float patterns
        const floatArray = array;
        const intView = new Uint32Array(array.buffer);
        
        for (let i = 0; i < floatArray.length; i++) {
          const value = floatArray[i];
          
          // Check if value looks like a pointer
          if (!isNaN(value) && value === (value | 0) && value > 0x10000 && value < 0xFFFFFFFF) {
            violations.typeViolations = true;
            violations.details.push({
              offset: i * (array instanceof Float32Array ? 4 : 8),
              value: value,
              intValue: intView[i * (array instanceof Float32Array ? 1 : 2)],
              issue: 'Float contains integer that looks like a pointer'
            });
          }
        }
      }
    } catch (e) {
      violations.error = e.message;
    }
    
    // Set overall violation flag
    violations.hasViolations = 
      violations.typeViolations || 
      violations.outOfRange || 
      violations.nonStandardPattern || 
      violations.signs;
    
    return violations;
  }
}

// Export the PatternDetector
export default PatternDetector;
