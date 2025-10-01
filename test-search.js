// Test script to verify enhanced search functions
const testData = [
    {
        title: "HackTheBox: Poison Walkthrough",
        content: `# HackTheBox: Poison Walkthrough

This is a detailed walkthrough of the Poison machine.

## Reconnaissance

First, we start with reconnaissance to gather information about the target.

### Nmap Scanning

We can use nmap to scan for open ports and services on the target machine:

\`\`\`bash
nmap -sC -sV -oA poison 10.10.10.84
\`\`\`

The nmap scan reveals several open ports including SSH and HTTP.

## Exploitation

After gathering information, we move to the exploitation phase.

### LFI Vulnerability

We discovered a Local File Inclusion vulnerability in the web application.

## Privilege Escalation

Once we have initial access, we need to escalate privileges to root.`,
        permalink: "/posts/hackthebox-poison-walkthrough/",
        summary: "Detailed walkthrough of the Poison machine covering LFI log poisoning, PHP RFI exploitation.",
        categories: ["HackTheBox", "Security"]
    }
];

// Search functions (copied from enhanced-search.js)
function createLocationSnippet(content, query) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    const lines = content.split('\n');
    
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
        return `No match found`;
    }
    
    let locationInfo = '';
    if (bestMatch.section) {
        locationInfo = `Found in section: ${bestMatch.section}`;
    } else {
        locationInfo = `Found at line ${bestMatch.lineNumber}`;
    }
    
    const snippetText = bestMatch.line;
    
    return {
        location: locationInfo,
        snippet: snippetText,
        lineNumber: bestMatch.lineNumber,
        section: bestMatch.section
    };
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
    }
    
    return null;
}

// Test function
function testSearch(query) {
    console.log(`\n=== Testing search for: "${query}" ===`);
    
    const item = testData[0];
    console.log(`Article: ${item.title}`);
    
    if (item.content.toLowerCase().includes(query.toLowerCase())) {
        const result = createLocationSnippet(item.content, query);
        console.log(`✓ Found match!`);
        console.log(`  Location: ${result.location}`);
        console.log(`  Section: ${result.section || 'None'}`);
        console.log(`  Line: ${result.lineNumber}`);
        console.log(`  Snippet: "${result.snippet}"`);
        return result;
    } else {
        console.log(`✗ No match found`);
        return null;
    }
}

// Run tests
console.log('Enhanced Search Function Test');
console.log('============================');

const testQueries = ['nmap', 'reconnaissance', 'exploitation', 'privilege', 'lfi'];

testQueries.forEach(query => {
    testSearch(query);
});

console.log('\n=== Testing section detection ===');
const content = testData[0].content;
const lines = content.split('\n');

lines.forEach((line, index) => {
    if (line.toLowerCase().includes('nmap')) {
        console.log(`Line ${index + 1}: "${line.trim()}"`);
        const section = findSectionName(lines, index);
        console.log(`  Section found: ${section || 'None'}`);
    }
});