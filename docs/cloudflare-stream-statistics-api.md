# 클라우드플레어 스트림 통계 API 가이드

이 문서는 클라우드플레어 스트림 API를 사용하여 비디오 시청 통계를 효율적으로 가져오는 방법을 설명합니다. 특히 사전집계된 데이터를 활용하여 대량의 비디오가 있는 환경에서도 빠르게 통계를 조회하는 방법에 중점을 둡니다.

## 1. 개요

클라우드플레어 스트림 API는 GraphQL 인터페이스를 통해 다양한 시청 통계 데이터를 제공합니다. 이 API는 서버 측에서 사전집계된 데이터를 제공하므로, 비디오 수가 많아도 빠르게 결과를 얻을 수 있습니다.

### 주요 특징

- **사전집계 데이터**: 서버 측에서 미리 계산된 데이터를 제공하여 빠른 응답 시간 보장
- **다양한 차원**: 크리에이터, 국가, 날짜, 비디오 ID 등 다양한 기준으로 데이터 집계 가능
- **높은 확장성**: 비디오 수와 관계없이 일정한 응답 시간 유지 (약 0.3초)
- **대량 데이터 처리**: 최대 10,000개까지의 결과를 한 번에 요청 가능

## 2. API 엔드포인트 및 인증

### 엔드포인트

```
https://api.cloudflare.com/client/v4/graphql
```

### 인증 헤더

```
Authorization: Bearer YOUR_API_TOKEN
Content-Type: application/json
```

### 필요한 환경 변수

- `CLOUDFLARE_ACCOUNT_ID`: 클라우드플레어 계정 ID
- `CLOUDFLARE_API_TOKEN`: API 토큰 (Stream 권한 필요)

## 3. 사전집계 데이터 쿼리

### 3.1 크리에이터별 시청 시간

모든 크리에이터의 시청 시간을 한 번에 가져올 수 있습니다. 크리에이터 수에 관계없이 빠른 응답 시간을 보장합니다.

```graphql
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      creatorStats: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"  # 시작 날짜
          date_lt: "2025-03-07"   # 종료 날짜 (미포함)
        }
        limit: 1000  # 원하는 크리에이터 수 (최대 10000)
        orderBy: [sum_minutesViewed_DESC]  # 시청 시간 내림차순 정렬
      ) {
        dimensions {
          creator  # 크리에이터 식별자
        }
        sum {
          minutesViewed  # 총 시청 시간(분)
        }
      }
    }
  }
}
```

**응답 예시**:
```json
{
  "data": {
    "viewer": {
      "accounts": [
        {
          "creatorStats": [
            {
              "dimensions": { "creator": "RYAN" },
              "sum": { "minutesViewed": 15 }
            },
            {
              "dimensions": { "creator": "test" },
              "sum": { "minutesViewed": 14 }
            },
            {
              "dimensions": { "creator": "ryan-kim-hjhh" },
              "sum": { "minutesViewed": 6 }
            },
            {
              "dimensions": { "creator": "msdebak" },
              "sum": { "minutesViewed": 2 }
            }
          ]
        }
      ]
    }
  }
}
```

### 3.2 국가별 시청 시간

모든 국가의 시청 시간을 한 번에 가져올 수 있습니다.

```graphql
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      countryStats: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 200  # 국가 수는 제한적이므로 충분한 값
        orderBy: [sum_minutesViewed_DESC]
      ) {
        dimensions {
          clientCountryName  # 국가 코드
        }
        sum {
          minutesViewed
        }
      }
    }
  }
}
```

**응답 예시**:
```json
{
  "data": {
    "viewer": {
      "accounts": [
        {
          "countryStats": [
            {
              "dimensions": { "clientCountryName": "KR" },
              "sum": { "minutesViewed": 33 }
            },
            {
              "dimensions": { "clientCountryName": "TR" },
              "sum": { "minutesViewed": 3 }
            }
          ]
        }
      ]
    }
  }
}
```

### 3.3 비디오별 시청 시간

상위 시청 비디오 목록을 가져올 수 있습니다.

```graphql
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      videoStats: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 1000  # 원하는 비디오 수
        orderBy: [sum_minutesViewed_DESC]
      ) {
        dimensions {
          uid  # 비디오 ID
        }
        sum {
          minutesViewed
        }
      }
    }
  }
}
```

