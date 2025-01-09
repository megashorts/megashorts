export const getAverageColor = async (imageUrl: string): Promise<string> => {
    // 실제 구현에서는 서버 사이드에서 이미지 분석 필요
    // 여기서는 예시로 랜덤 컬러를 반환
    return `#${Math.floor(Math.random()*16777215).toString(16)}`;
  };