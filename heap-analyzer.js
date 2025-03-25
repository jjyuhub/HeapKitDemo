/**
 * Core heap analyzer module that tracks memory allocations and provides
 * data structures for visualizations.
 */
class HeapAnalyzer {
  constructor() {
    // Track all allocations by ID
    this.allocations = new Map();
    
    // Track allocations by size bucket
    this.buckets = new Map();
    
    // Timeline of events for replay
    this.timeline = [];
    
    // Counter for allocation IDs
    this.nextId = 1;
    
    // Detected bucket sizes in PartitionAlloc
    this.detectedBucketSizes = [];
    
    // Stats for analysis
    this.stats = {
      totalAllocations: 0,
      totalDeallocations: 0,
      maxLiveAllocations: 0,
      currentLiveAllocations: 0,
    };
  }
  
  /**
   * Record a new allocation
   * @param {number} size - Size in bytes
   * @param {string} type - Object type (e.g., "ArrayBuffer", "String")
   * @param {Object} metadata - Additional information about the allocation
   * @returns {number} Allocation ID
   */
  recordAllocation(size, type, metadata = {}) {
    const id = this.nextId++;
    const timestamp = Date.now();
    
    const allocation = {
      id,
      size,
      type,
      timestamp,
      metadata,
      status: "allocated"
    };
    
    this.allocations.set(id, allocation);
    
    // Find the appropriate bucket
    const bucketSize = this.findBucketForSize(size);
    if (!this.buckets.has(bucketSize)) {
      this.buckets.set(bucketSize, []);
    }
    
    this.buckets.get(bucketSize).push(allocation);
    
    // Record in timeline
    this.timeline.push({
      type: "allocation",
      timestamp,
      allocation
    });
    
    // Update stats
    this.stats.totalAllocations++;
    this.stats.currentLiveAllocations++;
    if (this.stats.currentLiveAllocations > this.stats.maxLiveAllocations) {
      this.stats.maxLiveAllocations = this.stats.currentLiveAllocations;
    }
    
    return id;
  }
  
  /**
   * Record a deallocation
   * @param {number} id - Allocation ID
   */
  recordDeallocation(id) {
    if (!this.allocations.has(id)) {
      console.warn(`Tried to deallocate unknown ID: ${id}`);
      return;
    }
    
    const allocation = this.allocations.get(id);
    const timestamp = Date.now();
    
    allocation.status = "freed";
    allocation.freedAt = timestamp;
    
    // Record in timeline
    this.timeline.push({
      type: "deallocation",
      timestamp,
      allocation
    });
    
    // Update stats
    this.stats.totalDeallocations++;
    this.stats.currentLiveAllocations--;
  }
  
  /**
   * Record a simulated bug (overflow, use-after-free, etc.)
   * @param {number} sourceId - Source allocation ID
   * @param {string} bugType - Type of bug
   * @param {Object} details - Bug details (e.g., overflow size)
   */
  recordBug(sourceId, bugType, details = {}) {
    if (!this.allocations.has(sourceId)) {
      console.warn(`Tried to record bug for unknown ID: ${sourceId}`);
      return;
    }
    
    const timestamp = Date.now();
    
    // Record in timeline
    this.timeline.push({
      type: "bug",
      timestamp,
      sourceId,
      bugType,
      details
    });
  }
  
  /**
   * Find the appropriate bucket size for an allocation
   * Uses knowledge of PartitionAlloc's bucketing strategy
   * @param {number} size - Allocation size
   * @returns {number} Bucket size
   */
  findBucketForSize(size) {
    // Simplified PartitionAlloc bucketing strategy
    // This would be refined based on reverse engineering
    if (size <= 0) return 0;
    
    // Small allocations (up to 1024 bytes)
    if (size <= 1024) {
      // Calculate bucket size using PartitionAlloc's strategy
      // This is a simplified approximation
      const bucketSizes = [8, 16, 32, 48, 64, 80, 96, 112, 128, 
                          144, 160, 192, 224, 256, 320, 384, 
                          448, 512, 576, 640, 704, 768, 832, 896, 960, 1024];
      
      for (const bucketSize of bucketSizes) {
        if (size <= bucketSize) {
          return bucketSize;
        }
      }
    }
    
    // Medium allocations (up to 4096 bytes)
    if (size <= 4096) {
      // 128-byte increments
      return Math.ceil(size / 128) * 128;
    }
    
    // Large allocations
    // 4096-byte increments
    return Math.ceil(size / 4096) * 4096;
  }
  
  /**
   * Get all allocations in a specific bucket
   * @param {number} bucketSize - Bucket size
   * @returns {Array} Allocations in the bucket
   */
  getAllocationsInBucket(bucketSize) {
    return this.buckets.get(bucketSize) || [];
  }
  
  /**
   * Get all active buckets
   * @returns {Array} Array of bucket sizes
   */
  getActiveBuckets() {
    return Array.from(this.buckets.keys()).sort((a, b) => a - b);
  }
  
  /**
   * Get active (not freed) allocations
   * @returns {Array} Active allocations
   */
  getActiveAllocations() {
    return Array.from(this.allocations.values())
      .filter(alloc => alloc.status === "allocated");
  }
  
  /**
   * Find adjacent allocations to a given allocation
   * @param {number} id - Allocation ID
   * @returns {Object} Previous and next allocations
   */
  findAdjacentAllocations(id) {
    if (!this.allocations.has(id)) {
      return { prev: null, next: null };
    }
    
    const allocation = this.allocations.get(id);
    const bucketSize = this.findBucketForSize(allocation.size);
    const bucketed = this.buckets.get(bucketSize) || [];
    
    // Find the index of the allocation in its bucket
    const index = bucketed.findIndex(a => a.id === id);
    if (index === -1) {
      return { prev: null, next: null };
    }
    
    return {
      prev: index > 0 ? bucketed[index - 1] : null,
      next: index < bucketed.length - 1 ? bucketed[index + 1] : null
    };
  }
  
  /**
   * Generate statistics on bucket utilization
   * @returns {Object} Bucket statistics
   */
  generateBucketStats() {
    const stats = {};
    
    for (const [bucketSize, allocations] of this.buckets.entries()) {
      const active = allocations.filter(a => a.status === "allocated").length;
      const freed = allocations.filter(a => a.status === "freed").length;
      
      stats[bucketSize] = {
        totalAllocations: allocations.length,
        activeAllocations: active,
        freedAllocations: freed,
        utilizationRate: allocations.length > 0 ? active / allocations.length : 0
      };
    }
    
    return stats;
  }
  
  /**
   * Calculate statistics on allocation types
   * @returns {Object} Type statistics
   */
  generateTypeStats() {
    const stats = {};
    
    for (const allocation of this.allocations.values()) {
      if (!stats[allocation.type]) {
        stats[allocation.type] = {
          count: 0,
          totalSize: 0,
          active: 0,
          freed: 0
        };
      }
      
      stats[allocation.type].count++;
      stats[allocation.type].totalSize += allocation.size;
      
      if (allocation.status === "allocated") {
        stats[allocation.type].active++;
      } else {
        stats[allocation.type].freed++;
      }
    }
    
    return stats;
  }
  
  /**
   * Reset all tracking data
   */
  reset() {
    this.allocations.clear();
    this.buckets.clear();
    this.timeline = [];
    this.nextId = 1;
    this.stats = {
      totalAllocations: 0,
      totalDeallocations: 0,
      maxLiveAllocations: 0,
      currentLiveAllocations: 0,
    };
  }
}

// Export the HeapAnalyzer
export default HeapAnalyzer;
