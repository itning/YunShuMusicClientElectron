import {app, BrowserWindow, dialog, ipcMain, Menu, nativeImage, screen, Tray} from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as fs from 'fs';
import * as os from 'os';

class Main {
  private win: BrowserWindow = null;
  private args = process.argv.slice(1);
  private isServe = this.args.some(val => val === '--serve');

  private createWindow(): BrowserWindow {
    const size = screen.getPrimaryDisplay().workAreaSize;

    // Create the browser window.
    const win = this.win = new BrowserWindow({
      x: size.width / 4,
      y: size.height / 4,
      width: size.width / 2,
      height: size.height / 2,
      webPreferences: {
        nodeIntegration: true,
        allowRunningInsecureContent: this.isServe,
        contextIsolation: false,  // false if you want to run 2e2 test with Spectron
        enableRemoteModule: true // true if you want to run 2e2 test  with Spectron or use remote module in renderer context (ie. Angular)
      },
    });

    if (process.platform === 'win32') {
      this.initThumbarButtons(win);
    }

    if (this.isServe) {
      win.webContents.openDevTools();
      require('electron-reload')(__dirname, {
        electron: require(`${__dirname}/node_modules/electron`)
      });
      win.loadURL('http://localhost:4200').catch(err => {
        dialog.showErrorBox('加载失败！', err);
        return err;
      });
    } else {
      win.loadURL(url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true
      })).catch(err => {
        dialog.showErrorBox('加载失败！', err);
        return err;
      });
    }

    win.on('close', (e) => {
      if (win.isVisible()) {
        e.preventDefault();
        win.hide();
      }
    });

    win.on('closed', () => this.win = null);
    return win;
  }

  private initThumbarButtons(win: BrowserWindow) {
    win.setThumbarButtons([
      {
        tooltip: '上一曲',
        icon: nativeImage.createFromPath(path.join(__dirname, 'file', 'left-arrow.png')),
        click() {
          win.webContents.send('play_event', 'last');
        }
      },
      {
        tooltip: '播放',
        icon: nativeImage.createFromPath(path.join(__dirname, 'file', 'play.png')),
        click() {
          win.webContents.send('play_event', 'play');
        }
      },
      {
        tooltip: '下一曲',
        icon: nativeImage.createFromPath(path.join(__dirname, 'file', 'right-arrow.png')),
        click() {
          win.webContents.send('play_event', 'next');
        }
      }
    ]);
  }

  run(): void {
    try {
      // This method will be called when Electron has finished
      // initialization and is ready to create browser windows.
      // Some APIs can only be used after this event occurs.
      // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
      app.on('ready', () => {
        setTimeout(() => this.createWindow(), 400);
        Menu.setApplicationMenu(null);
        if (process.platform === 'win32') {
          this.initTray();
        }
      });

      // Quit when all windows are closed.
      app.on('window-all-closed', () => {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
          app.quit();
        }
      });

      app.on('activate', () => {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (this.win === null) {
          this.createWindow();
        }
      });

    } catch (e) {
      console.error(e);
      // https://segmentfault.com/a/1190000018878931
      fs.appendFileSync(path.join(process.cwd(), 'error.log'), e.toString() + e.stack + os.EOL);
    }
  }

  private initTray() {
    const tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'file', 'left-arrow.png')));
    const contextMenu = Menu.buildFromTemplate([
      {
        icon: nativeImage.createFromPath(path.join(__dirname, 'file', 'left-arrow.png')),
        label: '上一曲',
        click: () => this.win.webContents.send('play_event', 'last')
      },
      {
        icon: nativeImage.createFromPath(path.join(__dirname, 'file', 'play.png')),
        label: '播放',
        click: () => this.win.webContents.send('play_event', 'play')
      },
      {
        icon: nativeImage.createFromPath(path.join(__dirname, 'file', 'right-arrow.png')),
        label: '下一曲',
        click: () => this.win.webContents.send('play_event', 'next')
      },
      {
        label: '主界面',
        click: () => this.win.show()
      },
      {
        label: '退出',
        click: () => this.win.destroy()
      }
    ]);
    tray.setToolTip('云舒音乐');
    tray.setContextMenu(contextMenu);
    tray.on('double-click', () => this.win.show());
    tray.on('click', () => this.win.webContents.send('play_event', 'play'));
    ipcMain.on('tray', (event, arg) => tray.setToolTip(arg));
  }
}

new Main().run();
