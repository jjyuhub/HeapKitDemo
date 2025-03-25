/**
 * Visualization components for the heap analyzer
 * Provides multiple views of heap state and timeline
 */

import HeapAnalyzer from './heap-analyzer.js';

class HeapVisualizer {
  /**
   * Create a new heap visualizer
   * @param {HeapAnalyzer} analyzer - The heap analyzer instance
   * @param {Object} options - Visualization options
   */
  constructor(analyzer, options = {}) {
    this.analyzer = analyzer;
    this.options = {
      colors: {
        allocated: "#4CAF50",  // Green
        freed: "#F44336",      // Red
        selected: "#2196F3",   // Blue
        overflow: "#FF9800",   // Orange
        uaf: "#9C27B0",        // Purple
        default: "#9E9E9E",    // Gray
        text: "#212121",       // Dark gray
        background: "#FFFFFF", // White
        grid: "#EEEEEE"        // Light gray
      },
      timelineHeight: 150,
      bucketViewHeight: 300,
      ...options
    };
    
    // Track selected allocations for highlighting
    this.selectedAllocationId = null;
    
    // Element references
    this.canvasElements = {
      bucketView: null,
      timeline: null,
      adjacency: null,
      heapMap: null
    };
    
    // Contexts for drawing
    this.contexts = {};
  }
  
  /**
   * Initialize the visualizer with DOM elements
   * @param {Object} elements - Canvas elements
   */
  initialize(elements) {
    this.canvasElements = { ...elements };
    
    // Get and store contexts
    for (const [name, canvas] of Object.entries(this.canvasElements)) {
      if (canvas) {
        this.contexts[name] = canvas.getContext('2d');
        
        // Set up click handling for interactive elements
        canvas.addEventListener('click', (event) => {
          this.handleCanvasClick(name, event);
        });
      }
    }
    
    // Initial render
    this.render();
  }
  
  /**
   * Render all visualizations
   */
  render() {
    this.renderBucketView();
    this.renderTimeline();
    this.renderAdjacencyView();
    this.renderHeapMap();
  }
  
  /**
   * Render the bucket view visualization
   * Shows memory organization by buckets and slots
   */
  renderBucketView() {
    const canvas = this.canvasElements.bucketView;
    if (!canvas) return;
    
    const ctx = this.contexts.bucketView;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = this.options.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Get active buckets
    const buckets = this.analyzer.getActiveBuckets();
    if (buckets.length === 0) {
      this.drawNoDataMessage(ctx, width, height);
      return;
    }
    
    // Calculate layout
    const bucketPadding = 20;
    const bucketHeight = Math.min(40, (height - bucketPadding * 2) / buckets.length);
    const bucketSpacing = bucketHeight + 10;
    const bucketLabelWidth = 80;
    
    // Draw title
    ctx.fillStyle = this.options.colors.text;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Memory Bucket Visualization', 10, 20);
    
    // Draw each bucket
    buckets.forEach((bucketSize, index) => {
      const y = bucketPadding + index * bucketSpacing;
      
      // Draw bucket label
      ctx.fillStyle = this.options.colors.text;
      ctx.font = '12px Arial';
      ctx.fillText(`${bucketSize} bytes`, 10, y + bucketHeight / 2 + 4);
      
      // Get allocations in this bucket
      const allocations = this.analyzer.getAllocationsInBucket(bucketSize);
      const activeAllocations = allocations.filter(a => a.status === "allocated");
      const freedAllocations = allocations.filter(a => a.status === "freed");
      
      // Calculate utilization
      const totalSlots = allocations.length;
      const utilization = totalSlots > 0 ? activeAllocations.length / totalSlots : 0;
      
      // Draw bucket background
      const bucketWidth = width - bucketLabelWidth - 20;
      ctx.fillStyle = this.options.colors.grid;
      ctx.fillRect(bucketLabelWidth, y, bucketWidth, bucketHeight);
      
      // Draw allocations
      if (totalSlots > 0) {
        const slotWidth = bucketWidth / totalSlots;
        
        allocations.forEach((allocation, slotIndex) => {
          const slotX = bucketLabelWidth + slotIndex * slotWidth;
          
          // Set color based on allocation status
          if (allocation.id === this.selectedAllocationId) {
            ctx.fillStyle = this.options.colors.selected;
          } else {
            ctx.fillStyle = allocation.status === "allocated" 
              ? this.options.colors.allocated 
              : this.options.colors.freed;
          }
          
          // Draw the slot
          ctx.fillRect(slotX, y, slotWidth, bucketHeight);
          
          // Add a border to separate slots
          ctx.strokeStyle = this.options.colors.background;
          ctx.lineWidth = 1;
          ctx.strokeRect(slotX, y, slotWidth, bucketHeight);
        });
      }
      
      // Draw utilization text
      const utilizationText = `${activeAllocations.length}/${totalSlots} (${Math.round(utilization * 100)}%)`;
      ctx.fillStyle = this.options.colors.text;
      ctx.font = '10px Arial';
      ctx.fillText(utilizationText, width - 80, y + bucketHeight / 2 + 3);
    });
  }
  
