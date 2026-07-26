// ============================================================
// MiniEditor — lightweight code editor with syntax highlighting
// Drop-in replacement for CodeMirror subset used by easy6502
// ============================================================
var MiniEditor = (function() {

function create(textarea, options) {
    var opts = options || {};
    var tabSize = opts.tabSize || 4;
    var lineNumbers = opts.lineNumbers !== false;
    var gutters = opts.gutters || [];

    // --- State ---
    var lines = (textarea.value || '').split('\n');
    var lineClasses = {};   // lineIdx -> { wrap: Set, background: Set }
    var gutterMarkers = {}; // gutterName -> { lineIdx: element }
    var changeHandlers = [];
    var _refreshScheduled = false;

    // --- DOM ---
    var wrapper = document.createElement('div');
    wrapper.className = 'me-wrapper';
    wrapper.tabIndex = -1;

    // Gutter container
    var gutterEl = document.createElement('div');
    gutterEl.className = 'me-gutter';
    wrapper.appendChild(gutterEl);

    // Breakpoints gutter (first if present)
    var bpGutter = null;
    if (gutters.indexOf('breakpoints-gutter') >= 0) {
        bpGutter = document.createElement('div');
        bpGutter.className = 'me-gutter me-bp-gutter';
        gutterEl.appendChild(bpGutter);
    }

    // Line numbers gutter
    var lnGutter = null;
    if (lineNumbers) {
        lnGutter = document.createElement('div');
        lnGutter.className = 'me-gutter me-ln-gutter';
        gutterEl.appendChild(lnGutter);
    }

    // Scroll container
    var scrollContainer = document.createElement('div');
    scrollContainer.className = 'me-scroll';
    wrapper.appendChild(scrollContainer);

    // Highlight layer (pre)
    var highlightEl = document.createElement('pre');
    highlightEl.className = 'me-highlight';
    highlightEl.setAttribute('aria-hidden', 'true');
    scrollContainer.appendChild(highlightEl);

    // Search overlay layer
    var searchOverlay = document.createElement('pre');
    searchOverlay.className = 'me-search-overlay';
    searchOverlay.setAttribute('aria-hidden', 'true');
    scrollContainer.appendChild(searchOverlay);

    // Textarea (input layer)
    var ta = document.createElement('textarea');
    ta.className = 'me-textarea';
    ta.spellcheck = false;
    ta.autocapitalize = 'off';
    ta.autocomplete = 'off';
    scrollContainer.appendChild(ta);

    // Hidden mirror for measuring
    var mirror = document.createElement('pre');
    mirror.className = 'me-mirror';
    mirror.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:inherit;tab-size:' + tabSize;
    document.body.appendChild(mirror);

    function getLineHeight() {
        ta.style.height = 'auto';
        var h = ta.scrollHeight;
        if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) h = 20;
        return h || 20;
    }

    var lineHeight = 18;
    function measureLineHeight() {
        mirror.textContent = 'X';
        lineHeight = mirror.offsetHeight || 18;
    }

    // --- Syntax highlighting ---
    var INSTR = /^(ADC|AND|ASL|BCC|BCS|BEQ|BIT|BMI|BNE|BPL|BRK|BVC|BVS|CLC|CLD|CLI|CLV|CMP|CPX|CPX|CPY|DEC|DEX|DEY|EOR|INC|INX|INY|JMP|JSR|LDA|LDX|LDY|LSR|NOP|ORA|PHA|PHP|PLA|PLP|ROL|ROR|RTI|RTS|SBC|SEC|SED|SEI|STA|STX|STY|TAX|TAY|TSX|TXA|TXS|TYA|DCB)$/i;
    var DIRECTIVE = /^\.?(byte|word|res|org|equ|db|dw|ds|include|incbin|define)/i;

    function highlightLine(text) {
        var out = '';
        var i = 0;
        var len = text.length;
        while (i < len) {
            var ch = text.charAt(i);

            // Comment
            if (ch === ';') {
                out += '<span class="cm-comment">' + escHtml(text.substring(i)) + '</span>';
                return out;
            }

            // String
            if (ch === '"') {
                var end = text.indexOf('"', i + 1);
                if (end < 0) end = len - 1;
                out += '<span class="cm-string">' + escHtml(text.substring(i, end + 1)) + '</span>';
                i = end + 1;
                continue;
            }

            // Char literal
            if (ch === "'" && i + 2 < len && text.charAt(i + 2) === "'") {
                out += '<span class="cm-number">' + escHtml(text.substring(i, i + 3)) + '</span>';
                i += 3;
                continue;
            }

            // Label (word followed by colon)
            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '.') {
                var j = i;
                while (j < len) {
                    var c = text.charAt(j);
                    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_' || c === '.') j++;
                    else break;
                }
                var word = text.substring(i, j);
                // Check if followed by colon (label definition)
                var after = text.substring(j).trimStart();
                if (after.charAt(0) === ':') {
                    out += '<span class="cm-def">' + escHtml(word) + '</span>';
                    i = j;
                    continue;
                }
                // Check directive
                if (DIRECTIVE.test(word)) {
                    out += '<span class="cm-keyword">' + escHtml(word) + '</span>';
                    i = j;
                    continue;
                }
                // Check instruction
                if (INSTR.test(word)) {
                    out += '<span class="cm-keyword">' + escHtml(word) + '</span>';
                    i = j;
                    continue;
                }
                // Register
                if (/^(A|X|Y|SP|PC)$/i.test(word)) {
                    out += '<span class="cm-variable-2">' + escHtml(word) + '</span>';
                    i = j;
                    continue;
                }
                // Identifier (define name etc)
                out += escHtml(word);
                i = j;
                continue;
            }

            // Number: $hex, %bin, #number, plain number
            if (ch === '$' || ch === '%' || ch === '#') {
                var k = i + 1;
                if (ch === '$' || ch === '%') {
                    while (k < len && isHexDigit(text.charAt(k))) k++;
                } else {
                    if (k < len && (text.charAt(k) === '$' || text.charAt(k) === '%')) {
                        k++;
                        while (k < len && isHexDigit(text.charAt(k))) k++;
                    } else {
                        while (k < len && text.charAt(k) >= '0' && text.charAt(k) <= '9') k++;
                    }
                }
                if (k > i + 1) {
                    out += '<span class="cm-number">' + escHtml(text.substring(i, k)) + '</span>';
                    i = k;
                    continue;
                }
                out += escHtml(ch);
                i++;
                continue;
            }
            if (ch >= '0' && ch <= '9') {
                var k2 = i;
                while (k2 < len && ((text.charAt(k2) >= '0' && text.charAt(k2) <= '9') || isHexDigit(text.charAt(k2)) || text.charAt(k2) === 'h')) k2++;
                // Don't eat trailing 'h' unless preceded by hex digits
                out += '<span class="cm-number">' + escHtml(text.substring(i, k2)) + '</span>';
                i = k2;
                continue;
            }

            out += escHtml(ch);
            i++;
        }
        return out;
    }

    function isHexDigit(c) {
        return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
    }

    function escHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    // --- Render ---
    function render() {
        // Line numbers
        if (lnGutter) {
            var lnHtml = '';
            for (var i = 0; i < lines.length; i++) {
                var cls = 'me-ln';
                var lc = lineClasses[i];
                if (lc && lc.background && lc.background.size > 0) {
                    cls += ' ' + Array.from(lc.background).join(' ');
                }
                lnHtml += '<div class="' + cls + '">' + (i + 1) + '</div>';
            }
            lnGutter.innerHTML = lnHtml;
        }

        // Breakpoint markers
        if (bpGutter) {
            var bpHtml = '';
            for (var i = 0; i < lines.length; i++) {
                var marker = gutterMarkers['breakpoints-gutter'] && gutterMarkers['breakpoints-gutter'][i];
                var cls = 'me-bp';
                var lc = lineClasses[i];
                if (lc && lc.background && lc.background.size > 0) {
                    cls += ' ' + Array.from(lc.background).join(' ');
                }
                bpHtml += '<div class="' + cls + '">' + (marker ? marker.outerHTML : '') + '</div>';
            }
            bpGutter.innerHTML = bpHtml;
        }

        // Highlight
        var html = '';
        var searchHtml = '';
        for (var i = 0; i < lines.length; i++) {
            var cls = 'me-line';
            var lc = lineClasses[i];
            if (lc) {
                if (lc.wrap && lc.wrap.size > 0) cls += ' ' + Array.from(lc.wrap).join(' ');
                if (lc.background && lc.background.size > 0) cls += ' ' + Array.from(lc.background).join(' ');
            }
            var lineHtml = lines[i] === '' ? ' ' : highlightLine(lines[i]);
            html += '<div class="' + cls + '">' + lineHtml + '</div>';
            // Search overlay — only spans at match positions, rest is empty
            var searchLine = '';
            if (searchVisible && searchMatches.length > 0 && searchInput.value) {
                var matchesOnLine = [];
                for (var mi = 0; mi < searchMatches.length; mi++) {
                    if (searchMatches[mi].line === i) matchesOnLine.push({ match: searchMatches[mi], idx: mi });
                }
                if (matchesOnLine.length > 0) {
                    matchesOnLine.sort(function(a, b) { return a.match.ch - b.match.ch; });
                    var lt = lines[i];
                    var lastEnd = 0;
                    for (var mi2 = 0; mi2 < matchesOnLine.length; mi2++) {
                        var m = matchesOnLine[mi2].match;
                        var isCurrent = matchesOnLine[mi2].idx === searchIdx;
                        var sCls = isCurrent ? 'cm-search-active' : 'cm-search-match';
                        searchLine += escHtml(lt.substring(lastEnd, m.ch));
                        searchLine += '<span class="' + sCls + '">' + escHtml(lt.substring(m.ch, m.ch + m.len)) + '</span>';
                        lastEnd = m.ch + m.len;
                    }
                    searchLine += escHtml(lt.substring(lastEnd));
                } else {
                    searchLine = lines[i] === '' ? ' ' : ' ';
                }
            } else {
                searchLine = lines[i] === '' ? ' ' : ' ';
            }
            searchHtml += '<div class="me-line">' + searchLine + '</div>';
        }
        highlightEl.innerHTML = html;
        searchOverlay.innerHTML = searchHtml;

        // Sync highlight height to content
        highlightEl.style.height = (lines.length * lineHeight) + 'px';
        searchOverlay.style.height = (lines.length * lineHeight) + 'px';
        // Ensure textarea is constrained to visible area for scrolling
        var containerH = scrollContainer.clientHeight;
        if (containerH > 0) {
            var savedScroll = ta.scrollTop;
            ta.style.height = containerH + 'px';
            ta.scrollTop = savedScroll;
        }
    }

    // --- Sync scroll ---
    function syncScroll() {
        highlightEl.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)';
        searchOverlay.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)';
        if (lnGutter) lnGutter.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)';
        if (bpGutter) bpGutter.style.transform = 'translateY(' + (-ta.scrollTop) + 'px)';
    }
    ta.addEventListener('scroll', syncScroll);

    // --- Input handling ---
    ta.addEventListener('input', function() {
        var val = ta.value;
        var newLines = val.split('\n');
        var oldLen = lines.length;
        lines = newLines;
        render();
        fireChange();
    });

    ta.addEventListener('keydown', function(e) {
        // Tab
        if (e.key === 'Tab' && !e.shiftKey) {
            e.preventDefault();
            var s = ta.selectionStart;
            var end = ta.selectionEnd;
            var val = ta.value;
            ta.value = val.substring(0, s) + '    ' + val.substring(end);
            ta.selectionStart = ta.selectionEnd = s + 4;
            ta.dispatchEvent(new Event('input'));
        }
        // Autocomplete navigation
        if (acVisible) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                acIndex = Math.min(acIndex + 1, acMatches.length - 1);
                acRender();
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                acIndex = Math.max(acIndex - 1, 0);
                acRender();
                return;
            }
            if (e.key === 'Enter' || (e.key === 'Tab' && acMatches.length > 0)) {
                e.preventDefault();
                acAccept();
                return;
            }
            if (e.key === 'Escape') {
                acHide();
                return;
            }
        }
    });

    // --- Autocomplete ---
    var AC_WORDS = [
        'ADC','AND','ASL','BCC','BCS','BEQ','BIT','BMI','BNE','BPL','BRK','BVC','BVS',
        'CLC','CLD','CLI','CLV','CMP','CPX','CPY','DEC','DEX','DEY','EOR','INC','INX','INY',
        'JMP','JSR','LDA','LDX','LDY','LSR','NOP','ORA','PHA','PHP','PLA','PLP','ROL','ROR',
        'RTI','RTS','SBC','SEC','SED','SEI','STA','STX','STY','TAX','TAY','TSX','TXA','TXS','TYA',
        'DCB','DEFINE','.BYTE','.WORD','.ORG','.DEFINE','.DB','.DW'
    ];
    var AC_TYPES = {};
    AC_WORDS.forEach(function(w) { AC_TYPES[w] = w.charAt(0) === '.' ? 'dir' : 'op'; });

    var acDropdown = document.createElement('div');
    acDropdown.className = 'ac-dropdown';
    wrapper.appendChild(acDropdown);
    var acMatches = [];
    var acIndex = 0;
    var acVisible = false;
    var acWordStart = 0;

    function acShow() {
        if (acMatches.length === 0) { acHide(); return; }
        acIndex = 0;
        acVisible = true;
        acRender();
        // Position dropdown near cursor
        var textBefore = ta.value.substring(0, ta.selectionStart);
        var linesBefore = textBefore.split('\n');
        var lineIdx = linesBefore.length - 1;
        var colIdx = linesBefore[lineIdx].length;
        // Approximate position
        var charH = lineHeight;
        var charW = 8;
        var x = colIdx * charW + 8;
        var y = (lineIdx + 1) * charH - ta.scrollTop;
        // Keep in view
        var contW = scrollContainer.clientWidth;
        if (x + 180 > contW) x = contW - 180;
        if (x < 0) x = 0;
        if (y + acMatches.length * 22 > scrollContainer.clientHeight) {
            y = lineIdx * charH - ta.scrollTop - acMatches.length * 22;
        }
        acDropdown.style.left = x + 'px';
        acDropdown.style.top = y + 'px';
        acDropdown.style.display = 'block';
    }

    function acHide() {
        acVisible = false;
        acMatches = [];
        acDropdown.style.display = 'none';
    }

    function acRender() {
        acDropdown.innerHTML = '';
        for (var i = 0; i < acMatches.length; i++) {
            var div = document.createElement('div');
            div.className = 'ac-item' + (i === acIndex ? ' active' : '');
            div.innerHTML = acMatches[i] + '<span class="ac-type">' + (AC_TYPES[acMatches[i]] || '') + '</span>';
            div.dataset.idx = i;
            div.addEventListener('mousedown', function(e) {
                e.preventDefault();
                acIndex = parseInt(this.dataset.idx);
                acAccept();
            });
            acDropdown.appendChild(div);
        }
        // Scroll active item into view
        var activeEl = acDropdown.querySelector('.ac-item.active');
        if (activeEl) {
            activeEl.scrollIntoView({ block: 'nearest' });
        }
    }

    function acAccept() {
        if (acIndex < 0 || acIndex >= acMatches.length) { acHide(); return; }
        var word = acMatches[acIndex];
        var val = ta.value;
        var pos = ta.selectionStart;
        // Find word start
        var ws = acWordStart;
        ta.value = val.substring(0, ws) + word + ' ' + val.substring(pos);
        ta.selectionStart = ta.selectionEnd = ws + word.length + 1;
        acHide();
        ta.dispatchEvent(new Event('input'));
        ta.focus();
    }

    function acCheck() {
        var pos = ta.selectionStart;
        if (pos !== ta.selectionEnd) { acHide(); return; }
        var val = ta.value;
        // Find current word start (letters and dots)
        var ws = pos;
        while (ws > 0 && /[a-zA-Z._]/.test(val.charAt(ws - 1))) ws--;
        var prefix = val.substring(ws, pos).toUpperCase();
        if (prefix.length < 1) { acHide(); return; }
        acWordStart = ws;
        acMatches = AC_WORDS.filter(function(w) {
            return w.toUpperCase().indexOf(prefix) === 0 && w.toUpperCase() !== prefix;
        });
        if (acMatches.length === 0) { acHide(); return; }
        acShow();
    }

    ta.addEventListener('input', function() {
        acCheck();
    });

    // Dismiss autocomplete on outside click
    document.addEventListener('mousedown', function(e) {
        if (acVisible && !acDropdown.contains(e.target) && e.target !== ta) {
            acHide();
        }
    });

    function fireChange() {
        for (var i = 0; i < changeHandlers.length; i++) {
            changeHandlers[i]();
        }
    }

    // --- Public API (CodeMirror compatible subset) ---
    var editor = {
        getValue: function() { return lines.join('\n'); },

        setValue: function(text) {
            lines = (text || '').split('\n');
            ta.value = lines.join('\n');
            lineClasses = {};
            gutterMarkers = {};
            render();
            ta.scrollTop = 0;
            syncScroll();
        },

        getLine: function(n) { return lines[n] || ''; },

        lineCount: function() { return lines.length; },

        getWrapperElement: function() { return wrapper; },

        getGutterElement: function() { return gutterEl; },

        getScrollInfo: function() { return { top: ta.scrollTop, left: ta.scrollLeft }; },

        defaultTextHeight: function() { return lineHeight; },

        addLineClass: function(line, where, cls) {
            if (typeof line === 'string') {
                // "error-line" style — apply to all lines with that class
                for (var i = 0; i < lines.length; i++) {
                    if (!lineClasses[i]) lineClasses[i] = { wrap: new Set(), background: new Set() };
                    if (where === 'wrap') lineClasses[i].wrap.add(cls);
                    if (where === 'background') lineClasses[i].background.add(cls);
                }
                render();
                return;
            }
            if (line < 0 || line >= lines.length) return;
            if (!lineClasses[line]) lineClasses[line] = { wrap: new Set(), background: new Set() };
            if (where === 'wrap') lineClasses[line].wrap.add(cls);
            if (where === 'background') lineClasses[line].background.add(cls);
            render();
        },

        removeLineClass: function(line, where, cls) {
            if (typeof line === 'string') {
                cls = line;
                where = arguments[1] || 'background';
                for (var i = 0; i < lines.length; i++) {
                    if (!lineClasses[i]) continue;
                    if (where === 'wrap') lineClasses[i].wrap.delete(cls);
                    if (where === 'background') lineClasses[i].background.delete(cls);
                }
                render();
                return;
            }
            if (line < 0 || line >= lines.length) return;
            if (!lineClasses[line]) return;
            if (where === 'wrap') lineClasses[line].wrap.delete(cls);
            if (where === 'background') lineClasses[line].background.delete(cls);
            render();
        },

        setGutterMarker: function(line, gutterName, element) {
            if (!gutterMarkers[gutterName]) gutterMarkers[gutterName] = {};
            if (element === null) {
                delete gutterMarkers[gutterName][line];
            } else {
                gutterMarkers[gutterName][line] = element;
            }
            render();
        },

        clearGutter: function(gutterName) {
            gutterMarkers[gutterName] = {};
            render();
        },

        scrollIntoView: function(pos, margin) {
            var y = pos.line * lineHeight;
            var m = margin || 0;
            var viewTop = ta.scrollTop;
            var clientH = ta.clientHeight || scrollContainer.clientHeight;
            if (clientH <= 0) return;
            var maxScroll = Math.max(0, ta.scrollHeight - clientH);
            var viewBottom = viewTop + clientH;
            if (y < viewTop + m) {
                ta.scrollTop = Math.max(0, y - m);
            } else if (y + lineHeight > viewBottom - m) {
                ta.scrollTop = Math.min(maxScroll, y + lineHeight - clientH + m);
            }
            syncScroll();
        },

        coordsChar: function(coords, mode) {
            var rect = wrapper.getBoundingClientRect();
            var x = coords.left - rect.left + ta.scrollLeft;
            var y = coords.top - rect.top + ta.scrollTop;
            var line = Math.max(0, Math.min(Math.floor(y / lineHeight), lines.length - 1));
            // Approximate character position from x offset
            // Use mirror to measure
            mirror.textContent = lines[line] || '';
            var charWidth = (mirror.scrollWidth / Math.max(1, (lines[line] || '').length)) || 8;
            var ch = Math.round(x / charWidth);
            ch = Math.max(0, Math.min(ch, (lines[line] || '').length));
            return { line: line, ch: ch };
        },

        getTokenAt: function(pos) {
            var lineText = lines[pos.line] || '';
            if (pos.ch > lineText.length) pos.ch = lineText.length;
            // Find the token at ch position by re-tokenizing
            var i = 0;
            var len = lineText.length;
            var lastToken = { start: 0, end: 0, string: '', type: null };
            while (i < len && i <= pos.ch) {
                var ch = lineText.charAt(i);
                var start = i;
                var type = null;

                if (ch === ';') {
                    type = 'comment';
                    i = len;
                } else if (ch === '"') {
                    type = 'string';
                    i = lineText.indexOf('"', i + 1);
                    if (i < 0) i = len; else i++;
                } else if (ch === '$' || ch === '%') {
                    type = 'number';
                    i++;
                    while (i < len && isHexDigit(lineText.charAt(i))) i++;
                } else if (ch === '#' || (ch >= '0' && ch <= '9')) {
                    type = 'number';
                    i++;
                    if (ch === '#') {
                        if (i < len && (lineText.charAt(i) === '$' || lineText.charAt(i) === '%')) { i++; }
                        while (i < len && ((lineText.charAt(i) >= '0' && lineText.charAt(i) <= '9') || isHexDigit(lineText.charAt(i)))) i++;
                    } else {
                        while (i < len && ((lineText.charAt(i) >= '0' && lineText.charAt(i) <= '9') || isHexDigit(lineText.charAt(i)) || lineText.charAt(i) === 'h')) i++;
                    }
                } else if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '.') {
                    var j = i;
                    while (j < len) {
                        var c = lineText.charAt(j);
                        if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_' || c === '.') j++;
                        else break;
                    }
                    var word = lineText.substring(start, j);
                    i = j;
                    // Check next non-space for colon
                    var afterIdx = j;
                    while (afterIdx < len && lineText.charAt(afterIdx) === ' ') afterIdx++;
                    if (lineText.charAt(afterIdx) === ':') {
                        type = 'def';
                    } else if (DIRECTIVE.test(word)) {
                        type = 'keyword';
                    } else if (INSTR.test(word)) {
                        type = 'keyword';
                    } else if (/^(A|X|Y|SP|PC)$/i.test(word)) {
                        type = 'variable-2';
                    }
                } else {
                    i++;
                    continue;
                }
                lastToken = { start: start, end: i, string: lineText.substring(start, i), type: type };
            }
            return lastToken;
        },

        refresh: function() {
            if (!_refreshScheduled) {
                _refreshScheduled = true;
                requestAnimationFrame(function() {
                    _refreshScheduled = false;
                    measureLineHeight();
                    render();
                });
            }
        },

        on: function(event, handler) {
            if (event === 'change') changeHandlers.push(handler);
        },

        focus: function() { ta.focus(); },

        scrollTo: function(x, y) {
            var clientH = ta.clientHeight || scrollContainer.clientHeight;
            var maxScrollY = clientH > 0 ? Math.max(0, ta.scrollHeight - clientH) : 0;
            ta.scrollLeft = x;
            ta.scrollTop = Math.max(0, Math.min(y, maxScrollY));
            render();
        }
    };

    // Initial render
    ta.value = lines.join('\n');
    measureLineHeight();
    render();

    // --- Search bar (Ctrl+F) ---
    var searchEl = document.createElement('div');
    searchEl.className = 'me-search hidden';
    var searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Find...';
    var searchCount = document.createElement('span');
    searchCount.className = 'me-search-count';
    searchCount.textContent = '';
    var searchPrev = document.createElement('button');
    searchPrev.className = 'me-search-btn';
    searchPrev.textContent = '\u25B2';
    searchPrev.title = 'Previous (Shift+Enter)';
    var searchNext = document.createElement('button');
    searchNext.className = 'me-search-btn';
    searchNext.textContent = '\u25BC';
    searchNext.title = 'Next (Enter)';
    var searchClose = document.createElement('button');
    searchClose.className = 'me-search-btn';
    searchClose.textContent = '\u00D7';
    searchClose.title = 'Close (Esc)';
    searchEl.appendChild(searchInput);
    searchEl.appendChild(searchCount);
    searchEl.appendChild(searchPrev);
    searchEl.appendChild(searchNext);
    searchEl.appendChild(searchClose);
    wrapper.appendChild(searchEl);

    var searchMatches = [];
    var searchIdx = -1;
    var searchVisible = false;

    function searchShow() {
        searchVisible = true;
        searchEl.classList.remove('hidden');
        searchInput.focus();
        searchInput.select();
        if (searchInput.value) searchDo();
    }
    function searchHide() {
        searchVisible = false;
        searchEl.classList.add('hidden');
        searchMatches = [];
        searchIdx = -1;
        searchCount.textContent = '';
        render(); // clear highlights
    }
    function searchDo() {
        var q = searchInput.value;
        searchMatches = [];
        searchIdx = -1;
        if (!q) { render(); searchCount.textContent = ''; return; }
        var lower = q.toLowerCase();
        for (var i = 0; i < lines.length; i++) {
            var lineLower = lines[i].toLowerCase();
            var pos = 0;
            while (true) {
                var idx = lineLower.indexOf(lower, pos);
                if (idx < 0) break;
                searchMatches.push({ line: i, ch: idx, len: q.length });
                pos = idx + 1;
            }
        }
        if (searchMatches.length > 0) {
            searchIdx = 0;
            searchGoto(0);
        }
        searchCount.textContent = searchMatches.length > 0 ? (searchIdx + 1) + '/' + searchMatches.length : '0';
        render();
    }
    function searchGoto(idx) {
        if (idx < 0 || idx >= searchMatches.length) return;
        searchIdx = idx;
        var m = searchMatches[idx];
        // Scroll line into view
        var y = m.line * lineHeight;
        var viewTop = ta.scrollTop;
        var clientH = ta.clientHeight || scrollContainer.clientHeight;
        if (y < viewTop + 10 || y + lineHeight > viewTop + clientH - 10) {
            ta.scrollTop = Math.max(0, y - clientH / 3);
        }
        // Set selection to match
        var lineStart = 0;
        for (var i = 0; i < m.line; i++) lineStart += lines[i].length + 1;
        ta.selectionStart = lineStart + m.ch;
        ta.selectionEnd = lineStart + m.ch + m.len;
        searchCount.textContent = (searchIdx + 1) + '/' + searchMatches.length;
    }
    function searchNextMatch() {
        if (searchMatches.length === 0) return;
        searchGoto((searchIdx + 1) % searchMatches.length);
        render();
    }
    function searchPrevMatch() {
        if (searchMatches.length === 0) return;
        searchGoto((searchIdx - 1 + searchMatches.length) % searchMatches.length);
        render();
    }

    searchInput.addEventListener('input', searchDo);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) searchPrevMatch(); else searchNextMatch(); }
        if (e.key === 'Escape') { e.preventDefault(); searchHide(); ta.focus(); }
        if (e.key === 'F3') { e.preventDefault(); if (e.shiftKey) searchPrevMatch(); else searchNextMatch(); }
    });
    searchNext.addEventListener('click', searchNextMatch);
    searchPrev.addEventListener('click', searchPrevMatch);
    searchClose.addEventListener('click', function() { searchHide(); ta.focus(); });

    // Ctrl+F / Cmd+F handler — on wrapper to catch even when textarea isn't focused
    wrapper.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF') {
            e.preventDefault();
            e.stopPropagation();
            searchShow();
        }
    });
    // Also catch at document level as fallback
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyF' && wrapper.contains(document.activeElement)) {
            e.preventDefault();
            e.stopPropagation();
            searchShow();
        }
    });

    // Replace textarea in DOM
    textarea.style.display = 'none';
    textarea.parentNode.insertBefore(wrapper, textarea);

    return editor;
}

return { create: create };
})();
