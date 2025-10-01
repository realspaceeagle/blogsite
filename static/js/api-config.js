// API Configuration
// This file manages API settings and initialization

class APIConfig {
  constructor() {
    this.config = {
      // NIST NVD API settings
      nvd: {
        baseURL: 'https://services.nvd.nist.gov/rest/json',
        apiKey: localStorage.getItem('nvd_api_key') || null,
        rateLimit: localStorage.getItem('nvd_api_key') ? 50 : 5, // Higher with API key
        enabled: true
      },
      
      // General settings
      updateInterval: 5 * 60 * 1000, // 5 minutes
      cacheTimeout: 30 * 60 * 1000,  // 30 minutes
      enableRealTimeUpdates: true,
      enableNotifications: false,
      
      // Fallback settings
      enableFallbackData: true,
      fallbackOnError: true
    };
  }

  // Set NVD API key
  setNVDApiKey(apiKey) {
    if (apiKey && apiKey.trim()) {
      localStorage.setItem('nvd_api_key', apiKey.trim());
      this.config.nvd.apiKey = apiKey.trim();
      this.config.nvd.rateLimit = 50; // Higher rate limit with API key
      return true;
    }
    return false;
  }

  // Remove API key
  removeNVDApiKey() {
    localStorage.removeItem('nvd_api_key');
    this.config.nvd.apiKey = null;
    this.config.nvd.rateLimit = 5; // Lower rate limit without API key
  }

  // Get current configuration
  getConfig() {
    return { ...this.config };
  }

  // Update configuration
  updateConfig(updates) {
    Object.assign(this.config, updates);
    this.saveConfig();
  }

  // Save configuration to localStorage
  saveConfig() {
    const configToSave = { ...this.config };
    delete configToSave.nvd.apiKey; // Don't save API key in general config
    localStorage.setItem('security_dashboard_config', JSON.stringify(configToSave));
  }

  // Load configuration from localStorage
  loadConfig() {
    try {
      const saved = localStorage.getItem('security_dashboard_config');
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        Object.assign(this.config, parsedConfig);
        // Restore API key separately
        this.config.nvd.apiKey = localStorage.getItem('nvd_api_key') || null;
        this.config.nvd.rateLimit = this.config.nvd.apiKey ? 50 : 5;
      }
    } catch (error) {
      console.warn('Failed to load saved configuration:', error);
    }
  }

  // Check if API key is configured
  hasNVDApiKey() {
    return Boolean(this.config.nvd.apiKey);
  }

  // Get API status information
  getAPIStatus() {
    return {
      nvd: {
        hasApiKey: this.hasNVDApiKey(),
        rateLimit: this.config.nvd.rateLimit,
        enabled: this.config.nvd.enabled
      },
      realTimeUpdates: this.config.enableRealTimeUpdates,
      updateInterval: this.config.updateInterval / 1000 + ' seconds'
    };
  }

  // Initialize configuration on page load
  init() {
    this.loadConfig();
    return this;
  }
}

// Create global instance
window.APIConfig = new APIConfig().init();

// Expose configuration panel toggle
window.toggleAPIConfig = function() {
  const panel = document.getElementById('api-config-panel');
  if (panel) {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  } else {
    createAPIConfigPanel();
  }
};

