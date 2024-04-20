let focusModeEnabled = false;
let markedText = null; // Keep track of the highlighted text
let easyMDE;
let currentFilename = null;
let activeFolderPath = null;
let typewriterScrollingEnabled = true; // Assuming true enables the feature by default
let lastCursorTop = null;
let lastHighlighted = null; 
let focusParagraph = false;
let statusBarShow = false;

function registerEventListenersMenu() {
	document.addEventListener('keydown', handleKeyboardNavigationForExplorer); 
	
	document.addEventListener('keydown', function(event) {
    if (!event.ctrlKey && !event.metaKey) return;

    switch (event.key.toLowerCase()) {
        case 'e': // Toggle File Explorer
			//event.preventDefault();
			const fileExplorerContainer = document.querySelector('.file-explorer-container');
			fileExplorerContainer.classList.toggle('show');
			
			if (fileExplorerContainer.classList.contains('show')) {
				setTimeout(() => {
					let firstFocusable = fileExplorerContainer.querySelector('.folder-name, .file-name');
					if (firstFocusable) firstFocusable.focus();
				}, 100); // Ensure DOM has been updated
			}
            break;
        case 'd': // Toggle Theme
			document.body.classList.toggle('dark-theme');
			savePreferences();
			updateThemeMode();
            break;
		case 't': // Toggle Typewriter
            clearTypewriterScrolling();
            break;
        case 'n': // New File
            document.querySelector('#new-file').click();
            break;
        case 's': // Save File
            if (event.shiftKey) {
                document.querySelector('#save-as').click();
            } else {
                document.querySelector('#save-file').click();
            }
            break;
		case 'y': // Hide/Show File Explorer
			document.querySelector('.menu-column').classList.toggle('show');
			savePreferences();
			break;
		case 'q':
			easyMDE.codemirror.focus(); // Focus on the EasyMDE's CodeMirror instance
			//event.preventDefault();
			break;
		case 'f':
			if (!focusModeEnabled) {
				focusParagraph = false;
				applyFocusMode(easyMDE);
				markedText = highlightActiveSentence(easyMDE.codemirror);
			} else if (focusModeEnabled && !focusParagraph) {
				focusParagraph = true;
				markedText = highlightActiveSentence(easyMDE.codemirror);				
			} else {
				focusParagraph = false;
				applyFocusMode(easyMDE);
			}
			break;
		case 'k': // Toggle Typewriter
            showStatusBar()
			break;
			}
	});
	
	document.querySelector('.menu-row').addEventListener('click', (event) => {
        if (event.target.matches('#new-file')) {
		console.log("New");
			const confirmation = confirm('Are you sure you want to create a new file? Any unsaved changes will be lost.');
			if (confirmation) {
				// Clear the EasyMDE editor
				easyMDE.value('');
				// Reset currentFilename to indicate that there's no file currently being edited
				currentFilename = null;
				setTimeout(() => { updateStatusBar(activeFolderPath, currentFilename); }, 100);
			}
        } 
		else if (event.target.matches('#save-file')) {
			console.log("Save");
			saveclick();
        } 
		else if (event.target.matches('#save-as')) {
			console.log("Save-As");
			saveAsclick();
        } else if (event.target.matches('#toggle-theme')) {
			console.log(themeMode);
			document.body.classList.toggle('dark-theme');
			savePreferences();
			updateThemeMode();
		}
		else if (event.target.matches('#toggle-typewriter')) { // Corrected typo here
        console.log("Typewriter");
        clearTypewriterScrolling();
		} 
		else if (event.target.matches('#none-button')) { // Corrected typo here
			console.log("None");
			if (focusModeEnabled) {
				applyFocusMode(easyMDE);
			}
		} 
		else if (event.target.matches('#paragraph-button')) { // Corrected typo here
			focusParagraph = true;
			if (!focusModeEnabled) {
				applyFocusMode(easyMDE);
			}
			markedText = highlightActiveSentence(easyMDE.codemirror);
			savePreferences();
		} 
		else if (event.target.matches('#sentence-button')) { // Corrected typo here
			focusParagraph = false;
			if (!focusModeEnabled) {
				applyFocusMode(easyMDE);
			}
			markedText = highlightActiveSentence(easyMDE.codemirror);
			savePreferences();
		}
    });
	
	const fileExplorerToggle = document.querySelector('.file-explorer-toggle');
	const fileExplorerContainer = document.querySelector('.file-explorer-container');
	
	fileExplorerToggle.addEventListener('click', function() {
			// This checks if the .show class is already applied and toggles it
			fileExplorerContainer.classList.toggle('show');
		});
	
    loadFolderStructure();	
	
}

