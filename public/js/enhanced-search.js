// Enhanced Search Functionality
// Extends the default PaperMod search with content search capabilities

(function() {
    'use strict';
    
    // Store the original data and fuse instance
    let originalFuse = null;
    let fuseData = null;
    
    // Wait for the original search to initialize
    function waitForOriginalSearch() {
        return new Promise((resolve) => {
            const checkFuse = () => {
                if (window.fuse) {
                    originalFuse = window.fuse;
                    // Try to get data from the fuse instance
                    if (originalFuse._docs) {
                        fuseData = originalFuse._docs;
                    }
                    resolve();
                } else {
                    setTimeout(checkFuse, 100);
                }
            };
            checkFuse();
        });
    }
    
    // Enhanced search configuration
    const enhancedSearchConfig = {
        normal: {
            threshold: 0.4,
            distance: 100,
            keys: ['title', 'summary']
        },
        enhanced: {
            threshold: 0.3,
            distance: 200,
            includeMatches: true,
            includeScore: true,
            minMatchCharLength: 2,
            keys: [
                { name: 'title', weight: 3 },
                { name: 'summary', weight: 2 },
                { name: 'content', weight: 1 }
            ]
        }
    };
    
    // Initialize enhanced search when page loads
    window.addEventListener('load', async function() {
        // Wait for original search to be ready
        await waitForOriginalSearch();
        
        // Make data globally available
        window.fuseData = fuseData;
        
        console.log('Enhanced search initialized with', fuseData ? fuseData.length : 0, 'documents');
        
        // Override the original search function for enhanced mode
        const originalSearchInput = document.getElementById('searchInput');
        if (originalSearchInput) {
            // Store original event listeners
            const originalEvents = originalSearchInput.cloneNode(true);
            
            // Add enhanced search capability
            setupEnhancedSearchBehavior();
        }
    });
    
    function setupEnhancedSearchBehavior() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchInput || !searchResults) return;
        
        // Track current search mode
        let currentMode = 'normal';
        
        // Listen for mode changes
        document.addEventListener('searchModeChanged', function(e) {
            currentMode = e.detail.mode;
            
            // Clear results when switching modes
            searchResults.innerHTML = '';
            
            // Reconfigure fuse for the new mode
            if (fuseData) {
                const config = enhancedSearchConfig[currentMode];
                window.fuse = new Fuse(fuseData, config);
            }
            
            // Trigger search if there's a query
            const query = searchInput.value.trim();
            if (query) {
                if (currentMode === 'enhanced') {
                    performEnhancedSearch(query);
                } else {
                    // Let the original search handle normal mode
                    searchInput.dispatchEvent(new Event('input'));
                }
            }
        });
        
        // Enhanced input handler
        let searchTimeout;
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                if (currentMode === 'enhanced' && query) {
                    performEnhancedSearch(query);
                } else if (!query) {
                    searchResults.innerHTML = '';
                    hideSearchStats();
                }
            }, 300);
        });
    }
    
    function performEnhancedSearch(query) {
        if (!window.fuse || !query) {
            document.getElementById('searchResults').innerHTML = '';
            hideSearchStats();
            return;
        }
        
        const startTime = performance.now();
        const results = window.fuse.search(query, { limit: 20 });
        const endTime = performance.now();
        
        // Apply filters
        const filteredResults = applyFilters(results);
        
        // Update search stats
        updateSearchStats(filteredResults.length, query, endTime - startTime);
        
        // Render results
        renderEnhancedResults(filteredResults, query);
    }
    
    function applyFilters(results) {
        const categoryFilter = document.getElementById('categoryFilter');
        const sortFilter = document.getElementById('sortFilter');
        
        let filtered = results;
        
        // Apply category filter
        if (categoryFilter && categoryFilter.value) {
            filtered = filtered.filter(result => {
                const categories = result.item.categories || [];
                return categories.some(cat => 
                    cat.toLowerCase().includes(categoryFilter.value.toLowerCase())
                );
            });
        }
        
        // Apply sorting
        if (sortFilter && sortFilter.value !== 'relevance') {
            if (sortFilter.value === 'date') {
                filtered.sort((a, b) => new Date(b.item.date) - new Date(a.item.date));
            } else if (sortFilter.value === 'title') {
                filtered.sort((a, b) => a.item.title.localeCompare(b.item.title));
            }
        }
        
        return filtered;
    }
    
    function updateSearchStats(count, query, time) {
        const searchStats = document.getElementById('searchStats');
        const searchCount = document.getElementById('searchCount');
        const searchQuery = document.getElementById('searchQuery');
        const searchTime = document.getElementById('searchTime');
        
        if (searchStats && searchCount && searchQuery && searchTime) {
            searchCount.textContent = count;
            searchQuery.textContent = query;
            searchTime.textContent = ` (${Math.round(time)}ms)`;
            searchStats.style.display = 'block';
        }
    }
    
    function hideSearchStats() {
        const searchStats = document.getElementById('searchStats');
        if (searchStats) {
            searchStats.style.display = 'none';
        }
    }
    
    function renderEnhancedResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = '<li class="no-results">No results found for your search</li>';
            return;
        }
        
        const html = results.slice(0, 10).map(result => {
            const item = result.item;
            const score = result.score ? Math.round((1 - result.score) * 100) : 100;
            
            // Generate snippet from content matches
            let snippet = item.summary || '';
            if (result.matches) {
                const contentMatch = result.matches.find(m => m.key === 'content');
                if (contentMatch && contentMatch.value) {
                    snippet = createContentSnippet(contentMatch.value, query);
                }
            }
            
            // Format date
            const date = item.date ? new Date(item.date).toLocaleDateString() : '';
            
            // Get categories
            const categories = item.categories ? item.categories.join(', ') : 'Uncategorized';
            
            return `
                <li class="search-result-item">
                    <div class="search-result-title">
                        <a href="${item.permalink || item.url}">${highlightMatches(item.title, query)}</a>
                    </div>
                    <div class="search-result-meta">
                        ${date} • ${categories} • Relevance: ${score}%
                    </div>
                    <div class="search-result-snippet">
                        ${snippet}
                    </div>
                </li>
            `;
        }).join('');
        
        searchResults.innerHTML = html;
    }
    
    function createContentSnippet(content, query, maxLength = 200) {
        const words = query.toLowerCase().split(/\s+/);
        const contentLower = content.toLowerCase();
        
        // Find the best match position
        let bestIndex = -1;
        let bestScore = 0;
        
        words.forEach(word => {
            const index = contentLower.indexOf(word);
            if (index !== -1) {
                const score = word.length;
                if (score > bestScore) {
                    bestScore = score;
                    bestIndex = index;
                }
            }
        });
        
        if (bestIndex === -1) {
            return highlightMatches(content.substring(0, maxLength) + '...', query);
        }
        
        // Create snippet around the best match
        const start = Math.max(0, bestIndex - 80);
        const end = Math.min(content.length, bestIndex + 120);
        
        let snippet = content.substring(start, end);
        
        if (start > 0) snippet = '...' + snippet;
        if (end < content.length) snippet = snippet + '...';
        
        return highlightMatches(snippet, query);
    }
    
    function highlightMatches(text, query) {
        if (!query || !text) return text;
        
        const words = query.split(/\s+/).filter(word => word.length > 1);
        let highlightedText = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<span class="search-highlight">$1</span>');
        });
        
        return highlightedText;
    }
    
    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    // Export functions for use by the main search interface
    window.enhancedSearch = {
        performSearch: performEnhancedSearch,
        updateStats: updateSearchStats,
        hideStats: hideSearchStats
    };
    
})();