  /**
   * Render the timeline visualization
   * Shows allocations and deallocations over time
   */
  renderTimeline() {
    const canvas = this.canvasElements.timeline;
    if (!canvas) return;
    
    const ctx = this.contexts.timeline;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = this.options.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Get timeline events
    const events = this.analyzer.timeline;
    if (events.length === 0) {
      this.drawNoDataMessage(ctx, width, height);
      return;
    }
    
    // Calculate time range
    const startTime = events[0]?.timestamp || Date.now();
    const endTime = events[events.length - 1]?.timestamp || Date.now();
    const timeRange = Math.max(1, endTime - startTime);
    
    // Draw title
    ctx.fillStyle = this.options.colors.text;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Allocation Timeline', 10, 20);
    
    // Draw timeline axis
    const axisY = height - 30;
    ctx.strokeStyle = this.options.colors.text;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, axisY);
    ctx.lineTo(width - 10, axisY);
    ctx.stroke();
    
    // Draw events
    const eventWidth = 8;
    const eventHeight = 20;
    
    events.forEach(event => {
      const timeOffset = event.timestamp - startTime;
      const x = 50 + (timeOffset / timeRange) * (width - 60);
      const y = axisY - eventHeight;
      
      // Set color based on event type
      if (event.type === "allocation") {
        ctx.fillStyle = 
          event.allocation.id === this.selectedAllocationId 
            ? this.options.colors.selected 
            : this.options.colors.allocated;
      } else if (event.type === "deallocation") {
        ctx.fillStyle = 
          event.allocation.id === this.selectedAllocationId 
            ? this.options.colors.selected 
            : this.options.colors.freed;
      } else if (event.type === "bug") {
        ctx.fillStyle = 
          event.bugType === "overflow" 
            ? this.options.colors.overflow 
            : this.options.colors.uaf;
      } else {
        ctx.fillStyle = this.options.colors.default;
      }
      
      // Draw event marker
      ctx.beginPath();
      if (event.type === "allocation") {
        // Up arrow
        ctx.moveTo(x, y + eventHeight);
        ctx.lineTo(x + eventWidth/2, y);
        ctx.lineTo(x - eventWidth/2, y);
      } else if (event.type === "deallocation") {
        // Down arrow
        ctx.moveTo(x, y);
        ctx.lineTo(x + eventWidth/2, y + eventHeight);
        ctx.lineTo(x - eventWidth/2, y + eventHeight);
      } else {
        // Diamond for bugs
        ctx.moveTo(x, y);
        ctx.lineTo(x + eventWidth/2, y + eventHeight/2);
        ctx.lineTo(x, y + eventHeight);
        ctx.lineTo(x - eventWidth/2, y + eventHeight/2);
      }
      ctx.closePath();
      ctx.fill();
      
      // Store event data for click handling
      event.visualBounds = { x, y, width: eventWidth, height: eventHeight };
    });
    
    // Draw live allocation count over time
    let liveCount = 0;
    const points = [];
    