function showStatusBar() {
	statusBarShow = !statusBarShow;
	if (statusBarShow) {
		document.querySelector('.editor-statusbar').classList.add('show');
	} else {
		document.querySelector('.editor-statusbar').classList.remove('show');
	}
	savePreferences();
}

async function saveclick() {
	if (!activeFolderPath) {
		document.querySelector('#save-as').click();
		} else {
			const content = easyMDE.value(); // Get MD content
			let filename = currentFilename;

			if (!filename) {
				filename = prompt('Please enter a filename:');
				if (!filename) {
					alert('File not saved. Please provide a filename.');
					return;
				}
				currentFilename = filename; // Update global filename
				updateStatusBar(activeFolderPath, currentFilename);
			}

			// Determine the full path for saving
			const fullPath = activeFolderPath ? `${activeFolderPath}/${filename}` : filename;

			try {
				const response = await fetch('/save', {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({content, filename: fullPath})
				});

				if (response.ok) {
					alert('File saved successfully!');
					loadFolderStructure();
				} else {
					const data = await response.json();
					alert(`Error: ${data.message}`);
				}
			} catch (error) {
				console.error('Error:', error);
				alert('An error occurred while saving the file.');
		}}
}

async function saveAsclick() {

		// Get the current content of the Markdown editor
		let content;
		const rawMarkdownContent = easyMDE.value(); // Raw Markdown content
		const filename = prompt('Enter the filename (without extension):', 'untitled');
		const testcontent= easyMDE.markdown(rawMarkdownContent);
		if (!filename) {
			return; // User canceled the prompt, so we don't proceed
		}

		const fileFormat = prompt('Enter the file format (txt, docx, pdf, md):', 'md');

		if (!fileFormat) {
			return; // User canceled the prompt, so we don't proceed
		}

		// Determine the content format based on the selected file format
		if (fileFormat === 'docx' || fileFormat === 'pdf') {
			content = easyMDE.markdown(rawMarkdownContent); // Convert Markdown to HTML for docx and pdf
		} else {
			content = rawMarkdownContent; // Use raw Markdown for txt and md
		}

		try {
			const response = await fetch('/save-as', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filename, fileFormat, content })
			});

			if (response.ok) {
				const data = await response.json();
				alert(data.message);
			} else {
				const data = await response.json();
				alert(`Error: ${data.message}`);
			}
		} catch (error) {
			console.error('Error saving file:', error);
			alert('An error occurred while saving the file.');
		}
}

function loadFolderStructure() {
	  fetch('/files-with-structure')
		.then(response => response.json())
		.then(data => {
		  const fileExplorerContainer = document.querySelector('.file-explorer-container');
		  fileExplorerContainer.innerHTML = ''; // Clear previous entries

		  data.forEach(folder => {
			const folderEntry = document.createElement('div');
			folderEntry.className = 'folder-entry';

			const folderNameContainer = document.createElement('div');
			folderNameContainer.className = 'folder-name-container';

			const folderDiv = document.createElement('div');
			folderDiv.textContent = folder.name;
			folderDiv.className = 'folder-name';
			folderDiv.setAttribute('tabindex', '0');
			folderNameContainer.appendChild(folderDiv);

			// Create a "Remove" button for each folder
			const removeBtn = document.createElement('button');
			removeBtn.innerHTML = '&#10008;';
			removeBtn.className = 'remove-folder-btn';
			removeBtn.addEventListener('click', (e) => {
			  e.stopPropagation(); // Prevent the folder click event
			  removeFolder(folder.path); // Adjust as needed to use the correct path
			});

			folderNameContainer.appendChild(removeBtn);
			folderEntry.appendChild(folderNameContainer);

			fileExplorerContainer.appendChild(folderEntry);

			const fileListUl = document.createElement('ul');
			fileListUl.style.display = 'none'; // Initially hidden
			fileListUl.setAttribute('data-folder-path', folder.path.replace(/\\/g, '/')); // This should match the folderPath used in loadFiletoMenu
			folderEntry.appendChild(fileListUl); // Append the list to the folder entry

			folderDiv.addEventListener('click', () => {
			  // Correctly access fileListUl directly, as it's already in scope
			  const isVisible = fileListUl.style.display === 'block';
			  document.querySelectorAll('.file-explorer-container ul').forEach(ul => ul.style.display = 'none'); // Hide all
			  fileListUl.style.display = isVisible ? 'none' : 'block';
			  activeFolderPath = isVisible ? '' : folder.path; // Update or clear activeFolderPath based on visibility
			  updateStatusBar(activeFolderPath, currentFilename);
			  if (!isVisible) {
				loadFiletoMenu(folder.path, fileListUl);
				folderDiv.setAttribute('data-files-loaded', 'true');
			  }
			});

			// Check if this folder should be expanded after creation
			if (folder.path === activeFolderPath) {
			  fileListUl.style.display = 'block'; // Open the folder's file list
			  loadFiletoMenu(folder.path, fileListUl); // Load its contents
			}
		  });

		  // Add "Add Folder" button
		  addFolderButton(fileExplorerContainer);
		});
	}

