import {EventEmitter, Injectable} from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import {ipcRenderer, remote, webFrame} from 'electron';
import * as childProcess from 'child_process';
import * as fs from 'fs';
import * as mysql from 'mysql2';
import {Music} from '../entity/Music';
import {Page} from '../entity/page/Page';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  fs: typeof fs;
  private mysql: typeof mysql;
  private readonly pool: mysql.Pool;
  playStatusChange: EventEmitter<string> = new EventEmitter<string>();

  get isElectron(): boolean {
    return !!(window && window.process && window.process.type);
  }

  constructor() {
    // Conditional imports
    if (this.isElectron) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;

      // If you wan to use remote object, pleanse set enableRemoteModule to true in main.ts
      this.remote = window.require('electron').remote;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs');
      this.mysql = window.require('mysql2');
      this.pool = this.mysql.createPool({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'yunshu_music',
        waitForConnections: true,
        enableKeepAlive: true,
        connectionLimit: 5,
        queueLimit: 0
      });
      this.ipcRenderer.on('play_event', (event, type) => this.playStatusChange.emit(type));
    }
  }

  private static getPageInfo(musics): Page<Music> {
    const page = new Page<Music>();
    page.content = musics;
    page.empty = musics ? musics.length > 0 : false;
    page.first = page.last = true;
    page.numberOfElements = page.size = page.totalElements = musics ? musics.length : 0;
    page.number = page.totalPages = 1;
    return page;
  }

  getAll(): Promise<Page<Music>> {
    return this.pool.promise().execute('SELECT music_id AS musicId, name, singer, lyric_id AS lyricId, type FROM music')
      .then(([rows, fields]) => rows as Music[])
      .then(musics => ElectronService.getPageInfo(musics))
      .catch(err => {
        this.remote.dialog.showErrorBox('MySQL连接错误', err.toString());
        return err;
      });
  };

  search(keyword: string): Promise<Page<Music>> {
    return this.pool.promise().execute(`SELECT music_id AS musicId, name, singer, lyric_id AS lyricId, type FROM music WHERE name like '%${keyword}%' OR singer like '%${keyword}%'`)
      .then(([rows, fields]) => rows as Music[])
      .then(musics => ElectronService.getPageInfo(musics))
      .catch(err => {
        this.remote.dialog.showErrorBox('MySQL连接错误', err.toString());
        return err;
      });
  }

  getMusicFile(musicId: string): Promise<Blob> {
    return this.fs.promises.readFile(`F:/music_yunshu/${musicId}`)
      .then(data => new Blob([data.buffer]))
      .catch(err => {
        this.remote.dialog.showErrorBox('文件读取失败', err.toString());
        return err;
      });
  }

  getLyricFile(lyricId: string): Promise<string> {
    return this.fs.promises.readFile(`F:/lyric_yunshu/${lyricId}`, {encoding: 'utf8'})
      .catch(err => {
        if (err.code === 'ENOENT') {
          console.warn(err);
        } else {
          this.remote.dialog.showErrorBox('文件读取失败', err.toString());
        }
        return Promise.race('');
      });
  }

  sendEvent(type: EventType, message: any): void {
    switch (type) {
      case EventType.TRAY_TOOL_TIP:
        this.ipcRenderer.send('tray', message);
        break;
    }
  }

}

export enum EventType {
  TRAY_TOOL_TIP
}
