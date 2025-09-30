/**
 * Manual Twitter Timeline Fetcher
 * Fetches tweets from a user's timeline using various methods
 */
class TwitterTimeline {
    constructor(username, containerId, options = {}) {
        this.username = username;
        this.container = document.getElementById(containerId);
        this.options = {
            maxTweets: options.maxTweets || 5,
            showReplies: options.showReplies || false,
            showRetweets: options.showRetweets || true,
            refreshInterval: options.refreshInterval || 300000, // 5 minutes
            ...options
        };
        
        this.tweets = [];
        this.lastUpdate = null;
        this.isLoading = false;
        
        this.init();
    }
    
    init() {
        if (!this.container) {
            console.error('Twitter timeline container not found');
            return;
        }
        
        this.createLoadingState();
        this.fetchTweets();
        
        // Set up auto-refresh
        if (this.options.refreshInterval > 0) {
            setInterval(() => this.fetchTweets(), this.options.refreshInterval);
        }
    }
    
    createLoadingState() {
        this.container.innerHTML = `
            <div class="twitter-loading">
                <div class="loading-spinner"></div>
                <p>Loading tweets...</p>
            </div>
        `;
    }
    
    async fetchTweets() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Try multiple methods to get tweets
            let tweets = await this.tryFetchMethods();
            
