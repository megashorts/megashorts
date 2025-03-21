# 메가쇼츠 포인트 시스템 API 라우트 요약

이 문서는 메가쇼츠 포인트 시스템의 API 라우트와 그 역할을 요약합니다. 메인 프로젝트(Vercel)와 워커 프로젝트(Cloudflare Workers)의 API 엔드포인트를 모두 포함합니다.

## 목차

1. [메인 프로젝트 API 라우트](#1-메인-프로젝트-api-라우트)
   - [에이전시 관련 API](#11-에이전시-관련-api)
   - [업로더 관련 API](#12-업로더-관련-api)
   - [포인트 관련 API](#13-포인트-관련-api)
2. [워커 프로젝트 API 엔드포인트](#2-워커-프로젝트-api-엔드포인트)
   - [에이전시 워커 API](#21-에이전시-워커-api)
   - [업로더 워커 API](#22-업로더-워커-api)
   - [통계 워커 API](#23-통계-워커-api)

## 1. 메인 프로젝트 API 라우트

### 1.1 에이전시 관련 API

| 경로 | 메소드 | 역할 | 인증 요구사항 |
|------|-------|------|-------------|
| `/api/agency/views-export` | POST | 일일 시청 데이터를 R2에 내보내기 | 관리자 또는 API 키 |
| `/api/agency/settings-export` | POST | 시스템 설정을 R2에 내보내기 | 관리자 또는 API 키 |
| `/api/agency/points-apply` | POST | 에이전시 포인트 적용 | 관리자 또는 API 키 |
| `/api/agency/settings` | GET | 마스터 설정 조회 | 로그인 사용자 |
| `/api/agency/settings` | POST | 마스터 설정 저장 | 마스터 권한 |
| `/api/agency/distributions` | GET | 포인트 분배 내역 조회 | 로그인 사용자 |
| `/api/agency/structure` | GET | 추천인 구조 조회 | 로그인 사용자 |
| `/api/agency/trigger-settlement` | POST | 수동 정산 트리거 | 관리자 |

### 1.2 업로더 관련 API

| 경로 | 메소드 | 역할 | 인증 요구사항 |
|------|-------|------|-------------|
| `/api/uploader/uploaders-export` | GET | 업로더 목록 내보내기 | 관리자 또는 API 키 |
| `/api/uploader/subscribers-count` | GET | 구독자 수 조회 | 관리자 또는 API 키 |
| `/api/uploader/user-info` | GET | 업로더 정보 조회 | 관리자 또는 API 키 |
| `/api/uploader/uploader-level` | GET | 업로더 레벨 조회 | 관리자 또는 API 키 |
| `/api/uploader/update-uploader-level` | POST | 업로더 레벨 업데이트 | 관리자 또는 API 키 |
| `/api/uploader/points-apply` | POST | 업로더 포인트 적용 | 관리자 또는 API 키 |
| `/api/uploader/earnings` | GET | 업로더 포인트 내역 조회 | 로그인 사용자 |
| `/api/uploader/post-earnings` | GET | 포스트별 수익 내역 조회 | 로그인 사용자 |
| `/api/uploader/trigger-settlement` | POST | 수동 정산 트리거 | 관리자 |

### 1.3 포인트 관련 API

| 경로 | 메소드 | 역할 | 인증 요구사항 |
|------|-------|------|-------------|
| `/api/points/apply` | POST | 포인트 지급 신청 | 로그인 사용자 |
| `/api/points/payments` | GET | 지급 내역 조회 | 로그인 사용자 |
| `/api/points/applications` | GET | 지급 신청 내역 조회 | 로그인 사용자 |
| `/api/points/users/[userId]` | GET | 사용자 포인트 정보 조회 | 로그인 사용자 |
| `/api/points/users/[userId]/bank-info` | GET | 사용자 은행 정보 조회 | 로그인 사용자 |
| `/api/points/users/[userId]/bank-info` | POST | 사용자 은행 정보 업데이트 | 로그인 사용자 |
| `/api/points/admin/withdrawals` | GET | 관리자용 출금 내역 조회 | 관리자 |
| `/api/points/admin/withdrawals/[id]/approve` | POST | 출금 승인 | 관리자 |
| `/api/points/admin/withdrawals/[id]/reject` | POST | 출금 거절 | 관리자 |
| `/api/points/admin/withdrawals/[id]/memo` | POST | 출금 메모 추가 | 관리자 |

## 2. 워커 프로젝트 API 엔드포인트

### 2.1 에이전시 워커 API

| 엔드포인트 | 메소드 | 역할 | 트리거 |
|-----------|-------|------|--------|
| `/settings` | GET | 마스터 설정 조회 | HTTP 요청 |
| `/settings` | POST | 마스터 설정 저장 | HTTP 요청 |
| `/distributions` | GET | 포인트 분배 내역 조회 | HTTP 요청 |
| `/structure` | GET | 추천인 구조 조회 | HTTP 요청 |
| `/trigger-settlement` | POST | 수동 정산 트리거 | HTTP 요청 |
| `/__scheduled` | POST | 스케줄된 작업 실행 | 크론 또는 수동 |

### 2.2 업로더 워커 API

| 엔드포인트 | 메소드 | 역할 | 트리거 |
|-----------|-------|------|--------|
| `/earnings` | GET | 업로더 포인트 내역 조회 | HTTP 요청 |
| `/post-earnings` | GET | 포스트별 수익 내역 조회 | HTTP 요청 |
| `/trigger-settlement` | POST | 수동 정산 트리거 | HTTP 요청 |
| `/__scheduled` | POST | 스케줄된 작업 실행 | 크론 또는 수동 |

### 2.3 통계 워커 API

| 엔드포인트 | 메소드 | 역할 | 트리거 |
|-----------|-------|------|--------|
| `/uploader` | GET | 업로더 통계 조회 | HTTP 요청 |
| `/agency` | GET | 에이전시 통계 조회 | HTTP 요청 |
| `/admin` | GET | 관리자 통계 조회 | HTTP 요청 |
| `/points/apply` | POST | 포인트 지급 신청 처리 | HTTP 요청 |
| `/points/payments` | GET | 지급 내역 조회 | HTTP 요청 |
| `/points/applications` | GET | 지급 신청 내역 조회 | HTTP 요청 |
| `/reports/daily` | GET | 일일 보고서 조회 | HTTP 요청 |
| `/reports/weekly` | GET | 주간 보고서 조회 | HTTP 요청 |
| `/reports/monthly` | GET | 월간 보고서 조회 | HTTP 요청 |

## 3. 데이터 흐름 요약

### 3.1 일일 데이터 처리 흐름

1. 에이전시 워커가 스케줄에 따라 실행됨 (`/__scheduled`)
2. 워커가 메인 프로젝트 API를 호출하여 데이터 요청 (`/api/agency/views-export`)
3. 메인 프로젝트가 데이터를 R2에 저장
4. 워커가 R2에서 데이터를 읽어 처리
5. 워커가 처리 결과를 R2에 저장

### 3.2 포인트 적용 흐름

1. 워커가 정산 처리 후 결과를 R2에 저장
2. 워커가 메인 프로젝트 API를 호출하여 포인트 적용 요청 (`/api/agency/points-apply`, `/api/uploader/points-apply`)
3. 메인 프로젝트가 데이터베이스에 포인트 적용

### 3.3 사용자 요청 처리 흐름

1. 사용자가 메인 프로젝트 API를 호출 (예: `/api/points/apply`)
2. 메인 프로젝트가 요청을 처리하고 데이터베이스에 저장
3. 필요한 경우 워커 API를 호출하여 추가 처리 요청
