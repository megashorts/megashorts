'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Settings2, LogIn, CreditCard, FileText, Video } from 'lucide-react';
import ky from '@/lib/ky';
import { TYPE_DISPLAY_NAMES } from '@/lib/activity-logger/constants';

interface LogTypeSettings {
  [key: string]: boolean;
}

interface ApiResponse {
  success: boolean;
  data: LogTypeSettings | null;
}

const typeIcons = {
  auth: { icon: <LogIn className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.auth },
  payment: { icon: <CreditCard className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.payment },
  post: { icon: <FileText className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.post },
  video: { icon: <Video className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.video },
  system: { icon: <Settings2 className="w-4 h-4" />, label: TYPE_DISPLAY_NAMES.system }
} as const;

// 기본값으로 모든 타입 활성화
const defaultSettings: LogTypeSettings = Object.keys(TYPE_DISPLAY_NAMES).reduce(
  (acc, type) => ({
    ...acc,
    [type]: true
  }), 
  {}
);

export function SystemSettings() {
  const [settings, setSettings] = useState<LogTypeSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const mounted = useRef(false);

  // 설정 불러오기 - 컴포넌트 마운트 시 한 번만 실행
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await ky.get('/api/admin/settings', {  
          searchParams: { key: 'logging_types' }
        }).json<ApiResponse>();
        
        if (response.success && response.data) {
          setSettings(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // 설정 변경 핸들러 - 디바운스 적용
  const saveTimeout = useRef<NodeJS.Timeout>();
  const handleTypeChange = useCallback(async (type: string, checked: boolean) => {
    if (saving) return;

    try {
      setSaving(type);
      const newSettings = {
        ...settings,
        [type]: checked
      };
      setSettings(newSettings);

      // 이전 타이머 취소
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      // 500ms 후에 저장
      saveTimeout.current = setTimeout(async () => {
        try {
          await ky.post('/api/admin/settings', {
            json: {
              key: 'logging_types',
              value: newSettings
            }
          });
        } catch (error) {
          console.error('Failed to save settings:', error);
          setSettings(settings);
        } finally {
          setSaving(null);
        }
      }, 500);

    } catch (error) {
      console.error('Failed to update settings:', error);
      setSaving(null);
    }
  }, [settings, saving]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <p>설정을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          <CardTitle>시스템 설정</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-4 h-4" />
              <h3 className="text-lg font-medium">로그 설정</h3>
            </div>
            <div className="space-y-4">
              {Object.entries(TYPE_DISPLAY_NAMES).map(([type, label]) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox 
                    id={type}
                    checked={settings[type]}
                    disabled={saving === type}
                    onCheckedChange={(checked) => 
                      handleTypeChange(type, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={type} 
                    className="flex items-center space-x-2"
                  >
                    {typeIcons[type as keyof typeof typeIcons]?.icon}
                    <span className="hidden sm:inline">{label}</span>
                    {saving === type && (
                      <span className="text-sm text-muted-foreground">(저장 중...)</span>
                    )}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              체크되지 않은 타입의 로그는 저장되지 않습니다.
              이는 서버 리소스와 저장 공간을 절약하는데 도움이 됩니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
