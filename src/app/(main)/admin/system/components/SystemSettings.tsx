'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Loader2, Save, RefreshCw } from 'lucide-react';
import ky from '@/lib/ky';
import { 
  SETTING_KEYS, 
  SETTING_LABELS,
  SECTIONS,
  type SystemSettings,
  type UploaderLevel,
  type CoinPackage,
  type SubscriptionPackage,
  DEFAULT_SETTINGS
} from '@/lib/admin/system-settingspage';
import { useToast } from "@/components/ui/use-toast";

const formatNumber = (num: number) => {
  return num.toLocaleString('ko-KR');
};

const parseFormattedNumber = (str: string) => {
  return Number(str.replace(/,/g, ''));
};

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await ky.get('/api/admin/settings').json<Partial<SystemSettings>>();
        setSettings(prev => ({
          ...prev,
          ...Object.keys(response).reduce((acc, key) => ({
            ...acc,
            [key]: {
              ...prev[key as keyof SystemSettings],
              ...response[key as keyof SystemSettings]
            }
          }), {})
        }));
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load settings"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSaveSection = async (section: keyof typeof SECTIONS) => {
    if (saving) return;

    try {
      setSaving(section);
      const sectionKeys = SECTIONS[section].keys;
      const sectionSettings = sectionKeys.reduce((acc, key) => ({
        ...acc,
        [key]: settings[key as keyof SystemSettings]
      }), {});

      // 모든 섹션 공통: DB 저장
      await ky.post('/api/admin/settings', {
        json: { settings: sectionSettings }
      });

      // 섹션별 추가 동작
      if (section === 'SYSTEM_CONFIG') {
        // 시스템 설정: Vercel 환경변수 업데이트
        await ky.post('/api/admin/settings/apply');
        toast({
          title: "Success",
          description: "시스템 설정이 저장되고 환경변수가 업데이트되었습니다"
        });
      } else if (section === 'UPLOADER_CONFIG') {
        // 업로더 레벨: DB 저장만
        toast({
          title: "Success",
          description: "업로더 레벨 설정이 저장되었습니다"
        });
      } else if (section === 'PRICE_EVENT') {
        // 가격 및 이벤트: DB 저장만
        toast({
          title: "Success",
          description: "가격 및 이벤트 설정이 저장되었습니다"
        });
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save settings"
      });
    } finally {
      setSaving(null);
    }
  };

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        value: value
      }
    }));
  };

  const handlePackageChange = (
    key: 'subscriptionPackages' | 'coinPackages',
    index: number,
    field: 'amount' | 'price' | 'globalPrice' | 'type',
    value: number
  ) => {
    const packages = [...settings[key].value];
    packages[index] = {
      ...packages[index],
      [field]: value,
      ...(field === 'price' ? { globalPrice: Number((value / 1000).toFixed(2)) } : {})
    };

    handleSettingChange(key, packages);
  };

  const handleUploaderLevelChange = (index: number, field: keyof UploaderLevel, value: number) => {
    const newLevels = [...settings.uploaderQualification.value];
    newLevels[index] = {
      ...newLevels[index],
      [field]: value
    };

    handleSettingChange('uploaderQualification', newLevels);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="ml-2">설정을 불러오는 중...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'PRICE_EVENT':
        return <Save className="w-4 h-4" />;  // 저장만
      case 'UPLOADER_CONFIG':
        return <Save className="w-4 h-4" />;  // 저장만
      case 'SYSTEM_CONFIG':
        return <RefreshCw className="w-4 h-4" />;  // 저장 + 환경변수 업데이트
      default:
        return <Save className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-screen-xl mx-auto">
      <div className="grid gap-3 sm:grid-cols-2 sm:auto-rows-start">
        {/* 기존 섹션들 */}
        {Object.entries(SECTIONS).map(([sectionKey, section]) => (
          <Card key={sectionKey} className="flex flex-col">
            <CardHeader className="bg-muted/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{section.title}</CardTitle>
                    <Button 
                      size="icon"
                      variant="destructive"
                      onClick={() => handleSaveSection(sectionKey as keyof typeof SECTIONS)}
                      disabled={saving === sectionKey}
                      className="h-6 w-6 ml-2"
                    >
                      {saving === sectionKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        getSectionIcon(sectionKey)
                      )}
                    </Button>
                  </div>
                  <CardDescription className="text-xs mt-1">{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              <div className="space-y-3">
                {section.keys.map((key) => {
                  if (key === 'uploaderQualification') {
                    return (
                      <div key={key} className="overflow-x-auto -mx-3">
                        <table className="min-w-full border-collapse bg-card">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1.5 px-2 font-medium text-xs">레벨</th>
                              <th className="text-left py-1.5 px-2 font-medium text-xs">월 조회수</th>
                              <th className="text-left py-1.5 px-2 font-medium text-xs">수익률 (%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {settings[key].value.map((level, index) => (
                              <tr key={level.level} className="border-b last:border-0">
                                <td className="py-1.5 px-2 text-xs">Level {level.level}</td>
                                <td className="py-1.5 px-2">
                                  <Input
                                    type="text"
                                    value={formatNumber(level.minViews)}
                                    onChange={(e) => handleUploaderLevelChange(index, 'minViews', parseFormattedNumber(e.target.value))}
                                    className="h-7 w-24 text-xs appearance-none"
                                  />
                                </td>
                                <td className="py-1.5 px-2">
                                  <Input
                                    type="text"
                                    value={formatNumber(level.shareRatio)}
                                    onChange={(e) => handleUploaderLevelChange(index, 'shareRatio', parseFormattedNumber(e.target.value))}
                                    className="h-7 w-16 text-xs appearance-none"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (key === 'masterFeeRatio') {
                    return (
                      <div key={key} className="flex items-center justify-between py-1 gap-4">
                        <Label className="text-xs flex-1">
                          {SETTING_LABELS[key as keyof typeof SETTING_LABELS]}
                        </Label>
                        <Input
                          type="text"
                          value={formatNumber(settings[key].value)}
                          onChange={(e) => handleSettingChange(key, parseFormattedNumber(e.target.value))}
                          className="w-28 h-7 text-xs appearance-none"
                          step="0.01"
                        />
                      </div>
                    );
                  }

                  if (key === 'subscriptionPackages') {
                    const allPackages = [
                      ...settings.subscriptionPackages.value,
                      ...settings.coinPackages.value
                    ];

                    return (
                      <div key={key} className="overflow-x-auto -mx-3">
                        <table className="min-w-full border-collapse bg-card">
                          <thead>
                            <tr className="border-b">
                              <th className="text-center py-1.5 px-1 font-medium text-xs">구분</th>
                              <th className="text-center py-1.5 px-1 font-medium text-xs">설정</th>
                              <th className="text-center py-1.5 px-1 font-medium text-xs">한국 가격</th>
                              <th className="text-center py-1.5 px-1 font-medium text-xs">글로벌 가격</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allPackages.map((pkg, index) => {
                              const isSubscription = 'type' in pkg;
                              const packageKey = isSubscription ? 'subscriptionPackages' : 'coinPackages';
                              const packageIndex = isSubscription ? index : index - settings.subscriptionPackages.value.length;

                              return (
                                <tr key={index} className="border-b last:border-0">
                                  <td className="py-1.5 px-1 text-xs text-center">
                                    {isSubscription ? '구독' : '수량'}
                                  </td>
                                  <td className="py-1.5 px-1 text-xs text-center">
                                    {isSubscription ? (
                                      (pkg as SubscriptionPackage).type === 'weekly' ? '주간' : '연간'
                                    ) : (
                                      <Input
                                        type="text"
                                        value={formatNumber((pkg as CoinPackage).amount)}
                                        onChange={(e) => handlePackageChange(packageKey, packageIndex, 'amount', parseFormattedNumber(e.target.value))}
                                        className="h-7 w-20 text-xs mx-auto appearance-none"
                                      />
                                    )}
                                  </td>
                                  <td className="py-1.5 px-1 text-center">
                                    <Input
                                      type="text"
                                      value={formatNumber(pkg.price)}
                                      onChange={(e) => handlePackageChange(packageKey, packageIndex, 'price', parseFormattedNumber(e.target.value))}
                                      className="h-7 w-24 text-xs mx-auto appearance-none"
                                    />
                                  </td>
                                  <td className="py-1.5 px-1 text-center">
                                    <Input
                                      type="text"
                                      value={formatNumber(pkg.globalPrice)}
                                      onChange={(e) => handlePackageChange(packageKey, packageIndex, 'globalPrice', parseFormattedNumber(e.target.value))}
                                      className="h-7 w-20 text-xs mx-auto appearance-none"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (key !== 'coinPackages') {
                    return (
                      <div key={key} className="flex items-center justify-between py-1 gap-4">
                        <Label className="text-xs flex-1">
                          {SETTING_LABELS[key as keyof typeof SETTING_LABELS]}
                        </Label>
                        {typeof settings[key].value === 'boolean' ? (
                          <Switch
                            checked={settings[key].value}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSettingChange(key, e.target.checked)}
                          />
                        ) : (
                          <Input
                            type="text"
                            value={formatNumber(settings[key].value)}
                            onChange={(e) => handleSettingChange(key, parseFormattedNumber(e.target.value))}
                            className="w-28 h-7 text-xs appearance-none"
                          />
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* 수동배포 섹션 */}
        <Card className="flex flex-col">
          <CardHeader className="bg-muted/50 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-base">수동배포</CardTitle>
                <CardDescription className="text-xs mt-1">수동 배포 관리</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1 gap-4">
                <Label className="text-xs flex-1">
                  수동 배포 1 설명
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                >
                  배포1
                </Button>
              </div>
              <div className="flex items-center justify-between py-1 gap-4">
                <Label className="text-xs flex-1">
                  수동 배포 2 설명
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                >
                  배포2
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
