// Modules to control application life and create native browser window
const { app, BrowserWindow } = require('electron')
const path = require('path')

app.setUserTasks([
  {
    program: process.execPath,
    arguments: '--new-window',
    iconPath: process.execPath,
    iconIndex: 0,
    title: 'Open Picker',
    description: 'Create a new color picker window'
  }
])

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 223,
    height: 315,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, '/assets/icons/edit-tools.png'),
    maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.on('focus', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  mainWindow.restore();
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

