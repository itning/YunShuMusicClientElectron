import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {ElectronService} from './electron.service';
import {fromPromise} from 'rxjs/internal-compatibility';

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

  getMusicFileToObjectUrl(musicId: string): Observable<string> {
    return this.getMusicFile(musicId).pipe(map(blob => window.URL.createObjectURL(blob)));
  }

  getLyricFile(lyricId: string): Observable<string> {
    return fromPromise(this.electronService.getLyricFile(lyricId));
  }
}
