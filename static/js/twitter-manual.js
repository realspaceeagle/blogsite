/**
 * Manual Twitter Timeline Management
 * Helper functions to easily add and manage tweets
 */

// Configuration object for easy management
window.TwitterConfig = {
    username: 'haran_loga',
    recentTweetIds: [
        '1972685845124489257',  // Latest tweet
        // Add your recent tweet IDs here
        // Example format: '1234567890123456789',
        // You can get tweet IDs from the URL: twitter.com/username/status/TWEET_ID
    ],
    
    // Featured tweets that always show up
    featuredTweets: [
        // Example: '1234567890123456789',
    ]
};

// Helper function to add a new tweet ID
function addRecentTweet(tweetId) {
    if (!tweetId) {
        console.error('Tweet ID is required');
        return;
    }
    
    // Add to the beginning of the array
    TwitterConfig.recentTweetIds.unshift(tweetId);
    
    // Keep only the latest 10 tweets
    TwitterConfig.recentTweetIds = TwitterConfig.recentTweetIds.slice(0, 10);
    
    // Refresh the timeline if it exists
    if (window.twitterTimeline) {
        window.twitterTimeline.addManualTweet(tweetId);
    }
    
    console.log('Added tweet ID:', tweetId);
    console.log('Current tweet IDs:', TwitterConfig.recentTweetIds);
}

// Helper function to refresh the timeline
function refreshTwitterTimeline() {
    if (window.twitterTimeline) {
        window.twitterTimeline.refresh();
    } else {
        console.log('Twitter timeline not initialized yet');
    }
}

// Enhanced timeline class that includes manual tweet management
class EnhancedTwitterTimeline extends TwitterTimeline {
    constructor(username, containerId, options = {}) {
        super(username, containerId, options);
        this.manualTweets = TwitterConfig.recentTweetIds.concat(TwitterConfig.featuredTweets);
    }
    
    getFallbackTweets() {
        // Use configured tweet IDs
        return this.manualTweets.map(id => ({
            id: id,
            embedded: true,
            link: `https://twitter.com/${this.username}/status/${id}`
        }));
    }
    
    addManualTweet(tweetId) {
        // Add to manual tweets list
        this.manualTweets.unshift(tweetId);
        this.manualTweets = this.manualTweets.slice(0, this.options.maxTweets);
        
        // Call parent method
        super.addManualTweet(tweetId);
    }
}

// Override the initialization to use enhanced version
document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('twitter-timeline');
    if (container && !window.twitterTimeline) {
        const username = container.dataset.username || TwitterConfig.username;
        const maxTweets = parseInt(container.dataset.maxTweets) || 5;
        
        window.twitterTimeline = new EnhancedTwitterTimeline(username, 'twitter-timeline', {
            maxTweets: maxTweets,
            showReplies: false,
            showRetweets: true,
            refreshInterval: 300000 // 5 minutes
        });
    }
});

// Console helpers for development
console.log('Twitter Timeline Manual Control Loaded');
console.log('Use addRecentTweet("TWEET_ID") to add new tweets');
console.log('Use refreshTwitterTimeline() to refresh the timeline');
console.log('Current config:', TwitterConfig);