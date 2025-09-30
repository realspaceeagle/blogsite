// Enhanced Code Copy Functionality
(function() {
    'use strict';
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeCopyButtons);
    } else {
        initializeCopyButtons();
    }
    
    function initializeCopyButtons() {
        // Find all code blocks
        const codeBlocks = document.querySelectorAll('pre > code');
        
        codeBlocks.forEach((codeblock) => {
            const container = codeblock.parentNode.parentNode;
            
            // Skip if copy button already exists
            if (container.querySelector('.copy-code')) {
                return;
            }
            
            const copyButton = document.createElement('button');
            copyButton.classList.add('copy-code');
            copyButton.innerHTML = 'Copy';
            copyButton.setAttribute('aria-label', 'Copy code to clipboard');
            copyButton.setAttribute('title', 'Copy code to clipboard');
            
            // Copy functionality
            copyButton.addEventListener('click', async function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const textToCopy = codeblock.textContent || codeblock.innerText;
                
                try {
                    // Modern clipboard API
                    if (navigator.clipboard && window.isSecureContext) {
                        await navigator.clipboard.writeText(textToCopy);
                        showCopySuccess(copyButton);
                    } else {
                        // Fallback for older browsers
                        fallbackCopyToClipboard(textToCopy, copyButton);
                    }
                } catch (err) {
                    console.error('Copy failed:', err);
                    fallbackCopyToClipboard(textToCopy, copyButton);
                }
            });
            
            // Determine where to append the button
            if (container.classList.contains("highlight")) {
                container.appendChild(copyButton);
            } else if (container.parentNode.firstChild === container) {
                // td containing LineNos
                const parentTable = container.parentNode.parentNode.parentNode.parentNode;
                if (parentTable && parentTable.nodeName === "TABLE") {
                    parentTable.appendChild(copyButton);
                }
            } else if (codeblock.parentNode.parentNode.parentNode.parentNode.parentNode &&
                       codeblock.parentNode.parentNode.parentNode.parentNode.parentNode.nodeName === "TABLE") {
                // table containing LineNos and code
                codeblock.parentNode.parentNode.parentNode.parentNode.parentNode.appendChild(copyButton);
            } else {
                // code blocks not having highlight as parent class
                codeblock.parentNode.appendChild(copyButton);
            }
        });
    }
    
    function showCopySuccess(button) {
        const originalText = button.innerHTML;
        button.innerHTML = 'Copied!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }
    
    function fallbackCopyToClipboard(text, button) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '-1000px';
        textArea.style.left = '-1000px';
        document.body.appendChild(textArea);
        
        try {
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            if (successful) {
                showCopySuccess(button);
            } else {
                console.error('Fallback copy failed');
            }
        } catch (err) {
            console.error('Fallback copy error:', err);
        } finally {
            document.body.removeChild(textArea);
        }
    }
    
    // Keyboard shortcut support (Ctrl+C on focused code block)
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
            const activeElement = document.activeElement;
            if (activeElement && activeElement.tagName === 'CODE') {
                const copyButton = activeElement.parentNode.parentNode.querySelector('.copy-code');
                if (copyButton) {
                    e.preventDefault();
                    copyButton.click();
                }
            }
        }
    });
    
})();