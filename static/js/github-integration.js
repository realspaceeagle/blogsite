// Enhanced GitHub Integration JavaScript
document.addEventListener('DOMContentLoaded', function() {
  console.log('GitHub integration script loaded');
  
  // Initialize contribution tracker
  let contributionTracker = null;
  
  // Initialize GitHub Calendar when the page loads
  function initializeGitHubCalendar() {
    console.log('Initializing GitHub calendar...');
    
    // Check if we're on the homepage and GitHub section exists
    const githubSection = document.querySelector('.github-activity-section');
    const calendarElement = document.querySelector('.calendar');
    
    if (!githubSection || !calendarElement) {
      console.log('GitHub section or calendar element not found');
      return;
    }
    
    console.log('GitHub section and calendar element found');
    
    // Initialize custom contribution tracker
    if (window.GitHubContributionTracker) {
      contributionTracker = new window.GitHubContributionTracker('realspaceeagle');
    }
    
    // Check if GitHub Calendar library is available
    if (typeof GitHubCalendar !== 'undefined') {
      console.log('GitHubCalendar library available, initializing...');
      try {
        // Remove loading indicator
        const loadingElement = calendarElement.querySelector('.calendar-loading');
        if (loadingElement) {
          loadingElement.remove();
        }
        
        // Initialize the GitHub calendar
        GitHubCalendar(".calendar", "realspaceeagle", {
          responsive: true,
          tooltips: true,
          summary_text: "realspaceeagle's contributions",
          cache: 300000 // Cache for 5 minutes
        });
        
        console.log('GitHub calendar initialized successfully');
        
        // Update basic stats after calendar loads
        setTimeout(() => {
          updateGitHubStats();
        }, 3000);
        
      } catch (error) {
        console.error('GitHub Calendar initialization error:', error);
        showCustomContributionGraph();
      }
    } else {
      console.log('GitHubCalendar library not available, waiting...');
      // GitHub Calendar library not loaded, wait and retry
      let retryCount = 0;
      const maxRetries = 5;
      
      const retryInterval = setInterval(() => {
        retryCount++;
        console.log(`Retry attempt ${retryCount}/${maxRetries}`);
        
        if (typeof GitHubCalendar !== 'undefined') {
          clearInterval(retryInterval);
          initializeGitHubCalendar();
        } else if (retryCount >= maxRetries) {
          clearInterval(retryInterval);
          console.log('Max retries reached, showing custom fallback');
          showCustomContributionGraph();
        }
      }, 1000);
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
    
    if (totalContribElement) totalContribElement.textContent = '27';
    if (currentStreakElement) currentStreakElement.textContent = '10';
    if (longestStreakElement) longestStreakElement.textContent = '57';
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
    const githubSection = document.querySelector('.github-activity-section');
    if (!githubSection) return;
    
    // Check if refresh button already exists
    if (document.getElementById('github-refresh-btn')) return;
    
    const refreshButton = document.createElement('button');
    refreshButton.id = 'github-refresh-btn';
    refreshButton.innerHTML = '🔄 Refresh GitHub Stats';
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
      
      refreshButton.innerHTML = '⏳ Refreshing...';
      refreshButton.disabled = true;
      
      // Force refresh GitHub data
      refreshGitHubData().then(() => {
        refreshButton.innerHTML = '✅ Updated!';
        setTimeout(() => {
          refreshButton.innerHTML = '🔄 Refresh GitHub Stats';
          refreshButton.disabled = false;
        }, 2000);
      }).catch(() => {
        refreshButton.innerHTML = '❌ Failed';
        setTimeout(() => {
          refreshButton.innerHTML = '🔄 Refresh GitHub Stats';
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
    
    if (contributionTracker) {
      try {
        const contributionData = await contributionTracker.getContributions();
        const calendarElement = document.querySelector('.calendar');
        
        if (calendarElement) {
          contributionTracker.renderContributionGraph(calendarElement, contributionData);
          
          // Update stats based on contribution data
          const streaks = contributionTracker.calculateStreaks(contributionData.contributions);
          const totalContribElement = document.getElementById('total-contributions');
          const currentStreakElement = document.getElementById('current-streak');
          const longestStreakElement = document.getElementById('longest-streak');
          
          if (totalContribElement) totalContribElement.textContent = contributionData.total.lastYear.toLocaleString();
          if (currentStreakElement) currentStreakElement.textContent = streaks.currentStreak;
          if (longestStreakElement) longestStreakElement.textContent = streaks.longestStreak;
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
          <div style="text-align: center; padding: 2rem; background: var(--entry, #f8f9fa); border: 1px solid var(--border, #e9ecef); border-radius: 8px;">
            <div style="margin-bottom: 1rem;">
              <svg width="64" height="64" viewBox="0 0 16 16" style="opacity: 0.5;">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor"/>
              </svg>
            </div>
            <p style="color: var(--secondary, #6c757d); margin-bottom: 1rem; font-size: 0.9rem;">
              GitHub contribution calendar is temporarily unavailable
            </p>
            <a href="https://github.com/realspaceeagle" 
               target="_blank"
               rel="noopener noreferrer"
               style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--toggle-highlight, #0d6efd); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: opacity 0.2s;">
              View Full GitHub Profile →
            </a>
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