function addFolderButton(container) {
		const addFolderBtn = document.createElement('button');
		addFolderBtn.textContent = '+ Add Folder';
		addFolderBtn.className = 'add-folder-btn';
		addFolderBtn.addEventListener('click', addFolder); // Ensure you have an `addFolder` function implemented
		container.appendChild(addFolderBtn);
	}

function removeFolder(folderPath) {
		if (confirm(`Are you sure you want to remove this folder: ${folderPath}? This action cannot be undone.`)) {
			fetch('/remove-folder', {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify({ folderPath: folderPath })
			})
			.then(response => response.json())
			.then(data => {
				alert(data.message);
				loadFolderStructure();
			})
			.catch(error => console.error('Failed to remove folder:', error));
		}
	}

function addFolder() {
		fetch('/select-folder')
		.then(response => response.json())
		.then(data => {
			if (data.folderPath) {
				// Assuming data.folderPath is the full path you want to add
				const folderPath = data.folderPath; // This is the full path
				const folderName = folderPath.split(/(\\|\/)/g).pop(); // Extracts the folder name

				// Send both folderName and folderPath to the backend
				fetch('/add-folder', {
					method: 'POST',
					headers: {'Content-Type': 'application/json'},
					body: JSON.stringify({ folderName, folderPath })
				})
				.then(response => response.json())
				.then(data => {
					alert(data.message);
					loadFolderStructure(); // Reload to reflect changes
				});
			} else {
				alert('No folder selected.');
			}
		});
	}

function loadFiletoMenu(folderPath) {
	  const fileListUl = document.querySelector(`ul[data-folder-path="${folderPath.replace(/\\/g, '/')}"]`);

	  if (!fileListUl) {
		console.error('Failed to find file list container for folder:', folderPath);
		return;
	  }

	  fetch(`/folder-files?folderPath=${encodeURIComponent(folderPath)}`)
		.then(response => response.json())
		.then(data => {
		  fileListUl.innerHTML = ''; // Clear before adding new items

		  data.files.forEach(file => {
			const fileItem = document.createElement('div');
			fileItem.className = 'file-item';

			const fileName = document.createElement('div');
			fileName.textContent = file;
			fileName.classList.add('file-name');
			fileName.setAttribute('tabindex', '0');
			fileItem.appendChild(fileName);

			const headersListContainer = document.createElement('div');
			headersListContainer.classList.add('headers-list-container');
			headersListContainer.style.display = 'none'; // Initially hidden

			fetchAndDisplayHeaders(`${folderPath}/${file}`, headersListContainer);
			
			fileItem.appendChild(headersListContainer);

			fileItem.addEventListener('click', () => {
			  headersListContainer.style.display = headersListContainer.style.display === 'none' ? 'block' : 'none';
			  loadDocumentContent(`${folderPath}/${file}`);
			  
			  setTimeout(() => { updateStatusBar(activeFolderPath, currentFilename); }, 100);
			});

			fileListUl.appendChild(fileItem);
		  });
		})
		.catch(error => console.error('Failed to load files:', error));
	}
	
function fetchAndDisplayHeaders(filePath, headersListContainer) {
	  fetch('/get-markdown-headers', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ filePath })
	  })
	  .then(response => {
		if (!response.ok) {
		  throw new Error('Network response was not ok');
		}
		return response.json();
	  })
	  .then(data => {
		const headersList = createHeaderList(data, 0, filePath);
		headersListContainer.appendChild(headersList);
	  })
	  .catch(error => console.error('Error fetching headers:', error));
	}

