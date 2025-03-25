/**
 * User interface for the heap grooming toolkit
 * Provides the UI framework and main interaction components
 */

// Import utility for DOM manipulation
function $(selector) {
  return document.querySelector(selector);
}

class HeapToolkitUI {
  /**
   * Create a new heap toolkit UI
   * @param {Object} components - Component instances
   */
  constructor(components) {
    this.analyzer = components.analyzer;
    this.visualizer = components.visualizer;
    this.bugSimulator = components.bugSimulator;
    this.strategyGenerator = components.strategyGenerator;
    
    // UI state
    this.activeTab = 'visualize';
    this.selectedAllocationId = null;
    this.selectedBugId = null;
    
    // UI element references
    this.elements = {
      tabs: null,
      contentPanels: null,
      allocationsList: null,
      bucketsList: null,
      typesList: null,
      timelineControls: null,
      bugsList: null,
      strategyOutput: null
    };
    
    // Handler for allocation selection
    this.visualizer.onAllocationSelected = (id) => {
      this.selectedAllocationId = id;
      this.updateAllocationDetails(id);
      this.highlightAllocationInList(id);
    };
  }
  
  /**
   * Initialize the UI
   */
  initialize() {
    // Create main UI structure
    this.createUIStructure();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize tabs
    this.switchTab('visualize');
    
    // Initial UI update
    this.updateUI();
  }
  