**응답 예시**:
```json
{
  "data": {
    "viewer": {
      "accounts": [
        {
          "videoStats": [
            {
              "dimensions": { "uid": "0a5adbcee5a8497590268bad396c7d8b" },
              "sum": { "minutesViewed": 9 }
            },
            {
              "dimensions": { "uid": "65c89a1910d64cb0b5853e529e006466" },
              "sum": { "minutesViewed": 5 }
            }
          ]
        }
      ]
    }
  }
}
```

### 3.4 날짜별/시간별 시청 시간

일별 또는 시간별 시청 통계를 가져올 수 있습니다.

```graphql
# 일별 통계
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      dailyStats: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-01"
          date_lt: "2025-03-07"
        }
        limit: 7  # 7일간의 데이터
        orderBy: [date_DESC]  # 날짜 내림차순
      ) {
        dimensions {
          date  # 날짜 (YYYY-MM-DD)
        }
        sum {
          minutesViewed
        }
      }
    }
  }
}

# 시간별 통계
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      hourlyStats: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 24  # 24시간
        orderBy: [ts_DESC]  # 시간 내림차순
      ) {
        dimensions {
          ts  # 타임스탬프 (ISO 8601 형식)
        }
        count  # 시청 횟수
        sum {
          minutesViewed
        }
      }
    }
  }
}
```

## 4. 복합 쿼리 (여러 통계 한 번에 가져오기)

하나의 GraphQL 쿼리로 여러 종류의 통계를 한 번에 가져올 수 있습니다.

```graphql
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      # 1. 총 시청 시간
      totalMinutesViewed: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 1
      ) {
        sum {
          minutesViewed
        }
      }
      
      # 2. 국가별 시청 시간 (상위 10개)
      topCountries: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 10
        orderBy: [sum_minutesViewed_DESC]
      ) {
        dimensions {
          clientCountryName
        }
        sum {
          minutesViewed
        }
      }
      
      # 3. 비디오별 시청 시간 (상위 10개)
      topVideos: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 10
        orderBy: [sum_minutesViewed_DESC]
      ) {
        dimensions {
          uid
        }
        sum {
          minutesViewed
        }
      }
      
      # 4. 크리에이터별 시청 시간 (상위 10개)
      topCreators: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 10
        orderBy: [sum_minutesViewed_DESC]
      ) {
        dimensions {
          creator
        }
        sum {
          minutesViewed
        }
      }
    }
  }
}
```

## 5. 필터링 옵션

### 날짜 필터

- `date_geq`: 시작 날짜 (포함)
- `date_lt`: 종료 날짜 (미포함)

### 정렬 옵션

- `orderBy: [sum_minutesViewed_DESC]`: 시청 시간 내림차순
- `orderBy: [date_DESC]`: 날짜 내림차순
- `orderBy: [ts_DESC]`: 시간 내림차순

### 결과 제한

- `limit`: 반환할 최대 결과 수 (최대 10000)

## 6. 사전집계 데이터 활용의 중요성

### 비효율적인 접근 방식 (사용하지 말 것)

⚠️ **주의**: 다음과 같은 접근 방식은 대량의 동영상(10만개 이상)이 있는 환경에서 **절대 사용해서는 안 됩니다**:

- 비디오 목록 API를 호출하여 모든 비디오의 메타데이터를 가져오는 방식
- 비디오 ID와 크리에이터 정보를 일일이 매핑하는 방식
- 통계 API에서 가져온 데이터를 클라이언트 측에서 재가공하는 방식

이러한 방식은 다음과 같은 심각한 문제를 일으킵니다:
- API 호출 제한 초과
- 서버리스 환경에서 메모리 한계 초과
- 실행 시간 제한 초과
- 불필요한 네트워크 트래픽 발생

### 올바른 접근 방식: 사전집계 데이터 직접 활용

Cloudflare Stream API는 이미 크리에이터별, 국가별, 비디오별로 **사전집계된 데이터**를 제공합니다. 이 데이터를 **직접 활용**하는 것이 가장 효율적입니다:

```graphql
# 크리에이터별 통계 직접 가져오기 (사전집계됨)
query {
  viewer {
    accounts(filter: {
      accountTag: "${CLOUDFLARE_ACCOUNT_ID}"
    }) {
      creatorStats: streamMinutesViewedAdaptiveGroups(
        filter: {
          date_geq: "2025-03-06"
          date_lt: "2025-03-07"
        }
        limit: 10000  # 최대 10000개 결과
        orderBy: [sum_minutesViewed_DESC]
      ) {
        dimensions {
          creator
        }
        sum {
          minutesViewed
        }
      }
    }
  }
}
```

