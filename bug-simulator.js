/**
 * Bug simulation and analysis component
 * Simulates memory corruption bugs and analyzes their impact
 */

import HeapAnalyzer from './heap-analyzer.js';

class BugSimulator {
  /**
   * Create a new bug simulator
   * @param {HeapAnalyzer} analyzer - The heap analyzer instance
   */
  constructor(analyzer) {
    this.analyzer = analyzer;
    
    // Track active simulations
    this.activeBugs = new Map();
    this.nextBugId = 1;
    
    // Common bug types
    this.bugTypes = {
      BUFFER_OVERFLOW: 'overflow',
      USE_AFTER_FREE: 'use-after-free',
      DOUBLE_FREE: 'double-free',
      NULL_DEREFERENCE: 'null-deref',
      TYPE_CONFUSION: 'type-confusion'
    };
  }
  
  /**
   * Simulate a buffer overflow
   * @param {number} sourceId - Source allocation ID
   * @param {number} overflowSize - Size of overflow in bytes
   * @returns {Object} Simulation results
   */
  simulateOverflow(sourceId, overflowSize) {
    if (!this.analyzer.allocations.has(sourceId)) {
      return { error: 'Source allocation not found' };
    }
    
    const source = this.analyzer.allocations.get(sourceId);
    if (source.status !== 'allocated') {
      return { error: 'Source allocation is not active' };
    }
    
    // Record the bug
    const bugId = this.nextBugId++;
    const bugDetails = {
      id: bugId,
      type: this.bugTypes.BUFFER_OVERFLOW,
      sourceId,
      source,
      overflowSize,
      timestamp: Date.now(),
      impact: {}
    };
    
    // Find adjacent allocation that would be corrupted
    const adjacent = this.analyzer.findAdjacentAllocations(sourceId);
    if (adjacent.next && adjacent.next.status === 'allocated') {
      bugDetails.impact.corruptedAllocation = adjacent.next;
      bugDetails.impact.severity = this.assessOverflowSeverity(source, adjacent.next, overflowSize);
    } else {
      bugDetails.impact.severity = 'low';
      bugDetails.impact.notes = 'No active allocation would be directly corrupted';
    }
    
    // Record in analyzer timeline
    this.analyzer.recordBug(sourceId, this.bugTypes.BUFFER_OVERFLOW, {
      overflowSize,
      impactedId: adjacent.next?.id
    });
    
    // Store the active bug
    this.activeBugs.set(bugId, bugDetails);
    
    return bugDetails;
  }
  
  /**
   * Simulate a use-after-free bug
   * @param {number} freedId - ID of freed allocation
   * @returns {Object} Simulation results
   */
  simulateUseAfterFree(freedId) {
    if (!this.analyzer.allocations.has(freedId)) {
      return { error: 'Allocation not found' };
    }
    
    const freedAlloc = this.analyzer.allocations.get(freedId);
    if (freedAlloc.status !== 'freed') {
      return { error: 'Allocation is not freed yet' };
    }
    
    // Record the bug
    const bugId = this.nextBugId++;
    const bugDetails = {
      id: bugId,
      type: this.bugTypes.USE_AFTER_FREE,
      sourceId: freedId,
      source: freedAlloc,
      timestamp: Date.now(),
      impact: {}
    };
    
    // Find potential reuse of this memory region
    const bucketSize = this.analyzer.findBucketForSize(freedAlloc.size);
    const allocationsInBucket = this.analyzer.getAllocationsInBucket(bucketSize);
    
    // Find allocations that happened after this one was freed
    const freedAt = freedAlloc.freedAt || 0;
    const potentialReusers = allocationsInBucket.filter(alloc => 
      alloc.status === 'allocated' && alloc.timestamp > freedAt
    );
    
    if (potentialReusers.length > 0) {
      // Sort by time to find the most likely reuser
      potentialReusers.sort((a, b) => a.timestamp - b.timestamp);
      const mostLikelyReuser = potentialReusers[0];
      
      bugDetails.impact.reusingAllocation = mostLikelyReuser;
      bugDetails.impact.severity = this.assessUafSeverity(freedAlloc, mostLikelyReuser);
    } else {
      bugDetails.impact.severity = 'medium';
      bugDetails.impact.notes = 'No reuse detected yet, but memory could be reused later';
    }
    
    // Record in analyzer timeline
    this.analyzer.recordBug(freedId, this.bugTypes.USE_AFTER_FREE, {
      impactedId: bugDetails.impact.reusingAllocation?.id
    });
    
    // Store the active bug
    this.activeBugs.set(bugId, bugDetails);
    
    return bugDetails;
  }
  
