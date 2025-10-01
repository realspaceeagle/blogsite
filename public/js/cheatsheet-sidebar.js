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

    var itemButtons = sidebar.querySelectorAll('.sidebar-item');
    if (!itemButtons.length) {
      return;
    }

    var entries = document.querySelectorAll('.cheatsheet-entry');
    var breadcrumb = document.querySelector('[data-cheatsheet-breadcrumb]');
    var copyButton = document.querySelector('[data-cheatsheet-copy]');
    var printButton = document.querySelector('[data-cheatsheet-print]');
    var searchInput = sidebar.querySelector('[data-cheatsheet-search]');
    var clearButton = sidebar.querySelector('[data-cheatsheet-clear]');
    var emptyState = sidebar.querySelector('[data-cheatsheet-empty]');

    function updateBreadcrumb(button) {
      if (!breadcrumb || !button) {
        return;
      }
      var category = button.getAttribute('data-cheatsheet-category');
      var title = button.getAttribute('data-cheatsheet-title') || button.textContent.trim();
      breadcrumb.textContent = category ? category + ' / ' + title : title;
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

      return matched;
    }

    function filterCheatsheets(query) {
      var term = (query || '').trim().toLowerCase();
      var hasMatches = false;
      var groups = sidebar.querySelectorAll('.sidebar-group');

      groups.forEach(function (group) {
        var list = group.querySelector('.sidebar-items');
        var toggle = group.querySelector('.sidebar-group-toggle');
        var wrappers = group.querySelectorAll('.sidebar-item-wrapper');
        var groupHasMatch = false;

        wrappers.forEach(function (wrapper) {
          var button = wrapper.querySelector('.sidebar-item');
          var summaryNode = button ? button.querySelector('.item-summary') : null;
          var title = button ? (button.getAttribute('data-cheatsheet-title') || button.textContent || '') : '';
          var summary = summaryNode ? summaryNode.textContent : '';
          var haystack = (title + ' ' + summary).toLowerCase();
          var match = !term || haystack.indexOf(term) !== -1;

          wrapper.style.display = match ? '' : 'none';
          if (match) {
            groupHasMatch = true;
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

      if (clearButton) {
        if (term) {
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
      var found = showEntry(initialSlug, { updateHistory: false });
      if (!found) {
        var fallback = itemButtons[0].getAttribute('data-cheatsheet-target');
        showEntry(fallback, { updateHistory: false });
      }
    }

    itemButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var slug = button.getAttribute('data-cheatsheet-target');
        showEntry(slug, { updateHistory: true });
      });
    });

    window.addEventListener('popstate', function (event) {
      if (event.state && event.state.cheatsheet) {
        showEntry(event.state.cheatsheet, { updateHistory: false });
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
        var targetButton = document.querySelector('.sidebar-item.is-active');
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