    events.forEach(event => {
      const timeOffset = event.timestamp - startTime;
      const x = 50 + (timeOffset / timeRange) * (width - 60);
      
      if (event.type === "allocation") {
        liveCount++;
      } else if (event.type === "deallocation") {
        liveCount--;
      }
      
      points.push({ x, y: axisY - 30 - (liveCount * 3) });
    });
    
    // Draw the line connecting points
    if (points.length > 1) {
      ctx.strokeStyle = this.options.colors.allocated;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      
      ctx.stroke();
    }
    
    // Draw time labels
    ctx.fillStyle = this.options.colors.text;
    ctx.font = '10px Arial';
    ctx.fillText('Start', 40, axisY + 15);
    ctx.fillText('End', width - 30, axisY + 15);
    ctx.fillText('Live Objects', 10, 40);
  }
  
  /**
   * Render the adjacency view visualization
   * Shows relationships between allocations
   */
  renderAdjacencyView() {
    const canvas = this.canvasElements.adjacency;
    if (!canvas) return;
    
    const ctx = this.contexts.adjacency;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = this.options.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // If no allocation is selected, show message
    if (!this.selectedAllocationId) {
      ctx.fillStyle = this.options.colors.text;
      ctx.font = '14px Arial';
      ctx.fillText('Select an allocation to view adjacency', width/2 - 120, height/2);
      return;
    }
    
    // Get the selected allocation
    const allocation = this.analyzer.allocations.get(this.selectedAllocationId);
    if (!allocation) {
      this.drawNoDataMessage(ctx, width, height);
      return;
    }
    
    // Draw title
    ctx.fillStyle = this.options.colors.text;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Allocation Adjacency View', 10, 20);
    
    // Find adjacent allocations
    const adjacent = this.analyzer.findAdjacentAllocations(this.selectedAllocationId);
    
    // Draw objects
    const centerY = height / 2;
    const objectHeight = 80;
    const objectWidth = 180;
    const spacing = 40;
    
    // Draw previous allocation if exists
    if (adjacent.prev) {
      const prevX = width/2 - objectWidth - spacing;
      this.drawAllocationBox(ctx, prevX, centerY - objectHeight/2, 
                           objectWidth, objectHeight, adjacent.prev);
      
      // Draw connection arrow
      ctx.strokeStyle = this.options.colors.text;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(prevX + objectWidth, centerY);
      ctx.lineTo(width/2 - spacing/2, centerY);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(width/2 - spacing/2, centerY);
      ctx.lineTo(width/2 - spacing/2 - 10, centerY - 5);
      ctx.lineTo(width/2 - spacing/2 - 10, centerY + 5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Draw selected allocation
    this.drawAllocationBox(ctx, width/2 - objectWidth/2, centerY - objectHeight/2, 
                         objectWidth, objectHeight, allocation, true);
    
    // Draw next allocation if exists
    if (adjacent.next) {
      const nextX = width/2 + spacing;
      this.drawAllocationBox(ctx, nextX, centerY - objectHeight/2, 
                           objectWidth, objectHeight, adjacent.next);
      
      // Draw connection arrow
      ctx.strokeStyle = this.options.colors.text;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width/2 + objectWidth/2, centerY);
      ctx.lineTo(nextX, centerY);
      ctx.stroke();
      
      // Arrow head
      ctx.beginPath();
      ctx.moveTo(nextX, centerY);
      ctx.lineTo(nextX - 10, centerY - 5);
      ctx.lineTo(nextX - 10, centerY + 5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Show memory layout explanation
    ctx.fillStyle = this.options.colors.text;
    ctx.font = '12px Arial';
    const bucketSize = this.analyzer.findBucketForSize(allocation.size);
    ctx.fillText(`These allocations belong to the ${bucketSize}-byte bucket`, width/2 - 150, height - 20);
  }
  
  /**
   * Draw an allocation box with details
   */
  drawAllocationBox(ctx, x, y, width, height, allocation, isSelected = false) {
    // Draw background
    ctx.fillStyle = isSelected ? this.options.colors.selected : 
                  (allocation.status === "allocated" ? this.options.colors.allocated : this.options.colors.freed);
    ctx.fillRect(x, y, width, height);
    
    // Draw border
    ctx.strokeStyle = isSelected ? '#000000' : '#666666';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, width, height);
    
    // Draw allocation details
    ctx.fillStyle = isSelected ? '#FFFFFF' : this.options.colors.text;
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`ID: ${allocation.id}`, x + 10, y + 20);
    
    ctx.font = '12px Arial';
    ctx.fillText(`Type: ${allocation.type}`, x + 10, y + 35);
    ctx.fillText(`Size: ${allocation.size} bytes`, x + 10, y + 50);
    ctx.fillText(`Status: ${allocation.status}`, x + 10, y + 65);
  }
  
  /**
   * Render the heap map visualization
   * Shows a 2D map of memory allocations
   */
  renderHeapMap() {
    const canvas = this.canvasElements.heapMap;
    if (!canvas) return;
    
    const ctx = this.contexts.heapMap;
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = this.options.colors.background;
    ctx.fillRect(0, 0, width, height);
    
    // Get active allocations
    const allocations = Array.from(this.analyzer.allocations.values());
    if (allocations.length === 0) {
      this.drawNoDataMessage(ctx, width, height);
      return;
    }
    
    // Draw title
    ctx.fillStyle = this.options.colors.text;
    ctx.font = 'bold 14px Arial';
    ctx.fillText('Heap Memory Map', 10, 20);
    
    // Group allocations by type
    const typeGroups = {};
    const types = new Set();
    
    allocations.forEach(allocation => {
      if (!typeGroups[allocation.type]) {
        typeGroups[allocation.type] = [];
        types.add(allocation.type);
      }
      typeGroups[allocation.type].push(allocation);
    });
    
    // Sort types by total size
    const sortedTypes = Array.from(types).sort((a, b) => {
      const totalSizeA = typeGroups[a].reduce((sum, alloc) => sum + alloc.size, 0);
      const totalSizeB = typeGroups[b].reduce((sum, alloc) => sum + alloc.size, 0);
      return totalSizeB - totalSizeA;
    });
    
    // Calculate total size for scaling
    const totalSize = allocations.reduce((sum, alloc) => sum + alloc.size, 0);
    
    // Generate colors for types
    const typeColors = {};
    sortedTypes.forEach((type, index) => {
      // Generate a color based on index
      const hue = (index * 137.5) % 360;
      typeColors[type] = `hsl(${hue}, 70%, 60%)`;
    });
    
    // Draw treemap
    const padding = { top: 40, right: 20, bottom: 40, left: 20 };
    const mapWidth = width - padding.left - padding.right;
    const mapHeight = height - padding.top - padding.bottom;
    
    let currentY = padding.top;
    let remainingHeight = mapHeight;
    
    // Draw each type as a row
    sortedTypes.forEach((type, index) => {
      const allocsOfType = typeGroups[type];
      const totalTypeSize = allocsOfType.reduce((sum, alloc) => sum + alloc.size, 0);
      const rowHeight = Math.max(20, (totalTypeSize / totalSize) * mapHeight);
      
      if (currentY + rowHeight > height - padding.bottom) {
        return; // Skip if we're out of space
      }
      
      // Draw type header
      ctx.fillStyle = this.options.colors.text;
      ctx.font = 'bold 12px Arial';
      const typeText = `${type} (${Math.round(totalTypeSize / 1024)}KB)`;
      ctx.fillText(typeText, padding.left, currentY - 5);
      
      // Sort allocations by size
      const sortedAllocs = [...allocsOfType].sort((a, b) => b.size - a.size);
      
      // Draw allocations within this row
      let currentX = padding.left;
      sortedAllocs.forEach(allocation => {
        const blockWidth = Math.max(5, (allocation.size / totalTypeSize) * mapWidth);
        
        if (currentX + blockWidth > width - padding.right) {
          return; // Skip if we're out of space
        }
        
        // Set color based on allocation status and selection
        if (allocation.id === this.selectedAllocationId) {
          ctx.fillStyle = this.options.colors.selected;
        } else {
          ctx.fillStyle = allocation.status === "allocated" ? 
                         typeColors[type] : 
                         this.options.colors.freed;
        }
        
        // Draw the allocation block
        ctx.fillRect(currentX, currentY, blockWidth, rowHeight);
        
        // Draw border
        ctx.strokeStyle = this.options.colors.background;
        ctx.lineWidth = 1;
        ctx.strokeRect(currentX, currentY, blockWidth, rowHeight);
        
        // Store allocation info for click handling
        allocation.visualBounds = { 
          x: currentX, 
          y: currentY, 
          width: blockWidth, 
          height: rowHeight
        };
        
        currentX += blockWidth;
      });
      
      currentY += rowHeight;
      remainingHeight -= rowHeight;
    });
    
    // Draw legend
    const legendY = height - 30;
    let legendX = padding.left;
    
    sortedTypes.forEach((type, index) => {
      const typeText = type;
      const textWidth = ctx.measureText(typeText).width;
      
      if (legendX + textWidth + 30 > width - padding.right) {
        return; // Skip if we're out of space
      }
      
      // Draw color box
      ctx.fillStyle = typeColors[type];
      ctx.fillRect(legendX, legendY, 10, 10);
      
      // Draw type name
      ctx.fillStyle = this.options.colors.text;
      ctx.font = '10px Arial';
      ctx.fillText(typeText, legendX + 15, legendY + 8);
      
      legendX += textWidth + 30;
    });
  }
  
  /**
   * Draw a "no data" message on a canvas
   */
  drawNoDataMessage(ctx, width, height) {
    ctx.fillStyle = this.options.colors.text;
    ctx.font = '14px Arial';
    ctx.fillText('No allocation data available', width/2 - 90, height/2);
  }
  
  /**
   * Handle canvas click events
   */
  handleCanvasClick(canvasName, event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Handle timeline click
    if (canvasName === 'timeline') {
      this.handleTimelineClick(x, y);
    }
    // Handle heap map click
    else if (canvasName === 'heapMap') {
      this.handleHeapMapClick(x, y);
    }
    // Handle bucket view click
    else if (canvasName === 'bucketView') {
      this.handleBucketViewClick(x, y);
    }
  }
  
  /**
   * Handle clicks on the timeline
   */
  handleTimelineClick(x, y) {
    // Check if we clicked on an event
    for (const event of this.analyzer.timeline) {
      const bounds = event.visualBounds;
      if (!bounds) continue;
      
      const { x: eventX, y: eventY, width: eventWidth, height: eventHeight } = bounds;
      
      if (x >= eventX - eventWidth/2 && x <= eventX + eventWidth/2 &&
          y >= eventY && y <= eventY + eventHeight) {
        
        if (event.type === "allocation" || event.type === "deallocation") {
          this.selectAllocation(event.allocation.id);
        } else if (event.type === "bug") {
          this.selectAllocation(event.sourceId);
        }
        
        break;
      }
    }
  }
  
  /**
   * Handle clicks on the heap map
   */
  handleHeapMapClick(x, y) {
    // Check if we clicked on an allocation
    for (const allocation of this.analyzer.allocations.values()) {
      const bounds = allocation.visualBounds;
      if (!bounds) continue;
      
      const { x: blockX, y: blockY, width: blockWidth, height: blockHeight } = bounds;
      
      if (x >= blockX && x <= blockX + blockWidth &&
          y >= blockY && y <= blockY + blockHeight) {
        
        this.selectAllocation(allocation.id);
        break;
      }
    }
  }
  
  /**
   * Handle clicks on the bucket view
   */
  handleBucketViewClick(x, y) {
    // TODO: Implement bucket view click handling
  }
  
  /**
   * Select an allocation for highlighting
   */
  selectAllocation(id) {
    this.selectedAllocationId = id;
    this.render();
    
    // Fire event for other components
    if (this.onAllocationSelected) {
      this.onAllocationSelected(id);
    }
  }
}

// Export the HeapVisualizer
export default HeapVisualizer;