이 방식은 서버 측에서 이미 집계된 데이터를 한 번의 API 호출로 가져오므로, 10만 개 이상의 동영상이 있어도 약 0.3초 내외의 응답 시간을 보장합니다.

## 7. 성능 고려사항

- **응답 시간**: 사전집계 데이터 쿼리는 비디오 수와 관계없이 약 0.3초 내외의 응답 시간을 보입니다.
- **데이터 정확성**: 사전집계 데이터는 약간의 지연이 있을 수 있으며, 실시간 데이터가 아닙니다.
- **API 제한**: 클라우드플레어 API는 요청 제한이 있을 수 있으므로, 과도한 요청을 피해야 합니다.
- **대량 데이터**: 결과가 많은 경우 페이지네이션을 고려해야 합니다.

## 8. 에러 처리

API 호출 시 다음과 같은 오류가 발생할 수 있습니다:

- **인증 오류**: API 토큰이 잘못되었거나 권한이 부족한 경우
- **필드 오류**: 지원되지 않는 필드를 요청한 경우 (예: clientDeviceType)
- **구문 오류**: GraphQL 쿼리 구문이 잘못된 경우

적절한 에러 처리 로직을 구현하여 안정적인 서비스를 제공해야 합니다.

## 9. 결론

클라우드플레어 스트림 API는 사전집계된 데이터를 통해 대량의 비디오가 있는 환경에서도 빠르게 통계를 조회할 수 있습니다. 이를 활용하여 크리에이터별, 국가별, 비디오별 시청 통계를 효율적으로 수집하고 포인트 시스템에 활용할 수 있습니다.

특히 크리에이터별 시청 시간은 서버 측에서 사전집계된 형태로 제공되므로, 별도의 클라이언트 측 계산 없이 바로 활용할 수 있습니다. 이는 포인트 시스템 워커 구현에 매우 유용합니다.

---

# 스트림 통계 수집 워커 구현 가이드

이 섹션에서는 Cloudflare Stream API를 활용하여 비디오 시청 통계를 수집하고 저장하는 워커를 구현하는 방법을 설명합니다. 이 워커는 사전집계된 통계 데이터를 정기적으로 가져와 R2 버킷에 저장하여 다양한 사용자 유형(업로더, 영업팀 멤버, 팀마스터, 관리자)이 필요한 통계 정보를 효율적으로 조회할 수 있도록 합니다.

## 1. 워커 구조 및 파일 경로

### 워커 위치
```
/megashorts-logs/src/dailywork/workers/stream-stats/
```

### 주요 파일
- `index.ts`: 워커의 진입점
- `collector.ts`: 통계 데이터 수집 및 처리 로직
- `types.ts`: 타입 정의
- `wrangler.toml`: 워커 설정 파일

### 저장 파일 경로 구조 및 용도

#### 일별 통계 파일 (daily)
```
points-system-bucket/stream-stats/daily/YYYY-MM/YYYY-MM-DD-creators.json
```
- **용도**: 크리에이터별 일일 시청 통계
- **사용자**: 업로더(자신의 통계), 관리자(전체 통계)
- **주요 항목**: creator, minutesViewed, viewCount, trend(7일)
- **호출 시점**: 업로더가 수익 페이지 접속 시, 관리자가 크리에이터 통계 조회 시

```
points-system-bucket/stream-stats/daily/YYYY-MM/YYYY-MM-DD-countries.json
```
- **용도**: 국가별 일일 시청 통계
- **사용자**: 관리자
- **주요 항목**: clientCountryName, minutesViewed, viewCount
- **호출 시점**: 관리자가 국가별 통계 조회 시, 지도 시각화 데이터 필요 시

```
points-system-bucket/stream-stats/daily/YYYY-MM/YYYY-MM-DD-videos-with-posts.json
```
- **용도**: 개별 동영상 및 포스트별 통합 일일 시청 통계
- **사용자**: 업로더(자신의 동영상/포스트), 관리자(전체 동영상/포스트)
- **주요 항목**: 
  - 동영상 정보: uid, fileName, postName, realTitle, minutesViewed, viewCount
  - 포스트 요약 정보: postName, realTitle, videoCount, minutesViewed, viewCount, topVideos
