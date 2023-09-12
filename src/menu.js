const { Menu, app, dialog, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// IPC listener for receiving editor content from renderer process
ipcMain.on('editor-content-response', (event, content) => {
  // Your code to save the content to a file
  fs.writeFileSync(event.sender.filePath, content);
});

const createFileMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New File',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Your code for creating a new file

          }
        },
        {
          label: 'Open File',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { filePaths } = await dialog.showOpenDialog({
              properties: ['openFile']
            });
        
            if (filePaths.length > 0) {
              const filePath = filePaths[0];
              const content = fs.readFileSync(filePath, 'utf-8');
              const win = BrowserWindow.getFocusedWindow();
              console.log(content);
              win.webContents.send('populate-editor-content', content, filePath);  // Include filePath here
              const fileName = path.basename(filePath);
              win.webContents.send('update-tab-name', fileName);
              win.webContents.send('update-tab-filePath', filePath);
            }
          }
        },        
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            const win = BrowserWindow.getFocusedWindow();
            win.webContents.send('request-current-tab-filePath');
            ipcMain.once('current-tab-filePath-response', async (event, existingFilePath) => {
              let filePath = existingFilePath;
        
              if (!filePath) {
                const { filePath: newFilePath } = await dialog.showSaveDialog({
                  filters: [
                    { name: 'ION Document', extensions: ['ion'] },
                  ],
                });
                filePath = newFilePath;
              }
        
              if (filePath) {
                win.webContents.filePath = filePath;  // Set custom property
                win.webContents.send('request-editor-content');
                ipcMain.once('editor-content-response', (event, content) => {
                  fs.writeFileSync(filePath, content);  // Use custom property
                  const fileName = path.basename(filePath); // Assuming you've required the 'path' module
                  win.webContents.send('update-tab-name', fileName);
                  win.webContents.send('update-tab-filePath', filePath);
                });
              }
            });
          }
        },        
        {
          label: 'Save as',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            // Your code for saving a file
            const { filePath } = await dialog.showSaveDialog({
              filters: [
                { name: 'ION Document', extensions: ['ion']},
              ]
            });

            if (filePath) {
              const win = BrowserWindow.getFocusedWindow();
              win.webContents.filePath = filePath;  // Set custom property
              win.webContents.send('request-editor-content');
              ipcMain.once('editor-content-response', (event, content) => {
                fs.writeFileSync(event.sender.filePath, content);  // Use custom property
                const fileName = path.basename(event.sender.filePath); // Assuming you've required the 'path' module
                win.webContents.send('update-tab-name', fileName);
              });
            }
          }
        },
        {
          type: 'separator'
        },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'CmdOrCtrl+Y', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+=',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom + 1);
            }
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: (item, focusedWindow) => {
            if (focusedWindow) {
              const currentZoom = focusedWindow.webContents.getZoomLevel();
              focusedWindow.webContents.setZoomLevel(currentZoom - 1);
            }
          }
        },        
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: (item, focusedWindow) => { if (focusedWindow) focusedWindow.reload(); } },
        { label: 'Toggle DevTools', accelerator: 'CmdOrCtrl+I', click: (item, focusedWindow) => { if (focusedWindow) focusedWindow.webContents.toggleDevTools(); } }
      ]
    },
    {
      label: 'Terminal',
      submenu: [
        { label: 'Open Terminal', accelerator: 'CmdOrCtrl+T', click: () => {}},
        { label: 'New Terminal', accelerator: 'CmdOrCtrl+Shift+T', click: () => {}},
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

module.exports = {
  createFileMenu
};
