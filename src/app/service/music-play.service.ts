import {Injectable} from '@angular/core';
import {Observable, Subscriber} from 'rxjs';

/**
 * 音乐服务
 * 我只关心播放状态和播放什么
 */
@Injectable({
  providedIn: 'root'
})
export class MusicPlayService {
  private readonly audio = new Audio();
  /**
   * 播放状态改变事件发射器
   */
  private playObserver: Subscriber<boolean>;
  /**
   * 时间状态改变事件发射器
   */
  private timeObserver: Subscriber<MusicPlaybackDurationChangeEvent>;
  /**
   * 播放结束事件发射器
   */
  private endObserver: Subscriber<void>;

  private loadObserver: Subscriber<MusicLoadEvent>;
  /**
   * 播放状态改变事件
   */
  onPlayChangeEvent: Observable<boolean>;
  /**
   * 时间状态改变事件
   */
  onTimeChangeEvent: Observable<MusicPlaybackDurationChangeEvent>;
  /**
   * 播放结束事件
   */
  onPlayEndEvent: Observable<void>;

  onLoadEvent: Observable<MusicLoadEvent>;

  constructor() {
    this.onPlayChangeEvent = new Observable<boolean>((observer) => {
      this.playObserver = observer;
    });
    this.onTimeChangeEvent = new Observable<MusicPlaybackDurationChangeEvent>((observer) => {
      this.timeObserver = observer;
    });
    this.onPlayEndEvent = new Observable<void>((observer) => {
      this.endObserver = observer;
    });
    this.onLoadEvent = new Observable<MusicLoadEvent>((observer) => {
      this.loadObserver = observer;
    });

    this.audio.ondurationchange = this.musicChangeEventHandlers;
    this.audio.ontimeupdate = this.musicChangeEventHandlers;

    this.audio.onended = () => {
      this.changePlayStatus(false);
      this.endObserver.next();
    };

    this.audio.onprogress = () => this.loadObserver.next(MusicLoadEvent.LOADING);
    this.audio.oncanplay = () => this.loadObserver.next(MusicLoadEvent.STARTED);
    this.audio.oncanplaythrough = () => this.loadObserver.next(MusicLoadEvent.STARTED);

    this.audio.onplay = () => this.changePlayStatus(true);
    this.audio.onpause = () => this.changePlayStatus(false);
  }

  private musicChangeEventHandlers = () => {
    if (this.audio.currentTime && this.audio.duration) {
      this.timeObserver.next(new MusicPlaybackDurationChangeEvent(this.audio.currentTime, this.audio.duration, this.audio.buffered));
    }
    // tslint:disable-next-line
  };

  start(src: string): Observable<boolean> {
    this.loadObserver.next(MusicLoadEvent.START);
    this.audio.src = src;
    this.audio.load();
    this.audio.pause();
    return this.play();
  }

  seek(position: number): Observable<boolean> {
    return new Observable((observer) => {
      if (this.isPlayingNow()) {
        if (position < 0) {
          position = 0;
        }
        if (position > this.audio.duration) {
          position = this.audio.duration;
        }
        this.audio.currentTime = position;
        observer.next(true);
      } else {
        observer.next(false);
      }
      observer.complete();
    });
  }

  volume(value: number): void {
    if (value < 0) {
      value = 0;
    }
    if (value > 1) {
      value = 1;
    }
    this.audio.volume = value;
  }

  play(): Observable<boolean> {
    return new Observable((observer) => {
      if (!this.isPlayingNow()) {
        this.audio.play()
          .then(() => {
            this.changePlayStatus(true);
            observer.next(true);
          })
          .catch(error => {
            console.error(error);
            observer.next(false);
          })
          .finally(() => {
            observer.complete();
          });
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }

  pause(): Observable<boolean> {
    return new Observable((observer) => {
      if (this.isPlayingNow()) {
        this.audio.pause();
        this.changePlayStatus(false);
        observer.next(true);
      } else {
        observer.next(false);
      }
      observer.complete();
    });
  }

  private changePlayStatus(status: boolean): void {
    this.playObserver.next(status);
  }

  isPlayingNow(): boolean {
    return !this.audio.paused;
  }
}

/**
 * 音乐时长改变事件
 */
export class MusicPlaybackDurationChangeEvent {
  readonly nowTime: number;
  readonly totalTime: number;
  readonly timeRanges: TimeRanges;

  constructor(nowTime: number, totalTime: number, timeRanges: TimeRanges) {
    this.nowTime = nowTime;
    this.totalTime = totalTime;
    this.timeRanges = timeRanges;
  }
}

export enum MusicLoadEvent {
  /**
   * 开始加载，发送网络请求，但是还没收到响应
   */
  START,
  /**
   * 接收数据中，还不可以播放
   */
  LOADING,
  /**
   * 可以播放了
   */
  STARTED
}