            if (tweets && tweets.length > 0) {
                this.tweets = tweets;
                this.renderTweets();
                this.lastUpdate = new Date();
            } else {
                this.showFallback();
            }
        } catch (error) {
            console.error('Error fetching tweets:', error);
            this.showFallback();
        } finally {
            this.isLoading = false;
        }
    }
    
    async tryFetchMethods() {
        // Method 1: Try RSS to JSON service (nitter or similar)
        try {
            const rssData = await this.fetchFromRSS();
            if (rssData && rssData.length > 0) return rssData;
        } catch (e) {
            console.log('RSS method failed:', e.message);
        }
        
        // Method 2: Try scraping via proxy service
        try {
            const scrapeData = await this.fetchFromScrape();
            if (scrapeData && scrapeData.length > 0) return scrapeData;
        } catch (e) {
            console.log('Scraping method failed:', e.message);
        }
        
        // Method 3: Fallback to manual tweet IDs
        return this.getFallbackTweets();
    }
    
    async fetchFromRSS() {
        // Try multiple Nitter instances for reliability
        const nitterInstances = [
            'nitter.net',
            'nitter.it',
            'nitter.privacydev.net',
            'nitter.1d4.us'
        ];
        
        for (const instance of nitterInstances) {
            try {
                const rssUrl = `https://${instance}/${this.username}/rss`;
                const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
                
                const response = await fetch(proxyUrl, {
                    headers: { 'Accept': 'application/json' }
                });
                
                if (!response.ok) continue;
                
                const data = await response.json();
                
                if (data.status === 'ok' && data.items && data.items.length > 0) {
                    return data.items.slice(0, this.options.maxTweets).map(item => ({
                        id: this.extractTweetId(item.link),
                        text: this.cleanTweetText(item.description),
                        date: new Date(item.pubDate),
                        link: this.convertToTwitterLink(item.link),
                        author: this.username,
                        source: 'rss'
                    }));
                }
            } catch (error) {
                console.log(`Failed to fetch from ${instance}:`, error.message);
                continue;
            }
        }
        
        throw new Error('No working RSS sources available');
    }
    
    async fetchFromScrape() {
        // Alternative scraping method - you would need to implement this
        // based on available proxy services or your own backend
        throw new Error('Scraping method not implemented');
    }
    
    getFallbackTweets() {
        // Fallback to manually curated tweets
        // You can update these periodically with your latest tweet IDs
        const fallbackTweetIds = [
            // Add your recent tweet IDs here
            // Example: '1234567890123456789'
        ];
        
        return fallbackTweetIds.map(id => ({
            id: id,
            embedded: true,
            link: `https://twitter.com/${this.username}/status/${id}`
        }));
    }
    
    extractTweetId(url) {
        const match = url.match(/status\/(\d+)/);
        return match ? match[1] : null;
    }
    
    convertToTwitterLink(nitterLink) {
        // Convert nitter links back to twitter.com
        return nitterLink.replace(/https:\/\/[^\/]+\//, 'https://twitter.com/');
    }
    
    cleanTweetText(html) {
        // Remove HTML tags and clean up the text
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
    
    renderTweets() {
        if (!this.tweets || this.tweets.length === 0) {
            this.showFallback();
            return;
        }
        
        const tweetsHtml = this.tweets.map(tweet => {
            if (tweet.embedded) {
                return this.renderEmbeddedTweet(tweet);
            } else {
                return this.renderCustomTweet(tweet);
            }
        }).join('');
        
        this.container.innerHTML = `
            <div class="twitter-timeline-header">
                <h3>Latest Tweets</h3>
                <div class="last-update">Last updated: ${this.formatDate(this.lastUpdate)}</div>
            </div>
            <div class="tweets-container">
                ${tweetsHtml}
            </div>
            <div class="twitter-follow-link">
                <a href="https://twitter.com/${this.username}" target="_blank" class="btn-twitter-follow">
                    Follow @${this.username}
                </a>
            </div>
        `;
        
        // Load Twitter widgets if we have embedded tweets
        if (this.tweets.some(t => t.embedded)) {
            this.loadTwitterWidgets();
        }
    }
    
    renderEmbeddedTweet(tweet) {
        return `
            <div class="tweet-embed-container">
                <blockquote class="twitter-tweet" data-theme="dark">
                    <a href="${tweet.link}"></a>
                </blockquote>
            </div>
        `;
    }
    
    renderCustomTweet(tweet) {
        return `
            <div class="custom-tweet">
                <div class="tweet-header">
                    <div class="tweet-author">
                        <strong>@${this.username}</strong>
                    </div>
                    <div class="tweet-date">${this.formatDate(tweet.date)}</div>
                </div>
                <div class="tweet-content">
                    ${this.formatTweetText(tweet.text)}
                </div>
                <div class="tweet-actions">
                    <a href="${tweet.link}" target="_blank" class="tweet-link">View on Twitter</a>
                </div>
            </div>
        `;
    }
    
    formatTweetText(text) {
        // Basic formatting for links, mentions, hashtags
        return text
            .replace(/(https?:\/\/\S+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
            .replace(/@(\w+)/g, '<a href="https://twitter.com/$1" target="_blank" rel="noopener">@$1</a>')
            .replace(/#(\w+)/g, '<a href="https://twitter.com/hashtag/$1" target="_blank" rel="noopener">#$1</a>');
    }
    
    formatDate(date) {
        if (!date) return 'Unknown';
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showFallback() {
        this.container.innerHTML = `
            <div class="twitter-fallback">
                <div class="twitter-icon">𝕏</div>
                <h3>Follow me on Twitter</h3>
                <p>Get the latest cybersecurity insights and updates</p>
                <a href="https://twitter.com/${this.username}" target="_blank" class="btn-twitter-follow">
                    Follow @${this.username}
                </a>
                <div class="manual-updates">
                    <p><small>For the latest tweets, visit my Twitter profile directly.</small></p>
                </div>
            </div>
        `;
    }
    
    loadTwitterWidgets() {
        // Load Twitter's widget script if not already loaded
        if (!window.twttr) {
            const script = document.createElement('script');
            script.src = 'https://platform.twitter.com/widgets.js';
            script.async = true;
            script.onload = () => {
                if (window.twttr && window.twttr.widgets) {
                    window.twttr.widgets.load();
                }
            };
            document.head.appendChild(script);
        } else if (window.twttr.widgets) {
            window.twttr.widgets.load();
        }
    }
    
    // Manual method to add specific tweets
    addManualTweet(tweetId) {
        const tweet = {
            id: tweetId,
            embedded: true,
            link: `https://twitter.com/${this.username}/status/${tweetId}`
        };
        
        this.tweets.unshift(tweet);
        this.tweets = this.tweets.slice(0, this.options.maxTweets);
        this.renderTweets();
    }
    
    // Method to refresh tweets manually
    refresh() {
        this.fetchTweets();
    }
}

// CSS styles for the Twitter timeline
const twitterTimelineCSS = `
.twitter-timeline-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.twitter-loading {
    text-align: center;
    padding: 40px 20px;
    color: var(--secondary);
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top: 3px solid #1DA1F2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.twitter-timeline-header {
    text-align: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 1px solid var(--border);
}

.twitter-timeline-header h3 {
    margin: 0 0 10px 0;
    color: var(--primary);
    font-size: 24px;
}

.last-update {
    font-size: 12px;
    color: var(--secondary);
}

.tweets-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 30px;
}

.custom-tweet {
    background: var(--entry);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    transition: transform 0.2s ease;
}

.custom-tweet:hover {
    transform: translateY(-2px);
}

.tweet-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.tweet-author {
    color: var(--primary);
    font-weight: 600;
}

.tweet-date {
    color: var(--secondary);
    font-size: 14px;
}

.tweet-content {
    color: var(--content);
    line-height: 1.5;
    margin-bottom: 15px;
}

.tweet-content a {
    color: #1DA1F2;
    text-decoration: none;
}

.tweet-content a:hover {
    text-decoration: underline;
}

.tweet-actions {
    text-align: right;
}

.tweet-link {
    color: #1DA1F2;
    text-decoration: none;
    font-size: 14px;
}

.tweet-link:hover {
    text-decoration: underline;
}

.tweet-embed-container {
    display: flex;
    justify-content: center;
}

.twitter-fallback {
    text-align: center;
    padding: 40px 20px;
    background: var(--entry);
    border: 1px solid var(--border);
    border-radius: var(--radius);
}

.twitter-fallback .twitter-icon {
    font-size: 48px;
    color: #1DA1F2;
    margin-bottom: 20px;
}

.twitter-fallback h3 {
    margin: 0 0 15px 0;
    color: var(--primary);
    font-size: 24px;
}

.twitter-fallback p {
    color: var(--secondary);
    margin-bottom: 25px;
}

.twitter-follow-link {
    text-align: center;
}

.btn-twitter-follow {
    display: inline-block;
    background: #1DA1F2;
    color: white;
    padding: 12px 24px;
    border-radius: 25px;
    text-decoration: none;
    font-weight: 600;
    transition: background 0.3s ease, transform 0.2s ease;
}

.btn-twitter-follow:hover {
    background: #0d8bd9;
    transform: translateY(-2px);
}

.manual-updates {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid var(--border);
}

.manual-updates small {
    color: var(--secondary);
}

@media (max-width: 768px) {
    .twitter-timeline-container {
        padding: 15px;
    }
    
    .custom-tweet {
        padding: 15px;
    }
    
    .tweet-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
    }
}
`;

// Inject CSS
if (!document.getElementById('twitter-timeline-styles')) {
    const style = document.createElement('style');
    style.id = 'twitter-timeline-styles';
    style.textContent = twitterTimelineCSS;
    document.head.appendChild(style);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Auto-initialize if container exists
    const container = document.getElementById('twitter-timeline');
    if (container) {
        const username = container.dataset.username || 'haran_loga';
        const maxTweets = parseInt(container.dataset.maxTweets) || 5;
        
        window.twitterTimeline = new TwitterTimeline(username, 'twitter-timeline', {
            maxTweets: maxTweets,
            showReplies: false,
            showRetweets: true,
            refreshInterval: 300000 // 5 minutes
        });
    }
});

// Export for global access
window.TwitterTimeline = TwitterTimeline;