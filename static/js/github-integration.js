// GitHub Integration JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Initialize GitHub Calendar when the page loads
  function initializeGitHubCalendar() {
    // Check if we're on the projects page and GitHub section exists
    const githubSection = document.getElementById('github-section');
    const calendarElement = document.querySelector('.calendar');
    
    if (!githubSection || !calendarElement) {
      return;
    }
    
    // Wait for GitHub Calendar library to load
    if (typeof GitHubCalendar !== 'undefined') {
      try {
        // Initialize the GitHub calendar
        GitHubCalendar(".calendar", "realspaceeagle", {
          responsive: true,
          tooltips: true,
          summary_text: "realspaceeagle's contributions",
          cache: 300000 // Cache for 5 minutes
        });
        
        // Update basic stats (simplified version)
        setTimeout(() => {
          // Try to extract contribution count from the generated calendar
          const contributionCells = document.querySelectorAll('.calendar .js-calendar-graph-svg rect[data-count]');
          if (contributionCells.length > 0) {
            let totalContributions = 0;
            contributionCells.forEach(cell => {
              const count = parseInt(cell.getAttribute('data-count')) || 0;
              totalContributions += count;
            });
            
            document.getElementById('total-contributions').textContent = totalContributions.toLocaleString();
          } else {
            document.getElementById('total-contributions').textContent = 'View on GitHub';
          }
          
          // Set placeholder values for streaks
          document.getElementById('current-streak').textContent = 'View on GitHub';
          document.getElementById('longest-streak').textContent = 'View on GitHub';
        }, 2000);
        
      } catch (error) {
        console.log('GitHub Calendar initialization error:', error);
        showFallbackMessage();
      }
    } else {
      // GitHub Calendar library not loaded, show fallback
      setTimeout(() => {
        if (typeof GitHubCalendar === 'undefined') {
          showFallbackMessage();
        } else {
          initializeGitHubCalendar();
        }
      }, 2000);
    }
  }
  
  function showFallbackMessage() {
    const calendarElement = document.querySelector('.calendar');
    if (calendarElement) {
      calendarElement.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
          <p style="color: var(--secondary); margin-bottom: 1rem;">
            GitHub contribution calendar
          </p>
          <a href="https://github.com/realspaceeagle" 
             style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--toggle-highlight); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
            View on GitHub →
          </a>
        </div>
      `;
    }
    
    // Update stats with fallback values
    document.getElementById('total-contributions').textContent = 'View on GitHub';
    document.getElementById('current-streak').textContent = 'View on GitHub';
    document.getElementById('longest-streak').textContent = 'View on GitHub';
  }
  
  // Initialize when DOM is ready
  initializeGitHubCalendar();
});