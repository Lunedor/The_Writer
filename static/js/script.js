document.addEventListener('DOMContentLoaded', function() {
	debounce(() => initializeEasyMDE(easyMDE), 100);
    window.easyMDE = initializeEasyMDE();
    registerEventListeners(window.easyMDE);
	applyStoredPreferences();
	registerEventListenersMenu();
	registerCursorActivityListener(easyMDE);
	registerEventListenersColor();
    fetchAndStoreThemeData();
});

function initializeEasyMDE() {
    easyMDE = new EasyMDE({
        element: document.getElementById('editor'),
        autofocus: true,
        spellChecker: false,
		uploadImage: true,
		imageUploadEndpoint: "imageUpload",
		previewImagesInEditor: true,
		sideBySideFullscreen: false,
        status: [
		{
			className: "current-filename",
                defaultValue: function(el) {
                    // Set initial value
                    el.innerHTML = `${activeFolderPath ? activeFolderPath + ' | ' : ''}${currentFilename || 'New File'}.md`;
                },
                onUpdate: function(el) {
                    // Update the display as the filename changes
                    el.innerHTML = `${activeFolderPath ? activeFolderPath + ' | ' : ''}${currentFilename || 'New File'}.md`;
                }
            }, 
		"words",
		],
        toolbar: ["bold", "italic", "heading", "|", "quote", "unordered-list", "ordered-list", "|", "link", "image", "|", "preview", "side-by-side", "fullscreen"],
		 renderingConfig: {
            singleLineBreaks: true,
            codeSyntaxHighlighting: true,
            markedOptions: {
                renderer: Object.assign(new marked.Renderer(), {
                    image(href, title, text) {
                        let width = 'auto', height = 'auto';
                        // Parse width and height from the title
                        if (title) {
                            const widthMatch = title.match(/width=([\dpx%]+)/);
                            const heightMatch = title.match(/height=([\dpx%]+)/);
                            width = widthMatch ? widthMatch[1] : 'auto';
                            height = heightMatch ? heightMatch[1] : 'auto';
                        }
                        const style = `style="width: ${width}; height: ${height};"`;
                        return `<img src="${href}" alt="${text}" ${style}>`;
                    }
                })
            }
        },
    });
    return easyMDE;
}

function debounce(func, timeout = 0) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}

function registerEventListeners(easyMDE) {
	const editorToolbar = document.querySelector('.editor-toolbar');
    const cm = easyMDE.codemirror;
	
    cm.on("cursorActivity", (easyMDE) => {
        if (focusModeEnabled) {
            if (markedText) {
                markedText.clear();
            }
            markedText = highlightActiveSentence(cm);
        }
    });

    cm.on("changes", () => {
        if (focusModeEnabled) {
            if (markedText) {
                markedText.clear();
            }
            markedText = highlightActiveSentence(cm);
        } 
    });

    var target = document.querySelector('.CodeMirror');

// Create an observer instance
var observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.attributeName === "class") {
      var currentClassState = target.classList.contains('CodeMirror-fullscreen');
      console.log('Fullscreen mode:', currentClassState);
      if (currentClassState) {
        document.body.classList.add('is-fullscreen');
      } else {
        document.body.classList.remove('is-fullscreen');
      }
    }
  });
});

// Configuration of the observer:
var config = { attributes: true };

// Pass in the target node, as well as the observer options
observer.observe(target, config);

}

function applyFocusMode(easyMDE) {
    const cm = easyMDE.codemirror;
	const toggleFocusBtn = document.querySelector('#toggle-focus');
  
    if (focusModeEnabled) {
        // Disable focus mode
        document.querySelector('.CodeMirror').classList.remove('focus-mode-active');
		toggleFocusBtn.classList.add('inactive-mode');
        if (markedText) {
            markedText.clear();
            markedText = null;
        }
    } else {
        // Enable focus mode
        document.querySelector('.CodeMirror').classList.add('focus-mode-active');
		toggleFocusBtn.classList.remove('inactive-mode');
        markedText = highlightActiveSentence(cm);
    }

    focusModeEnabled = !focusModeEnabled;
	savePreferences();
}

function highlightActiveSentence(cm) {
    const cursor = cm.getCursor();
    const text = cm.getLine(cursor.line);
	console.log(text);

    // Clear the last highlight before setting a new one
    if (lastHighlighted) {
        lastHighlighted.clear();
        lastHighlighted = null; // Reset after clearing to avoid trying to clear it again unnecessarily
    }

    // Use compromise to split the text into sentences
    const doc = window.nlp(text);
    const sentences = doc.sentences().out('array');
    
    let sentenceStart = 0;
    let sentenceEnd = 0;
    for (let sentence of sentences) {
        sentenceEnd = focusParagraph ? sentenceStart + text.length : sentenceStart + sentence.length;
        // Check if the cursor is within the current sentence
        if (cursor.ch >= sentenceStart && cursor.ch <= sentenceEnd) {
            const markerOptions = {
                className: 'active-sentence',
                inclusiveLeft: false,
                inclusiveRight: true,
            };
            // Mark the current active sentence and store this marker to clear it next time
            lastHighlighted = cm.markText({ line: cursor.line, ch: sentenceStart }, { line: cursor.line, ch: sentenceEnd }, markerOptions);
            break; // Once the active sentence is found and highlighted, exit the loop
        }
        sentenceStart = sentenceEnd + 1; // Move to the start of the next potential sentence
    }

    // No need to return the marker as we manage it globally with lastHighlighted
}