// Create API configuration panel
function createAPIConfigPanel() {
  const panelHTML = `
    <div id="api-config-panel" style="
      position: fixed;
      top: 20px;
      right: 20px;
      width: 350px;
      max-height: 80vh;
      background: var(--entry);
      border: 2px solid var(--border);
      border-radius: 10px;
      padding: 20px;
      z-index: 1000;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
      overflow-y: auto;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0; color: var(--primary);">API Configuration</h3>
        <button onclick="closeAPIConfig()" style="
          background: none;
          border: none;
          color: var(--secondary);
          font-size: 20px;
          cursor: pointer;
        ">×</button>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--primary); margin-bottom: 10px;">NIST NVD API Key</h4>
        <p style="color: var(--secondary); font-size: 12px; margin-bottom: 10px;">
          Optional: Get a free API key from <a href="https://nvd.nist.gov/developers/request-an-api-key" target="_blank" style="color: #00ff41;">nvd.nist.gov</a> 
          for higher rate limits (50 requests/30s vs 5 requests/30s)
        </p>
        <input type="text" id="nvd-api-key" placeholder="Enter your NVD API key..." style="
          width: 100%;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 5px;
          background: var(--theme);
          color: var(--primary);
          margin-bottom: 10px;
        ">
        <div style="display: flex; gap: 10px;">
          <button onclick="saveNVDApiKey()" style="
            background: #00ff41;
            color: #000;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
          ">Save</button>
          <button onclick="removeNVDApiKey()" style="
            background: #e03131;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
          ">Remove</button>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--primary); margin-bottom: 10px;">Current Status</h4>
        <div id="api-status" style="font-size: 12px; color: var(--secondary);">
          Loading status...
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h4 style="color: var(--primary); margin-bottom: 10px;">Settings</h4>
        <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--secondary);">
          <input type="checkbox" id="enable-real-time" checked>
          Enable Real-time Updates
        </label>
        <label style="display: flex; align-items: center; gap: 10px; color: var(--secondary);">
          <input type="checkbox" id="enable-fallback" checked>
          Enable Fallback Data
        </label>
      </div>

      <div style="text-align: center;">
        <button onclick="testAPIConnection()" style="
          background: var(--primary);
          color: var(--theme);
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          width: 100%;
        ">Test API Connection</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', panelHTML);
  updateAPIStatus();
  
  // Load current API key
  const currentKey = window.APIConfig.config.nvd.apiKey;
  if (currentKey) {
    document.getElementById('nvd-api-key').value = currentKey;
  }

  // Load current settings
  document.getElementById('enable-real-time').checked = window.APIConfig.config.enableRealTimeUpdates;
  document.getElementById('enable-fallback').checked = window.APIConfig.config.enableFallbackData;
}

window.closeAPIConfig = function() {
  const panel = document.getElementById('api-config-panel');
  if (panel) {
    panel.remove();
  }
};

window.saveNVDApiKey = function() {
  const input = document.getElementById('nvd-api-key');
  const apiKey = input.value.trim();
  
  if (window.APIConfig.setNVDApiKey(apiKey)) {
    alert('API key saved successfully!');
    updateAPIStatus();
  } else {
    alert('Please enter a valid API key.');
  }
};

window.removeNVDApiKey = function() {
  window.APIConfig.removeNVDApiKey();
  document.getElementById('nvd-api-key').value = '';
  alert('API key removed.');
  updateAPIStatus();
};

window.testAPIConnection = function() {
  const button = event.target;
  button.textContent = 'Testing...';
  button.disabled = true;
  
  // Test with a simple CVE API call
  const apiManager = new SecurityAPIManager();
  apiManager.getRecentCVEs(1)
    .then(data => {
      alert('API connection successful! ' + (data.length > 0 ? 'CVE data retrieved.' : 'No data returned.'));
    })
    .catch(error => {
      alert('API connection failed: ' + error.message);
    })
    .finally(() => {
      button.textContent = 'Test API Connection';
      button.disabled = false;
    });
};

function updateAPIStatus() {
  const statusDiv = document.getElementById('api-status');
  if (!statusDiv) return;
  
  const status = window.APIConfig.getAPIStatus();
  statusDiv.innerHTML = `
    <strong>NVD API:</strong> ${status.nvd.hasApiKey ? '✅ API Key Configured' : '⚠️ No API Key'}<br>
    <strong>Rate Limit:</strong> ${status.nvd.rateLimit} requests/30s<br>
    <strong>Real-time Updates:</strong> ${status.realTimeUpdates ? '✅ Enabled' : '❌ Disabled'}<br>
    <strong>Update Interval:</strong> ${status.updateInterval}
  `;
}

// Add settings toggle button to the page
document.addEventListener('DOMContentLoaded', function() {
  // Add a floating settings button
  const settingsButton = document.createElement('button');
  settingsButton.innerHTML = '⚙️';
  settingsButton.title = 'API Configuration';
  settingsButton.onclick = window.toggleAPIConfig;
  settingsButton.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: var(--primary);
    color: var(--theme);
    border: none;
    font-size: 20px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 999;
    transition: transform 0.2s ease;
  `;
  
  settingsButton.addEventListener('mouseenter', () => {
    settingsButton.style.transform = 'scale(1.1)';
  });
  
  settingsButton.addEventListener('mouseleave', () => {
    settingsButton.style.transform = 'scale(1)';
  });
  
  document.body.appendChild(settingsButton);
});