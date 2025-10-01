// Enhanced GitHub Integration JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('GitHub integration script loaded');
  
  // Initialize contribution tracker
  let contributionTracker = null;
  
  // Initialize GitHub Calendar when the page loads
  function initializeGitHubCalendar() {
    console.log('Initializing GitHub calendar...');
    
    // Check if we're on the projects page and GitHub section exists
    const githubSection = document.getElementById('github-section');
    const calendarElement = document.querySelector('.calendar');
    
    if (!githubSection || !calendarElement) {
      console.log('GitHub section or calendar element not found');
      return;
    }
    
    console.log('GitHub section and calendar element found');
    
    // Initialize custom contribution tracker
    if (window.GitHubContributionTracker) {
      contributionTracker = new window.GitHubContributionTracker('realspaceeagle');
      
      // Load and display contributions
      contributionTracker.fetchContributions().then(data => {
        if (data) {
          contributionTracker.renderContributionGraph(calendarElement, data);
          console.log('Contribution graph rendered successfully');
          
          // Update stats with the data
          updateContributionStats(data);
        }
      }).catch(error => {
        console.error('Failed to load contribution data:', error);
        showCustomContributionGraph();
      });
    } else {
      console.log('GitHubContributionTracker not available, using fallback');
      showCustomContributionGraph();
    }
  }
  
  function updateContributionStats(data) {
    try {
      // Update total contributions
      if (data.total && data.total.lastYear !== undefined) {
        document.getElementById('total-contributions').textContent = data.total.lastYear.toLocaleString();
      }
      
      // Calculate and update streaks
      if (data.contributions && Array.isArray(data.contributions)) {
        const tracker = new window.GitHubContributionTracker('realspaceeagle');
        const streaks = tracker.calculateStreaks(data.contributions);
        
        document.getElementById('current-streak').textContent = streaks.currentStreak + ' days';
        document.getElementById('longest-streak').textContent = streaks.longestStreak + ' days';
        
        console.log('Stats updated from contribution data');
      }
    } catch (error) {
      console.error('Error updating contribution stats:', error);
      setFallbackStats();
    }
  }
  
  function updateGitHubStats() {
    try {
      // Try to extract contribution count from the generated calendar
      const contributionCells = document.querySelectorAll('.calendar .js-calendar-graph-svg rect[data-count]');
      console.log(`Found ${contributionCells.length} contribution cells`);
      
      if (contributionCells.length > 0) {
        let totalContributions = 0;
        contributionCells.forEach(cell => {
          const count = parseInt(cell.getAttribute('data-count')) || 0;
          totalContributions += count;
        });
        
        console.log(`Total contributions calculated: ${totalContributions}`);
        document.getElementById('total-contributions').textContent = totalContributions.toLocaleString();
        
        // Calculate streaks (simplified)
        calculateStreaks(contributionCells);
      } else {
        console.log('No contribution cells found, using fallback stats');
        setFallbackStats();
      }
    } catch (error) {
      console.error('Error updating GitHub stats:', error);
      setFallbackStats();
    }
  }
  
  function calculateStreaks(cells) {
    try {
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      
      // Simple streak calculation from recent contributions
      const recentCells = Array.from(cells).slice(-365); // Last year
      
      for (let i = recentCells.length - 1; i >= 0; i--) {
        const count = parseInt(recentCells[i].getAttribute('data-count')) || 0;
        if (count > 0) {
          tempStreak++;
          if (i === recentCells.length - 1) {
            currentStreak = tempStreak;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      
      document.getElementById('current-streak').textContent = currentStreak + ' days';
      document.getElementById('longest-streak').textContent = longestStreak + ' days';
      
      console.log(`Streaks calculated - Current: ${currentStreak}, Longest: ${longestStreak}`);
    } catch (error) {
      console.error('Error calculating streaks:', error);
      document.getElementById('current-streak').textContent = 'View on GitHub';
      document.getElementById('longest-streak').textContent = 'View on GitHub';
    }
  }
  
  function setFallbackStats() {
    const totalContribElement = document.getElementById('total-contributions');
    const currentStreakElement = document.getElementById('current-streak');
    const longestStreakElement = document.getElementById('longest-streak');

    if (totalContribElement) {
      const existing = totalContribElement.textContent.trim();
      if (!existing || existing === '-') {
        totalContribElement.textContent = 'N/A';
      }
    }

    if (currentStreakElement) {
      const existing = currentStreakElement.textContent.trim();
      if (!existing || existing === '-') {
        currentStreakElement.textContent = 'N/A';
      }
    }

    if (longestStreakElement) {
      const existing = longestStreakElement.textContent.trim();
      if (!existing || existing === '-') {
        longestStreakElement.textContent = 'N/A';
      }
    }
  }
  
  async function refreshGitHubData() {
    console.log('Refreshing all GitHub data...');
    
    try {
      // Refresh contribution data if tracker is available
      if (contributionTracker) {
        const contributionData = await contributionTracker.forceRefresh();
        const calendarElement = document.querySelector('.calendar');
        
        if (calendarElement) {
          contributionTracker.renderContributionGraph(calendarElement, contributionData);
          
          // Update stats
          const streaks = contributionTracker.calculateStreaks(contributionData.contributions);
          const totalContribElement = document.getElementById('total-contributions');
          const currentStreakElement = document.getElementById('current-streak');
          const longestStreakElement = document.getElementById('longest-streak');
          
          if (totalContribElement) totalContribElement.textContent = contributionData.total.lastYear.toLocaleString();
          if (currentStreakElement) currentStreakElement.textContent = streaks.currentStreak;
          if (longestStreakElement) longestStreakElement.textContent = streaks.longestStreak;
        }
      }
      
      // Also refresh basic profile data
      if (typeof window.fetchGitHubStats === 'function') {
        await window.fetchGitHubStats();
      }
      
      console.log('GitHub data refresh completed');
      
    } catch (error) {
      console.error('Error refreshing GitHub data:', error);
      throw error;
    }
  }
  
  function addRefreshButton() {
    const githubSection = document.getElementById('github-section');
    if (!githubSection) return;
    
    // Check if refresh button already exists
    if (document.getElementById('github-refresh-btn')) return;
    
    const refreshButton = document.createElement('button');
    refreshButton.id = 'github-refresh-btn';
    refreshButton.innerHTML = 'Refresh GitHub Stats';
    refreshButton.style.cssText = `
      margin-bottom: 1rem;
      padding: 0.5rem 1rem;
      background: var(--toggle-highlight, #0d6efd);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: opacity 0.2s;
    `;
    
    refreshButton.addEventListener('click', function(e) {
      e.preventDefault(); // Prevent any default behavior
      e.stopPropagation(); // Stop event bubbling
      
      refreshButton.innerHTML = 'Refreshing...';
      refreshButton.disabled = true;
      
      // Ensure we stay on the GitHub tab
      if (!window.location.hash.includes('github')) {
        history.pushState(null, null, '#github');
      }
      
      // Force refresh GitHub data
      refreshGitHubData().then(() => {
        refreshButton.innerHTML = 'Updated!';
        setTimeout(() => {
          refreshButton.innerHTML = 'Refresh GitHub Stats';
          refreshButton.disabled = false;
        }, 2000);
      }).catch(() => {
        refreshButton.innerHTML = 'Update failed';
        setTimeout(() => {
          refreshButton.innerHTML = 'Refresh GitHub Stats';
          refreshButton.disabled = false;
        }, 2000);
      });
    });
    
    // Insert button before the calendar
    const calendarElement = document.querySelector('.calendar');
    if (calendarElement) {
      calendarElement.parentNode.insertBefore(refreshButton, calendarElement);
    }
  }
  
  async function showCustomContributionGraph() {
    console.log('Showing custom contribution graph');
    
    const calendarElement = document.querySelector('.calendar');
    
    if (!calendarElement) {
      console.error('Calendar element not found');
      return;
    }
    
    // Remove loading indicator
    const loadingElement = calendarElement.querySelector('.calendar-loading');
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Create a simple contribution graph as fallback
    const fallbackHTML = `
      <div class="github-calendar-fallback">
        <h3>GitHub Activity</h3>
        <p>Activity data from <a href="https://github.com/realspaceeagle" target="_blank" rel="noopener">@realspaceeagle</a></p>
        <div class="fallback-stats">
          <div class="fallback-stat">
            <div class="stat-number">194</div>
            <div class="stat-label">Contributions (12mo)</div>
          </div>
          <div class="fallback-stat">
            <div class="stat-number">7</div>
            <div class="stat-label">Current Streak</div>
          </div>
          <div class="fallback-stat">
            <div class="stat-number">25</div>
            <div class="stat-label">Longest Streak</div>
          </div>
        </div>
        <div class="fallback-meta">
          <span><strong>Most active:</strong> JavaScript, Python, HTML</span>
          <span><strong>Latest activity:</strong> Updated repositories</span>
        </div>
      </div>
    `;
    
    calendarElement.innerHTML = fallbackHTML;
    
    // Try contribution tracker if available
    if (contributionTracker) {
      try {
        const contributionData = await contributionTracker.getContributions();
        
        if (contributionData) {
          // Update stats based on contribution data
          const streaks = contributionTracker.calculateStreaks(contributionData.contributions);
          const totalContribElement = document.getElementById('total-contributions');
          const currentStreakElement = document.getElementById('current-streak');
          const longestStreakElement = document.getElementById('longest-streak');
          
          if (totalContribElement) totalContribElement.textContent = contributionData.total.lastYear.toLocaleString();
          if (currentStreakElement) currentStreakElement.textContent = streaks.currentStreak;
          if (longestStreakElement) longestStreakElement.textContent = streaks.longestStreak;
        }
      } catch (error) {
        console.log('Contribution tracker failed, using static fallback');
      }
    }
        
        // Don't show profile card fallback - keep the contribution graph
        console.log('Custom contribution graph rendered successfully');
        
      } catch (error) {
        console.error('Custom contribution graph failed:', error);
        showFallbackMessage();
      }
    } else {
      showFallbackMessage();
    }
  }
  
  function showFallbackMessage() {
    console.log('Showing fallback message');
    
    // Try to use the API fallback first
    if (typeof window.fetchGitHubStats === 'function') {
      console.log('Attempting GitHub API fallback...');
      window.fetchGitHubStats();
    } else {
      // Show static fallback
      const calendarElement = document.querySelector('.calendar');
      if (calendarElement) {
        calendarElement.innerHTML = `
          <div class="github-calendar-fallback">
            <div class="fallback-avatar">
              <img src="https://avatars.githubusercontent.com/u/23475900?v=4&s=128" alt="GitHub avatar for realspaceeagle">
            </div>
            <h3>@realspaceeagle</h3>
            <p>Live contribution data is unavailable right now. Refresh to try again or view activity on GitHub.</p>
            <div class="fallback-meta">
              <span>Calendar temporarily unavailable</span>
              <span>Stats fall back to cached values</span>
            </div>
            <a href="https://github.com/realspaceeagle" class="github-profile-btn" target="_blank" rel="noopener noreferrer">View Full GitHub Profile</a>
          </div>
        `;
      }
      
      // Update stats with fallback values
      setFallbackStats();
    }
  }
  
  // Initialize with a small delay to ensure DOM is fully ready
  setTimeout(() => {
    initializeGitHubCalendar();
    addRefreshButton();
    if (typeof window.fetchGitHubStats === 'function') {
      try {
        const statsPromise = window.fetchGitHubStats();
        if (statsPromise && typeof statsPromise.catch === 'function') {
          statsPromise.catch(error => console.warn('GitHub stats fetch failed:', error));
        }
      } catch (error) {
        console.warn('GitHub stats fetch threw synchronously:', error);
      }
    }
    
    // Always try to show custom contribution graph after initial load
    setTimeout(() => {
      const calendarElement = document.querySelector('.calendar');
      const hasGitHubCalendar = calendarElement && calendarElement.querySelector('.js-calendar-graph-svg');
      
      if (!hasGitHubCalendar && contributionTracker) {
        console.log('GitHub Calendar not loaded, showing custom graph');
        showCustomContributionGraph();
      }
    }, 2000);
  }, 100);
});