(function () {
  function ready(callback) {
    if (document.readyState !== 'loading') {
      callback();
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  ready(function () {
    var sidebar = document.querySelector('.cheatsheet-sidebar');
    if (!sidebar) {
      return;
    }

    var itemButtons = Array.prototype.slice.call(sidebar.querySelectorAll('.sidebar-item'));
    if (!itemButtons.length) {
      return;
    }

    var entries = Array.prototype.slice.call(document.querySelectorAll('.cheatsheet-entry'));
    var entryLookup = {};
    entries.forEach(function (entry) {
      var key = entry.getAttribute('data-cheatsheet');
      if (key) {
        entryLookup[key] = entry;
      }
    });

    var breadcrumb = document.querySelector('[data-cheatsheet-breadcrumb]');
    var copyButton = document.querySelector('[data-cheatsheet-copy]');
    var printButton = document.querySelector('[data-cheatsheet-print]');
    var searchInput = sidebar.querySelector('[data-cheatsheet-search]');
    var clearButton = sidebar.querySelector('[data-cheatsheet-clear]');
    var emptyState = sidebar.querySelector('[data-cheatsheet-empty]');
    var resultsOverlay = document.querySelector('[data-cheatsheet-results]');
    var resultsTerm = resultsOverlay ? resultsOverlay.querySelector('[data-cheatsheet-results-term]') : null;
    var resultsList = resultsOverlay ? resultsOverlay.querySelector('[data-cheatsheet-results-list]') : null;
    var resultsClose = resultsOverlay ? resultsOverlay.querySelector('[data-cheatsheet-results-close]') : null;

    var currentSearchTerm = '';

    function updateBreadcrumb(button) {
      if (!breadcrumb || !button) {
        return;
      }
      var category = button.getAttribute('data-cheatsheet-category');
      var title = button.getAttribute('data-cheatsheet-title') || button.textContent.trim();
      if (category) {
        breadcrumb.textContent = category + ' / ' + title;
      } else {
        breadcrumb.textContent = title;
      }
    }

    function getActiveButton() {
      return sidebar.querySelector('.sidebar-item.is-active');
    }

    function clearHighlights(container) {
      if (!container) {
        return;
      }
      var marks = container.querySelectorAll('.cheatsheet-highlight');
      marks.forEach(function (mark) {
        var parent = mark.parentNode;
        if (!parent) {
          return;
        }
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      });
    }

    function highlightTerm(container, term) {
      if (!container || !term) {
        return;
      }
      var lowerTerm = term.toLowerCase();
      var walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (!node.parentNode) {
              return NodeFilter.FILTER_REJECT;
            }
            var parentTag = node.parentNode.tagName;
            if (parentTag && /SCRIPT|STYLE|NOSCRIPT/.test(parentTag)) {
              return NodeFilter.FILTER_REJECT;
            }
            var value = node.textContent;
            if (!value || !value.trim()) {
              return NodeFilter.FILTER_SKIP;
            }
            return value.toLowerCase().indexOf(lowerTerm) === -1
              ? NodeFilter.FILTER_SKIP
              : NodeFilter.FILTER_ACCEPT;
          }
        },
        false
      );

      var nodes = [];
      while (walker.nextNode()) {
        nodes.push(walker.currentNode);
      }

      nodes.forEach(function (textNode) {
        var fullText = textNode.textContent;
        var lowerText = fullText.toLowerCase();
        var startIndex = 0;
        var fragment = document.createDocumentFragment();

        while (true) {
          var matchIndex = lowerText.indexOf(lowerTerm, startIndex);
          if (matchIndex === -1) {
            break;
          }

          var endIndex = matchIndex + term.length;
          var before = fullText.slice(startIndex, matchIndex);
          if (before) {
            fragment.appendChild(document.createTextNode(before));
          }

          var mark = document.createElement('mark');
          mark.className = 'cheatsheet-highlight';
          mark.textContent = fullText.slice(matchIndex, endIndex);
          fragment.appendChild(mark);

          startIndex = endIndex;
        }

        var remaining = fullText.slice(startIndex);
        if (remaining) {
          fragment.appendChild(document.createTextNode(remaining));
        }

        textNode.parentNode.replaceChild(fragment, textNode);
      });
    }

    function applyHighlight(slug, term, options) {
      var opts = options || {};
      entries.forEach(function (entry) {
        clearHighlights(entry);
      });

      if (!term) {
        return;
      }

      var entry = entryLookup[slug];
      if (!entry) {
        return;
      }

      var inner = entry.querySelector('.cheatsheet-entry-inner');
      if (!inner) {
        inner = entry;
      }

      highlightTerm(inner, term);

      var marks = entry.querySelectorAll('.cheatsheet-highlight');
      marks.forEach(function (mark) {
        mark.classList.remove('is-focus');
      });

      if (!marks.length) {
        return;
      }

      var focusIndex = opts.hasOwnProperty('focusIndex') ? opts.focusIndex : 0;
      if (focusIndex === null || focusIndex === undefined || isNaN(focusIndex)) {
        focusIndex = 0;
      }
      focusIndex = Math.max(0, Math.min(marks.length - 1, parseInt(focusIndex, 10)));
      var focusMark = marks[focusIndex];
      if (focusMark) {
        focusMark.classList.add('is-focus');
        if (opts.scroll !== false) {
          focusMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }

    function escapeHtml(value) {
      return value.replace(/[&<>"]/g, function (char) {
        switch (char) {
          case '&':
            return '&amp;';
          case '<':
            return '&lt;';
          case '>':
            return '&gt;';
          case '"':
            return '&quot;';
          default:
            return char;
        }
      });
    }

    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\]\\]/g, '\$&');
    }

    function createSnippet(text, matchIndex, termLength, term) {
      var start = Math.max(0, matchIndex - 80);
      var end = Math.min(text.length, matchIndex + termLength + 80);
      var raw = text.slice(start, end).replace(/\s+/g, ' ').trim();
      var escaped = escapeHtml(raw);
      if (!term) {
        return escaped;
      }
      var regex = new RegExp('(' + escapeRegExp(term) + ')', 'ig');
      return escaped.replace(regex, '<mark class="cheatsheet-highlight">$1</mark>');
    }

    function highlightText(text, term) {
      var escaped = escapeHtml(text || '');
      if (!term) {
        return escaped;
      }
      var regex = new RegExp('(' + escapeRegExp(term) + ')', 'ig');
      return escaped.replace(regex, '<mark class="cheatsheet-highlight">$1</mark>');
    }

    function findSnippets(slug, term, limit) {
      var entry = entryLookup[slug];
      if (!entry) {
        return [];
      }
      var inner = entry.querySelector('.cheatsheet-entry-inner');
      var text = (inner || entry).textContent || '';
      var lowerText = text.toLowerCase();
      var lowerTerm = term.toLowerCase();
      var max = typeof limit === 'number' ? limit : 5;
      var matches = [];
      var searchIndex = 0;
      var occurrence = 0;

      while (matches.length < max) {
        var found = lowerText.indexOf(lowerTerm, searchIndex);
        if (found === -1) {
          break;
        }
        matches.push({
          occurrence: occurrence,
          snippet: createSnippet(text, found, term.length, term)
        });
        occurrence += 1;
        searchIndex = found + term.length;
      }

      return matches;
    }

    function renderResults(term, results) {
      if (!resultsOverlay || !resultsTerm || !resultsList) {
        return;
      }

      if (!term) {
        hideResults();
        return;
      }

      resultsTerm.textContent = term;

      if (!results.length) {
        resultsList.innerHTML = '<p class="search-overlay-empty">No matches found in cheatsheets.</p>';
      } else {
        var items = results.map(function (item) {
          var category = item.category ? '<span class="search-overlay-item-category">' + escapeHtml(item.category) + '</span>' : '';
          var indexAttr = item.occurrence === null || item.occurrence === undefined ? '' : String(item.occurrence);
          return '<article class="search-overlay-item" data-cheatsheet-result data-cheatsheet-result-slug="' + item.slug + '" data-cheatsheet-result-index="' + indexAttr + '">' +
            '<header class="search-overlay-item-header">' +
            '<p class="search-overlay-item-title">' + escapeHtml(item.title) + '</p>' +
            category +
            '</header>' +
            '<p class="search-overlay-snippet">' + item.snippet + '</p>' +
            '</article>';
        });
        resultsList.innerHTML = items.join('');
      }

      resultsOverlay.hidden = false;
      resultsOverlay.classList.add('is-visible');
    }

    function hideResults() {
      if (!resultsOverlay) {
        return;
      }
      resultsOverlay.hidden = true;
      resultsOverlay.classList.remove('is-visible');
    }

    function showEntry(slug, options) {
      var opts = options || {};
      var matched = false;

      entries.forEach(function (entry) {
        if (entry.getAttribute('data-cheatsheet') === slug) {
          entry.removeAttribute('hidden');
          matched = true;
        } else {
          entry.setAttribute('hidden', '');
        }
      });

      itemButtons.forEach(function (button) {
        if (button.getAttribute('data-cheatsheet-target') === slug) {
          button.classList.add('is-active');
          button.setAttribute('aria-current', 'true');
          updateBreadcrumb(button);
          if (opts.updateHistory !== false) {
            var newUrl = window.location.pathname + '#' + slug;
            window.history.replaceState({ cheatsheet: slug }, '', newUrl);
          }
        } else {
          button.classList.remove('is-active');
          button.removeAttribute('aria-current');
        }
      });

      if (matched) {
        applyHighlight(slug, currentSearchTerm, { scroll: opts.scroll !== false, focusIndex: opts.focusIndex });
      } else {
        entries.forEach(function (entry) {
          clearHighlights(entry);
        });
      }

      return matched;
    }

    function filterCheatsheets(query) {
      currentSearchTerm = (query || '').trim();
      var term = currentSearchTerm.toLowerCase();
      var hasMatches = false;
      var firstMatchButton = null;
      var aggregatedResults = [];
      var groups = Array.prototype.slice.call(sidebar.querySelectorAll('.sidebar-group'));
      var maxResultsTotal = 30;
      var maxResultsPerCheat = 4;

      groups.forEach(function (group) {
        var list = group.querySelector('.sidebar-items');
        var toggle = group.querySelector('.sidebar-group-toggle');
        var wrappers = Array.prototype.slice.call(group.querySelectorAll('.sidebar-item-wrapper'));
        var groupHasMatch = false;

        wrappers.forEach(function (wrapper) {
          var button = wrapper.querySelector('.sidebar-item');
          if (!button) {
            return;
          }

          var slug = button.getAttribute('data-cheatsheet-target');
          var summaryNode = button.querySelector('.item-summary');
          var title = button.getAttribute('data-cheatsheet-title') || button.textContent || '';
          var summary = summaryNode ? summaryNode.textContent : '';
          var category = button.getAttribute('data-cheatsheet-category') || '';
          var haystack = (title + ' ' + summary).toLowerCase();
          var match = !term || haystack.indexOf(term) !== -1;

          if (!match && term && entryLookup[slug]) {
            var contentText = entryLookup[slug].textContent || '';
            if (contentText.toLowerCase().indexOf(term) !== -1) {
              match = true;
            }
          }

          wrapper.style.display = match ? '' : 'none';
          if (match) {
            groupHasMatch = true;
            if (!firstMatchButton) {
              firstMatchButton = button;
            }

            if (term && aggregatedResults.length < maxResultsTotal) {
              var snippets = findSnippets(slug, currentSearchTerm, maxResultsPerCheat);
              if (!snippets.length) {
                if (summary && summary.toLowerCase().indexOf(term) !== -1) {
                  snippets.push({ occurrence: null, snippet: highlightText(summary, currentSearchTerm) });
                } else if (title && title.toLowerCase().indexOf(term) !== -1) {
                  snippets.push({ occurrence: null, snippet: highlightText(title, currentSearchTerm) });
                }
              }

              for (var i = 0; i < snippets.length && aggregatedResults.length < maxResultsTotal; i += 1) {
                aggregatedResults.push({
                  slug: slug,
                  title: title,
                  category: category,
                  snippet: snippets[i].snippet,
                  occurrence: snippets[i].occurrence
                });
              }
            }
          }
        });

        if (term) {
          group.style.display = groupHasMatch ? '' : 'none';
          if (groupHasMatch && list && toggle) {
            toggle.setAttribute('aria-expanded', 'true');
            list.hidden = false;
          }
        } else {
          group.style.display = '';
          if (list && toggle.getAttribute('aria-expanded') === 'false') {
            list.hidden = true;
          }
        }

        if (groupHasMatch) {
          hasMatches = true;
        }
      });

      if (emptyState) {
        emptyState.hidden = hasMatches;
      }

      var activeButton = getActiveButton();
      var activeSlug = activeButton && activeButton.getAttribute('data-cheatsheet-target');
      var activeWrapper = activeButton ? activeButton.closest('.sidebar-item-wrapper') : null;
      var activeGroup = activeButton ? activeButton.closest('.sidebar-group') : null;
      var activeVisible = !!(
        activeWrapper &&
        activeWrapper.style.display !== 'none' &&
        activeGroup &&
        activeGroup.style.display !== 'none'
      );

      if (term) {
        if (hasMatches) {
          if (!activeButton || !activeVisible) {
            if (firstMatchButton) {
              showEntry(firstMatchButton.getAttribute('data-cheatsheet-target'), {
                updateHistory: false,
                scroll: true,
                focusIndex: 0
              });
            }
          } else if (activeSlug) {
            applyHighlight(activeSlug, currentSearchTerm, { scroll: false, focusIndex: 0 });
          }
        } else {
          entries.forEach(function (entry) {
            clearHighlights(entry);
          });
        }
        renderResults(currentSearchTerm, aggregatedResults);
      } else {
        if (activeSlug) {
          applyHighlight(activeSlug, '', { scroll: false, focusIndex: 0 });
        }
        hideResults();
      }

      if (clearButton) {
        if (currentSearchTerm) {
          clearButton.classList.add('is-visible');
        } else {
          clearButton.classList.remove('is-visible');
        }
      }
    }

    function getInitialSlug() {
      if (window.location.hash) {
        return window.location.hash.substring(1);
      }
      var first = itemButtons[0];
      return first ? first.getAttribute('data-cheatsheet-target') : null;
    }

    var initialSlug = getInitialSlug();
    if (initialSlug) {
      var found = showEntry(initialSlug, { updateHistory: false, scroll: false, focusIndex: 0 });
      if (!found) {
        var fallback = itemButtons[0].getAttribute('data-cheatsheet-target');
        showEntry(fallback, { updateHistory: false, scroll: false, focusIndex: 0 });
      }
    }

    itemButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var slug = button.getAttribute('data-cheatsheet-target');
        showEntry(slug, { updateHistory: true, scroll: true, focusIndex: 0 });
      });
    });

    window.addEventListener('popstate', function (event) {
      if (event.state && event.state.cheatsheet) {
        showEntry(event.state.cheatsheet, { updateHistory: false, scroll: true, focusIndex: 0 });
      }
    });

    if (searchInput) {
      filterCheatsheets(searchInput.value);
      searchInput.addEventListener('input', function () {
        filterCheatsheets(searchInput.value);
      });
      searchInput.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          searchInput.value = '';
          filterCheatsheets('');
          searchInput.blur();
        }
      });
    } else {
      filterCheatsheets('');
    }

    if (clearButton) {
      clearButton.addEventListener('click', function () {
        if (searchInput) {
          searchInput.value = '';
          searchInput.focus();
        }
        filterCheatsheets('');
      });
    }

    if (copyButton) {
      copyButton.addEventListener('click', function () {
        var targetButton = getActiveButton();
        var urlToCopy = targetButton ? targetButton.getAttribute('data-cheatsheet-url') : null;
        var link = urlToCopy ? new URL(urlToCopy, window.location.origin).toString() : window.location.href;
        navigator.clipboard.writeText(link).then(function () {
          var original = copyButton.textContent;
          copyButton.textContent = 'Copied!';
          setTimeout(function () {
            copyButton.textContent = original;
          }, 1400);
        });
      });
    }

    if (printButton) {
      printButton.addEventListener('click', function () {
        window.print();
      });
    }

    if (resultsOverlay) {
      resultsOverlay.addEventListener('click', function (event) {
        if (event.target === resultsOverlay) {
          hideResults();
        }
      });
    }

    if (resultsClose) {
      resultsClose.addEventListener('click', hideResults);
    }

    if (resultsList) {
      resultsList.addEventListener('click', function (event) {
        var target = event.target.closest('[data-cheatsheet-result]');
        if (!target) {
          return;
        }
        var slug = target.getAttribute('data-cheatsheet-result-slug');
        var indexAttr = target.getAttribute('data-cheatsheet-result-index');
        var focusIndex = indexAttr ? parseInt(indexAttr, 10) : null;
        showEntry(slug, { updateHistory: true, scroll: true, focusIndex: focusIndex });
        hideResults();
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && resultsOverlay && !resultsOverlay.hidden) {
        hideResults();
      }
    });

    var groupToggles = sidebar.querySelectorAll('.sidebar-group-toggle');
    groupToggles.forEach(function (toggle) {
      toggle.addEventListener('click', function () {
        var expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        var list = toggle.nextElementSibling;
        if (list) {
          list.hidden = expanded;
        }
      });
    });
  });
})();
