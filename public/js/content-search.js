// Simple Content Search - searches inside blog posts and shows relevant lines
(function() {
    'use strict';

    let searchData = null;
    let searchIndex = null;

    // Initialize search when page loads
    window.addEventListener('load', function() {
        if (window.location.pathname.includes('/search/')) {
            initializeContentSearch();
        }
    });

    async function initializeContentSearch() {
        try {
            console.log('Initializing content search...');
            
            // Load search data
            const response = await fetch('/index.json');
            searchData = await response.json();
            
            console.log(`Loaded ${searchData.length} posts for content search`);
            
            // Create simple search index
            searchIndex = searchData.map(item => ({
                title: item.title,
                content: item.content || '',
                summary: item.summary || '',
                permalink: item.permalink || item.url,
                date: item.date
            }));

            // Override search functionality
            setupContentSearchHandler();
            
        } catch (error) {
            console.error('Failed to initialize content search:', error);
        }
    }

    function setupContentSearchHandler() {
        const searchInput = document.getElementById('searchInput');
        const enhancedBtn = document.getElementById('enhancedSearchBtn');
        
        if (!searchInput || !enhancedBtn) {
            console.log('Search elements not found');
            return;
        }

        // Add click handler for enhanced search button
        enhancedBtn.addEventListener('click', function() {
            const query = searchInput.value.trim();
            console.log('Enhanced search clicked with query:', query);
            
            if (query) {
                performContentSearch(query);
            }
        });

        // Also search on input when enhanced mode is active
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            const container = document.querySelector('.enhanced-search-container');
            const isEnhanced = container && container.classList.contains('enhanced-search');
            
            if (isEnhanced && query) {
                // Debounce the search
                clearTimeout(window.contentSearchTimeout);
                window.contentSearchTimeout = setTimeout(() => {
                    performContentSearch(query);
                }, 500);
            }
        });

        console.log('Content search handlers setup complete');
    }

    function performContentSearch(query) {
        console.log('Performing content search for:', query);
        
        if (!searchIndex || !query) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const results = searchInContent(query);
        console.log(`Content search found ${results.length} results`);
        
        displayContentResults(results, query);
    }

    function searchInContent(query) {
        const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
        const results = [];

        searchIndex.forEach(post => {
            const titleLower = post.title.toLowerCase();
            const contentLower = post.content.toLowerCase();
            const summaryLower = post.summary.toLowerCase();
            
            let score = 0;
            let hasMatch = false;
            let matchedLines = [];

            // Check title matches (higher score)
            searchTerms.forEach(term => {
                if (titleLower.includes(term)) {
                    score += 10;
                    hasMatch = true;
                }
            });

            // Check content matches and extract relevant lines
            if (post.content) {
                const lines = post.content.split('\n');
                
                lines.forEach((line, index) => {
                    const lineLower = line.toLowerCase();
                    let lineScore = 0;
                    let lineMatches = [];

                    searchTerms.forEach(term => {
                        if (lineLower.includes(term)) {
                            lineScore += term.length;
                            lineMatches.push(term);
                            hasMatch = true;
                        }
                    });

                    if (lineScore > 0 && line.trim().length > 10) {
                        matchedLines.push({
                            line: line.trim(),
                            lineNumber: index + 1,
                            score: lineScore,
                            matches: lineMatches,
                            section: findSectionForLine(lines, index)
                        });
                    }
                });

                score += matchedLines.length;
            }

            // Check summary matches
            searchTerms.forEach(term => {
                if (summaryLower.includes(term)) {
                    score += 3;
                    hasMatch = true;
                }
            });

            if (hasMatch) {
                // Sort matched lines by score and take top 3
                matchedLines.sort((a, b) => b.score - a.score);
                matchedLines = matchedLines.slice(0, 3);

                results.push({
                    title: post.title,
                    permalink: post.permalink,
                    date: post.date,
                    summary: post.summary,
                    score: score,
                    matchedLines: matchedLines
                });
            }
        });

        // Sort results by score
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, 10); // Top 10 results
    }

    function findSectionForLine(lines, lineIndex) {
        // Look backwards from the current line to find the nearest heading
        for (let i = lineIndex; i >= 0 && i > lineIndex - 20; i--) {
            const line = lines[i].trim();
            
            // Check for markdown headings
            const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
            if (headingMatch) {
                return headingMatch[2].trim();
            }
            
            // Check for common section patterns
            if (line.match(/^(Reconnaissance|Enumeration|Exploitation|Privilege Escalation|Post-Exploitation|Initial Access|Lateral Movement|Persistence|Defense Evasion|Credential Access|Discovery|Collection|Command and Control|Exfiltration|Impact)/i)) {
                return line.trim();
            }
            
            // Check for step patterns
            if (line.match(/^(Step \d+|Phase \d+|\d+\.|[A-Z][a-z]+ \d+:)/)) {
                return line.trim();
            }
        }
        
        return null;
    }

    function highlightText(text, query) {
        if (!query || !text) return text;
        
        const terms = query.split(/\s+/).filter(term => term.length > 1);
        let highlightedText = text;
        
        terms.forEach(term => {
            const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
            highlightedText = highlightedText.replace(regex, '<mark class="search-highlight">$1</mark>');
        });
        
        return highlightedText;
    }

    function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function displayContentResults(results, query) {
        const searchResults = document.getElementById('searchResults');
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = '<li class="no-results">No content matches found for your search</li>';
            return;
        }

        const html = results.map(result => {
            const date = result.date ? new Date(result.date).toLocaleDateString() : '';
            
            // Generate content snippets
            let snippetsHtml = '';
            if (result.matchedLines.length > 0) {
                snippetsHtml = result.matchedLines.map(match => {
                    const locationText = match.section ? 
                        `Found in section: <strong>${match.section}</strong>` : 
                        `Found at line ${match.lineNumber}`;
                    
                    return `
                        <div class="content-match">
                            <div class="match-location">${locationText}</div>
                            <div class="match-text">${highlightText(match.line, query)}</div>
                        </div>
                    `;
                }).join('');
            } else {
                // Fallback to summary
                snippetsHtml = `
                    <div class="content-match">
                        <div class="match-text">${highlightText(result.summary || 'Found in article title', query)}</div>
                    </div>
                `;
            }

            return `
                <li class="search-result-item enhanced-result">
                    <div class="search-result-title">
                        <a href="${result.permalink}">${highlightText(result.title, query)}</a>
                    </div>
                    <div class="search-result-meta">
                        ${date} • Score: ${result.score}
                    </div>
                    <div class="search-result-content">
                        ${snippetsHtml}
                    </div>
                </li>
            `;
        }).join('');

        searchResults.innerHTML = html;
    }

    // Make search function globally available
    window.performContentSearch = performContentSearch;

})();