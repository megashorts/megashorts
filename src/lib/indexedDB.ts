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

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['lastViews'], 'readwrite');
      const store = transaction.objectStore('lastViews');

      const request = store.put({
        postId,
        sequence,
        timestamp
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  // 서버 데이터로 동기화 (브라우저에 없는 동영상 ID만 추가)
  async syncWithServer(serverData: VideoViewStore) {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');

    // 현재 브라우저의 시청 기록 가져오기
    const transaction = this.db.transaction(['watchedVideos'], 'readwrite');
    const store = transaction.objectStore('watchedVideos');
    
    return new Promise<void>((resolve, reject) => {
      const request = store.getAll();
      
      request.onerror = () => reject(request.error);
      request.onsuccess = async () => {
        const currentRecords = request.result || [];
        const currentVideoIds = new Set(currentRecords.map(record => record.videoId));
        
        // 브라우저에 없는 동영상 ID만 추가
        const newWatchedPromises = serverData.watchedVideos
          .filter(video => !currentVideoIds.has(video.videoId))
          .map(video => this.saveWatchedVideo(video.videoId));
        
        try {
          await Promise.all(newWatchedPromises);
          resolve();
        } catch (error) {
          reject(error);
        }
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
