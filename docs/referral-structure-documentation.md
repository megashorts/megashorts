# 조회 탭의 추천인 구조 탭 분석

## 로직 및 방식

추천인 구조 탭은 사용자의 추천인 네트워크를 트리 형태로 시각화하는 기능을 제공합니다. 이 기능의 작동 방식은 다음과 같습니다:

### 1. 데이터 로드 과정

1. `Agencysearch.tsx`에서 컴포넌트가 마운트되거나 탭이 "structure"로 변경될 때 `loadStructureData` 함수가 호출됩니다.
2. 이 함수는 `/api/agency/structure?userId={currentUser.id}` API 엔드포인트를 호출하여 현재 로그인한 사용자의 추천인 구조 데이터를 가져옵니다.
3. API 호출이 성공하면 응답 데이터를 `structureData` 상태에 저장합니다.
4. 이 데이터는 `ReferralStructureView` 컴포넌트에 전달되어 화면에 표시됩니다.

### 2. 백엔드 데이터 구성 과정

`structure/route.ts` 파일에서 추천인 구조 데이터를 구성하는 과정은 다음과 같습니다:

1. 요청된 `userId`에 해당하는 사용자 정보를 데이터베이스에서 조회합니다.
2. 해당 사용자와 관련된 에이전시 역할 정보를 조회합니다.
3. 사용자의 직접 추천인(`referrals`)을 조회합니다.
4. `buildReferralTree` 함수를 재귀적으로 호출하여 전체 추천인 트리를 구성합니다:
   - 각 추천인에 대해 그들의 하위 추천인을 조회합니다.
   - 각 추천인의 에이전시 역할 정보를 매핑합니다.
   - 이 과정을 재귀적으로 반복하여 전체 트리를 구성합니다.

### 3. 프론트엔드 렌더링 과정

`ReferralStructureView.tsx` 파일에서 추천인 구조를 렌더링하는 과정은 다음과 같습니다:

1. 루트 노드(현재 사용자)부터 시작하여 `ReferralTreeNode` 컴포넌트를 재귀적으로 렌더링합니다.
2. 각 노드는 확장/축소 가능한 트리 구조로 표시됩니다.
3. 기본적으로 처음 2단계(level < 2)까지는 자동으로 확장됩니다.
4. 각 노드에는 사용자명, 역할(본부마스터, 운영자 등), 에이전시 역할 정보(레벨, 수수료 비율)가 표시됩니다.

## 데이터 구조

추천인 구조 데이터는 다음과 같은 계층적 구조를 가집니다:

```typescript
interface ReferralNode {
  userId: string;         // 사용자 ID
  username: string;       // 사용자명
  referredBy: string | null; // 추천인
  userRole: number;       // 사용자 역할 (50: 본부마스터, 40: 운영자, 30: 에이전시마스터, 20: 에이전시멤버, 기타: 일반회원)
  agencyRoles: {          // 에이전시 역할 정보
    masterId: string;     // 마스터 ID
    role: string;         // 역할
    level: number;        // 레벨
    commissionRate: number; // 수수료 비율
  }[];
  children: ReferralNode[]; // 하위 추천인 목록 (재귀적 구조)
}
```

## 예시 데이터

다음은 추천인 구조 데이터의 예시입니다:

```json
{
  "userId": "user1",
  "username": "본부마스터",
  "referredBy": null,
  "userRole": 50,
  "agencyRoles": [],
  "children": [
    {
      "userId": "user2",
      "username": "에이전시마스터1",
      "referredBy": "본부마스터",
      "userRole": 30,
      "agencyRoles": [
        {
          "masterId": "user1",
          "role": "AGENCY",
          "level": 1,
          "commissionRate": 5
        }
      ],
      "children": [
        {
          "userId": "user4",
          "username": "에이전시멤버1",
          "referredBy": "에이전시마스터1",
          "userRole": 20,
          "agencyRoles": [
            {
              "masterId": "user1",
              "role": "MEMBER",
              "level": 2,
              "commissionRate": 3
            }
          ],
          "children": []
        }
      ]
    },
    {
      "userId": "user3",
      "username": "에이전시마스터2",
      "referredBy": "본부마스터",
      "userRole": 30,
      "agencyRoles": [
        {
          "masterId": "user1",
          "role": "AGENCY",
          "level": 1,
          "commissionRate": 5
        }
      ],
      "children": [
        {
          "userId": "user5",
          "username": "일반회원1",
          "referredBy": "에이전시마스터2",
          "userRole": 10,
          "agencyRoles": [
            {
              "masterId": "user1",
              "role": "MEMBER",
              "level": 3,
              "commissionRate": 1
            }
          ],
          "children": []
        }
      ]
    }
  ]
}
```

## 화면 표시 예시

위 데이터가 화면에 표시되는 방식은 다음과 같습니다:

```
▼ 본부마스터 (본부마스터)
  │
  ├─▼ 에이전시마스터1 (에이전시마스터) 레벨 1 (5%)
  │  │
  │  └─○ 에이전시멤버1 (에이전시멤버) 레벨 2 (3%)
  │
  └─▼ 에이전시마스터2 (에이전시마스터) 레벨 1 (5%)
     │
     └─○ 일반회원1 (일반회원) 레벨 3 (1%)
```

여기서:
- `▼`는 확장된 노드를 나타냅니다.
- `▶`는 축소된 노드를 나타냅니다.
- `○`는 하위 노드가 없는 노드를 나타냅니다.
- 각 노드 옆에는 사용자명, 역할, 에이전시 역할 정보가 표시됩니다.

## 주요 특징

1. **계층적 표시**: 추천인 관계가 계층적으로 표시되어 전체 구조를 쉽게 파악할 수 있습니다.
2. **확장/축소 기능**: 노드를 클릭하여 하위 구조를 확장하거나 축소할 수 있습니다.
3. **역할 표시**: 각 사용자의 역할(본부마스터, 운영자, 에이전시마스터, 에이전시멤버, 일반회원)이 표시됩니다.
4. **에이전시 역할 정보**: 각 사용자의 에이전시 역할 정보(레벨, 수수료 비율)가 표시됩니다.
5. **자동 확장**: 처음 2단계까지는 자동으로 확장되어 표시됩니다.

이 추천인 구조 탭을 통해 본부마스터는 자신의 추천인 네트워크를 시각적으로 확인하고, 각 추천인의 역할과 수수료 비율을 파악할 수 있습니다. 이는 영업 구조를 관리하고 포인트 분배 시스템을 이해하는 데 도움이 됩니다.
