const { app, BrowserWindow } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

const PROJECT_ROOT = path.join(__dirname, "..");

let mainWindow;
let metroProcess;

function startMetro() {
  return new Promise((resolve) => {
    metroProcess = spawn("npx", ["expo", "start", "--web", "--port", "8081"], {
      cwd: PROJECT_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });

    metroProcess.stdout.on("data", (data) => {
      const output = data.toString();
      if (output.includes("Web:")) {
        setTimeout(resolve, 2000);
      }
    });

    metroProcess.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    setTimeout(resolve, 35000);
  });
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 410,
    height: 860,
    title: "FasalGuard",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.setMenuBarVisibility(false);

  try {
    await startMetro();
    mainWindow.loadURL("http://localhost:8081");
  } catch {
    mainWindow.loadURL("http://localhost:8081");
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (metroProcess) metroProcess.kill();
  app.quit();
});

app.on("before-quit", () => {
  if (metroProcess) metroProcess.kill();
});