function registerCursorActivityListener(easyMDE) {
    const cm = easyMDE.codemirror;
    const debouncedScrollToSpecificPoint = debounce(() =>  typewriterScrollingEnabled ? typewriterScrolling(easyMDE) : null, 100); // Debounce to manage call rate

    cm.on("cursorActivity", () => {
        const cursor = cm.getCursor();
        const cursorCoords = cm.cursorCoords(cursor, "local");
        const cursorTop = cursorCoords.top;

        // Check if the cursor's vertical position has changed
        if (cursorTop !== lastCursorTop) {
            debouncedScrollToSpecificPoint(); // Call the function to adjust the scroll
            lastCursorTop = cursorTop; // Update lastCursorTop with the new position
        }
    });
}

function typewriterScrolling(easyMDE) {
	var cm = easyMDE.codemirror;
    const sel = easyMDE.codemirror.getWrapperElement();
    const textAreaElement = sel.querySelector('.CodeMirror-scroll');
    const cursor = cm.getCursor('anchor'); // Get the current cursor position
    const top = cm.charCoords({line: cursor.line, ch: 0}, "local").top; // Top position of the cursor line
    const halfWindowHeight = cm.getWrapperElement().offsetHeight / 2; // Half of the editor window height
    const scrollTo = Math.round((top - halfWindowHeight)); // Calculate the scroll position to center the cursor
	const editorHeight = cm.getScrollInfo().height;
	
	const scrollerElement = sel.querySelector('.CodeMirror');;
	paddingTop= 284-top;
	textAreaElement.style.paddingTop = paddingTop > 0 ? `${paddingTop}px` : 0;
	paddingBottom = 284 - (editorHeight - top);
	document.querySelector('.CodeMirror').style.paddingBottom = paddingBottom > 0 ? `${paddingBottom}px` : 0;
	
    cm.scrollTo(null, scrollTo); // Scroll to the calculated position	
	const currentBottomPadding = document.querySelector('.CodeMirror').style.paddingBottom.replace('px', '');
	if (paddingBottom > 0 && currentBottomPadding !== `${paddingBottom}`) {
		document.querySelector('.CodeMirror').style.paddingBottom = `${paddingBottom}px`;
		cm.refresh();
	}
}

function clearTypewriterScrolling() {
    typewriterScrollingEnabled = !typewriterScrollingEnabled;
	savePreferences();
	const toggleTypewriterBtn = document.querySelector('#toggle-typewriter');
    // Logic to enable/disable typewriter scrolling based on the `typewriterScrollingEnabled` state
    if(typewriterScrollingEnabled) {
        // Enable typewriter scrolling
        typewriterScrolling(easyMDE);
		toggleTypewriterBtn.classList.remove('inactive-mode');
    } else {
        // Disable typewriter scrolling, possibly by removing any styles or classes that were added
        const sel = easyMDE.codemirror.getWrapperElement();
        const textAreaElement = sel.querySelector('.CodeMirror-scroll');
        textAreaElement.style.paddingTop = null;
        easyMDE.codemirror.scrollTo(null, 0); // Reset scroll position
		toggleTypewriterBtn.classList.add('inactive-mode');
    }
}

async function savePreferences() {
    const preferences = {
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light',
        focusMode: focusModeEnabled,
		paragraphMode: focusParagraph,
        menuColumnVisible: document.querySelector('.menu-column').classList.contains('show'),
		curentThemeName: themeName,
        typewriterScrolling: typewriterScrollingEnabled,
        statusbar: statusBarShow,
        uiFont: document.getElementById('font-select').value,
    };

    try {
        const response = await fetch('/preferences', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(preferences),
        });

        if (!response.ok) throw new Error('Failed to save preferences');
        console.log("Preferences saved successfully", themeName);
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

async function applyStoredPreferences() {
    try {
        const response = await fetch('/preferences');
        if (!response.ok) throw new Error('Failed to load preferences');

        const preferences = await response.json();
        if (preferences) {
            // Apply theme
            if (preferences.theme === 'dark') {
                document.body.classList.add('dark-theme');
            } else {
                document.body.classList.remove('dark-theme');
            }

            // Apply font preference
            if (preferences.uiFont) {
                document.getElementById('font-select').value = preferences.uiFont;
                applyFont('body, button, input, textarea, select', preferences.uiFont);
            }

            // Apply focus mode
            focusModeEnabled = preferences.focusMode;
            if (focusModeEnabled) {
                document.querySelector('.CodeMirror').classList.add('focus-mode-active');
				document.querySelector('#toggle-focus').classList.toggle('inactive-mode', !focusModeEnabled);
            } else {
                document.querySelector('.CodeMirror').classList.remove('focus-mode-active');
				document.querySelector('#toggle-focus').classList.toggle('inactive-mode', !focusModeEnabled);
            }
			
			focusParagraph = !!preferences.paragraphMode;
			
				
            // Apply menu column visibility
            if (preferences.menuColumnVisible) {
                document.querySelector('.menu-column').classList.add('show');
            } else {
                document.querySelector('.menu-column').classList.remove('show');
            }

			themeName = preferences.curentThemeName || 'default';
			updateDropdownSelection();
			applyThemeValues(themeName);
			
            // Apply typewriter scrolling
            typewriterScrollingEnabled = preferences.typewriterScrolling;
			if (typewriterScrollingEnabled) {
				document.querySelector('#toggle-typewriter').classList.toggle('inactive-mode', !typewriterScrollingEnabled);
			} else {
				document.querySelector('#toggle-typewriter').classList.toggle('inactive-mode', !typewriterScrollingEnabled);
			}

            // Apply status bar visibility
            statusBarShow = preferences.statusbar;
            if (statusBarShow) {
                document.querySelector('.editor-statusbar').classList.add('show');
            } else {
                document.querySelector('.editor-statusbar').classList.remove('show');
            }
        }
        console.log("Preferences loaded successfully");
    } catch (error) {
        console.error('Error loading preferences:', error);
    }
}
