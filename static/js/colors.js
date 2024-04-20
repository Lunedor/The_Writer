let themeData; // Global variable to store the theme data
let themeMode;
let themeName;

function registerEventListenersColor() {
    fetchAndStoreThemeData().then(() => {
        document.getElementById('theme-select').addEventListener('change', function() {
			themeName = this.value;
            applyThemeValues(themeName);
			savePreferences();	
        });
		updateThemeMode();
		applyThemeValues(themeName);
		
        document.getElementById('create-theme-btn').addEventListener('click', function() {
            createNewTheme();
			applyThemeValues(themeName);
			updateDropdownSelection();
        });

        document.getElementById('apply-theme-btn').addEventListener('click', function() {
            applyTheme();
			applyThemeValues(themeName);
        });

        document.getElementById('delete-theme-btn').addEventListener('click', function() {
            const selectedThemeName = document.getElementById('theme-select').value;
            if (selectedThemeName === 'default') {
                alert('The default theme cannot be deleted.');
                return;
            }
            if (confirm(`Are you sure you want to delete the theme "${selectedThemeName}"?`)) {
                deleteTheme(selectedThemeName);
            }
        });
        
        populateFontSelectors();			
		registerColorPickerListeners();
		setupResetButton();

        document.getElementById('font-select').addEventListener('change', function() {
            applyFont('body, button, input, textarea, select', this.value); // Apply to body for UI font
        });
			
		document.getElementById('rename-theme-btn').addEventListener('click', function() {
			const themeSelect = document.getElementById('theme-select');
			if (document.getElementById('temp-input-rename')) {
				document.getElementById('temp-input-rename').focus();
				return;
			}
			
			const originalIndex = themeSelect.selectedIndex;
			const oldThemeName = themeSelect.options[originalIndex].text;

			if (oldThemeName === 'Default Theme') {
				alert('The default theme cannot be renamed.');
				return;
			}

			// Create and style the input element for renaming
			let input = document.createElement('input');
			input.type = 'text';
			input.value = oldThemeName;
			input.style.width = "112px";
			input.style.height = '21px';
			input.style.margin = 'auto';
			input.id = "temp-input-rename";

			// Insert input field right before the select element and hide the select
			themeSelect.parentNode.insertBefore(input, themeSelect);
			themeSelect.style.display = 'none';

			input.focus();

			// Define behavior when user presses Enter, Escape, or input loses focus
			input.addEventListener('keydown', function(event) {
				if (event.key === 'Enter') {
					input.blur();  // Trigger the onblur event to save the name
				} else if (event.key === 'Escape') {
					restoreOriginalName(input, themeSelect, oldThemeName);
				}
			});

			input.onblur = function() {
				if (this.value.trim() === oldThemeName || !this.value.trim()) {
					restoreOriginalName(input, themeSelect, oldThemeName);
				} else {
					finishRenaming(input, themeSelect, originalIndex, oldThemeName);
				}
			};
		});

		// Attach toggle function to each dropdown button
		document.querySelectorAll('.dropdown > button').forEach(button => {
			button.addEventListener('click', toggleDropdown);
		});

		// Global listener to handle clicks outside of dropdowns
		document.body.addEventListener('click', closeDropdowns);

		// Prevent dropdowns from closing when clicked inside, but allow propagation for inner button clicks
		document.querySelectorAll('.dropdown-content-file, .dropdown-content-color, .dropdown-content-focus').forEach(dropdownContent => {
			dropdownContent.addEventListener('click', event => {
				if (event.target.tagName !== 'BUTTON') { // Allow button clicks to propagate
					console.log("Click inside dropdown content, stopping propagation for non-button elements");
					event.stopPropagation();
				}
			});
		});
    }).catch(error => console.error('Error registering event listeners:', error));
}

// Function to close all dropdowns except the current one being toggled
function closeAllDropdowns(currentDropdown) {
	document.querySelectorAll('.dropdown-content-file, .dropdown-content-color, .dropdown-content-focus').forEach(dropdownContent => {
		if (dropdownContent !== currentDropdown && dropdownContent.classList.contains('show')) {
			dropdownContent.classList.remove('show');
			console.log("Other dropdowns closed");
		}
	});
}