function createHeaderList(headers, level = 0, documentPath) {
    const headersList = document.createElement('div');
    headersList.classList.add('headers-list');
    
    headers.forEach(header => {
        const headerItem = document.createElement('div');
        headerItem.classList.add('header-item');
        headerItem.textContent = `${' '.repeat(level * 2)}${header.text}`;
        headerItem.setAttribute('tabindex', '0');
        headerItem.dataset.documentPath = documentPath; // Store document path
        
        headerItem.addEventListener('click', async (event) => {
            event.stopPropagation();
            
            const headerDocumentPath = event.currentTarget.dataset.documentPath;
            if (activeFolderPath !== headerDocumentPath) {
                await loadDocumentContent(headerDocumentPath);
            }
            scrollToHeaderInEditor(header.line);
            setTimeout(() => { updateStatusBar(activeFolderPath, currentFilename); }, 100);
        });
        
        headersList.appendChild(headerItem);
        
        if (header.children && header.children.length > 0) {
            headersList.appendChild(createHeaderList(header.children, level + 1, documentPath));
        }
    });
    
    return headersList;
}

function scrollToHeaderInEditor(lineNumber) {
		easyMDE.codemirror.scrollIntoView({ line: lineNumber - 1, ch: 0 });
		easyMDE.codemirror.setCursor({ line: lineNumber - 1, ch: 0 });
		easyMDE.codemirror.focus();  // Optionally set focus to EasyMDE after scrolling
	}

async function loadDocumentContent(documentPath) {
		try {
			const response = await fetch('/load', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ filename: documentPath })
			});
			if (!response.ok) throw new Error('Failed to load document');

			const { content } = await response.json();
			easyMDE.value(content); // Assuming 'content' is the MD content
			
			// Update currentFilename and activeFolderPath based on documentPath
			const pathComponents = documentPath.split('/'); // Adjust the separator if necessary
			const fullFilename = pathComponents.pop(); // Get the last element as full filename including extension
			activeFolderPath = pathComponents.join('/'); // Rejoin the remaining elements as the folder path
			setTimeout(() => { updateStatusBar(activeFolderPath, currentFilename); }, 100);
			// Remove file extension from filename, assuming extension starts with the last '.'
			const extensionIndex = fullFilename.lastIndexOf('.');
			currentFilename = extensionIndex > 0 ? fullFilename.substring(0, extensionIndex) : fullFilename;
			
		} catch (error) {
			console.error('Error loading document:', error);
		}
	}

function updateStatusBar(activeFolderPath, currentFilename) {
		// Select the status bar element by its class name
		const statusBarElement = document.querySelector('.current-filename');
		if (statusBarElement) {
			// Update the inner HTML with the new path and filename
			statusBarElement.innerHTML = `${activeFolderPath ? activeFolderPath + ' | ' : ''}${currentFilename || 'New File'}.md`;
		}
	}

function handleKeyboardNavigationForExplorer(event) {
    if (!event.ctrlKey || !['ArrowUp', 'ArrowDown', 'Enter', ' '].includes(event.key)) return;
    const focusableElements = Array.from(document.querySelectorAll('.file-explorer-container .folder-name, .file-explorer-container .file-name, .file-explorer-container .header-item'));
    let currentFocusedIndex = focusableElements.findIndex(element => element === document.activeElement);
    let nextFocusedIndex = currentFocusedIndex;

    switch (event.key) {
        case 'ArrowDown':
            do {
                nextFocusedIndex = (nextFocusedIndex + 1) % focusableElements.length; // Cycle through the elements
            } while (!isElementVisible(focusableElements[nextFocusedIndex]) && nextFocusedIndex !== currentFocusedIndex);
            break;
        case 'ArrowUp':
            do {
                nextFocusedIndex = (nextFocusedIndex - 1 + focusableElements.length) % focusableElements.length; // Cycle in reverse
            } while (!isElementVisible(focusableElements[nextFocusedIndex]) && nextFocusedIndex !== currentFocusedIndex);
            break;
        case 'Enter':
        case ' ':
            //event.preventDefault(); // Prevent default action (e.g., form submission)
            document.activeElement.click(); // Simulate a click event on the currently focused element
            return; // Exit the function early for these cases
    }

    if (currentFocusedIndex !== nextFocusedIndex) {
        focusableElements[nextFocusedIndex]?.focus();
        //event.preventDefault(); // Prevent scrolling
    }
}

function isElementVisible(element) {
    return element.offsetWidth > 0 && element.offsetHeight > 0;
}

