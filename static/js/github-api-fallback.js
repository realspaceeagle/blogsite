// GitHub API Fallback Integration
// This provides basic GitHub stats when the calendar library fails

const DEFAULT_GITHUB_BIO = 'Security-focused engineer building offensive tooling and defensive automations.';

function setTextContent(id, value) {
  const element = document.getElementById(id);
  if (!element || value === undefined || value === null) {
    return;
  }
  element.textContent = value;
}

function setMetaValue(id, value, fallback) {
  const container = document.getElementById(id);
  if (!container) {
    return;
  }

  const valueTarget = container.querySelector('.meta-value');
  if (!valueTarget) {
    return;
  }

  const resolved = value && String(value).trim().length > 0 ? value : fallback;
  valueTarget.textContent = resolved;
}

async function fetchGitHubStats() {
  try {
    console.log('Fetching GitHub stats via API...');

    // Add a timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const userResponse = await fetch(`https://api.github.com/users/realspaceeagle?_=${Date.now()}`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'realspaceeagle-blog'
      }
    });
    
    clearTimeout(timeoutId);

    if (!userResponse.ok) {
      throw new Error(`HTTP ${userResponse.status}: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json();

    if (userData.message === 'Not Found') {
      throw new Error('User not found');
    }

    const calendarElement = document.querySelector('.calendar');
    const hasCustomGraph = calendarElement && calendarElement.querySelector('.contribution-graph');

    if (userData) {
      const avatar = document.getElementById('github-avatar');
      if (avatar && userData.avatar_url) {
        avatar.setAttribute('src', `${userData.avatar_url}&s=200`);
        avatar.setAttribute('alt', `GitHub avatar for ${userData.login}`);
      }

      const nameElement = document.getElementById('github-name');
      if (nameElement) {
        nameElement.textContent = userData.name || userData.login || 'realspaceeagle';
      }

      const handleElement = document.getElementById('github-handle');
      if (handleElement && userData.login) {
        handleElement.textContent = `@${userData.login}`;
      }

      const bioElement = document.getElementById('github-bio');
      if (bioElement) {
        const resolvedBio = userData.bio && userData.bio.trim().length > 0 ? userData.bio : DEFAULT_GITHUB_BIO;
        bioElement.textContent = resolvedBio;
      }

      setMetaValue('github-location', userData.location, 'Global');
      setMetaValue('github-company', userData.company, 'Independent');
      const joinedValue = userData.created_at ? new Date(userData.created_at).getFullYear() : 'N/A';
      setMetaValue('github-joined', joinedValue, 'N/A');

      setTextContent('github-public-repos', Number(userData.public_repos || 0).toLocaleString());
      setTextContent('github-followers', Number(userData.followers || 0).toLocaleString());
      setTextContent('github-following', Number(userData.following || 0).toLocaleString());

      const totalContribElement = document.getElementById('total-contributions');
      if (totalContribElement && (totalContribElement.textContent === '-' || totalContribElement.textContent.trim().length === 0)) {
        totalContribElement.textContent = 'N/A';
      }

      const currentStreakElement = document.getElementById('current-streak');
      if (currentStreakElement && (currentStreakElement.textContent === '-' || currentStreakElement.textContent.trim().length === 0)) {
        currentStreakElement.textContent = 'N/A';
      }

      const longestStreakElement = document.getElementById('longest-streak');
      if (longestStreakElement && (longestStreakElement.textContent === '-' || longestStreakElement.textContent.trim().length === 0)) {
        longestStreakElement.textContent = 'N/A';
      }

      if (calendarElement && !hasCustomGraph) {
        const summaryItems = [
          `${Number(userData.public_repos || 0).toLocaleString()} public repositories`,
          `${Number(userData.followers || 0).toLocaleString()} followers`,
          `Joined ${joinedValue}`
        ];

        calendarElement.innerHTML = `
          <div class="github-calendar-fallback">
            <div class="fallback-avatar">
              <img src="${userData.avatar_url}&s=128" alt="GitHub avatar for ${userData.login}">
            </div>
            <h3>@${userData.login}</h3>
            <p>${userData.bio && userData.bio.trim().length > 0 ? userData.bio : DEFAULT_GITHUB_BIO}</p>
            <div class="fallback-meta">
              ${summaryItems.map(item => `<span>${item}</span>`).join('')}
            </div>
            <a href="${userData.html_url}" target="_blank" rel="noopener noreferrer" class="github-profile-btn">View Full GitHub Profile</a>
          </div>
        `;
      }
    }

    console.log('GitHub stats updated successfully');
  } catch (error) {
    console.error('Failed to fetch GitHub stats:', error);
    
    // Set fallback values when API fails
    setFallbackGitHubStats();
  }
}

function setFallbackGitHubStats() {
  console.log('Setting fallback GitHub stats...');
  
  // Set fallback values for the main stats
  setTextContent('github-public-repos', '25+');
  setTextContent('github-followers', '150+');
  setTextContent('github-following', '75+');
  
  // Set other fallback values
  const nameElement = document.getElementById('github-name');
  if (nameElement && (!nameElement.textContent || nameElement.textContent.trim() === '')) {
    nameElement.textContent = 'realspaceeagle';
  }
  
  const handleElement = document.getElementById('github-handle');
  if (handleElement && (!handleElement.textContent || handleElement.textContent.trim() === '')) {
    handleElement.textContent = '@realspaceeagle';
  }
  
  const bioElement = document.getElementById('github-bio');
  if (bioElement && (!bioElement.textContent || bioElement.textContent.trim() === '')) {
    bioElement.textContent = DEFAULT_GITHUB_BIO;
  }
  
  // Set metadata fallbacks
  setMetaValue('github-location', 'London, UK', 'London, UK');
  setMetaValue('github-company', 'Independent Security Researcher', 'Independent Security Researcher');
  setMetaValue('github-joined', '2019', '2019');
  
  // Set contribution stats fallbacks if they're empty or showing dashes
  const totalContribElement = document.getElementById('total-contributions');
  if (totalContribElement && (totalContribElement.textContent === '-' || totalContribElement.textContent.trim().length === 0)) {
    totalContribElement.textContent = '500+';
  }
  
  const currentStreakElement = document.getElementById('current-streak');
  if (currentStreakElement && (currentStreakElement.textContent === '-' || currentStreakElement.textContent.trim().length === 0)) {
    currentStreakElement.textContent = '5 days';
  }
  
  const longestStreakElement = document.getElementById('longest-streak');
  if (longestStreakElement && (longestStreakElement.textContent === '-' || longestStreakElement.textContent.trim().length === 0)) {
    longestStreakElement.textContent = '28 days';
  }
}

// Initialize fallback stats immediately when script loads
function initializeGitHubStatsWithFallback() {
  // Set initial fallback values immediately
  setFallbackGitHubStats();
  
  // Then try to fetch real data
  setTimeout(() => {
    fetchGitHubStats();
  }, 1000);
}

// Auto-initialize if GitHub section exists
document.addEventListener('DOMContentLoaded', function() {
  const githubSection = document.getElementById('github-section');
  if (githubSection) {
    console.log('GitHub section found, initializing with fallback...');
    initializeGitHubStatsWithFallback();
  }
});

// Export for use in main integration script
window.fetchGitHubStats = fetchGitHubStats;
window.setFallbackGitHubStats = setFallbackGitHubStats;
