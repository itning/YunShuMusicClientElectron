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
    if (this.electronService.config.useServer) {
      return this.http.get<MusicMetaInfo>(`${this.electronService.config.serverUrl}music/metaInfo?id=${musicId}`)
        .pipe(
          map(it => {
            const musicWrapper = MusicWrapper.createEmpty();
            musicWrapper.musicUrl = `${this.electronService.config.serverUrl}file?id=${musicId}`;
            musicWrapper.title = it.title;
            musicWrapper.artists = it.artists;
            musicWrapper.album = it.album;
            const coverPicture = it.coverPictures[0];
            if (coverPicture) {
              musicWrapper.picUrl = `data:${coverPicture.mimeType ? coverPicture.mimeType : 'image/jpeg'};base64,${coverPicture.base64}`;
            }
            return musicWrapper;
          })
        );
    } else {
      return this.getMusicFile(musicId).pipe(map(data => MusicWrapper.createFromMusicInfo(data)));
    }
  }

  getLyricFile(lyricId: string): Observable<string> {
    return fromPromise(this.electronService.getLyricFile(lyricId));
  }
}

class MusicMetaInfo {
  title: string;
  artists: string[];
  album: string;
  coverPictures: CoverPicture[];
}

class CoverPicture {
  base64: string;
  binaryData: string;
  mimeType: string;
  description: string;
  isLinked: boolean;
  imageUrl: string;
  pictureType: number;
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

  static createEmpty(): MusicWrapper {
    return new MusicWrapper();
  }

  static createFromMusicInfo(music: MusicInfo): MusicWrapper {
    const musicWrapper = new MusicWrapper();
    musicWrapper.musicUrl = window.URL.createObjectURL(music.blob);
    musicWrapper.title = music.title;
    musicWrapper.album = music.album;
    musicWrapper.artists = music.artists;
    musicWrapper.picUrl = music.pictureBase64;
    return musicWrapper;
  }
}
