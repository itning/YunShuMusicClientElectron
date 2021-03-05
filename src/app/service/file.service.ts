import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ElectronService, MusicInfo} from './electron.service';
import {fromPromise} from 'rxjs/internal-compatibility';

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private http: HttpClient,
              private electronService: ElectronService) {
  }

  getMusicFile(musicId: string): Observable<MusicInfo> {
    return fromPromise(this.electronService.getMusicFile(musicId));
  }

  getMusicFileToObjectUrl(musicId: string): Observable<MusicWrapper> {
    return this.getMusicFile(musicId).pipe(map(data => new MusicWrapper(data)));
  }

  getLyricFile(lyricId: string): Observable<string> {
    return fromPromise(this.electronService.getLyricFile(lyricId));
  }
}

export class MusicWrapper {
  musicUrl: string;
  picUrl: string;
  /**
   * 专辑
   */
  album: string;
  /**
   * 标题
   */
  title: string;
  /**
   * 艺术家
   */
  artists: string[];

  constructor(music: MusicInfo) {
    this.musicUrl = window.URL.createObjectURL(music.blob);
    this.title = music.title;
    this.album = music.album;
    this.artists = music.artists;
    this.picUrl = music.pictureBase64;
  }
}
