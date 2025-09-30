// GitHub API Fallback Integration
// This provides basic GitHub stats when the calendar library fails

async function fetchGitHubStats() {
  try {
    console.log('Fetching GitHub stats via API...');
    
    // Fetch user info from GitHub API
    const userResponse = await fetch('https://api.github.com/users/realspaceeagle');
    const userData = await userResponse.json();
    
    if (userData.message === 'Not Found') {
      throw new Error('User not found');
    }
    
    // Update the fallback with real data
    const calendarElement = document.querySelector('.calendar');
    if (calendarElement && userData) {
      calendarElement.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: var(--entry, #f8f9fa); border: 1px solid var(--border, #e9ecef); border-radius: 8px;">
          <div style="margin-bottom: 1rem;">
            <img src="${userData.avatar_url}" alt="GitHub Profile" style="width: 64px; height: 64px; border-radius: 50%; border: 2px solid var(--border, #e9ecef);">
          </div>
          <h3 style="margin: 0.5rem 0; color: var(--primary, #212529);">@${userData.login}</h3>
          <p style="color: var(--secondary, #6c757d); margin-bottom: 1rem; font-size: 0.9rem;">
            ${userData.bio || 'GitHub Profile'}
          </p>
          <div style="display: flex; justify-content: center; gap: 1rem; margin-bottom: 1rem; font-size: 0.85rem;">
            <span>🏢 ${userData.public_repos} repos</span>
            <span>👥 ${userData.followers} followers</span>
          </div>
          <a href="${userData.html_url}" 
             target="_blank"
             rel="noopener noreferrer"
             style="display: inline-block; padding: 0.75rem 1.5rem; background: var(--toggle-highlight, #0d6efd); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; transition: opacity 0.2s;">
            View Full GitHub Profile →
          </a>
        </div>
      `;
      
      // Update stats with real data
      document.getElementById('total-contributions').textContent = userData.public_repos + ' public repos';
      document.getElementById('current-streak').textContent = userData.followers + ' followers';  
      document.getElementById('longest-streak').textContent = userData.following + ' following';
    }
    
    console.log('GitHub stats updated successfully');
    
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    // Keep the existing fallback message
  }
}

// Export for use in main integration script
window.fetchGitHubStats = fetchGitHubStats;