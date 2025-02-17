'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function MainSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>메인페이지 설정</CardTitle>
        <CardDescription>
          메인페이지 관련 설정을 관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-sm text-muted-foreground">
              메인페이지 설정이 추가될 예정입니다.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
