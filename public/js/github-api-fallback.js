// GitHub API Fallback Integration
// This provides basic GitHub stats when the calendar library fails

async function fetchGitHubStats() {
  try {
    console.log('Fetching GitHub stats via API...');
    
    // Fetch user info from GitHub API with cache busting
    const userResponse = await fetch(`https://api.github.com/users/realspaceeagle?_=${Date.now()}`);
    const userData = await userResponse.json();
    
    if (userData.message === 'Not Found') {
      throw new Error('User not found');
    }
    
    // Only update stats, don't replace the calendar content if custom graph exists
    const calendarElement = document.querySelector('.calendar');
    const hasCustomGraph = calendarElement && calendarElement.querySelector('.contribution-graph');
    
    if (userData) {
      // Always update the stats with just the numbers
      const totalContribElement = document.getElementById('total-contributions');
      const currentStreakElement = document.getElementById('current-streak');
      const longestStreakElement = document.getElementById('longest-streak');
      
      if (totalContribElement) totalContribElement.textContent = userData.public_repos;
      if (currentStreakElement) currentStreakElement.textContent = userData.followers;
      if (longestStreakElement) longestStreakElement.textContent = userData.following;
      
      // Only show profile card if no custom graph exists
      if (calendarElement && !hasCustomGraph) {
        calendarElement.innerHTML = `
          <div style="text-align: center; padding: 2rem; background: var(--entry, #f8f9fa); border: 1px solid var(--border, #e9ecef); border-radius: 8px;">
            <div style="margin-bottom: 1rem;">
              <img src="${userData.avatar_url}" alt="GitHub Profile" style="width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--border, #e9ecef);">
            </div>
            <h3 style="margin: 0.5rem 0; color: var(--primary, #212529);">@${userData.login}</h3>
            <p style="color: var(--secondary, #6c757d); margin-bottom: 1rem; font-size: 0.9rem;">
              ${userData.bio || `${userData.company || 'Software Developer'} • ${userData.location || 'GitHub Developer'}`}
            </p>
            <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; font-size: 0.85rem; flex-wrap: wrap;">
              <span>📁 ${userData.public_repos} repos</span>
              <span>👥 ${userData.followers} followers</span>
              <span>📅 Since ${new Date(userData.created_at).getFullYear()}</span>
            </div>
            <a href="${userData.html_url}" 
               target="_blank"
               rel="noopener noreferrer"
               style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--toggle-highlight, #0d6efd); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: opacity 0.2s;">
              View Full GitHub Profile →
            </a>
          </div>
        `;
      }
    }
    
    console.log('GitHub stats updated successfully');
    
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    // Keep the existing fallback message
  }
}

// Export for use in main integration script
window.fetchGitHubStats = fetchGitHubStats;