- **호출 시점**: 업로더가 동영상/포스트별 성과 확인 시, 관리자가 인기 동영상/포스트 분석 시
- **특징**: 동영상 정보와 포스트 요약 정보를 하나의 파일에 통합하여 저장

```
points-system-bucket/stream-stats/daily/YYYY-MM/YYYY-MM-DD-summary.json
```
- **용도**: 플랫폼 전체 일일 요약 통계 (관리자용 대시보드 데이터)
- **사용자**: 관리자
- **주요 항목**: totalMinutesViewed, totalViewCount, uniqueViewers, topCreators, topCountries, topVideos, dailyTrend
- **호출 시점**: 관리자가 대시보드 접속 시, 일별 리포트 생성 시
- **특징**: 관리자를 위한 전체 플랫폼 정보가 담긴 핵심 파일

#### 주간 통계 파일 (weekly)
```
points-system-bucket/stream-stats/weekly/YYYY-MM/YYYY-WW-creators.json
```
- **용도**: 크리에이터별 주간 시청 통계
- **사용자**: 업로더(자신의 통계), 관리자(전체 통계)
- **주요 항목**: creator, dailyStats(7일), totalMinutesViewed, totalViewCount
- **호출 시점**: 업로더가 주간 성과 확인 시, 관리자가 주간 리포트 생성 시

```
points-system-bucket/stream-stats/weekly/YYYY-MM/YYYY-WW-summary.json
```
- **용도**: 플랫폼 전체 주간 요약 통계
- **사용자**: 관리자
- **주요 항목**: weekStart, weekEnd, totalMinutesViewed, totalViewCount, dailyStats, topCreators, topCountries, topVideos
- **호출 시점**: 관리자가 주간 리포트 생성 시, 주간 성과 분석 시

#### 롤링 7일 통계 파일 (rolling)
```
points-system-bucket/stream-stats/rolling/last7days-creators.json
```
- **용도**: 최근 7일간 크리에이터별 통계 (매일 업데이트)
- **사용자**: 업로더(자신의 통계), 관리자(전체 통계)
- **주요 항목**: startDate, endDate, creators(각각 dailyStats 포함)
- **호출 시점**: 업로더/관리자가 최근 7일 트렌드 확인 시

```
points-system-bucket/stream-stats/rolling/last7days-countries.json
```
- **용도**: 최근 7일간 국가별 통계 (매일 업데이트)
- **사용자**: 관리자
- **주요 항목**: startDate, endDate, countries(각각 dailyStats 포함)
- **호출 시점**: 관리자가 최근 국가별 트렌드 확인 시

```
points-system-bucket/stream-stats/rolling/last7days-summary.json
```
- **용도**: 최근 7일간 플랫폼 전체 요약 통계 (매일 업데이트)
- **사용자**: 관리자
- **주요 항목**: startDate, endDate, totalMinutesViewed, totalViewCount, dailyStats, topCreators, topCountries, topVideos
- **호출 시점**: 관리자 대시보드 접속 시, 실시간 트렌드 분석 시

### 로그 기록
```
// 기존 로그 버킷과 공유 로그 작성 파일 사용
// 팀마스터설정파일저장워커와 동일한 방식으로 로그 작성
```

## 2. 동영상 특성 및 데이터 구조

### 동영상 특성
- 동영상은 2분 내의 짧은 동영상입니다.
- 한 포스트에는 약 100여개의 동영상이 포함되어 있습니다.
- 클라우드플레어에서는 포스트 정보가 아닌 개별 동영상에 관한 사전집계 응답만을 제공합니다.
- 실제 파일명은 "lady001.mp4", "lady004.mp4" 같은 형식으로 저장됩니다.
  - 파일명의 접두사(예: "lady")는 실제 DB상 포스트 정보 타이틀이 아닙니다.
  - 파일명 패턴(접두사 + 숫자)을 활용하여 같은 포스트에 속한 동영상들을 그룹화할 수 있습니다.
- 각 동영상은 클라우드플레어 스트림에 메타데이터와 함께 저장됩니다:
  ```json
  "meta": {
    "isPremium": "false",
    "name": "lady001.mp4",
    "sequence": "1",
    "title": "첫사랑"
  }
  ```
  - 실제 포스트 타이틀은 메타데이터의 "title" 필드에 저장됩니다.

