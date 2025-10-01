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
        
        // Override the original search input behavior completely
        setupEnhancedSearchBehavior();
        
        // Force override of any existing search handlers
        setTimeout(() => {
            forceOverrideSearch();
        }, 1000);
    });
    
    function forceOverrideSearch() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchInput || !searchResults) return;
        
        // Store reference to our enhanced search functions
        window.enhancedSearchEnabled = true;
        
        // Override any existing search behavior
        const originalSearch = window.search || function() {};
        
        window.search = function(query, mode = 'normal') {
            console.log('Custom search called:', query, mode);
            
            if (mode === 'enhanced') {
                performEnhancedSearch(query);
            } else {
                performNormalSearch(query);
            }
        };
        
        console.log('Search override complete');
    }
    
    function setupEnhancedSearchBehavior() {
        const searchInput = document.getElementById('searchInput');
        const searchResults = document.getElementById('searchResults');
        
        if (!searchInput || !searchResults) return;
        
        // Remove original event listeners by cloning and replacing the element
        const newSearchInput = searchInput.cloneNode(true);
        searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        
        // Track current search mode
        let currentMode = 'normal';
        
        // Listen for mode changes
        document.addEventListener('searchModeChanged', function(e) {
            currentMode = e.detail.mode;
            console.log('Search mode changed to:', currentMode);
            
            // Clear results when switching modes
            searchResults.innerHTML = '';
            
            // Reconfigure fuse for the new mode
            if (fuseData) {
                const config = enhancedSearchConfig[currentMode];
                console.log('Updating fuse config for mode:', currentMode, config);
                window.fuse = new Fuse(fuseData, config);
            }
            
            // Trigger search if there's a query
            const currentInput = document.getElementById('searchInput');
            const query = currentInput ? currentInput.value.trim() : '';
            console.log('Current query:', query);
            if (query) {
                if (currentMode === 'enhanced') {
                    console.log('Performing enhanced search');
                    performEnhancedSearch(query);
                } else {
                    console.log('Performing normal search');
                    performNormalSearch(query);
                }
            }
        });
        
        // Enhanced input handler for both modes
        let searchTimeout;
        newSearchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Clear previous timeout
            clearTimeout(searchTimeout);
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                if (query) {
                    // Check if container has enhanced-search class to determine mode
                    const container = document.querySelector('.enhanced-search-container');
                    const isEnhanced = container && container.classList.contains('enhanced-search');
                    
                    console.log('Input search - Mode:', isEnhanced ? 'enhanced' : 'normal', 'Query:', query);
                    
                    if (isEnhanced || currentMode === 'enhanced') {
                        performEnhancedSearch(query);
                    } else {
                        performNormalSearch(query);
                    }
                } else {
                    searchResults.innerHTML = '';
                    hideSearchStats();
                }
            }, 300);
        });
    }
    
    function performNormalSearch(query) {
        if (!window.fuse || !query) {
            document.getElementById('searchResults').innerHTML = '';
            hideSearchStats();
            return;
        }
        
        const results = window.fuse.search(query, { limit: 10 });
        renderNormalResults(results, query);
    }
    
    function renderNormalResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;
        
        if (results.length === 0) {
            searchResults.innerHTML = '<li class="no-results">No results found for your search</li>';
            return;
        }
        
        const html = results.map(result => {
            const item = result.item;
            return `
                <li class="post-entry">
                    <header class="entry-header">${highlightMatches(item.title, query)}&nbsp;»</header>
                    <a href="${item.permalink}" aria-label="${item.title}"></a>
                </li>
            `;
        }).join('');
        
        searchResults.innerHTML = html;
    }
    
    function performEnhancedSearch(query) {
        console.log('performEnhancedSearch called with query:', query);
        console.log('window.fuse exists:', !!window.fuse);
        console.log('fuseData exists:', !!fuseData);
        
        if (!window.fuse || !query) {
            console.log('No fuse or query, clearing results');
            document.getElementById('searchResults').innerHTML = '';
            hideSearchStats();
            return;
        }
        
        const startTime = performance.now();
        const results = window.fuse.search(query, { limit: 20 });
        const endTime = performance.now();
        
        console.log(`Found ${results.length} results in enhanced search`);
        if (results.length > 0) {
            console.log('First result:', results[0]);
        }
        
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
        console.log('renderEnhancedResults called with', results.length, 'results');
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) {
            console.log('No searchResults element found');
            return;
        }
        
        const container = document.querySelector('.enhanced-search-container');
        console.log('Container classes:', container ? container.className : 'No container found');
        
        if (results.length === 0) {
            searchResults.innerHTML = '<li class="no-results">No results found for your search</li>';
            return;
        }
        
        const html = results.slice(0, 10).map(result => {
            const item = result.item;
            const score = result.score ? Math.round((1 - result.score) * 100) : 100;
            
            // Generate content snippet with location info
            const snippet = generateSimpleSnippet(result, query);
            
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
                        ${date} • ${categories} • Match: ${score}%
                    </div>
                    <div class="search-result-snippet">
                        ${snippet}
                    </div>
                </li>
            `;
        }).join('');
        
        searchResults.innerHTML = html;
    }
    
    function generateSimpleSnippet(result, query) {
        const item = result.item;
        const matches = result.matches || [];
        
        // Debug: log matches to console for troubleshooting
        if (matches.length > 0) {
            console.log(`Snippet for "${item.title}": found matches in [${matches.map(m => m.key).join(', ')}]`);
        }
        
        // Try to find content match first
        const contentMatch = matches.find(m => m.key === 'content');
        if (contentMatch && contentMatch.value) {
            return createLocationSnippet(contentMatch.value, query);
        }
        
        // If no content match but we have content, search manually
        if (item.content && item.content.toLowerCase().includes(query.toLowerCase())) {
            return createLocationSnippet(item.content, query);
        }
        
        // Fallback to summary or title
        if (item.summary) {
            return `<div class="snippet-text">${highlightMatches(item.summary, query)}</div>`;
        }
        
        if (item.content) {
            const shortContent = item.content.substring(0, 200);
            return `<div class="snippet-text">${highlightMatches(shortContent, query)}...</div>`;
        }
        
        return `<div class="snippet-text">Found in: ${item.title}</div>`;
    }
    
    function createLocationSnippet(content, query) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const lines = content.split(/\r?\n/);

    // Find the best match line
    let bestMatch = null;
    let bestScore = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.length < 10) continue; // Skip very short lines

        const lineLower = line.toLowerCase();
        let lineScore = 0;

        words.forEach(word => {
            if (lineLower.includes(word)) {
                lineScore += word.length;
            }
        });

        if (lineScore > bestScore) {
            bestScore = lineScore;
            bestMatch = {
                line: line,
                lineNumber: i + 1,
                section: findSectionName(lines, i)
            };
        }
    }

    if (!bestMatch) {
        return <div class="snippet-text">...</div>;
    }

    const matchIndex = bestMatch.lineNumber - 1;
    const headingInfo = findNearestHeading(lines, matchIndex);
    const headingText = headingInfo && headingInfo.text
        ? headingInfo.text.replace(/^#+\s*/, '').trim()
        : (bestMatch.section ? bestMatch.section.replace(/^#+\s*/, '').trim() : null);

    const snippetHeading = headingText && headingText.length
        ? <div class="snippet-heading"></div>
        : <div class="snippet-heading">Line </div>;

    const contextHeading = headingInfo
        ? headingInfo
        : (bestMatch.section ? { text: bestMatch.section, line: matchIndex } : { line: -1 });

    const contextLines = getContextLines(lines, matchIndex, contextHeading, 240);
    let contextText = contextLines.join(' ').trim();

    if (!contextText) {
        contextText = bestMatch.line;
    }

    const snippetText = <div class="snippet-text"></div>;

    return snippetHeading + snippetText;
}

function findSectionName(lines, lineIndex) {
        // Look backwards for a heading
        for (let i = lineIndex; i >= 0 && i > lineIndex - 20; i--) {
            const line = lines[i].trim();
            
            // Check for markdown headings
            if (line.match(/^#{1,6}\s+(.+)/)) {
                return line.replace(/^#+\s*/, '').trim();
            }
            
            // Check for common section patterns
            if (line.match(/^(Reconnaissance|Enumeration|Exploitation|Privilege Escalation|Post-Exploitation|Initial Access|Lateral Movement|Persistence|Defense Evasion|Credential Access|Discovery|Collection|Command and Control|Exfiltration|Impact)/i)) {
                return line.trim();
            }
            
            // Check for step patterns
            if (line.match(/^(Step \d+|Phase \d+|\d+\.|[A-Z][a-z]+ \d+:)/)) {
                return line.trim();
            }
            
            // Check for bold headings
            if (line.match(/^\*\*([^*]+)\*\*$/)) {
                return line.replace(/\*\*/g, '').trim();
            }
        }
        
        return null;
    }
    
    function generateContentSnippets(result, query) {
        const item = result.item;
        const matches = result.matches || [];
        const snippets = [];
        
        // Get content matches
        const contentMatches = matches.filter(m => m.key === 'content');
        
        if (contentMatches.length > 0) {
            // Generate snippets from different parts of content
            const content = contentMatches[0].value;
            const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
            const contentSnippets = findMultipleContentMatches(content, words, query);
            
            contentSnippets.forEach(snippet => {
                snippets.push(`
                    <div class="content-snippet">
                        <div class="snippet-content">${snippet}</div>
                    </div>
                `);
            });
        }
        
        // Add title/summary match if no content matches
        if (snippets.length === 0) {
            const summaryText = item.summary || item.content?.substring(0, 200) || '';
            if (summaryText) {
                snippets.push(`
                    <div class="content-snippet">
                        <div class="snippet-content">${highlightMatches(summaryText, query)}...</div>
                    </div>
                `);
            }
        }
        
        return snippets.slice(0, 3); // Limit to 3 snippets per result
    }
    
    function findMultipleContentMatches(content, words, query) {
        const snippets = [];
        const usedRanges = [];
        
        // Find distinct matches for different words/phrases
        words.forEach(word => {
            if (word.length < 2) return;
            
            const contentLower = content.toLowerCase();
            let index = contentLower.indexOf(word);
            
            while (index !== -1 && snippets.length < 3) {
                // Check if this area is already covered
                const isOverlapping = usedRanges.some(range => 
                    (index >= range.start && index <= range.end) ||
                    (index + word.length >= range.start && index + word.length <= range.end)
                );
                
                if (!isOverlapping) {
                    const snippet = extractRelevantSection(content, index, query, 300);
                    if (snippet && snippet.length > 50) {
                        snippets.push(snippet);
                        // Mark this range as used
                        usedRanges.push({
                            start: Math.max(0, index - 100),
                            end: Math.min(content.length, index + 200)
                        });
                    }
                }
                
                // Find next occurrence
                index = contentLower.indexOf(word, index + word.length);
            }
        });
        
        // If no word-specific matches, get the best overall match
        if (snippets.length === 0) {
            const overallMatch = createContentSnippet(content, query, 300);
            if (overallMatch) {
                snippets.push(overallMatch);
            }
        }
        
        return snippets;
    }
    
    function createContentSnippet(content, query, maxLength = 300) {
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
        const contentLower = content.toLowerCase();
        
        // Find all matches with context
        const matches = [];
        words.forEach(word => {
            let index = 0;
            while ((index = contentLower.indexOf(word, index)) !== -1) {
                matches.push({
                    word: word,
                    index: index,
                    score: word.length
                });
                index += word.length;
            }
        });
        
        if (matches.length === 0) {
            return highlightMatches(content.substring(0, maxLength) + '...', query);
        }
        
        // Sort matches by score and position
        matches.sort((a, b) => b.score - a.score || a.index - b.index);
        
        // Get the best match and find relevant section
        const bestMatch = matches[0];
        return extractRelevantSection(content, bestMatch.index, query, maxLength);
    }
    
    function extractRelevantSection(content, matchIndex, query, maxLength) {
        // Split content into lines for better context
        const lines = content.split('\n');
        let currentPos = 0;
        let matchLine = -1;
        let matchLineStart = 0;
        
        // Find which line contains the match
        for (let i = 0; i < lines.length; i++) {
            const lineEnd = currentPos + lines[i].length;
            if (matchIndex >= currentPos && matchIndex <= lineEnd) {
                matchLine = i;
                matchLineStart = currentPos;
                break;
            }
            currentPos = lineEnd + 1; // +1 for newline
        }
        
        if (matchLine === -1) {
            // Fallback to simple substring
            const start = Math.max(0, matchIndex - 100);
            const end = Math.min(content.length, matchIndex + 200);
            let snippet = content.substring(start, end);
            if (start > 0) snippet = '...' + snippet;
            if (end < content.length) snippet = snippet + '...';
            return highlightMatches(snippet, query);
        }
        
        // Look for headings around the match
        const heading = findNearestHeading(lines, matchLine);
        const contextLines = getContextLines(lines, matchLine, heading, maxLength);
        
        let snippet = '';
        
        // Add heading if found
        if (heading.text && heading.line !== matchLine) {
            snippet += `<strong>${heading.text.replace(/^#+\s*/, '')}</strong>\n`;
        }
        
        // Add context lines
        snippet += contextLines.join(' ').trim();
        
        // Limit length
        if (snippet.length > maxLength) {
            snippet = snippet.substring(0, maxLength) + '...';
        }
        
        return highlightMatches(snippet, query);
    }
    
    function findNearestHeading(lines, matchLine) {
        // Look backwards for the nearest heading (markdown style)
        for (let i = matchLine; i >= 0; i--) {
            const line = lines[i].trim();
            
            // Check for markdown headings
            if (line.match(/^#{1,6}\s+.+/)) {
                return { text: line, line: i };
            }
            
            // Check for section headings (common patterns)
            if (line.match(/^(## |### |#### |##### |###### )/)) {
                return { text: line, line: i };
            }
            
            // Check for bold headings
            if (line.match(/^\*\*[^*]+\*\*$/) || line.match(/^__[^_]+__$/)) {
                return { text: line, line: i };
            }
            
            // Check for step-like headings
            if (line.match(/^(Step \d+|Phase \d+|\d+\.|[A-Z][a-z]+ \d+:|[A-Z][A-Z\s]+:)/) && line.length < 100) {
                return { text: line, line: i };
            }
            
            // Check for technical section headings
            if (line.match(/^(Reconnaissance|Enumeration|Exploitation|Privilege Escalation|Post-Exploitation|Initial Access|Lateral Movement|Persistence|Defense Evasion|Credential Access|Discovery|Collection|Command and Control|Exfiltration|Impact)/i)) {
                return { text: line, line: i };
            }
            
            // Don't go too far back
            if (matchLine - i > 15) break;
        }
        
        // Look forward if no heading found backwards
        for (let i = matchLine + 1; i < lines.length && i < matchLine + 8; i++) {
            const line = lines[i].trim();
            
            if (line.match(/^#{1,6}\s+.+/) || 
                line.match(/^\*\*[^*]+\*\*$/) || 
                line.match(/^__[^_]+__$/) ||
                line.match(/^(Step \d+|Phase \d+|\d+\.|[A-Z][a-z]+ \d+:)/)) {
                return { text: line, line: i };
            }
        }
        
        return { text: null, line: -1 };
    }
    
    function getContextLines(lines, matchLine, heading, maxLength) {
        const contextLines = [];
        let totalLength = 0;
        
        // Add the match line first
        if (lines[matchLine] && lines[matchLine].trim()) {
            contextLines.push(lines[matchLine].trim());
            totalLength += lines[matchLine].length;
        }
        
        // Add lines before and after the match
        let before = matchLine - 1;
        let after = matchLine + 1;
        let addedBefore = false;
        let addedAfter = false;
        
        while ((before >= 0 || after < lines.length) && totalLength < maxLength * 0.8) {
            // Add line before
            if (before >= 0 && !addedBefore && before !== heading.line) {
                const line = lines[before].trim();
                if (line && !line.match(/^#{1,6}\s+/) && line.length > 10) {
                    contextLines.unshift(line);
                    totalLength += line.length;
                    addedBefore = true;
                }
                before--;
            } else {
                addedBefore = true;
            }
            
            // Add line after
            if (after < lines.length && !addedAfter && after !== heading.line) {
                const line = lines[after].trim();
                if (line && !line.match(/^#{1,6}\s+/) && line.length > 10) {
                    contextLines.push(line);
                    totalLength += line.length;
                    addedAfter = true;
                }
                after++;
            } else {
                addedAfter = true;
            }
            
            if (addedBefore && addedAfter) break;
        }
        
        return contextLines;
    }
    
    function highlightMatches(text, query) {
        if (!query || !text) return text;
        
        const words = query.split(/\s+/).filter(word => word.length > 1);
        let highlightedText = text;
        
        // Sort words by length (longest first) to avoid partial matches
        words.sort((a, b) => b.length - a.length);
        
        words.forEach(word => {
            const regex = new RegExp(`(${escapeRegex(word)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
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
    
    // Direct enhanced search function that can be called from search page
    window.performEnhancedSearchDirect = function(query) {
        console.log('performEnhancedSearchDirect called with:', query);
        
        // Ensure we have the data and fuse instance
        if (!window.fuse || !fuseData) {
            console.log('Fuse not ready, waiting...');
            setTimeout(() => window.performEnhancedSearchDirect(query), 100);
            return;
        }
        
        // Configure fuse for enhanced search
        const enhancedConfig = {
            threshold: 0.3,
            distance: 200,
            includeMatches: true,
            includeScore: true,
            minMatchCharLength: 2,
            keys: [
                { name: 'title', weight: 3 },
                { name: 'summary', weight: 2 },
                { name: 'content', weight: 1 },
                { name: 'tags', weight: 2 }
            ]
        };
        
        // Create new fuse instance with enhanced config
        const enhancedFuse = new Fuse(fuseData, enhancedConfig);
        
        // Perform search
        const results = enhancedFuse.search(query, { limit: 20 });
        console.log(`Direct enhanced search found ${results.length} results`);
        
        // Render results using enhanced format
        renderEnhancedResults(results, query);
        
        // Update stats
        updateSearchStats(results.length, query, 0);
    };
    
})();