// Toggle the visibility of the dropdown
function toggleDropdown(event) {
	let dropdown = event.target.nextElementSibling;
	if (dropdown && event.target.tagName === 'BUTTON') {
		closeAllDropdowns(dropdown); // Close all other dropdowns first
		dropdown.classList.toggle('show');
		event.stopPropagation(); // Stop the click from propagating to the body only for the button that toggles
		console.log("Dropdown toggled");
	}
}

// Close dropdowns if clicked outside
function closeDropdowns(event) {
	console.log("Global click detected, checking dropdowns...");
	document.querySelectorAll('.dropdown').forEach(dropdown => {
		const button = dropdown.querySelector('button');
		const dropdownContent = dropdown.querySelector('.dropdown-content-file, .dropdown-content-color, .dropdown-content-focus');
		if (dropdownContent) {
			// Check if the click is outside the dropdown content and the associated button
			if (!dropdownContent.contains(event.target) && (!button || !button.contains(event.target))) {
				if (dropdownContent.classList.contains("show")) {
					console.log("Outside click detected, closing dropdown");
					dropdownContent.classList.remove('show');
				}
			}
		} else {
			console.log("Element not found: ", button, dropdownContent);
		}
	});
}

function fetchAndStoreThemeData() {
    return fetch('/load-theme')
        .then(response => response.json())
        .then(data => {
            themeData = data;
            console.log('themeData:', themeData);
            updateThemeSelectOptions();
			updateDropdownSelection();
			return themeData;
        })
        .catch(error => console.error('Error loading theme data:', error));
}

function updateThemeSelectOptions() {
    const themeSelect = document.getElementById('theme-select');
    themeSelect.innerHTML = ''; // Clear existing options
    themeSelect.add(new Option('Default Theme', 'default'));
    themeData.custom.forEach(theme => {
        themeSelect.add(new Option(theme.name, theme.name));
    });
	themeSelect.value = themeName;
}

function applyCssVariables(themeProps) {
    const root = document.documentElement;
    Object.keys(themeProps).forEach(key => {
        root.style.setProperty(key, themeProps[key]);
    });
}

function createNewTheme() {
    const newThemeName = prompt("Enter the name of the new theme:");
	const themeSelect = document.getElementById('theme-select');
    if (newThemeName) {
        fetch('/load-theme')
            .then(response => response.json())
            .then(data => {
                const themeExists = data.custom.some(theme => theme.name === newThemeName);
                if (themeExists) {
                    alert("This theme name already exists. Please choose a different name.");
                } else {
                    const newTheme = {
                        name: newThemeName,
                        light: { ...data.default.light },
                        dark: { ...data.default.dark }
                    };
                    data.custom.push(newTheme);
                    saveUpdatedThemes(data);
                }
            })
            .catch((error) => console.error('Error loading themes:', error));
    } else {
        console.log("Theme creation was canceled or the name was empty.");
    }
}

function applyThemeValues(themeName = 'default') {
    let themeProps;
    if (!themeData) {
        console.error("Theme data not loaded yet, unable to apply theme.");
        return;
    }
    if (themeName === "default") {
        themeProps = themeData.default[themeMode];
    } else {
        const customTheme = themeData.custom.find(theme => theme.name === themeName);
        if (customTheme) {
            themeProps = customTheme[themeMode];
        } else {
            console.error(`Theme "${themeName}" not found in the theme data.`);
            // Fall back to the default theme
            themeProps = themeData.default[themeMode];
        }
    }
    if (themeProps) {
        applyCssVariables(themeProps);
        updateColorInputValues(themeProps, themeMode);
    } else {
        console.error("Selected theme properties are not found.");
    }
}

function updateColorInputValues(themeProps, themeMode) {
    document.getElementById('bg-color-picker').value = themeProps['--bg-color-' + themeMode];
    document.getElementById('text-color-picker').value = themeProps['--text-color-' + themeMode];
    document.getElementById('hover-color-picker').value = themeProps['--hover-color-' + themeMode];
    document.getElementById('editor-bg-color-picker').value = themeProps['--editor-bg-color-' + themeMode];
    document.getElementById('editor-text-color-picker').value = themeProps['--editor-text-color-' + themeMode];
	document.getElementById('editor-text-color-dimming-picker').value = themeProps['--editor-text-color-dimming-' + themeMode];

}