### 일별 크리에이터 통계 (YYYY-MM-DD-creators.json)
```json
{
  "date": "2025-03-11",
  "creators": [
    {
      "creator": "RYAN",
      "minutesViewed": 120,
      "viewCount": 45,
      "trend": [
        {"date": "2025-03-05", "minutesViewed": 95, "viewCount": 38},
        {"date": "2025-03-06", "minutesViewed": 105, "viewCount": 42},
        // ... 최근 7일간의 데이터
        {"date": "2025-03-11", "minutesViewed": 120, "viewCount": 45}
      ]
    },
    // ... 다른 크리에이터들
  ]
}
```

### 일별 국가별 통계 (YYYY-MM-DD-countries.json)
```json
{
  "date": "2025-03-11",
  "countries": [
    {
      "clientCountryName": "KR",
      "minutesViewed": 350,
      "viewCount": 120
    },
    // ... 다른 국가들
  ]
}
```

### 일별 상위 동영상 통계 (YYYY-MM-DD-videos.json)
```json
{
  "date": "2025-03-11",
  "videos": [
    {
      "uid": "0a5adbcee5a8497590268bad396c7d8b",
      "fileName": "인기포스트23",
      "postName": "인기포스트",
      "minutesViewed": 85,
      "viewCount": 35
    },
    // ... 다른 동영상들
  ]
}
```

### 일별 포스트별 통계 (YYYY-MM-DD-posts.json)
```json
{
  "date": "2025-03-11",
  "posts": [
    {
      "postName": "인기포스트",
      "videoCount": 100,
      "minutesViewed": 850,
      "viewCount": 350,
      "topVideos": [
        {"fileName": "인기포스트23", "minutesViewed": 85, "viewCount": 35},
        {"fileName": "인기포스트45", "minutesViewed": 65, "viewCount": 28},
        // ... 상위 5개 동영상
      ]
    },
    // ... 다른 포스트들
  ]
}
```

### 일별 요약 통계 (YYYY-MM-DD-summary.json)
```json
{
  "date": "2025-03-11",
  "totalMinutesViewed": 1250,
  "totalViewCount": 450,
  "uniqueViewers": 320,
  "topCreators": [
    {"creator": "RYAN", "minutesViewed": 120, "viewCount": 45},
    // ... 상위 10명
  ],
  "topCountries": [
    {"clientCountryName": "KR", "minutesViewed": 350, "viewCount": 120},
    // ... 상위 10개국
  ],
  "topVideos": [
    {"uid": "0a5adbcee5a8497590268bad396c7d8b", "minutesViewed": 85, "viewCount": 35},
    // ... 상위 10개
  ],
  "dailyTrend": [
    {"date": "2025-03-05", "minutesViewed": 1050, "viewCount": 380},
    // ... 최근 7일간의 데이터
    {"date": "2025-03-11", "minutesViewed": 1250, "viewCount": 450}
  ]
}
```

### 주간 크리에이터 통계 (YYYY-WW-creators.json)
```json
{
  "weekStart": "2025-03-05",
  "weekEnd": "2025-03-11",
  "creators": [
    {
      "creator": "RYAN",
      "dailyStats": [
        {"date": "2025-03-05", "minutesViewed": 95, "viewCount": 38},
        // ... 7일간의 데이터
        {"date": "2025-03-11", "minutesViewed": 120, "viewCount": 45}
      ],
      "totalMinutesViewed": 780,
      "totalViewCount": 312
    },
    // ... 다른 크리에이터들
  ]
}
```

### 롤링 7일 요약 통계 (last7days-summary.json)
```json
{
  "startDate": "2025-03-05",
  "endDate": "2025-03-11",
  "totalMinutesViewed": 7850,
  "totalViewCount": 2950,
  "dailyStats": [
    {"date": "2025-03-05", "minutesViewed": 1050, "viewCount": 380},
    // ... 7일간의 데이터
    {"date": "2025-03-11", "minutesViewed": 1250, "viewCount": 450}
  ],
  "topCreators": [
    {"creator": "RYAN", "minutesViewed": 780, "viewCount": 312},
    // ... 상위 10명
  ],
  "topCountries": [
    {"clientCountryName": "KR", "minutesViewed": 2450, "viewCount": 840},
    // ... 상위 10개국
  ],
  "topVideos": [
    {"uid": "0a5adbcee5a8497590268bad396c7d8b", "minutesViewed": 520, "viewCount": 210},
    // ... 상위 10개
  ]
}
```

