'use client';

import type { LocationInfo, DeviceInfo } from './types';

interface CachedInfo {
  ip: string;
  country: string;
  city: string;
  device: DeviceInfo;
}

class LocationManager {
  private static instance: LocationManager;
  private static CHECK_INTERVAL = 60 * 60 * 1000;  // 1시간
  private static STORAGE_KEY = 'location_info';
  
  private lastCheck: number = 0;
  private cachedInfo: CachedInfo | null = null;
  private initialized = false;

  private constructor() {}

  private initialize() {
    if (this.initialized || typeof window === 'undefined') return;
    
    // 저장된 캐시 복원
    try {
      const stored = localStorage.getItem(LocationManager.STORAGE_KEY);
      if (stored) {
        const { info, timestamp } = JSON.parse(stored);
        const now = Date.now();
        if (now - timestamp < LocationManager.CHECK_INTERVAL) {
          this.cachedInfo = info;
          this.lastCheck = timestamp;
        }
      }
    } catch (error) {
      console.error('캐시 복원 실패:', error);
    }
    
    this.initialized = true;
  }

  static getInstance(): LocationManager {
    if (!LocationManager.instance) {
      LocationManager.instance = new LocationManager();
    }
    return LocationManager.instance;
  }

  private async getLocationInfo(): Promise<LocationInfo> {
    try {
      console.log('[LocationManager] API 호출 시작: /api/admin/ip');
      
      const response = await fetch('/api/admin/ip').catch(error => {
        console.error('[LocationManager] API 호출 실패:', error);
        throw error;
      });

      if (!response.ok) {
        console.error('[LocationManager] API 응답 에러:', response.status, response.statusText);
        throw new Error(`API 응답 에러: ${response.status}`);
      }

      const data = await response.json().catch(error => {
        console.error('[LocationManager] API 응답 파싱 실패:', error);
        throw error;
      });

      console.log('[LocationManager] API 응답:', data);
      
      return {
        ip: data.ip,
        country: data.country || 'unknown',
        city: 'unknown'  // Pro 플랜 업그레이드 전까지 unknown
      };
    } catch (error) {
      console.error('[LocationManager] 위치 정보 조회 실패:', error);
      return {
        ip: 'unknown',
        country: 'unknown',
        city: 'unknown'
      };
    }
  }

  private getDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const mobile = /Mobile|Android|iPhone/i.test(ua);
    const tablet = /Tablet|iPad/i.test(ua);
    
    return {
      browser: this.getBrowser(ua),
      os: this.getOS(ua),
      type: tablet ? 'tablet' : (mobile ? 'mobile' : 'desktop')
    };
  }

  private getBrowser(ua: string): string {
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private getOS(ua: string): string {
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  }

  async getInfo(): Promise<CachedInfo> {
    if (!this.initialized) {
      this.initialize();
    }

    const now = Date.now();
    
    if (!this.cachedInfo || (now - this.lastCheck > LocationManager.CHECK_INTERVAL)) {
      console.log('[LocationManager] 위치 정보 업데이트 시작');
      const locationInfo = await this.getLocationInfo();
      this.cachedInfo = {
        ...locationInfo,
        device: this.getDeviceInfo()
      };
      this.lastCheck = now;

      // 캐시 저장
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(LocationManager.STORAGE_KEY, JSON.stringify({
            info: this.cachedInfo,
            timestamp: this.lastCheck
          }));
          console.log('[LocationManager] 캐시 저장 완료');
        } catch (error) {
          console.error('[LocationManager] 캐시 저장 실패:', error);
        }
      }
    } 
    
    return this.cachedInfo;
  }
}

export const locationManager = LocationManager.getInstance();
