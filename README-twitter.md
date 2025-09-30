# Twitter Timeline Integration

## Overview
Your blog now includes a dynamic Twitter timeline that can manually fetch and display your tweets. The implementation includes multiple fallback methods to ensure tweets are displayed even when APIs are unavailable.

## Features
- **Automatic fetching**: Attempts to fetch tweets from RSS feeds and other sources
- **Manual tweet management**: Easy way to add specific tweet IDs
- **Responsive design**: Works on all device sizes
- **Fallback display**: Shows a follow button when tweets can't be fetched
- **Auto-refresh**: Updates every 5 minutes when possible

## How to Add Tweets

### Method 1: Using Tweet IDs (Recommended)
1. Go to a tweet on Twitter/X
2. Copy the tweet ID from the URL (the long number after `/status/`)
   - Example: `https://twitter.com/haran_loga/status/1234567890123456789`
   - Tweet ID: `1234567890123456789`
3. Edit `static/js/twitter-manual.js`
4. Add the tweet ID to the `recentTweetIds` array:

```javascript
recentTweetIds: [
    '1234567890123456789',  // Your new tweet ID
    '9876543210987654321',  // Previous tweet ID
    // Add more tweet IDs here
],
```

### Method 2: Using Browser Console (For Testing)
1. Open your site in a browser
2. Open Developer Tools (F12)
3. Go to Console tab
4. Type: `addRecentTweet("YOUR_TWEET_ID_HERE")`
5. Press Enter

### Method 3: Featured Tweets
For tweets you always want to show, add them to the `featuredTweets` array in `twitter-manual.js`.

## Configuration Options

Edit `static/js/twitter-manual.js` to customize:

```javascript
window.TwitterConfig = {
    username: 'haran_loga',           // Your Twitter username
    recentTweetIds: [...],            // Recent tweet IDs
    featuredTweets: [...],            // Always-shown tweets
};
```

You can also modify the timeline behavior by editing the initialization in the same file:

```javascript
window.twitterTimeline = new EnhancedTwitterTimeline(username, 'twitter-timeline', {
    maxTweets: 5,              // Number of tweets to show
    showReplies: false,        // Show reply tweets
    showRetweets: true,        // Show retweets
    refreshInterval: 300000    // Auto-refresh interval (5 minutes)
});
```

## Troubleshooting

### No Tweets Showing
1. Check that tweet IDs are correctly formatted (numbers only)
2. Ensure tweets are public
3. Verify the username is correct
4. Check browser console for error messages

### Styling Issues
The timeline styles are included in `twitter-timeline.js`. If you need custom styling, you can override the CSS variables:

```css
:root {
    --primary: your-primary-color;
    --secondary: your-secondary-color;
    --entry: your-background-color;
    --border: your-border-color;
}
```

### Manual Refresh
You can manually refresh the timeline in browser console:
```javascript
refreshTwitterTimeline()
```

## Files Modified
- `layouts/index.html` - Added Twitter timeline container
- `layouts/partials/extend_head.html` - Added script includes
- `static/js/twitter-timeline.js` - Main timeline functionality
- `static/js/twitter-manual.js` - Manual tweet management

## Browser Support
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design included

The timeline will gracefully degrade to a follow button if JavaScript is disabled or tweets can't be loaded.