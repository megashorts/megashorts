// lib/telegram.ts

/**
 * 텔레그램 봇을 통한 알림 발송 유틸리티
 * 
 * 설정 방법:
 * 1. @BotFather에게 /newbot 명령어로 봇 생성
 * 2. 받은 봇 토큰을 TELEGRAM_BOT_TOKEN 환경변수에 설정
 * 3. 봇을 원하는 채팅방에 초대하고 관리자로 설정
 * 4. 채팅방 ID를 TELEGRAM_CHAT_ID 환경변수에 설정
 * 
 * 채팅방 ID 확인 방법:
 * https://api.telegram.org/bot<BOT_TOKEN>/getUpdates 호출 후
 * 봇이 있는 채팅방에서 메시지 전송하면 chat.id 확인 가능
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(message: string): Promise<boolean> {
  // 환경변수가 설정되지 않은 경우 건너뛰기
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.log('텔레그램 설정이 없어 알림을 건너뜁니다.');
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML', // HTML 형식 지원
        disable_web_page_preview: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('텔레그램 API 오류:', errorData);
      return false;
    }

    const result = await response.json();
    if (result.ok) {
      console.log('텔레그램 알림 발송 성공');
      return true;
    } else {
      console.error('텔레그램 알림 발송 실패:', result);
      return false;
    }

  } catch (error) {
    console.error('텔레그램 알림 발송 중 오류:', error);
    return false;
  }
}

/**
 * 환경변수 설정 예시:
 * 
 * .env.local 파일에 추가:
 * TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
 * TELEGRAM_CHAT_ID=-1001234567890
 * 
 * 참고사항:
 * - 개인 채팅방 ID는 양수, 그룹 채팅방 ID는 음수로 시작
 * - 봇이 채팅방에 있어야 메시지 전송 가능
 * - 무료로 사용 가능하며 제한은 텔레그램 API 정책에 따름
 */