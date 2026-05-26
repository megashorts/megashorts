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
import {
  CONTENT_LANGUAGE_POLICIES,
  CONTENT_LANGUAGE_POLICY_DESCRIPTIONS,
  CONTENT_LANGUAGE_POLICY_LABELS,
  type ContentLanguagePolicy,
} from '@/lib/content-language';
import { ANALYTICS_TIME_ZONE_OPTIONS } from '@/lib/analytics-timezone';

const toFiniteNumber = (value: unknown, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatNumber = (num: unknown) => toFiniteNumber(num).toLocaleString('ko-KR');

const parseFormattedNumber = (str: string) => toFiniteNumber(str.replace(/,/g, ''));

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
  }, [toast]);

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
          title: "Settings Saved",
          description: "System settings saved and environment variables updated."
        });
      } else if (section === 'UPLOADER_CONFIG') {
        // 업로더 레벨: DB 저장만
        toast({
          title: "Settings Saved",
          description: "Uploader level settings saved."
        });
      } else if (section === 'PRICE_EVENT') {
        // 가격 및 이벤트: DB 저장만
        toast({
          title: "Settings Saved",
          description: "Price and event settings saved."
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
    const fallbackPackages = DEFAULT_SETTINGS[key].value;
    const currentPackages = Array.isArray(settings[key]?.value) ? settings[key].value : fallbackPackages;
    const packages = [...currentPackages];
    packages[index] = {
      ...(packages[index] || fallbackPackages[index] || {}),
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
            <p className="ml-2">Loading settings...</p>
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
                              <th className="text-left py-1.5 px-2 font-medium text-xs">Level</th>
                              <th className="text-left py-1.5 px-2 font-medium text-xs">Monthly Views</th>
                              <th className="text-left py-1.5 px-2 font-medium text-xs">Revenue Share (%)</th>
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

                  if (key === 'coinToPoint') {
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

                  // if (key === 'noteamReffererPointRatio') {
                  //   return (
                  //     <div key={key} className="flex items-center justify-between py-1 gap-4">
                  //       <Label className="text-xs flex-1">
                  //         {SETTING_LABELS[key as keyof typeof SETTING_LABELS]}
                  //       </Label>
                  //       <Input
                  //         type="text"
                  //         value={formatNumber(settings[key].value)}
                  //         onChange={(e) => handleSettingChange(key, parseFormattedNumber(e.target.value))}
                  //         className="w-28 h-7 text-xs appearance-none"
                  //         step="0.01"
                  //       />
                  //     </div>
                  //   );
                  // }

                  if (key === 'subscriptionPackages') {
                    const subscriptionPackages = Array.isArray(settings.subscriptionPackages?.value)
                      ? settings.subscriptionPackages.value
                      : DEFAULT_SETTINGS.subscriptionPackages.value;
                    const coinPackages = Array.isArray(settings.coinPackages?.value)
                      ? settings.coinPackages.value
                      : DEFAULT_SETTINGS.coinPackages.value;
                    const allPackages = [
                      ...subscriptionPackages,
                      ...coinPackages
                    ];

                    return (
                      <div key={key} className="overflow-x-auto -mx-3">
                        <table className="min-w-full border-collapse bg-card">
                          <thead>
                            <tr className="border-b">
                              <th className="text-center py-1.5 px-1 font-medium text-xs">Type</th>
                              <th className="text-center py-1.5 px-1 font-medium text-xs">Setting</th>
                              <th className="text-center py-1.5 px-1 font-medium text-xs">Korea Price</th>
                              <th className="text-center py-1.5 px-1 font-medium text-xs">Global Price</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allPackages.map((pkg, index) => {
                              const isSubscription = 'type' in pkg;
                              const packageKey = isSubscription ? 'subscriptionPackages' : 'coinPackages';
                              const packageIndex = isSubscription ? index : index - subscriptionPackages.length;

                              return (
                                <tr key={index} className="border-b last:border-0">
                                  <td className="py-1.5 px-1 text-xs text-center">
                                    {isSubscription ? 'Subscription' : 'Coins'}
                                  </td>
                                  <td className="py-1.5 px-1 text-xs text-center">
                                    {isSubscription ? (
                                      (pkg as SubscriptionPackage).type === 'weekly' ? 'Weekly' : 'Yearly'
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

                  if (key === 'contentLanguagePolicy') {
                    const value = settings[key].value as ContentLanguagePolicy;

                    return (
                      <div key={key} className="py-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-xs flex-1">
                            {SETTING_LABELS[key as keyof typeof SETTING_LABELS]}
                          </Label>
                          <select
                            value={value}
                            onChange={(e) => handleSettingChange(key, e.target.value as ContentLanguagePolicy)}
                            className="h-7 w-56 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                          >
                            {CONTENT_LANGUAGE_POLICIES.map((policy) => (
                              <option key={policy} value={policy}>
                                {CONTENT_LANGUAGE_POLICY_LABELS[policy]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="pl-1 text-[11px] leading-4 text-muted-foreground">
                          {CONTENT_LANGUAGE_POLICY_DESCRIPTIONS[value]}
                        </p>
                      </div>
                    );
                  }

                  if (key === 'analyticsTimeZone') {
                    return (
                      <div key={key} className="py-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <Label className="text-xs flex-1">
                            {SETTING_LABELS[key as keyof typeof SETTING_LABELS]}
                          </Label>
                          <select
                            value={String(settings[key].value)}
                            onChange={(e) => handleSettingChange(key, e.target.value)}
                            className="h-7 w-56 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                          >
                            {ANALYTICS_TIME_ZONE_OPTIONS.map((tz) => (
                              <option key={tz} value={tz}>
                                {tz}
                              </option>
                            ))}
                          </select>
                        </div>
                        <p className="pl-1 text-[11px] leading-4 text-muted-foreground">
                          Log and reporting day-boundary time zone.
                        </p>
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
                <CardTitle className="text-base">Manual Deploy</CardTitle>
                <CardDescription className="text-xs mt-1">Manual Deployment Management</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 flex-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between py-1 gap-4">
                <Label className="text-xs flex-1">
                  Manual Deploy 1 Description
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                >
                  Deploy 1
                </Button>
              </div>
              <div className="flex items-center justify-between py-1 gap-4">
                <Label className="text-xs flex-1">
                  Manual Deploy 2 Description
                </Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7"
                >
                  Deploy 2
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