## 3. 워커 실행 스케줄

### 일별 통계 수집 워커
- **실행 시간**: 한국 시간 기준 매일 00:15 (UTC 15:15)
- **수집 범위**: 전날 00:00:00 ~ 23:59:59 (한국 시간)
- **cron 표현식**: `15 15 * * *`

### 주간 통계 수집 워커
- **실행 시간**: 한국 시간 기준 매주 월요일 00:20 (UTC 15:20)
- **수집 범위**: 지난 주 월요일 ~ 일요일
- **cron 표현식**: `20 15 * * 1`

## 4. 워커 구현 세부 사항

### 주요 변수 및 함수

#### collector.ts
```typescript
// 주요 변수
const BUCKET_NAME = 'points-system-bucket';
const LOG_BUCKET_NAME = 'logs-bucket';
const STREAM_STATS_PREFIX = 'stream-stats';
const DAILY_PREFIX = 'daily';
const WEEKLY_PREFIX = 'weekly';
const ROLLING_PREFIX = 'rolling';

// 주요 함수
async function collectDailyStats(date: string): Promise<CollectorResult>;
async function collectWeeklyStats(weekStart: string, weekEnd: string): Promise<CollectorResult>;
async function updateRollingStats(date: string): Promise<CollectorResult>;
async function fetchCreatorStats(startDate: string, endDate: string): Promise<CreatorStat[]>;
async function fetchCountryStats(startDate: string, endDate: string): Promise<CountryStat[]>;
async function fetchVideoStats(startDate: string, endDate: string): Promise<VideoStat[]>;
async function saveToR2(path: string, data: any): Promise<void>;
async function loadFromR2(path: string): Promise<any>;
async function logOperation(operation: string, details: any): Promise<void>;
```

### 데이터 처리 흐름

1. **일별 통계 수집**:
   ```
   1. 전날 날짜 계산 (한국 시간 기준)
   2. Cloudflare Stream API 호출하여 크리에이터, 국가, 비디오 통계 가져오기
   3. 비디오 파일명 분석하여 포스트별 통계 생성
   4. 이전 6일간의 데이터 로드하여 7일 트렌드 데이터 구성
   5. 요약 통계 생성
   6. R2 버킷에 파일 저장
   7. 롤링 7일 통계 업데이트
   8. 공유 로그 클라이언트를 통해 로그 기록
   ```

2. **주간 통계 수집**:
   ```
   1. 지난 주 날짜 범위 계산 (월~일)
   2. 해당 주의 일별 통계 파일 로드
   3. 주간 집계 데이터 생성
   4. R2 버킷에 파일 저장
   5. 로그 기록
   ```

3. **롤링 7일 통계 업데이트**:
   ```
   1. 최근 7일 날짜 범위 계산
   2. 해당 기간의 일별 통계 파일 로드
   3. 7일 집계 데이터 생성
   4. R2 버킷에 파일 저장
   ```

## 5. 성능 및 리소스 고려사항

### 메모리 사용량 시뮬레이션
- 크리에이터 1만명 기준 creators.json: 약 1-1.5MB
- 국가별 통계 countries.json: 약 40KB
- 상위 동영상 통계 (500개): 약 100KB
- 요약 통계 summary.json: 약 50KB
- **총 메모리 사용량**: 약 2-3MB (파일 로드) + 10-15MB (처리 오버헤드)
- **Cloudflare Workers 메모리 제한**: 128MB (무료 플랜), 1GB (유료 플랜)

### 실행 시간 시뮬레이션
- Cloudflare Stream API 호출: 약 0.3초 × 3회 = 0.9초
- 데이터 처리 및 변환: 약 0.5-1초
- R2 파일 로드 (7일치): 약 0.5초
- R2 파일 저장: 약 0.5초
- **총 실행 시간**: 약 2-3초
- **Cloudflare Workers 실행 제한**: 50ms (무료 플랜), 30초 (유료 플랜)

## 6. 에러 처리 및 로깅