  /**
   * Create the main UI structure
   */
  createUIStructure() {
    const container = document.createElement('div');
    container.className = 'heap-toolkit-container';
    
    // Create tabs
    const tabsHtml = `
      <div class="toolkit-tabs">
        <button class="tab-button active" data-tab="visualize">Visualize</button>
        <button class="tab-button" data-tab="analyze">Analyze</button>
        <button class="tab-button" data-tab="bugs">Simulate Bugs</button>
        <button class="tab-button" data-tab="strategy">Grooming Strategy</button>
        <button class="tab-button" data-tab="code">Generate Code</button>
      </div>
    `;
    
    // Create content panels
    const contentHtml = `
      <div class="toolkit-content">
        <!-- Visualization Tab -->
        <div class="content-panel active" id="visualize-panel">
          <div class="visualization-container">
            <div class="canvas-container">
              <h3>Memory Buckets</h3>
              <canvas id="bucket-view-canvas" width="800" height="300"></canvas>
            </div>
            <div class="canvas-container">
              <h3>Allocation Timeline</h3>
              <canvas id="timeline-canvas" width="800" height="150"></canvas>
              <div class="timeline-controls">
                <button id="play-timeline">Play</button>
                <button id="pause-timeline">Pause</button>
                <input type="range" id="timeline-slider" min="0" max="100" value="100">
                <span id="timeline-info">Current: 0/0</span>
              </div>
            </div>
            <div class="canvas-row">
              <div class="canvas-container half-width">
                <h3>Adjacency View</h3>
                <canvas id="adjacency-canvas" width="400" height="200"></canvas>
              </div>
              <div class="canvas-container half-width">
                <h3>Heap Map</h3>
                <canvas id="heap-map-canvas" width="400" height="200"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Analysis Tab -->
        <div class="content-panel" id="analyze-panel">
          <div class="analysis-container">
            <div class="sidebar">
              <div class="section">
                <h3>Allocations</h3>
                <div class="list-container" id="allocations-list"></div>
              </div>
              <div class="section">
                <h3>Buckets</h3>
                <div class="list-container" id="buckets-list"></div>
              </div>
              <div class="section">
                <h3>Types</h3>
                <div class="list-container" id="types-list"></div>
              </div>
            </div>
            <div class="main-content">
              <div class="section">
                <h3>Allocation Details</h3>
                <div id="allocation-details">
                  <p>Select an allocation to view details</p>
                </div>
              </div>
              <div class="section">
                <h3>Statistics</h3>
                <div id="statistics"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Bugs Tab -->
        <div class="content-panel" id="bugs-panel">
          <div class="bugs-container">
            <div class="sidebar">
              <div class="section">
                <h3>Active Bugs</h3>
                <div class="list-container" id="bugs-list"></div>
                <div class="controls">
                  <button id="add-overflow-bug">Add Buffer Overflow</button>
                  <button id="add-uaf-bug">Add Use-After-Free</button>
                  <button id="add-typeconf-bug">Add Type Confusion</button>
                </div>
              </div>
            </div>
            <div class="main-content">
              <div class="section">
                <h3>Bug Details</h3>
                <div id="bug-details">
                  <p>Select a bug to view details</p>
                </div>
              </div>
              <div class="section">
                <h3>Exploitability Assessment</h3>
                <div id="exploitability"></div>
              </div>
              <div class="section">
                <h3>Mitigation Suggestions</h3>
                <div id="mitigations"></div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Strategy Tab -->
        <div class="content-panel" id="strategy-panel">
          <div class="strategy-container">
            <div class="section">
              <h3>Grooming Strategy</h3>
              <div class="controls">
                <select id="strategy-bug-selector">
                  <option value="">Select a bug</option>
                </select>
                <button id="generate-strategy">Generate Strategy</button>
              </div>
            </div>
            <div class="section">
              <h3>Strategy Output</h3>
              <div id="strategy-output"></div>
            </div>
          </div>
        </div>
        
        <!-- Code Tab -->
        <div class="content-panel" id="code-panel">
          <div class="code-container">
            <div class="section">
              <h3>Generated JavaScript Code</h3>
              <div class="controls">
                <select id="code-template-selector">
                  <option value="spray">Heap Spray</option>
                  <option value="defrag">Heap Defragmentation</option>
                  <option value="exploit">Exploit Template</option>
                </select>
                <button id="generate-code">Generate Code</button>
                <button id="copy-code">Copy to Clipboard</button>
              </div>
            </div>
            <div class="section">
              <pre id="code-output">// Select a template and click Generate Code</pre>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    const stylesHtml = `
      <style>
        .heap-toolkit-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9f9f9;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        
        .toolkit-tabs {
          display: flex;
          border-bottom: 1px solid #ddd;
          margin-bottom: 20px;
        }
        
        .tab-button {
          padding: 10px 20px;
          background: #eee;
          border: none;
          cursor: pointer;
          margin-right: 5px;
          border-radius: 5px 5px 0 0;
        }
        
        .tab-button.active {
          background: #4CAF50;
          color: white;
        }
        
        .content-panel {
          display: none;
        }
        
        .content-panel.active {
          display: block;
        }
        
        .canvas-container {
          margin-bottom: 20px;
        }
        
        .canvas-row {
          display: flex;
          justify-content: space-between;
        }
        
        .half-width {
          width: 48%;
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #333;
        }
        
        .timeline-controls {
          margin-top: 10px;
          display: flex;
          align-items: center;
        }
        
        .timeline-controls button {
          margin-right: 10px;
          padding: 5px 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .timeline-controls input {
          flex-grow: 1;
          margin: 0 10px;
        }
        
        .analysis-container,
        .bugs-container {
          display: flex;
        }
        
        .sidebar {
          width: 250px;
          margin-right: 20px;
        }
        
        .main-content {
          flex-grow: 1;
        }
        
        .section {
          background: white;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 5px;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.05);
        }
        
        .list-container {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 3px;
        }
        
        .list-item {
          padding: 8px 10px;
          border-bottom: 1px solid #eee;
          cursor: pointer;
        }
        
        .list-item:hover {
          background-color: #f5f5f5;
        }
        
        .list-item.selected {
          background-color: #e0f2e0;
        }
        
        .controls {
          margin-top: 10px;
        }
        
        .controls button,
        .controls select {
          margin-right: 5px;
          margin-bottom: 5px;
          padding: 5px 10px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .controls select {
          background: white;
          color: #333;
          border: 1px solid #ddd;
        }
        
        pre {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 3px;
          overflow-x: auto;
          white-space: pre-wrap;
        }
        
        #allocation-details,
        #bug-details,
        #strategy-output,
        #statistics,
        #exploitability,
        #mitigations {
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 3px;
          min-height: 100px;
        }
        
        .severity-critical {
          color: #9c27b0;
          font-weight: bold;
        }
        
        .severity-high {
          color: #f44336;
          font-weight: bold;
        }
        
        .severity-medium {
          color: #ff9800;
        }
        
        .severity-low {
          color: #4caf50;
        }
      </style>
    `;
    
    container.innerHTML = stylesHtml + tabsHtml + contentHtml;
    document.body.appendChild(container);
    
    // Store UI element references
    this.elements.tabs = document.querySelectorAll('.tab-button');
    this.elements.contentPanels = document.querySelectorAll('.content-panel');
    this.elements.allocationsList = $('#allocations-list');
    this.elements.bucketsList = $('#buckets-list');
    this.elements.typesList = $('#types-list');
    this.elements.timelineControls = {
      play: $('#play-timeline'),
      pause: $('#pause-timeline'),
      slider: $('#timeline-slider'),
      info: $('#timeline-info')
    };
    this.elements.bugsList = $('#bugs-list');
    this.elements.strategyOutput = $('#strategy-output');
    
    // Initialize canvas elements for the visualizer
    this.visualizer.initialize({
      bucketView: $('#bucket-view-canvas'),
      timeline: $('#timeline-canvas'),
      adjacency: $('#adjacency-canvas'),
      heapMap: $('#heap-map-canvas')
    });
  }
  
  /**
   * Set up event listeners for UI elements
   */
  setupEventListeners() {
    // Tab switching
    this.elements.tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchTab(tab.dataset.tab);
      });
    });
    
    // Timeline controls
    this.elements.timelineControls.play.addEventListener('click', () => {
      // Play timeline animation
      console.log('Play timeline');
    });
    
    this.elements.timelineControls.pause.addEventListener('click', () => {
      // Pause timeline animation
      console.log('Pause timeline');
    });
    
    this.elements.timelineControls.slider.addEventListener('input', (e) => {
      // Update timeline position
      const value = parseInt(e.target.value);
      console.log('Timeline position:', value);
    });
    
    // Bug simulation buttons
    $('#add-overflow-bug').addEventListener('click', () => {
      this.showAddBugDialog('overflow');
    });
    
    $('#add-uaf-bug').addEventListener('click', () => {
      this.showAddBugDialog('uaf');
    });
    
    $('#add-typeconf-bug').addEventListener('click', () => {
      this.showAddBugDialog('typeconf');
    });
    
    // Strategy generation
    $('#generate-strategy').addEventListener('click', () => {
      const bugId = $('#strategy-bug-selector').value;
      if (bugId) {
        this.generateStrategy(parseInt(bugId));
      } else {
        alert('Please select a bug first');
      }
    });
    
    // Code generation
    $('#generate-code').addEventListener('click', () => {
      const template = $('#code-template-selector').value;
      this.generateCode(template);
    });
    
    $('#copy-code').addEventListener('click', () => {
      const code = $('#code-output').textContent;
      navigator.clipboard.writeText(code)
        .then(() => {
          alert('Code copied to clipboard');
        })
        .catch(err => {
          console.error('Error copying code:', err);
          alert('Failed to copy code');
        });
    });
  }
  
  /**
   * Switch to a different tab
   * @param {string} tabId - Tab ID to switch to
   */
  switchTab(tabId) {
    // Update active tab
    this.activeTab = tabId;
    
    // Update tab buttons
    this.elements.tabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    // Update content panels
    this.elements.contentPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === `${tabId}-panel`);
    });
    
    // Refresh content for the active tab
    this.updateTabContent(tabId);
  }
  
  /**
   * Update the content of the active tab
   * @param {string} tabId - Tab ID to update
   */
  updateTabContent(tabId) {
    switch (tabId) {
      case 'visualize':
        // Refresh visualizations
        this.visualizer.render();
        break;
        
      case 'analyze':
        // Update lists
        this.updateAllocationsList();
        this.updateBucketsList();
        this.updateTypesList();
        this.updateStatistics();
        break;
        
      case 'bugs':
        // Update bugs list
        this.updateBugsList();
        break;
        
      case 'strategy':
        // Update strategy bug selector
        this.updateStrategyBugSelector();
        break;
        
      case 'code':
        // No specific updates needed
        break;
    }
  }
  
  /**
   * Update the entire UI
   */
  updateUI() {
    // Update lists
    this.updateAllocationsList();
    this.updateBucketsList();
    this.updateTypesList();
    this.updateStatistics();
    this.updateBugsList();
    this.updateStrategyBugSelector();
    
    // Refresh visualizations
    this.visualizer.render();
  }
  
  /**
   * Update the allocations list
   */
  updateAllocationsList() {
    const list = this.elements.allocationsList;
    list.innerHTML = '';
    
    const allocations = Array.from(this.analyzer.allocations.values());
    
    if (allocations.length === 0) {
      list.innerHTML = '<div class="list-item">No allocations</div>';
      return;
    }
    
    // Sort by ID
    allocations.sort((a, b) => a.id - b.id);
    
    allocations.forEach(allocation => {
      const item = document.createElement('div');
      item.className = 'list-item';
      if (allocation.id === this.selectedAllocationId) {
        item.classList.add('selected');
      }
      
      item.textContent = `#${allocation.id}: ${allocation.type} (${allocation.size} bytes)`;
      item.dataset.id = allocation.id;
      
      item.addEventListener('click', () => {
        this.selectedAllocationId = allocation.id;
        this.visualizer.selectAllocation(allocation.id);
        this.updateAllocationDetails(allocation.id);
        this.highlightAllocationInList(allocation.id);
      });
      
      list.appendChild(item);
    });
  }
  
  /**
   * Update the buckets list
   */
  updateBucketsList() {
    const list = this.elements.bucketsList;
    list.innerHTML = '';
    
    const buckets = this.analyzer.getActiveBuckets();
    
    if (buckets.length === 0) {
      list.innerHTML = '<div class="list-item">No buckets</div>';
      return;
    }
    
    const bucketStats = this.analyzer.generateBucketStats();
    
    buckets.forEach(bucketSize => {
      const stats = bucketStats[bucketSize];
      
      const item = document.createElement('div');
      item.className = 'list-item';
      item.textContent = `${bucketSize} bytes (${stats.activeAllocations}/${stats.totalAllocations})`;
      
      item.addEventListener('click', () => {
        // Filter allocations list to show only this bucket
        this.filterAllocationsByBucket(bucketSize);
      });
      
      list.appendChild(item);
    });
  }
  
  /**
   * Update the types list
   */
  updateTypesList() {
    const list = this.elements.typesList;
    list.innerHTML = '';
    
    const typeStats = this.analyzer.generateTypeStats();
    const types = Object.keys(typeStats);
    
    if (types.length === 0) {
      list.innerHTML = '<div class="list-item">No types</div>';
      return;
    }
    
    // Sort by count (descending)
    types.sort((a, b) => typeStats[b].count - typeStats[a].count);
    
    types.forEach(type => {
      const stats = typeStats[type];
      
      const item = document.createElement('div');
      item.className = 'list-item';
      item.textContent = `${type} (${stats.active}/${stats.count})`;
      
      item.addEventListener('click', () => {
        // Filter allocations list to show only this type
        this.filterAllocationsByType(type);
      });
      
      list.appendChild(item);
    });
  }
  
  /**
   * Update the bugs list
   */
  updateBugsList() {
    const list = this.elements.bugsList;
    list.innerHTML = '';
    
    const bugs = this.bugSimulator.getActiveBugs();
    
    if (bugs.length === 0) {
      list.innerHTML = '<div class="list-item">No bugs simulated</div>';
      return;
    }
    
    bugs.forEach(bug => {
      const item = document.createElement('div');
      item.className = 'list-item';
      if (bug.id === this.selectedBugId) {
        item.classList.add('selected');
      }
      
      let severityClass = '';
      if (bug.impact && bug.impact.severity) {
        severityClass = `severity-${bug.impact.severity}`;
      }
      
      item.innerHTML = `
        <div>#${bug.id}: ${bug.type}</div>
        <div class="${severityClass}">Severity: ${bug.impact?.severity || 'unknown'}</div>
      `;
      item.dataset.id = bug.id;
      
      item.addEventListener('click', () => {
        this.selectedBugId = bug.id;
        this.updateBugDetails(bug.id);
        this.highlightBugInList(bug.id);
      });
      
      list.appendChild(item);
    });
  }
  
  /**
   * Update the strategy bug selector
   */
  updateStrategyBugSelector() {
    const selector = $('#strategy-bug-selector');
    
    // Save current selection
    const currentValue = selector.value;
    
    // Clear selector
    selector.innerHTML = '<option value="">Select a bug</option>';
    
    // Add bugs
    const bugs = this.bugSimulator.getActiveBugs();
    
    bugs.forEach(bug => {
      const option = document.createElement('option');
      option.value = bug.id;
      option.textContent = `#${bug.id}: ${bug.type}`;
      selector.appendChild(option);
    });
    
    // Restore selection if possible
    if (currentValue && Array.from(selector.options).some(opt => opt.value === currentValue)) {
      selector.value = currentValue;
    }
  }
  
  /**
   * Update allocation details
   * @param {number} id - Allocation ID
   */
  updateAllocationDetails(id) {
    const detailsElement = $('#allocation-details');
    
    if (!id || !this.analyzer.allocations.has(id)) {
      detailsElement.innerHTML = '<p>Select an allocation to view details</p>';
      return;
    }
    
    const allocation = this.analyzer.allocations.get(id);
    const adjacent = this.analyzer.findAdjacentAllocations(id);
    
    // Format timestamps
    const timestamp = new Date(allocation.timestamp).toLocaleTimeString();
    const freedTime = allocation.freedAt ? 
      new Date(allocation.freedAt).toLocaleTimeString() : 'N/A';
    
    // Calculate lifetime
    let lifetime = 'Still alive';
    if (allocation.status === 'freed' && allocation.freedAt) {
      const ms = allocation.freedAt - allocation.timestamp;
      lifetime = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
    }
    
    detailsElement.innerHTML = `
      <h4>Allocation #${allocation.id}</h4>
      <table>
        <tr>
          <td><strong>Type:</strong></td>
          <td>${allocation.type}</td>
        </tr>
        <tr>
          <td><strong>Size:</strong></td>
          <td>${allocation.size} bytes</td>
        </tr>
        <tr>
          <td><strong>Bucket:</strong></td>
          <td>${this.analyzer.findBucketForSize(allocation.size)} bytes</td>
        </tr>
        <tr>
          <td><strong>Status:</strong></td>
          <td>${allocation.status}</td>
        </tr>
        <tr>
          <td><strong>Allocated:</strong></td>
          <td>${timestamp}</td>
        </tr>
        <tr>
          <td><strong>Freed:</strong></td>
          <td>${freedTime}</td>
        </tr>
        <tr>
          <td><strong>Lifetime:</strong></td>
          <td>${lifetime}</td>
        </tr>
        <tr>
          <td><strong>Previous:</strong></td>
          <td>${adjacent.prev ? `#${adjacent.prev.id} (${adjacent.prev.type})` : 'None'}</td>
        </tr>
        <tr>
          <td><strong>Next:</strong></td>
          <td>${adjacent.next ? `#${adjacent.next.id} (${adjacent.next.type})` : 'None'}</td>
        </tr>
      </table>
      
      <div class="controls">
        <button id="simulate-overflow-btn">Simulate Overflow</button>
        <button id="simulate-uaf-btn" ${allocation.status === 'freed' ? '' : 'disabled'}>Simulate UAF</button>
      </div>
    `;
    
    // Add event listeners for the buttons
    $('#simulate-overflow-btn').addEventListener('click', () => {
      this.showSimulateOverflowDialog(id);
    });
    
    $('#simulate-uaf-btn').addEventListener('click', () => {
      if (allocation.status === 'freed') {
        const bug = this.bugSimulator.simulateUseAfterFree(id);
        this.updateBugsList();
        this.updateStrategyBugSelector();
        this.switchTab('bugs');
        this.selectedBugId = bug.id;
        this.updateBugDetails(bug.id);
        this.highlightBugInList(bug.id);
      }
    });
  }
  
  /**
   * Update bug details
   * @param {number} id - Bug ID
   */
  updateBugDetails(id) {
    const detailsElement = $('#bug-details');
    const exploitabilityElement = $('#exploitability');
    const mitigationsElement = $('#mitigations');
    
    if (!id || !this.bugSimulator.activeBugs.has(id)) {
      detailsElement.innerHTML = '<p>Select a bug to view details</p>';
      exploitabilityElement.innerHTML = '';
      mitigationsElement.innerHTML = '';
      return;
    }
    
    const bug = this.bugSimulator.activeBugs.get(id);
    const source = this.analyzer.allocations.get(bug.sourceId);
    
    // Format bug details based on type
    let bugSpecificDetails = '';
    
    switch (bug.type) {
      case 'overflow':
        bugSpecificDetails = `
          <tr>
            <td><strong>Overflow Size:</strong></td>
            <td>${bug.overflowSize} bytes</td>
          </tr>
          <tr>
            <td><strong>Corrupted Object:</strong></td>
            <td>${bug.impact.corruptedAllocation ? 
              `#${bug.impact.corruptedAllocation.id} (${bug.impact.corruptedAllocation.type})` : 
              'None identified'}
            </td>
          </tr>
        `;
        break;
        
      case 'use-after-free':
        bugSpecificDetails = `
          <tr>
            <td><strong>Reusing Object:</strong></td>
            <td>${bug.impact.reusingAllocation ? 
              `#${bug.impact.reusingAllocation.id} (${bug.impact.reusingAllocation.type})` : 
              'None identified yet'}
            </td>
          </tr>
        `;
        break;
        
      case 'type-confusion':
        bugSpecificDetails = `
          <tr>
            <td><strong>Original Type:</strong></td>
            <td>${bug.impact.originalType || source.type}</td>
          </tr>
          <tr>
            <td><strong>Confused Type:</strong></td>
            <td>${bug.wrongType || bug.impact.confusedType || 'Unknown'}</td>
          </tr>
        `;
        break;
    }
    
    detailsElement.innerHTML = `
      <h4>Bug #${bug.id}: ${bug.type}</h4>
      <table>
        <tr>
          <td><strong>Source Object:</strong></td>
          <td>#${source.id} (${source.type})</td>
        </tr>
        <tr>
          <td><strong>Object Size:</strong></td>
          <td>${source.size} bytes</td>
        </tr>
        <tr>
          <td><strong>Bucket:</strong></td>
          <td>${this.analyzer.findBucketForSize(source.size)} bytes</td>
        </tr>
        <tr>
          <td><strong>Severity:</strong></td>
          <td class="severity-${bug.impact.severity || 'medium'}">${bug.impact.severity || 'Medium'}</td>
        </tr>
        ${bugSpecificDetails}
        <tr>
          <td><strong>Notes:</strong></td>
          <td>${bug.impact.notes || 'None'}</td>
        </tr>
      </table>
      
      <div class="controls">
        <button id="generate-strategy-for-bug">Generate Strategy</button>
        <button id="remove-bug">Remove Bug</button>
      </div>
    `;
    
    // Generate exploitability assessment
    const assessment = this.bugSimulator.assessExploitability(id);
    
    exploitabilityElement.innerHTML = `
      <h4>Exploitability: <span class="severity-${assessment.overall}">${assessment.overall}</span></h4>
      
      <h5>Exploitation Factors:</h5>
      <ul>
        ${assessment.factors.map(factor => `<li>${factor}</li>`).join('')}
      </ul>
      
      <h5>Exploitation Difficulties:</h5>
      <ul>
        ${assessment.difficulties.map(diff => `<li>${diff}</li>`).join('')}
      </ul>
      
      <p>Overall exploitation score: ${assessment.score}/100</p>
    `;
    
    // Generate mitigation suggestions
    const mitigations = this.bugSimulator.generateMitigations(id);
    
    mitigationsElement.innerHTML = `
      <h4>Suggested Mitigations:</h4>
      <ul>
        ${mitigations.map(m => `
          <li>
            <strong>${m.title}</strong>
            <p>${m.description}</p>
          </li>
        `).join('')}
      </ul>
    `;
    
    // Add event listeners for the buttons
    $('#generate-strategy-for-bug').addEventListener('click', () => {
      this.switchTab('strategy');
      $('#strategy-bug-selector').value = id;
      this.generateStrategy(id);
    });
    
    $('#remove-bug').addEventListener('click', () => {
      this.bugSimulator.removeBug(id);
      this.selectedBugId = null;
      this.updateBugsList();
      this.updateStrategyBugSelector();
      this.updateBugDetails(null);
    });
  }
  
  /**
   * Update statistics display
   */
  updateStatistics() {
    const statsElement = $('#statistics');
    
    const stats = this.analyzer.stats;
    const bucketStats = this.analyzer.generateBucketStats();
    const typeStats = this.analyzer.generateTypeStats();
    
    // Calculate total memory usage
    let totalMemory = 0;
    let activeMemory = 0;
    
    for (const allocation of this.analyzer.allocations.values()) {
      totalMemory += allocation.size;
      if (allocation.status === 'allocated') {
        activeMemory += allocation.size;
      }
    }
    
    // Format memory sizes
    const formatMemory = (bytes) => {
      if (bytes < 1024) return `${bytes} bytes`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };
    
    statsElement.innerHTML = `
      <h4>Overall Statistics</h4>
      <table>
        <tr>
          <td><strong>Total Allocations:</strong></td>
          <td>${stats.totalAllocations}</td>
        </tr>
        <tr>
          <td><strong>Active Allocations:</strong></td>
          <td>${stats.currentLiveAllocations}</td>
        </tr>
        <tr>
          <td><strong>Total Deallocations:</strong></td>
          <td>${stats.totalDeallocations}</td>
        </tr>
        <tr>
          <td><strong>Peak Live Allocations:</strong></td>
          <td>${stats.maxLiveAllocations}</td>
        </tr>
        <tr>
          <td><strong>Total Memory Allocated:</strong></td>
          <td>${formatMemory(totalMemory)}</td>
        </tr>
        <tr>
          <td><strong>Active Memory:</strong></td>
          <td>${formatMemory(activeMemory)}</td>
        </tr>
      </table>
      
      <h4>Most Common Types</h4>
      <ul>
        ${Object.entries(typeStats)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 5)
          .map(([type, stats]) => `
            <li>${type}: ${stats.count} allocations (${formatMemory(stats.totalSize)})</li>
          `)
          .join('')}
      </ul>
      
      <h4>Most Used Buckets</h4>
      <ul>
        ${Object.entries(bucketStats)
          .sort((a, b) => b[1].totalAllocations - a[1].totalAllocations)
          .slice(0, 5)
          .map(([size, stats]) => `
            <li>${size} bytes: ${stats.totalAllocations} allocations (${stats.activeAllocations} active)</li>
          `)
          .join('')}
      </ul>
    `;
  }
  
  /**
   * Filter allocations list by bucket
   * @param {number} bucketSize - Bucket size to filter by
   */
  filterAllocationsByBucket(bucketSize) {
    const list = this.elements.allocationsList;
    list.innerHTML = '';
    
    const allocations = this.analyzer.getAllocationsInBucket(bucketSize);
    
    if (allocations.length === 0) {
      list.innerHTML = '<div class="list-item">No allocations in this bucket</div>';
      return;
    }
    
    // Sort by ID
    allocations.sort((a, b) => a.id - b.id);
    
    allocations.forEach(allocation => {
      const item = document.createElement('div');
      item.className = 'list-item';
      if (allocation.id === this.selectedAllocationId) {
        item.classList.add('selected');
      }
      
      item.textContent = `#${allocation.id}: ${allocation.type} (${allocation.size} bytes)`;
      item.dataset.id = allocation.id;
      
      item.addEventListener('click', () => {
        this.selectedAllocationId = allocation.id;
        this.visualizer.selectAllocation(allocation.id);
        this.updateAllocationDetails(allocation.id);
        this.highlightAllocationInList(allocation.id);
      });
      
      list.appendChild(item);
    });
  }
  
  /**
   * Filter allocations list by type
   * @param {string} type - Object type to filter by
   */
  filterAllocationsByType(type) {
    const list = this.elements.allocationsList;
    list.innerHTML = '';
    
    const allocations = Array.from(this.analyzer.allocations.values())
      .filter(alloc => alloc.type === type);
    
    if (allocations.length === 0) {
      list.innerHTML = '<div class="list-item">No allocations of this type</div>';
      return;
    }
    
    // Sort by ID
    allocations.sort((a, b) => a.id - b.id);
    
    allocations.forEach(allocation => {
      const item = document.createElement('div');
      item.className = 'list-item';
      if (allocation.id === this.selectedAllocationId) {
        item.classList.add('selected');
      }
      
      item.textContent = `#${allocation.id}: ${allocation.type} (${allocation.size} bytes)`;
      item.dataset.id = allocation.id;
      
      item.addEventListener('click', () => {
        this.selectedAllocationId = allocation.id;
        this.visualizer.selectAllocation(allocation.id);
        this.updateAllocationDetails(allocation.id);
        this.highlightAllocationInList(allocation.id);
      });
      
      list.appendChild(item);
    });
  }
  
  /**
   * Highlight the selected allocation in the list
   * @param {number} id - Allocation ID
   */
  highlightAllocationInList(id) {
    const items = this.elements.allocationsList.querySelectorAll('.list-item');
    
    items.forEach(item => {
      item.classList.toggle('selected', parseInt(item.dataset.id) === id);
    });
  }
  
  /**
   * Highlight the selected bug in the list
   * @param {number} id - Bug ID
   */
  highlightBugInList(id) {
    const items = this.elements.bugsList.querySelectorAll('.list-item');
    
    items.forEach(item => {
      item.classList.toggle('selected', parseInt(item.dataset.id) === id);
    });
  }
  
  /**
   * Show dialog for adding a bug
   * @param {string} bugType - Type of bug to add
   */
  showAddBugDialog(bugType) {
    // Create a simple modal dialog
    const modal = document.createElement('div');
    modal.className = 'bug-dialog-modal';
    
    let title, content;
    
    switch (bugType) {
      case 'overflow':
        title = 'Add Buffer Overflow Bug';
        content = `
          <div class="form-group">
            <label for="source-alloc">Source Allocation:</label>
            <select id="source-alloc">
              ${Array.from(this.analyzer.allocations.values())
                .filter(a => a.status === 'allocated')
                .map(a => `<option value="${a.id}">#${a.id}: ${a.type} (${a.size} bytes)</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="overflow-size">Overflow Size (bytes):</label>
            <input type="number" id="overflow-size" value="8" min="1" max="1024">
          </div>
        `;
        break;
        
      case 'uaf':
        title = 'Add Use-After-Free Bug';
        content = `
          <div class="form-group">
            <label for="freed-alloc">Freed Allocation:</label>
            <select id="freed-alloc">
              ${Array.from(this.analyzer.allocations.values())
                .filter(a => a.status === 'freed')
                .map(a => `<option value="${a.id}">#${a.id}: ${a.type} (${a.size} bytes)</option>`)
                .join('')}
            </select>
          </div>
        `;
        break;
        
      case 'typeconf':
        title = 'Add Type Confusion Bug';
        content = `
          <div class="form-group">
            <label for="source-alloc">Source Allocation:</label>
            <select id="source-alloc">
              ${Array.from(this.analyzer.allocations.values())
                .filter(a => a.status === 'allocated')
                .map(a => `<option value="${a.id}">#${a.id}: ${a.type} (${a.size} bytes)</option>`)
                .join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="wrong-type">Wrong Type:</label>
            <select id="wrong-type">
              ${Array.from(new Set(Array.from(this.analyzer.allocations.values()).map(a => a.type)))
                .map(type => `<option value="${type}">${type}</option>`)
                .join('')}
            </select>
          </div>
        `;
        break;
        
      default:
        return;
    }
    
    modal.innerHTML = `
      <style>
        .bug-dialog-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .bug-dialog {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          width: 400px;
        }
        
        .bug-dialog h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        
        .form-group select,
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
        }
        
        .button-group {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .button-group button {
          padding: 8px 15px;
          margin-left: 10px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .button-group .cancel {
          background-color: #f5f5f5;
        }
        
        .button-group .add {
          background-color: #4CAF50;
          color: white;
        }
      </style>
      
      <div class="bug-dialog">
        <h3>${title}</h3>
        <div class="bug-form">
          ${content}
        </div>
        <div class="button-group">
          <button class="cancel">Cancel</button>
          <button class="add">Add Bug</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.add').addEventListener('click', () => {
      let bug;
      
      switch (bugType) {
        case 'overflow':
          const sourceId = parseInt(modal.querySelector('#source-alloc').value);
          const overflowSize = parseInt(modal.querySelector('#overflow-size').value);
          bug = this.bugSimulator.simulateOverflow(sourceId, overflowSize);
          break;
          
        case 'uaf':
          const freedId = parseInt(modal.querySelector('#freed-alloc').value);
          bug = this.bugSimulator.simulateUseAfterFree(freedId);
          break;
          
        case 'typeconf':
          const confSourceId = parseInt(modal.querySelector('#source-alloc').value);
          const wrongType = modal.querySelector('#wrong-type').value;
          bug = this.bugSimulator.simulateTypeConfusion(confSourceId, wrongType);
          break;
      }
      
      document.body.removeChild(modal);
      
      // Update UI
      this.updateBugsList();
      this.updateStrategyBugSelector();
      
      // Switch to bugs tab and select the new bug
      this.switchTab('bugs');
      this.selectedBugId = bug.id;
      this.updateBugDetails(bug.id);
      this.highlightBugInList(bug.id);
    });
  }
  
  /**
   * Show dialog for simulating overflow
   * @param {number} sourceId - Source allocation ID
   */
  showSimulateOverflowDialog(sourceId) {
    // Create a simple modal dialog
    const modal = document.createElement('div');
    modal.className = 'bug-dialog-modal';
    
    const source = this.analyzer.allocations.get(sourceId);
    
    modal.innerHTML = `
      <style>
        .bug-dialog-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .bug-dialog {
          background-color: white;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
          width: 400px;
        }
        
        .bug-dialog h3 {
          margin-top: 0;
          margin-bottom: 15px;
        }
        
        .form-group {
          margin-bottom: 15px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 5px;
        }
        
        .form-group select,
        .form-group input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
        }
        
        .button-group {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .button-group button {
          padding: 8px 15px;
          margin-left: 10px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
        }
        
        .button-group .cancel {
          background-color: #f5f5f5;
        }
        
        .button-group .add {
          background-color: #4CAF50;
          color: white;
        }
      </style>
      
      <div class="bug-dialog">
        <h3>Simulate Buffer Overflow</h3>
        <div class="bug-form">
          <div class="form-group">
            <label>Source Allocation:</label>
            <div>#${source.id}: ${source.type} (${source.size} bytes)</div>
          </div>
          <div class="form-group">
            <label for="overflow-size">Overflow Size (bytes):</label>
            <input type="number" id="overflow-size" value="8" min="1" max="1024">
          </div>
        </div>
        <div class="button-group">
          <button class="cancel">Cancel</button>
          <button class="add">Add Bug</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    modal.querySelector('.cancel').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('.add').addEventListener('click', () => {
      const overflowSize = parseInt(modal.querySelector('#overflow-size').value);
      const bug = this.bugSimulator.simulateOverflow(sourceId, overflowSize);
      
      document.body.removeChild(modal);
      
      // Update UI
      this.updateBugsList();
      this.updateStrategyBugSelector();
      
      // Switch to bugs tab and select the new bug
      this.switchTab('bugs');
      this.selectedBugId = bug.id;
      this.updateBugDetails(bug.id);
      this.highlightBugInList(bug.id);
    });
  }
  
  /**
   * Generate a grooming strategy for a bug
   * @param {number} bugId - Bug ID
   */
  generateStrategy(bugId) {
    const outputElement = this.elements.strategyOutput;
    
    if (!bugId || !this.bugSimulator.activeBugs.has(bugId)) {
      outputElement.innerHTML = '<p>No bug selected</p>';
      return;
    }
    
    const strategy = this.strategyGenerator.generateStrategyForBug(bugId);
    
    if (strategy.error) {
      outputElement.innerHTML = `<p>Error: ${strategy.error}</p>`;
      return;
    }
    
    let phasesHtml = '';
    
    if (strategy.phases) {
      phasesHtml = `
        <h4>Exploitation Phases:</h4>
        <ol>
          ${strategy.phases.map(phase => `
            <li>
              <h5>${phase.type}: ${phase.description}</h5>
              ${phase.code ? `<pre>${phase.code}</pre>` : ''}
            </li>
          `).join('')}
        </ol>
      `;
    }
    
    outputElement.innerHTML = `
      <h3>${strategy.name}</h3>
      <p>${strategy.description}</p>
      
      <h4>Target Information:</h4>
      <table>
        <tr>
          <td><strong>Bug Type:</strong></td>
          <td>${strategy.targetBug.type}</td>
        </tr>
        <tr>
          <td><strong>Target Bucket:</strong></td>
          <td>${strategy.targetBucket || 'Various'} bytes</td>
        </tr>
        <tr>
          <td><strong>Approach:</strong></td>
          <td>${strategy.approach || 'Generic'}</td>
        </tr>
        <tr>
          <td><strong>Target Objects:</strong></td>
          <td>${strategy.targetObjects ? strategy.targetObjects.join(', ') : 'Various'}</td>
        </tr>
      </table>
      
      ${phasesHtml}
      
      <div class="controls">
        <button id="generate-code-from-strategy">Generate Exploit Code</button>
      </div>
    `;
    
    // Add event listener for the button
    $('#generate-code-from-strategy').addEventListener('click', () => {
      this.switchTab('code');
      $('#code-template-selector').value = 'exploit';
      this.generateCode('exploit', bugId);
    });
  }
  
  /**
   * Generate code based on a template
   * @param {string} template - Template name
   * @param {number} bugId - Optional bug ID for exploit templates
   */
  generateCode(template, bugId = null) {
    const codeOutput = $('#code-output');
    
    switch (template) {
      case 'spray':
        codeOutput.textContent = this.generateSprayCode();
        break;
        
      case 'defrag':
        codeOutput.textContent = this.generateDefragCode();
        break;
        
      case 'exploit':
        if (bugId === null) {
          // Get the first bug if none specified
          const bugs = this.bugSimulator.getActiveBugs();
          if (bugs.length > 0) {
            bugId = bugs[0].id;
          } else {
            codeOutput.textContent = '// No bugs available to generate exploit code';
            return;
          }
        }
        
        codeOutput.textContent = this.generateExploitCode(bugId);
        break;
        
      default:
        codeOutput.textContent = '// Unknown template';
    }
  }
  
  /**
   * Generate heap spray code
   * @returns {string} Generated code
   */
  generateSprayCode() {
    return `/**
 * Heap Spray Utility
 * Generated by Heap Grooming Toolkit
 */

// Configuration
const config = {
  spraySize: 1024 * 1024 * 10,  // 10 MB total spray
  chunkSize: 0x10000,           // 64 KB per chunk
  fillByte: 0x41,               // 'A'
  shellcodeOffset: 0x8,         // Offset for shellcode in each chunk
  nopsled: true,                // Include NOP sled
  shellcodeBytes: [             // Example shellcode (just prints 'x')
    0x48, 0xb8, 0x78, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0, 0x0,   // mov rax, 'x'
    0x48, 0x89, 0x44, 0x24, 0x8                            // mov [rsp+8], rax
  ]
};

// Spray the heap
function sprayHeap() {
  console.log(\`Spraying the heap with \${config.spraySize / (1024 * 1024)}MB of data...\`);
  
  // Calculate number of chunks
  const numChunks = Math.floor(config.spraySize / config.chunkSize);
  console.log(\`Creating \${numChunks} chunks of size \${config.chunkSize / 1024}KB\`);
  
  // Create a template chunk with shellcode
  const templateChunk = createChunkWithShellcode();
  
  // Spray the heap by creating many ArrayBuffers
  const buffers = [];
  for (let i = 0; i < numChunks; i++) {
    const buffer = new ArrayBuffer(config.chunkSize);
    const view = new Uint8Array(buffer);
    
    // Copy template into the buffer
    view.set(templateChunk);
    
    // Push to array to keep reference
    buffers.push(buffer);
    
    // Print progress
    if (i % 100 === 0) {
      console.log(\`Sprayed \${i} chunks...\`);
    }
  }
  
  console.log(\`Finished spraying \${buffers.length} chunks\`);
  return buffers;
}

// Create a chunk with embedded shellcode
function createChunkWithShellcode() {
  const chunk = new Uint8Array(config.chunkSize);
  
  // Fill with default byte
  chunk.fill(config.fillByte);
  
  // Add NOP sled if requested
  if (config.nopsled) {
    const nopValue = 0x90; // x86 NOP instruction
    for (let i = 0; i < 0x100; i++) {
      chunk[config.shellcodeOffset + i] = nopValue;
    }
  }
  
  // Add shellcode
  for (let i = 0; i < config.shellcodeBytes.length; i++) {
    chunk[config.shellcodeOffset + (config.nopsled ? 0x100 : 0) + i] = config.shellcodeBytes[i];
  }
  
  return chunk;
}

// Allocate in different size classes
function sprayVariousSizes() {
  const buffers = {};
  
  const sizeClasses = [
    32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384
  ];
  
  for (const size of sizeClasses) {
    buffers[size] = [];
    const count = Math.floor(1024 * 1024 / size); // Allocate about 1MB per size class
    
    console.log(\`Spraying \${count} objects of size \${size}\`);
    
    for (let i = 0; i < count; i++) {
      const buffer = new ArrayBuffer(size);
      const view = new Uint8Array(buffer);
      
      // Fill with recognizable pattern
      for (let j = 0; j < size; j++) {
        view[j] = (j % 256) ^ (size & 0xff);
      }
      
      buffers[size].push(buffer);
    }
  }
  
  return buffers;
}

// Export functions
window.sprayHeap = sprayHeap;
window.sprayVariousSizes = sprayVariousSizes;

// Run spray (comment out if you want to control execution)
const sprayedBuffers = sprayHeap();
console.log('Heap spray complete');`;
  }
  
  /**
   * Generate heap defragmentation code
   * @returns {string} Generated code
   */
  generateDefragCode() {
    return `/**
 * Heap Defragmentation Utility
 * Generated by Heap Grooming Toolkit
 */

// Configuration
const config = {
  defragCycles: 5,    // Number of defrag cycles
  gcPressure: 10,     // MB of memory pressure to force GC
  allocSizes: [       // Sizes to allocate in each cycle
    32, 64, 128, 256, 512, 1024, 2048, 4096
  ],
  allocPerSize: 1000  // Allocations per size
};

// Utility to force garbage collection
function forceGC() {
  console.log('Forcing garbage collection...');
  
  // Create memory pressure
  const pressure = [];
  for (let i = 0; i < config.gcPressure; i++) {
    pressure.push(new Uint8Array(1024 * 1024));
  }
  
  // Clear pressure
  pressure.length = 0;
  
  // Try explicit GC if available
  if (window.gc) {
    window.gc();
  }
}

// Run a defragmentation cycle
function defragCycle() {
  console.log('Running defragmentation cycle...');
  
  // Allocate objects of various sizes
  const allocations = [];
  
  for (const size of config.allocSizes) {
    console.log(\`Allocating \${config.allocPerSize} objects of size \${size}\`);
    
    for (let i = 0; i < config.allocPerSize; i++) {
      allocations.push(new ArrayBuffer(size));
    }
  }
  
  // Force GC to clean up unreferenced objects
  forceGC();
  
  // Clear allocations (but keep some to prevent full cleanup)
  const keepEvery = 10;
  const kept = [];
  
  for (let i = 0; i < allocations.length; i++) {
    if (i % keepEvery === 0) {
      kept.push(allocations[i]);
    }
  }
  
  allocations.length = 0;
  
  console.log(\`Kept \${kept.length} allocations for stability\`);
  return kept;
}

// Run a defragmentation algorithm to consolidate free space
function defragmentHeap() {
  console.log(\`Starting heap defragmentation with \${config.defragCycles} cycles...\`);
  
  const keptAllocations = [];
  
  // Run multiple cycles
  for (let i = 0; i < config.defragCycles; i++) {
    console.log(\`Defrag cycle \${i + 1}/${config.defragCycles}\`);
    const kept = defragCycle();
    keptAllocations.push(kept);
    
    // Pause to allow GC to run
    const start = Date.now();
    while (Date.now() - start < 100) {
      // Busy wait to ensure separate GC cycles
    }
  }
  
  console.log('Defragmentation complete');
  
  // Final GC to consolidate free space
  forceGC();
  
  return keptAllocations;
}

// Clean up most allocations in specific size range
function cleanupBucket(size, threshold = 0.9) {
  console.log(\`Cleaning up bucket size \${size} bytes (threshold: \${threshold * 100}%)\`);
  
  // Allocate many objects of target size
  const allocations = [];
  const count = 1000;
  
  for (let i = 0; i < count; i++) {
    allocations.push(new ArrayBuffer(size));
  }
  
  // Keep only a fraction
  const keepCount = Math.floor(count * (1 - threshold));
  const kept = allocations.slice(0, keepCount);
  
  // Allow others to be garbage collected
  allocations.length = 0;
  
  // Force GC
  forceGC();
  
  console.log(\`Kept \${kept.length} allocations of size \${size}\`);
  return kept;
}

// Export functions
window.defragmentHeap = defragmentHeap;
window.cleanupBucket = cleanupBucket;
window.forceGC = forceGC;

// Run defragmentation (comment out if you want to control execution)
const keptRefs = defragmentHeap();
console.log('Heap defragmentation complete');`;
  }
  
  /**
   * Generate exploit code for a bug
   * @param {number} bugId - Bug ID
   * @returns {string} Generated code
   */
  generateExploitCode(bugId) {
    if (!bugId || !this.bugSimulator.activeBugs.has(bugId)) {
      return '// No bug selected or bug not found';
    }
    
    return this.strategyGenerator.generateExploitTemplate(this.bugSimulator.activeBugs.get(bugId));
  }
}

// Export the HeapToolkitUI
export default HeapToolkitUI;
