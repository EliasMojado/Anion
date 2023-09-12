const { ipcRenderer } = require('electron');
const path = require('path');


ipcRenderer.on('request-editor-content', (event) => {
  const content = getEditorContent(); // Assuming getEditorContent is defined in this scope
  ipcRenderer.send('editor-content-response', content);
});

ipcRenderer.on('request-current-tab-filePath', (event) => {
  const filePath = activeTab ? activeTab.filePath : null;
  ipcRenderer.send('current-tab-filePath-response', filePath);
});

ipcRenderer.on('update-tab-name', (event, newName) => {
  updateTabName(newName);
});

ipcRenderer.on('populate-editor-content', (event, content, filePath) => {
  console.log(content, filePath);
  window.addTab(filePath, content);  // Create a new tab and populate it with content and filePath
});

ipcRenderer.on('update-tab-filePath', (event, newFilePath) => {
  updateTabFilePath(newFilePath);
});

const updateTabFilePath = (newFilePath) => {
  if (activeTab) {
    console.log(newFilePath);
    activeTab.filePath = newFilePath;
  }
};

const updateTabName = (newName) => {
  if (activeTab) {
    activeTab.textContent = newName;
  }
};

let activeTab = null;

document.addEventListener("DOMContentLoaded", () => {
  const tabsContainer = document.getElementById("tabs-container");
  const tabContentContainer = document.getElementById("tab-content-container");
  const addTabButton = document.getElementById("add-tab-button");

  let tabCounter = 0;

  // Function to activate a tab
  const activateTab = (tab) => {
    if (activeTab) {
      activeTab.classList.remove("active");
      document.getElementById(`tab-content-${activeTab.id.split('-')[1]}`).classList.remove("active");
    }
    tab.classList.add("active");
    document.getElementById(`tab-content-${tab.id.split('-')[1]}`).classList.add("active");
    activeTab = tab;
    ipcRenderer.send('active-tab-filePath', tab.filePath);  // Send filePath to main process
  };

  // Function to add a new tab
  const addTab = (filePath=null, content='') => {
    tabCounter++;
    const tab = document.createElement("div");
    tab.className = "tab";
    tab.id = `tab-${tabCounter}`;
    tab.textContent = filePath ? path.basename(filePath) : `Untitled ${tabCounter}`; // Set the tab name based on filePath if available
    tab.filePath = filePath; // Set the filePath attribute
    tab.addEventListener("click", () => activateTab(tab));

    const closeButton = document.createElement("button");
    closeButton.className = "close-tab-button";
    closeButton.textContent = "×";
    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      const parentTab = event.target.closest('.tab');
      const tabId = parentTab.id;
      const contentId = `tab-content-${tabId.split('-')[1]}`;
      parentTab.remove();
      document.getElementById(contentId).remove();
      if (activeTab === parentTab) {
        activeTab = null;
      }
    });

    tab.appendChild(closeButton);
    tabsContainer.appendChild(tab);

    const tabContent = document.createElement("div");
    tabContent.className = "tab-content";
    tabContent.id = `tab-content-${tabCounter}`;

    const editorDiv = document.createElement("div");
    editorDiv.className = "editor";
    editorDiv.id = `editor-${tabCounter}`;
    tabContent.appendChild(editorDiv);

    tabContentContainer.appendChild(tabContent);

    const editor = ace.edit(`editor-${tabCounter}`);
    if (editor) {
      console.log("Editor initialized");
      editor.setTheme("ace/theme/twilight");
      editor.session.setMode("ace/mode/javascript");
      editor.setValue(content);
    } else {
      console.log("Editor failed to initialize");
    }

    activateTab(tab);
  };

  addTabButton.addEventListener("click", addTab);
  addTab();

  window.addTab = addTab;
});

// Expose the getEditorContent function to the main process
window.getEditorContent = function() {
  try {
    if (activeTab) {
      const tabId = activeTab.id;
      const editorId = `editor-${tabId.split('-')[1]}`;
      const editor = ace.edit(editorId);
      if (editor) {
        return editor.getValue();
      } else {
        console.log("Failed to find editor for active tab");
        return "";
      }
    } else {
      console.log("No active tab");
      return "";
    }
  } catch (error) {
    console.log(error);
    return "wala ka detect boss";
  }
};

window.updateTabName = updateTabName;
window.updateTabFilePath = updateTabFilePath;