### 로그 구조
```json
{
  "timestamp": "2025-03-12T00:15:30.123Z",
  "operation": "collectDailyStats",
  "date": "2025-03-11",
  "success": true,
  "duration": 2.45,
  "details": {
    "creatorsCount": 1250,
    "countriesCount": 85,
    "videosCount": 500,
    "totalMinutesViewed": 12500
  },
  "error": null
}
```

### 에러 처리 전략
- **API 호출 실패**: 최대 3회 재시도 후 실패 시 부분 데이터로 진행하고 로그에 오류 기록
- **R2 파일 접근 오류**: 이전 백업 데이터 사용 또는 빈 데이터로 초기화하고 로그에 오류 기록
- **메모리 한계 접근**: 처리 데이터 크기 제한 및 배치 처리로 메모리 사용량 관리
- **실행 시간 초과 위험**: 중요 작업 우선 처리 및 비중요 작업 다음 실행으로 연기

## 7. 포스트별 통계 생성 전략

### 효율적인 포스트 통계 생성 방식

포스트별 통계는 10만개 동영상 전체를 처리하는 것이 아니라, **상위 1,000개 동영상**만을 대상으로 생성합니다. 이 접근 방식은 서버리스 환경에서 현실적으로 구현 가능하며 다음과 같은 이점이 있습니다:

1. **API 호출 최소화**: 한 번의 API 호출로 상위 1,000개 동영상 데이터만 가져옵니다.
2. **메모리 사용량 최적화**: 전체 10만개가 아닌 1,000개만 처리하므로 메모리 사용량이 크게 감소합니다.
3. **실행 시간 단축**: 서버리스 환경의 실행 시간 제한(30초) 내에 충분히 처리 가능합니다.
4. **의미 있는 데이터 집중**: 시청 시간이 많은 상위 동영상이 포함되므로 중요한 통계 정보는 모두 포함됩니다.

### 파일명 기반 포스트 식별 및 메타데이터 활용