function saveUpdatedThemes(updatedThemes) {
    fetch('/save-theme', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedThemes)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Themes updated successfully:', data);
        fetchAndUpdateThemeSelect();
        alert('Theme updated successfully!');
    })
    .catch(error => console.error('Error updating themes:', error));
}

function deleteTheme(themeName) {
    fetch('/delete-theme', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ themeName: themeName })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            alert(data.error);
        } else {
            console.log('Theme deleted successfully:', data.message);
            fetchAndUpdateThemeSelect();
        }
    })
    .catch(error => console.error('Error deleting theme:', error));
}

function fetchAndUpdateThemeSelect() {
    fetch('/load-theme')
        .then(response => response.json())
        .then(data => {
            themeData = data;
            updateThemeSelectOptions();
        })
        .catch(error => console.error('Error loading theme data:', error));
}

function applyTheme() {
    const themeMode = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const selectedThemeName = document.getElementById('theme-select').value;

    // Save new theme values only if not the default theme
    if (selectedThemeName !== 'default') {
        saveThemeValues(selectedThemeName, themeMode);
		themeName = selectedThemeName;
		updateDropdownSelection();
    } else {
        alert('The default theme cannot be modified.');
    }
}

function saveThemeValues(themeName, themeMode) {
    // Ensure the theme being modified is not the default theme
    if (themeName === 'default') {
        alert('The default theme cannot be modified.');
        return;
    }

    // Find the custom theme in the themeData array
    const themeIndex = themeData.custom.findIndex(theme => theme.name === themeName);
    if (themeIndex === -1) {
        console.error('Theme not found');
        return;
    }

    // Collect new values from the color pickers
    const updatedThemeProps = {
        ['--bg-color-' + themeMode]: document.getElementById('bg-color-picker').value,
        ['--text-color-' + themeMode]: document.getElementById('text-color-picker').value,
        ['--hover-color-' + themeMode]: document.getElementById('hover-color-picker').value,
        ['--editor-bg-color-' + themeMode]: document.getElementById('editor-bg-color-picker').value,
        ['--editor-text-color-' + themeMode]: document.getElementById('editor-text-color-picker').value,
		['--editor-text-color-dimming-' + themeMode]: document.getElementById('editor-text-color-dimming-picker').value,
    };

    // Update the theme properties in the global themeData object
    Object.entries(updatedThemeProps).forEach(([key, value]) => {
        themeData.custom[themeIndex][themeMode][key] = value;
    });

    // Save the updated theme data back to the server
    saveUpdatedThemes(themeData);
}

function updateThemeMode() {
    themeMode = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    applyThemeValues(themeName);
}

function updateDropdownSelection() {
    const themeSelect = document.getElementById('theme-select');
    themeSelect.value = themeName; 
	console.log('applied to dropdown:', themeName);
}

function registerColorPickerListeners() {
    const colorPickers = [
        { id: 'bg-color-picker', cssVarBase: '--bg-color' },
        { id: 'text-color-picker', cssVarBase: '--text-color' },
        { id: 'hover-color-picker', cssVarBase: '--hover-color' },
        { id: 'editor-bg-color-picker', cssVarBase: '--editor-bg-color' },
        { id: 'editor-text-color-picker', cssVarBase: '--editor-text-color' },
		{ id: 'editor-text-color-dimming-picker', cssVarBase: '--editor-text-color-dimming' },
    ];

    colorPickers.forEach(picker => {
        const inputElement = document.getElementById(picker.id);
        if (inputElement) {
            inputElement.addEventListener('input', function() {
                const themeMode = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
                const cssVarName = `${picker.cssVarBase}-${themeMode}`;
                document.documentElement.style.setProperty(cssVarName, this.value);
                console.log(`Updated ${cssVarName} to ${this.value}`);
            });
        } else {
            console.error(`Element not found: ${picker.id}`);
        }
    });
}

function setupResetButton() {
    const resetButton = document.getElementById('reset-changes-btn');
    resetButton.addEventListener('click', function() {
        applyThemeValues(themeName); // Reapply the last saved theme settings
    });
}