  /**
   * Simulate a type confusion bug
   * @param {number} sourceId - Source allocation ID
   * @param {string} wrongType - Wrong type to confuse with
   * @returns {Object} Simulation results
   */
  simulateTypeConfusion(sourceId, wrongType) {
    if (!this.analyzer.allocations.has(sourceId)) {
      return { error: 'Source allocation not found' };
    }
    
    const source = this.analyzer.allocations.get(sourceId);
    if (source.status !== 'allocated') {
      return { error: 'Source allocation is not active' };
    }
    
    // Record the bug
    const bugId = this.nextBugId++;
    const bugDetails = {
      id: bugId,
      type: this.bugTypes.TYPE_CONFUSION,
      sourceId,
      source,
      wrongType,
      timestamp: Date.now(),
      impact: {}
    };
    
    // Assess impact based on size differences and type properties
    const correctType = source.type;
    bugDetails.impact.originalType = correctType;
    bugDetails.impact.confusedType = wrongType;
    
    // Find examples of the wrong type for comparison
    const wrongTypeExamples = Array.from(this.analyzer.allocations.values())
      .filter(alloc => alloc.type === wrongType && alloc.status === 'allocated');
    
    if (wrongTypeExamples.length > 0) {
      const wrongTypeExample = wrongTypeExamples[0];
      const sizeDiff = source.size - wrongTypeExample.size;
      
      if (sizeDiff > 0) {
        bugDetails.impact.severity = 'high';
        bugDetails.impact.notes = `${correctType} is larger than ${wrongType}, potential out-of-bounds access`;
      } else if (sizeDiff < 0) {
        bugDetails.impact.severity = 'medium';
        bugDetails.impact.notes = `${correctType} is smaller than ${wrongType}, potential metadata corruption`;
      } else {
        bugDetails.impact.severity = 'medium';
        bugDetails.impact.notes = 'Types have same size, but internal layout differences may cause issues';
      }
      
      bugDetails.impact.exampleAllocation = wrongTypeExample;
    } else {
      bugDetails.impact.severity = 'unknown';
      bugDetails.impact.notes = `No examples of ${wrongType} available for comparison`;
    }
    
    // Record in analyzer timeline
    this.analyzer.recordBug(sourceId, this.bugTypes.TYPE_CONFUSION, {
      wrongType
    });
    
    // Store the active bug
    this.activeBugs.set(bugId, bugDetails);
    
    return bugDetails;
  }
  
  /**
   * Assess the severity of a buffer overflow
   * @private
   */
  assessOverflowSeverity(source, target, overflowSize) {
    // Critical types that could lead to code execution
    const criticalTypes = ['Function', 'ArrayBuffer', 'WebAssembly', 'VTable'];
    const sensitiveTypes = ['Array', 'Object', 'Map', 'Set'];
    
    // Check if the target is a critical type
    if (criticalTypes.some(type => target.type.includes(type))) {
      return 'critical';
    }
    
    // Check if the target is a sensitive type
    if (sensitiveTypes.some(type => target.type.includes(type))) {
      return 'high';
    }
    
    // Large overflows are more severe
    if (overflowSize > 100) {
      return 'high';
    } else if (overflowSize > 16) {
      return 'medium';
    }
    
    return 'low';
  }
  
  /**
   * Assess the severity of a use-after-free
   * @private
   */
  assessUafSeverity(freed, reuser) {
    // Critical types that could lead to code execution
    const criticalTypes = ['Function', 'ArrayBuffer', 'WebAssembly', 'VTable'];
    const sensitiveTypes = ['Array', 'Object', 'Map', 'Set'];
    
    // UAF with reuse by a critical type is severe
    if (criticalTypes.some(type => reuser.type.includes(type))) {
      return 'critical';
    }
    
    // UAF with reuse by a sensitive type is high impact
    if (sensitiveTypes.some(type => reuser.type.includes(type))) {
      return 'high';
    }
    
    // UAF on a critical type is high impact
    if (criticalTypes.some(type => freed.type.includes(type))) {
      return 'high';
    }
    
    return 'medium';
  }
  
  /**
   * Generate mitigation suggestions for a bug
   * @param {number} bugId - Bug ID
   * @returns {Array} Array of mitigation suggestions
   */
  generateMitigations(bugId) {
    if (!this.activeBugs.has(bugId)) {
      return { error: 'Bug not found' };
    }
    
    const bug = this.activeBugs.get(bugId);
    const mitigations = [];
    
    switch (bug.type) {
      case this.bugTypes.BUFFER_OVERFLOW:
        mitigations.push({
          title: 'Use bounded operations',
          description: 'Replace unbounded operations with bounded variants (e.g., strcpy with strncpy)'
        });
        mitigations.push({
          title: 'Add bounds checking',
          description: 'Add explicit bounds checking before memory operations'
        });
        mitigations.push({
          title: 'Use memory-safe containers',
          description: 'Replace raw arrays with bounds-checked containers'
        });
        if (bug.impact.severity === 'critical' || bug.impact.severity === 'high') {
          mitigations.push({
            title: 'Add heap layout randomization',
            description: 'Randomize allocation order to make exploitation less reliable'
          });
        }
        break;
        
      case this.bugTypes.USE_AFTER_FREE:
        mitigations.push({
          title: 'Nullify pointers after free',
          description: 'Set pointers to null immediately after freeing memory'
        });
        mitigations.push({
          title: 'Use smart pointers',
          description: 'Replace raw pointers with smart pointers that handle memory management'
        });
        mitigations.push({
          title: 'Delay reuse of freed memory',
          description: 'Implement a quarantine zone to delay the reuse of recently freed memory'
        });
        break;
        
      case this.bugTypes.TYPE_CONFUSION:
        mitigations.push({
          title: 'Add runtime type checking',
          description: 'Implement runtime type checks before type casting'
        });
        mitigations.push({
          title: 'Use type-safe interfaces',
          description: 'Redesign interfaces to eliminate the need for unsafe casts'
        });
        mitigations.push({
          title: 'Add type metadata validation',
          description: 'Validate type metadata before operations'
        });
        break;
        
      default:
        mitigations.push({
          title: 'Implement comprehensive testing',
          description: 'Add fuzz testing to identify memory safety issues'
        });
    }
    
    // Generic mitigations for all bugs
    mitigations.push({
      title: 'Deploy exploit mitigations',
      description: 'Enable available exploit mitigations (ASLR, DEP, CFG, etc.)'
    });
    
    return mitigations;
  }
  
