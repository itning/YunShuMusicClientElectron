import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {mergeMap} from 'rxjs/operators';
import {ElectronService} from './electron.service';
import {fromPromise} from 'rxjs/internal-compatibility';
import * as musicMetadata from 'music-metadata-browser';
import {IAudioMetadata} from "music-metadata/lib/type";

@Injectable({
  providedIn: 'root'
})
export class FileService {

  constructor(private http: HttpClient,
              private electronService: ElectronService) {
  }

  getMusicFile(musicId: string): Observable<Blob> {
    return fromPromise(this.electronService.getMusicFile(musicId));
  }

  getMusicFileToObjectUrl(musicId: string): Observable<MusicWrapper> {
    return this.getMusicFile(musicId).pipe(mergeMap(blob => fromPromise(musicMetadata.parseBlob(blob).then(it => new MusicWrapper(window.URL.createObjectURL(blob), it)))));
  }

  getLyricFile(lyricId: string): Observable<string> {
    return fromPromise(this.electronService.getLyricFile(lyricId));
  }
}

export class MusicWrapper {
  musicUrl: string;
  picUrl: string;

  constructor(musicUrl: string, metadata?: IAudioMetadata) {
    this.musicUrl = musicUrl;
    if (metadata && metadata.common.picture) {
      const format = metadata.common.picture[0]?.format;
      this.picUrl = `data:${format ? format : 'image/jpeg'};base64,${metadata.common.picture[0]?.data.toString('base64')}`;
    }
  }
}
