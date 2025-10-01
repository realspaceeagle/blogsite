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
      entryLookup[entry.getAttribute('data-cheatsheet')] = entry;
    });

    var breadcrumb = document.querySelector('[data-cheatsheet-breadcrumb]');
    var copyButton = document.querySelector('[data-cheatsheet-copy]');
    var printButton = document.querySelector('[data-cheatsheet-print]');
    var searchInput = sidebar.querySelector('[data-cheatsheet-search]');
    var clearButton = sidebar.querySelector('[data-cheatsheet-clear]');
    var emptyState = sidebar.querySelector('[data-cheatsheet-empty]');

    var currentSearchTerm = '';

    function updateBreadcrumb(button) {
      if (!breadcrumb || !button) {
        return;
      }
      var category = button.getAttribute('data-cheatsheet-category');
      var title = button.getAttribute('data-cheatsheet-title') || button.textContent.trim();
      breadcrumb.textContent = category ? category + ' / ' + title : title;
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
            if (!node.textContent || !node.textContent.trim()) {
              return NodeFilter.FILTER_SKIP;
            }
            return node.textContent.toLowerCase().indexOf(lowerTerm) === -1
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

      if (opts.scroll !== false) {
        var firstMark = entry.querySelector('.cheatsheet-highlight');
        if (firstMark) {
          firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
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
        applyHighlight(slug, currentSearchTerm, { scroll: opts.scroll !== false });
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
      var groups = Array.prototype.slice.call(sidebar.querySelectorAll('.sidebar-group'));

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
                scroll: true
              });
            }
          } else if (activeSlug) {
            applyHighlight(activeSlug, currentSearchTerm, { scroll: false });
          }
        } else {
          entries.forEach(function (entry) {
            clearHighlights(entry);
          });
        }
      } else {
        if (activeSlug) {
          applyHighlight(activeSlug, '', { scroll: false });
        } else if (firstMatchButton) {
          showEntry(firstMatchButton.getAttribute('data-cheatsheet-target'), {
            updateHistory: false,
            scroll: false
          });
        }
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
      var found = showEntry(initialSlug, { updateHistory: false, scroll: false });
      if (!found) {
        var fallback = itemButtons[0].getAttribute('data-cheatsheet-target');
        showEntry(fallback, { updateHistory: false, scroll: false });
      }
    }

    itemButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var slug = button.getAttribute('data-cheatsheet-target');
        showEntry(slug, { updateHistory: true, scroll: true });
      });
    });

    window.addEventListener('popstate', function (event) {
      if (event.state && event.state.cheatsheet) {
        showEntry(event.state.cheatsheet, { updateHistory: false, scroll: true });
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