  /**
   * Get exploitability assessment for a bug
   * @param {number} bugId - Bug ID
   * @returns {Object} Exploitability assessment
   */
  assessExploitability(bugId) {
    if (!this.activeBugs.has(bugId)) {
      return { error: 'Bug not found' };
    }
    
    const bug = this.activeBugs.get(bugId);
    const assessment = {
      overall: 'low',
      factors: [],
      difficulties: []
    };
    
    // Initialize with a score
    let exploitScore = 0;
    
    switch (bug.type) {
      case this.bugTypes.BUFFER_OVERFLOW:
        // Assess overflow exploitability
        if (bug.impact.corruptedAllocation) {
          const target = bug.impact.corruptedAllocation;
          
          // Critical types are easier to exploit
          if (target.type.includes('Function') || target.type.includes('ArrayBuffer')) {
            assessment.factors.push('Overflow corrupts a critical object type');
            exploitScore += 30;
          }
          
          // Small overflows are more controlled
          if (bug.overflowSize <= 8) {
            assessment.factors.push('Small, controlled overflow size');
            exploitScore += 20;
          } else if (bug.overflowSize <= 64) {
            assessment.factors.push('Moderate overflow size');
            exploitScore += 10;
          } else {
            assessment.difficulties.push('Large overflow may cause instability');
            exploitScore -= 10;
          }
        } else {
          assessment.difficulties.push('No identified adjacent object to corrupt');
          exploitScore -= 20;
        }
        break;
        
      case this.bugTypes.USE_AFTER_FREE:
        // Assess UAF exploitability
        if (bug.impact.reusingAllocation) {
          const reuser = bug.impact.reusingAllocation;
          
          // Critical types are easier to exploit
          if (reuser.type.includes('ArrayBuffer') || reuser.type.includes('Function')) {
            assessment.factors.push('UAF memory reused by a critical object type');
            exploitScore += 30;
          }
          
          if (bug.source.type === reuser.type) {
            assessment.factors.push('Reusing allocation has same type, reducing chance of crashes');
            exploitScore += 15;
          } else {
            assessment.difficulties.push('Type mismatch between freed and reusing objects may cause instability');
            exploitScore -= 10;
          }
        } else {
          assessment.difficulties.push('No identified reusing allocation yet');
          exploitScore -= 15;
        }
        break;
        
      case this.bugTypes.TYPE_CONFUSION:
        // Assess type confusion exploitability
        if (bug.wrongType.includes('Function') || bug.wrongType.includes('ArrayBuffer')) {
          assessment.factors.push('Confusion with a critical object type');
          exploitScore += 25;
        }
        
        if (bug.impact.exampleAllocation) {
          const sizeDiff = bug.source.size - bug.impact.exampleAllocation.size;
          if (sizeDiff > 0) {
            assessment.factors.push('Target type is smaller than original, enabling out-of-bounds access');
            exploitScore += 20;
          }
        } else {
          assessment.difficulties.push('No example of confused type available for comparison');
          exploitScore -= 10;
        }
        break;
        
      default:
        assessment.difficulties.push('Unknown bug type, difficult to assess');
        exploitScore -= 20;
    }
    
    // Add common factors
    if (this.analyzer.stats.totalAllocations > 100) {
      assessment.factors.push('Complex heap state provides opportunities for grooming');
      exploitScore += 10;
    }
    
    // Determine overall exploitability
    if (exploitScore >= 40) {
      assessment.overall = 'high';
    } else if (exploitScore >= 20) {
      assessment.overall = 'medium';
    } else {
      assessment.overall = 'low';
    }
    
    assessment.score = exploitScore;
    
    return assessment;
  }
  
  /**
   * Get all active bugs
   * @returns {Array} Array of active bugs
   */
  getActiveBugs() {
    return Array.from(this.activeBugs.values());
  }
  
  /**
   * Remove a bug simulation
   * @param {number} bugId - Bug ID
   */
  removeBug(bugId) {
    this.activeBugs.delete(bugId);
  }
  
  /**
   * Reset all bug simulations
   */
  reset() {
    this.activeBugs.clear();
    this.nextBugId = 1;
  }
}

// Export the BugSimulator
export default BugSimulator;
