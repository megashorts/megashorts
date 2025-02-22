// 브라우저의 최소 정보 저장/관리만 담당

const DB_NAME = 'video-system';
const DB_VERSION = 1;

interface VideoViewStore {
  // 시청한 동영상 ID만 저장
  watchedVideos: {
    videoId: string;
  }[];
  
  // 포스트별 마지막 시청 정보만 저장
  lastViews: {
    postId: string;
    sequence: number;
    timestamp: number;
  }[];
}

class VideoDBManager {
  private db: IDBDatabase | null = null;

  async init() {
    if (this.db) return;

    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 시청한 유료 동영상 ID 저장소 (최소 정보만)
        if (!db.objectStoreNames.contains('watchedVideos')) {
          db.createObjectStore('watchedVideos', { keyPath: 'videoId' });
        }
        
        // 포스트별 마지막 시청 정보 저장소 (최소 정보만)
        if (!db.objectStoreNames.contains('lastViews')) {
          db.createObjectStore('lastViews', { keyPath: 'postId' });
        }
      };
    });
  }

  // VideoDBManager 시청한 영상기록 가져오기
  async getLastView(postId: string) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<{ postId: string; sequence: number; timestamp: number } | null>((resolve, reject) => {
      const transaction = this.db!.transaction(['lastViews'], 'readonly');
      const store = transaction.objectStore('lastViews');
      const request = store.get(postId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // 시청한 동영상 ID만 저장
  async saveWatchedVideo(videoId: string) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['watchedVideos'], 'readwrite');
      const store = transaction.objectStore('watchedVideos');

      const request = store.put({ videoId });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 포스트별 마지막 시청 정보만 저장
  async saveLastView(postId: string, sequence: number, timestamp: number) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    console.log('Saving last view:', { postId, sequence, timestamp });  // 디버깅 로그 추가

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['lastViews'], 'readwrite');
      const store = transaction.objectStore('lastViews');

      const request = store.put({
        postId,
        sequence,
        timestamp
      });

      request.onerror = () => {
        console.error('Failed to save last view:', request.error);  // 디버깅 로그 추가
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('Last view saved successfully');  // 디버깅 로그 추가
        resolve();
      };
    });
  }

  // 서버 데이터로 동기화 (브라우저에 없는 정보만 추가)
  async syncWithServer(serverData: VideoViewStore) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    console.log('Starting sync with server data:', serverData);  // 디버깅 로그 추가

    // 1. watchedVideos 동기화
    const watchedVideosSync = new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['watchedVideos'], 'readwrite');
      const store = transaction.objectStore('watchedVideos');
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const currentRecords = request.result || [];
        const currentVideoIds = new Set(currentRecords.map(record => record.videoId));
        
        console.log('Current watched videos:', currentVideoIds);  // 디버깅 로그 추가
        
        // 브라우저에 없는 동영상 ID만 추가
        const newWatchedPromises = serverData.watchedVideos
          .filter(video => !currentVideoIds.has(video.videoId))
          .map(video => this.saveWatchedVideo(video.videoId));
        
        try {
          await Promise.all(newWatchedPromises);
          console.log('Watched videos sync completed');  // 디버깅 로그 추가
          resolve();
        } catch (error) {
          console.error('Failed to sync watched videos:', error);  // 디버깅 로그 추가
          reject(error);
        }
      };
    });

    // 2. lastViews 동기화
    const lastViewsSync = new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['lastViews'], 'readwrite');
      const store = transaction.objectStore('lastViews');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const currentViews = request.result || [];
        const currentPostIds = new Set(currentViews.map(view => view.postId));

        console.log('Current last views:', currentViews);  // 디버깅 로그 추가

        // 브라우저에 없는 포스트의 시청 정보만 추가
        const newLastViewPromises = serverData.lastViews
          .filter(view => !currentPostIds.has(view.postId))
          .map(view => this.saveLastView(view.postId, view.sequence, view.timestamp));

        try {
          await Promise.all(newLastViewPromises);
          console.log('Last views sync completed');  // 디버깅 로그 추가
          resolve();
        } catch (error) {
          console.error('Failed to sync last views:', error);  // 디버깅 로그 추가
          reject(error);
        }
      };
    });

    // 두 동기화 작업을 병렬로 실행
    return Promise.all([watchedVideosSync, lastViewsSync]);
  }

  async getWatchedVideos() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
  
    return new Promise<string[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['watchedVideos'], 'readonly');
      const store = transaction.objectStore('watchedVideos');
      const request = store.getAll();
  
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const videos = request.result || [];
        resolve(videos.map(v => v.videoId));
      };
    });
  }

  // 1화보다 더 본 포스트 ID 목록 가져오기
  async getWatchingPostIds() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return new Promise<string[]>((resolve, reject) => {
      const transaction = this.db!.transaction(['lastViews'], 'readonly');
      const store = transaction.objectStore('lastViews');
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const views = request.result || [];
        const watchingPosts = views
          .filter(view => view.sequence > 1)
          .map(view => view.postId);
        resolve(watchingPosts);
      };
    });
  }

  // 다른 사용자 로그인 시에만 호출되는 초기화 메서드
  async clearForNewUser() {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    return Promise.all([
      new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(['watchedVideos'], 'readwrite');
        const store = transaction.objectStore('watchedVideos');
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const transaction = this.db!.transaction(['lastViews'], 'readwrite');
        const store = transaction.objectStore('lastViews');
        const request = store.clear();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      })
    ]);
  }
}

export const videoDB = new VideoDBManager();