```typescript
function extractPostNameFromFileName(fileName: string): string {
  // 파일명에서 숫자를 제외한 부분을 포스트 이름으로 추출
  // 예: "lady001.mp4" -> "lady"
  return fileName.replace(/\d+\.mp4$/, '');
}

// 상위 1,000개 동영상 통계만 가져와서 처리
async function generatePostStats(videoStats: VideoStat[]): Promise<PostStat[]> {
  const postMap = new Map<string, PostStat>();
  const realTitleCache = new Map<string, string>(); // 포스트명 -> 실제 타이틀 캐시
  
  // 비디오 통계를 포스트별로 그룹화
  for (const video of videoStats) {
    const postName = extractPostNameFromFileName(video.fileName);
    
    // 실제 포스트 타이틀 가져오기 (메타데이터 활용)
    let realTitle = realTitleCache.get(postName);
    if (!realTitle) {
      // 각 포스트별로 최소 1개의 동영상만 메타데이터 요청
      const metadata = await fetchVideoMetadata(video.uid);
      realTitle = metadata.meta.title || postName; // 메타데이터에서 실제 타이틀 추출
      realTitleCache.set(postName, realTitle); // 캐시에 저장
    }
    
    if (!postMap.has(postName)) {
      postMap.set(postName, {
        postName,
        realTitle, // 실제 포스트 타이틀 저장
        videoCount: 0,
        minutesViewed: 0,
        viewCount: 0,
        topVideos: []
      });
    }
    
    const post = postMap.get(postName)!;
    post.videoCount++;
    post.minutesViewed += video.minutesViewed;
    post.viewCount += video.viewCount;
    
    // 상위 5개 동영상 추적
    post.topVideos.push({
      fileName: video.fileName,
      minutesViewed: video.minutesViewed,
      viewCount: video.viewCount
    });
    
    // 시청 시간 기준 내림차순 정렬 및 상위 5개만 유지
    post.topVideos.sort((a, b) => b.minutesViewed - a.minutesViewed);
    if (post.topVideos.length > 5) {
      post.topVideos = post.topVideos.slice(0, 5);
    }
  }
  
  // Map을 배열로 변환하고 시청 시간 기준 내림차순 정렬
  return Array.from(postMap.values())
    .sort((a, b) => b.minutesViewed - a.minutesViewed);
}

// 동영상 메타데이터 가져오기 (실제 포스트 타이틀 포함)
async function fetchVideoMetadata(videoId: string) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`, {
    headers: {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch video metadata: ${response.statusText}`);
  }
  
  return await response.json();
}
```

### 구현 흐름

1. **상위 동영상 통계 가져오기**:
   ```typescript
   // 상위 1,000개 동영상만 가져오기 (시청 시간 기준 내림차순)
   const videoStats = await fetchVideoStats(startDate, endDate, 1000);
   ```

2. **포스트별 통계 생성**:
   ```typescript
   // 가져온 1,000개 동영상을 기반으로 포스트별 통계 생성
   const postStats = await generatePostStats(videoStats);
   ```

3. **통합 파일 저장**:
   ```typescript
   // 동영상 통계와 포스트 통계를 함께 저장
   await saveStatsFile({
     date: currentDate,
     videos: videoStats,
     posts: postStats
   });
   ```

이 방식은 서버리스 환경에서 효율적으로 작동하며, 10만개 동영상 중 실제로 의미 있는 상위 1,000개만 처리하므로 현실적인 접근법입니다.

## 8. 워커 구현 예시

### index.ts
```typescript
import { collectDailyStats, collectWeeklyStats } from './collector';
import { LogClient } from '../../shared/log-client';

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const logger = new LogClient(env.LOG_BUCKET, 'stream-stats');
    
    try {
      // 한국 시간 기준 날짜 계산
      const now = new Date();
      now.setHours(now.getHours() + 9); // UTC+9
      
      // 전날 날짜 (YYYY-MM-DD 형식)
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];
      
      // 요일이 월요일(1)인 경우 주간 통계도 수집
      if (now.getDay() === 1) {
        // 지난 주 월요일~일요일 날짜 계산
        const lastMonday = new Date(now);
        lastMonday.setDate(lastMonday.getDate() - 7);
        const lastSunday = new Date(now);
        lastSunday.setDate(lastSunday.getDate() - 1);
        
        const weekStartStr = lastMonday.toISOString().split('T')[0];
        const weekEndStr = lastSunday.toISOString().split('T')[0];
        
        // 주간 통계 수집
        await collectWeeklyStats(weekStartStr, weekEndStr, env, logger);
      }
      
      // 일별 통계 수집
      await collectDailyStats(dateStr, env, logger);
      
      await logger.log('scheduled', {
        status: 'success',
        date: dateStr,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      await logger.log('scheduled', {
        status: 'error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }
};
```

### types.ts
```typescript
export interface Env {
  POINTS_SYSTEM_BUCKET: R2Bucket;
  LOG_BUCKET: R2Bucket;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_API_TOKEN: string;
}

export interface CreatorStat {
  creator: string;
  minutesViewed: number;
  viewCount: number;
}

export interface CountryStat {
  clientCountryName: string;
  minutesViewed: number;
  viewCount: number;
}

export interface VideoStat {
  uid: string;
  fileName: string;
  minutesViewed: number;
  viewCount: number;
}

export interface PostStat {
  postName: string;
  videoCount: number;
  minutesViewed: number;
  viewCount: number;
  topVideos: {
    fileName: string;
    minutesViewed: number;
    viewCount: number;
  }[];
}

export interface CollectorResult {
  success: boolean;
  date: string;
  stats?: {
    creatorsCount: number;
    countriesCount: number;
    videosCount: number;
    postsCount: number;
    totalMinutesViewed: number;
    totalViewCount: number;
  };
  error?: string;
}
```

## 9. 실제 사용 사례

### 업로더(크리에이터) 통계 조회
```typescript
// 업로더 페이지에서 자신의 통계 조회
async function fetchCreatorStats(username: string, date: string) {
  // 일별 크리에이터 통계 파일 로드
  const response = await fetch(`/api/stream-stats/daily/${date}/creators`);
  const data = await response.json();
  
  // 해당 크리에이터 데이터 필터링
  const creatorStats = data.creators.find(c => c.creator === username);
  
  if (!creatorStats) {
    return { error: '통계 데이터가 없습니다.' };
  }
  
  // 크리에이터의 포스트 통계 로드
  const postsResponse = await fetch(`/api/stream-stats/daily/${date}/posts`);
  const postsData = await postsResponse.json();
  
  // 해당 크리에이터의 포스트만 필터링
  const creatorPosts = postsData.posts.filter(p => p.creator === username);
  
  return {
    stats: creatorStats,
    posts: creatorPosts,
    trend: creatorStats.trend
  };
}
```
