let responseHistory = [];

document.addEventListener('keydown', function(event) {
	fetch('/get_api_key')
    .then(response => response.json())
    .then(data => {
        if (data.api_key) {
            document.getElementById('api-key-input').value = data.api_key;
        }
    })
    .catch(error => console.error('Error fetching API key:', error));
    if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        openAIDialog();
    }
	document.addEventListener('keydown', function(event) {
    if (event.keyCode === 27) {  // ESC key
        closeDialog();
    }
});
});

document.getElementById('writing-assistant').addEventListener('click', function() {
            openAIDialog();
        });

function closeDialog() {
    const dialogContainer = document.getElementById("dialog-container");
    if (dialogContainer) {
        dialogContainer.style.display = 'none';
    }
}

function openAIDialog() {
  const dialogContainer = document.getElementById("dialog-container");
  const lastModelVersion = localStorage.getItem("lastModelVersion");

  dialogContainer.innerHTML = `
    <div>
      <label>Model:</label>
      <select id="model-select">
        <option value="gpt-3.5-turbo">GPT-3.5</option>
        <option value="gpt-4-turbo">GPT-4</option>
        <option value="gemini-pro">Gemini 1.0 Pro</option>
        <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro</option>
      </select>
    </div>
    <div>
      <label for="api-key-input">API Key:</label>
      <input type="password" id="api-key-input" placeholder="Enter your API Key">
      <button onclick="saveAPIKey()">&#128190;</button>
    </div>
    <div>
      <label for="general-summary">Additional Information:</label>
      <textarea id="general-summary"></textarea>
    </div>
    <button id="send-btn" onclick="sendPrompt()">Send</button>
    <div id="ai-response-container">
	<label>Response:</label>
	  <div id="loading-indicator" style="display: none;">Loading...</div>
      <textarea id="ai-response" readonly style="height: 200px; width: 100%;"></textarea>
      <button id="refresh-btn" onclick="sendPrompt()">Refresh</button>
      <button id="apply-btn" onclick="applyResponse()">Apply</button>
	  <button id="cls-btn" onclick="closeDialog()">Close</button>
    </div>
    <select id="response-history"></select>  <!-- Place this inside the dialog -->
  `;
  document.getElementById("model-select").value = lastModelVersion || "gpt-3.5-turbo";
  updateResponseList();
  dialogContainer.style.display = 'block'; // Make the dialog visible
}

function saveAPIKey() {
    const modelType = document.getElementById("model-select").value;
    const apiKey = document.getElementById("api-key-input").value;
    const payload = {
        model_type: modelType,  // Ensure this aligns with 'openai' or 'gemini'
        api_key: apiKey
    };

    fetch('/save_api_key', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => alert(data.message))
    .catch(error => console.error('Error saving API key:', error));
}


function sendPrompt() {
    const modelVersion = document.getElementById("model-select").value;
    localStorage.setItem("lastModelVersion", modelVersion);
    const apiKey = document.getElementById("api-key-input").value;
    const prompt = generatePrompt();
    const loadingIndicator = document.getElementById("loading-indicator");

    loadingIndicator.style.display = 'block'; // Show loading indicator

    fetch('/get_ai_response', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt: prompt, model_version: modelVersion, api_key: apiKey})
    })
    .then(response => response.json())
    .then(data => {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
        if (data.error) {
            console.error('API error:', data.error);
            alert("API Error: " + data.error); // Show error to the user
        } else {
            document.getElementById("ai-response").value = data.response;
            responseHistory.push(data.response);
            updateResponseList();
        }
    })
    .catch(error => {
        loadingIndicator.style.display = 'none'; // Hide loading indicator
        console.error('Error getting AI response:', error);
        alert("Network Error: There was an issue processing your request.");
    });
}


function updateResponseList() {
    const responseList = document.getElementById("response-history");
    responseList.innerHTML = '';  // Clear previous entries
    responseHistory.forEach((resp, index) => {
        const option = document.createElement("option");
        option.value = index;
        option.text = resp.slice(0, 50) + '...';  // Show a snippet
        responseList.appendChild(option);
    });

    // Add an event listener to update the display area when a response is selected
    responseList.onchange = function() {
        const selectedResponse = responseHistory[responseList.value];
        document.getElementById("ai-response").value = selectedResponse;  // Update display area
    };
}

function generatePrompt() {
    const currentText = window.easyMDE.value();  // Retrieve current text from EasyMDE
    const relevantText = getRelevantText(currentText);  // Extract a relevant portion of the text

    const generalSummary = document.getElementById("general-summary").value.trim();

    let prompt = "Continue the following text in a natural and coherent manner. Ensure the continuation is seamless and fits the current narrative style and content format using Markdown for any necessary formatting:\n\n";
    prompt += `### Current Text\n${relevantText}\n`;

    if (generalSummary) {
        prompt += `### Context\n${generalSummary}\n`;
    }

    prompt += "Please provide a continuation that aligns with the themes and tone of the text above.";
	console.log(prompt);
    return prompt;
}

function applyResponse() {
    const responseList = document.getElementById("response-history");
    const selectedResponse = responseHistory[responseList.value];
    const easyMDE = window.easyMDE; // Retrieve the globally stored EasyMDE instance
    if (easyMDE && selectedResponse) {
        easyMDE.value(easyMDE.value() + '\n' + selectedResponse); // Append the selected response
        document.getElementById("dialog-container").style.display = 'none';  // Close dialog box
    } else {
        console.error('EasyMDE not found or no response selected');
    }
}

function countTokens(text) {
    return text.trim().split(/\s+/).length;  // Simple whitespace-based tokenization
}

function getRelevantText(text) {
    const maxTokens = 3000;  // Set a safe limit to leave room for the prompt text and user inputs
    let paragraphs = text.split('\n\n');
    let relevantText = '';
    let tokenCount = 0;

    // Start from the end of the text and work backwards until the token limit is reached
    for (let i = paragraphs.length - 1; i >= 0; i--) {
        let paragraph = paragraphs[i];
        let paragraphTokens = countTokens(paragraph);
        if (tokenCount + paragraphTokens > maxTokens) break;  // Stop if adding this paragraph would exceed the limit
        relevantText = paragraph + '\n\n' + relevantText;  // Prepend to keep the order
        tokenCount += paragraphTokens;
    }

    return relevantText.trim();
}