function handleRename() {
    const input = this;
    const newName = input.value.trim();
    const oldName = input.parentNode.value;

    if (!newName || newName === oldName) {
        alert('Invalid or unchanged name.');
        restoreOriginalName(input, oldName); // Restore the old name if no change
        return;
    }

    const themeExists = themeData.custom.some(theme => theme.name === newName);
    if (themeExists) {
        alert("This theme name already exists. Please choose a different name.");
        restoreOriginalName(input, oldName);
        return;
    }

    const themeIndex = themeData.custom.findIndex(theme => theme.name === oldName);
    if (themeIndex !== -1) {
        themeData.custom[themeIndex].name = newName;
        saveUpdatedThemes(themeData);
        updateThemeSelectOptions();
    } else {
        console.error('Theme not found');
        restoreOriginalName(input, oldName);
    }
}

function restoreOriginalName(input, select, oldName) {
    // Remove the input and show the select again
    input.parentNode.removeChild(input);
    select.style.display = '';
    select.value = oldName;  // Restore the old name in the dropdown
}

function finishRenaming(input, select, index, oldName) {
    const newName = input.value.trim();
    if (newName && newName !== oldName && !Array.from(select.options).some(opt => opt.text === newName)) {
        select.options[index].text = newName;
        updateThemeData(oldName, newName);
    }

    restoreOriginalName(input, select, oldName);
}

function updateThemeData(oldName, newName) {
    let themes = themeData.custom;
    let theme = themes.find(theme => theme.name === oldName);
    if (theme) {
        theme.name = newName;
        saveUpdatedThemes(themeData); // Function to save the changes
    }
	updateDropdownSelection();
}

// Font list


// Populate font selectors
function populateFontSelectors() {
    const uiFontSelect = document.getElementById('font-select');
    const currentFont = localStorage.getItem('uiFont') || 'Roboto'; // Example default font
    const fonts = [
        'Arial',           // Clean Sans-serif
        'Times New Roman', // Clean Serif
        'Verdana',         // Clean Sans-serif
        'Courier New',     // Clean Monospaced
        'Tahoma',          // Clean Sans-serif
        'Georgia',         // Clean Serif
        'Garamond',        // Clean Serif
        'Roboto',          // Versatile Sans-serif
        'Roboto Condensed', // Condensed Sans-serif
        'Roboto Slab',     // Slab Serif
        'Roboto Mono',     // Monospaced version of Roboto
        'Alegreya',        // Clean Serif
        'Merriweather',    // Serif
        'Playfair Display',// High-contrast Serif
        'Lora',            // Calligraphic Serif
        'PT Serif',        // Versatile Serif
        'Open Sans',       // Neutral Sans-serif
        'Oswald',          // Semi-rounded Serif
        'Lato',            // Semi-rounded Sans-serif
        'Poppins',        // Semi-rounded Sans-serif
        'Nunito',          // Semi-rounded Sans-serif
        'Source Sans Pro', // UI-optimized Sans-serif
        'Noto Sans',       // Multi-language Sans-serif
        'Work Sans',       // Clean Sans-serif
        'Raleway',         // Clean Sans-serif
        'Ubuntu',          // Clean Sans-serif
        'Fira Code',       // Monospaced with Ligatures
        'Source Code Pro', // Monospaced
        'Inconsolata',     // Clean Monospaced
        'Courier Prime'    // Modern Monospaced for text
    ];
    
    fonts.forEach(font => {
        let option = new Option(font, font);
        option.selected = (font === currentFont);  // Set the currently active font as selected
        uiFontSelect.add(option);
    });
}


// Function to load and apply a font
function applyFont(selector, fontFamily) {
    // Check if the font is one of the predefined system fonts
    const systemFonts = ['Arial', 'Tahoma', 'Times New Roman', 'Verdana', 'Courier New', 'Georgia', 'Garamond'];
    const elements = document.querySelectorAll(selector);
    if (systemFonts.includes(fontFamily)) {
        elements.forEach(element => {
            element.style.fontFamily = fontFamily;
        });
    } else {
        // If not a system font, assume it needs to be loaded
        WebFont.load({
            google: {
                families: [fontFamily]
            },
            active: function() {
                elements.forEach(element => {
                    element.style.fontFamily = fontFamily;
                });
            }
        });
    }
    savePreferences();
}
