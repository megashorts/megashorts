"use server";

import { redirect } from "next/navigation";

export async function testAction() {
  const testData = {
    message: "This is test data",
    timestamp: new Date().toISOString()
  };

  // 데이터 반환 테스트
  return { success: true, data: testData };
}

export async function testRedirectAction() {
  const testData = {
    message: "This data should be returned before redirect",
    timestamp: new Date().toISOString()
  };

  // 리다이렉트 전에 데이터 반환 시도
  const result = { success: true, data: testData };
  
  redirect("/test-server-action");
  
  // 이 코드는 실행되지 않음
  return result;
}

export async function testRedirectWithData() {
  const testData = {
    message: "Redirecting...",
    timestamp: new Date().toISOString()
  };

  if (Math.random() > 0.5) {
    // 50% 확률로 리다이렉트
    redirect("/test-server-action");
  }

  // 리다이렉트되지 않으면 데이터 반환
  return { success: true, data: testData };
}
