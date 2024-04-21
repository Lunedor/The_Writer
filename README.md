# The Writer

**The Writer** is a powerful markdown editor with a clean and intuitive user interface. It's designed to help writers, authors, and content creators focus on their craft by providing a distraction-free writing environment with useful features.

![image](https://github.com/Lunedor/The_Writer/assets/33136986/eaba3906-649f-4702-8358-38f5ffe1a43d)


## Features

**Markdown Editing:** Write and preview your content in real-time with syntax highlighting and formatting tools.

**File Explorer:** Easily navigate and manage your files and folders within the app.

**AI Writing Assistant:** Get writing suggestions and content continuations using advanced AI models like GPT-3.5, GPT-4, Gemini 1.0 Pro and Gemini 1.5 Pro.

**Focus Mode:** Highlight the current sentence or paragraph to help you stay focused on the text you're writing.

**Typewriter Scrolling:** Simulate a typewriter-like experience by automatically scrolling the editor to keep your cursor centered.

**Theme Customization:** Customize the app's appearance with built-in light and dark themes, or create your own custom themes.

**Font Selection:** Choose from a variety of font options to find the perfect writing experience.

**Save As Options:** Save your work in various formats, including Markdown, TXT, DOCX, and PDF.

**Keyboard Shortcuts & Navigation:** You can use entire features with using keyboard shortcuts and navigation.

**Adding Images:** Users can upload images directly within the application, supporting formats like PNG, JPEG, and JPG up to 2MB. The image upload feature is designed to be intuitive, allowing for drag-and-drop capabilities or paste from clipboard.

**Custom Image Resizing:** Once images are uploaded, users have the flexibility to customize their size directly in Markdown by adding parameters within the image tag. This feature supports both pixel-based and percentage-based adjustments to accommodate various document layouts and design needs. 

**Examples include:**

 - Specifying pixel dimensions: ...image.png "width=50px, height=100px")

 - Setting width only and letting height scale automatically or vice versa: ...image.png "width=50px") or ...image.png "height=50px")

 - Adjusting width as a percentage of the container: ...image.png "width=200%")



## Getting Started

To get started with The Writer, follow these steps:

Clone the repository: git clone https://github.com/Lunedor/the-writer.git

Install the required Python dependencies: pip install -r requirements.txt

Start the Flask development server: python main.py

It will open pywebview GUI to use app also you can use it via browser

Open your web browser and navigate to http://localhost:5000

*Or you can download .exe file of [alpha release](https://github.com/Lunedor/The_Writer/releases/tag/Alpha) and start to app without needing installation.*

***Please note that the app stores preferences, theme data, folder paths, and API keys in JSON files. Additionally, uploaded images will be saved for serving. The JSON files will be stored in C:\Users\UserName\AppData\Roaming\\.the-writer, and images will be stored in the \images folder in the same directory.***


## Keyboard Shortcut List

**New File:** Press Ctrl + N to create a new file in the editor.

**Save File:** Press Ctrl + S to save the current file.

**Save As File:** Press Shift + Ctrl + S to save the file with a different name or format.

**Toggle Theme:** Press Ctrl + D to switch between light and dark themes for the interface.

**Focus Mode:** Press Ctrl + F to activate focus mode, which highlights the active sentence in the editor for better concentration.

**Toggle Typewriter Mode:** Press Ctrl + T to enable or disable typewriter mode for smoother writing experience.

**AI Assistant:** Press Ctrl + M to open AI Asisstant screen.

**Hide/Show File Explorer:** Press Ctrl + Y to toggle the visibility of the file explorer panel. If you hide it will be visible only when you hover on.

**File Explorer:** Press Ctrl + E to toggle the file explorer, allowing you to navigate through files and folders with Ctrl + Arrow Keys and Ctrl + Enter for selection.

**Focus on Editor:** Press Ctrl + Q to focus on the editor, making it ready for typing.

**Hide/Show Status Bar:** Press Ctrl + K to toggle the visibility of the status bar.

**Also you can use EasyMDE shortcuts while in the editor.**


## Contributing

We welcome contributions from the community! If you'd like to contribute to The Writer, please follow these steps:


## Fork the repository

Create a new branch: git checkout -b my-feature-branch

Make your changes and commit them: git commit -m 'Add some feature'

Push to the branch: git push origin my-feature-branch

Submit a pull request


## License

This project is licensed under the MIT License.

## Acknowledgments
**EasyMDE** - A simple, embeddable, and beautiful Markdown editor

**Flask** - The Python web framework powering the backend

**PyWebView** - GUI for your Python program with JavaScript, HTML, and CSS
