"use server";

import { lucia } from '@/auth';
import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { NotificationType } from '@prisma/client';
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { logActivity } from "@/lib/activity-logger/client";

export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    const { username, email, password, referredBy } = signUpSchema.parse(credentials);
    const addcoinUser = 2;
    const addcoinRefferer = 2;

    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    const userId = generateIdFromEntropySize(10);

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    if (existingUsername) {
      return {
        error: "Username already taken",
      };
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    if (existingEmail) {
      return {
        error: "Email already taken",
      };
    }

    // referredBy 체크를 transaction 전에 수행
    let referrer = null;
    let teamMasterId = null;
    let teamMasterType = null;

    if (referredBy) {
      // 추천인 정보 가져오기 (팀마스터 정보 포함)
      referrer = await prisma.user.findFirst({
        where: {
          username: {
            equals: referredBy,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
          username: true,
          teamMaster: true,
        },
      });

      if (!referrer) {
        return {
          error: "추천인 정보를 찾을 수 없습니다.",
        };
      }

      // 추천인의 팀마스터 정보가 있는 경우
      if (referrer?.teamMaster) {
        teamMasterId = referrer.teamMaster;

        // 팀마스터 정보 조회
        const teamMasterSettings = await prisma.systemSetting.findFirst({
          where: {
            key: `team_master_settings_${teamMasterId}`,
          },
          select: {
            value: true,
          },
        });

        if (teamMasterSettings && teamMasterSettings.value) {
          const settings = teamMasterSettings.value as any;
          teamMasterType = settings.masterType || null;

          // 네트워크 바이너리 타입인 경우 직접 추천 가입자 수 확인
          if (teamMasterType === 'BINARY_NETWORK') {
            // 추천인의 직접 추천 가입자 수 조회
            const directReferrals = await prisma.user.count({
              where: {
                referredBy: referrer.username,
              },
            });

            // 직접 추천 가입자가 2명 이상인 경우
            if (directReferrals >= 2) {
              // 워커에서 로그를 기록하므로 클라이언트 측 로그는 제거

              return {
                error: "해당 추천인은 추천가입자수(2명)가 완료되었습니다.",
              };
            }
          }
        }
      }
    }

    // transaction 실행
    await prisma.$transaction(async (tx) => {
      // 새 사용자 생성 (팀마스터 정보 포함)
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: username,
          email,
          passwordHash,
          referredBy: referrer?.id || null,
          teamMaster: teamMasterId, // 추천인의 팀마스터 정보 설정
        },
      });

      // 추천인이 있는 경우에만 포인트 지급 및 알림 생성
      if (referrer) {
        await tx.user.update({
          where: { id: referrer.id },
          data: {
            mscoin: { increment: addcoinRefferer },
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: {
            mscoin: { increment: addcoinUser },
          },
        });

        await tx.notification.create({
          data: {
            issuerId: userId,
            recipientId: userId,
            type: NotificationType.COIN,
            metadata: {
              amount: addcoinUser,
              reason: '추천인 가입'
            }
          },
        });

        await tx.notification.create({
          data: {
            issuerId: userId,
            recipientId: referrer.id,
            type: NotificationType.COIN,
            metadata: {
              amount: addcoinRefferer,
              reason: '추천인 가입'
            }
          },
        });
      }

      // 알림 생성
      await tx.notification.create({
        data: {
          recipientId: userId,
          issuerId: userId,
          type: 'COMMENT',
          metadata: {
            reason: '가입을 환영합니다! 🎉🎉'
          }
        }
      });
    });

    // // 추천인 구조 워커 호출 (팀마스터가 있는 경우)
    // if (teamMasterId && referrer) {
    //   try {
    //     const apiKey = process.env.WORKER_API_KEY || process.env.CRON_SECRET;
    //     const apiBaseUrl = 'https://referral-structure.msdevcm.workers.dev';
        
    //     // 팀마스터 정보는 이미 teamMaster으로 알고 있으므로 불필요한 DB 조회 제거
    //     // 워커에서는 username만 사용하므로 직접 전달
        
    //     // 추천인 정보 가져오기 (추가 정보)
    //     const referrerInfo = await prisma.user.findUnique({
    //       where: { id: referrer.id },
    //       select: {
    //         id: true,
    //         username: true,
    //         displayName: true,
    //         email: true
    //       }
    //     });

    //     // referrerInfo가 null인 경우 처리
    //     if (!referrerInfo) {
    //       console.error('추천인 정보를 찾을 수 없음:', referrer.id);
    //       throw new Error('추천인 정보를 찾을 수 없습니다.');
    //     }

    //     // 워커로 전달하는 내용 로그 출력
    //     const requestBody = {
    //       masterUserId: teamMasterId,
    //       // userInfo를 최상위 레벨로 이동 (SyncReferralStructureRequest 인터페이스와 일치)
    //       userInfo: {
    //         username: teamMasterId // teamMasterId가 실제로는 유저네임
    //       },
    //       options: {
    //         // 추천인 정보도 함께 전달하여 structure.members에 추가될 수 있도록 함
    //         members: {
    //           added: [
    //             {
    //               userId: referrer.id,
    //               username: referrerInfo.username,
    //               displayName: referrerInfo.displayName || referrerInfo.username,
    //               email: referrerInfo.email,
    //               level: 0,
    //               joinedAt: new Date().toISOString(),
    //               status: 'active'
    //             }
    //           ],
    //           updated: [],
    //           removed: []
    //         },
    //         signupEvent: {
    //           userId: userId,
    //           username: username,
    //           displayName: username,
    //           email: email,
    //           referrerId: referrer.id
    //         }
    //       }
    //     };
        
    //     console.log('추천인 구조 워커로 전달하는 내용:', JSON.stringify(requestBody, null, 2));
    //     console.log('팀마스터 유저네임:', teamMasterId);
        
    //     // 추천인 구조 워커 호출 (sync 엔드포인트 사용)
    //     const response = await fetch(`${apiBaseUrl}/sync`, {
    //       method: 'POST',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': `Bearer ${apiKey}`
    //       },
    //       body: JSON.stringify(requestBody)
    //     });

    //     const result = await response.json();
    //     console.log('추천인 구조 워커 응답:', result);
        
    //     // 워커에서 로그를 기록하므로 클라이언트 측 로그는 제거
    //   } catch (error) {
    //     console.error('추천인 구조 워커 호출 오류:', error);
        
    //     // 워커에서 로그를 기록하므로 클라이언트 측 로그는 제거
    //   }
    // }

    const session = await lucia.createSession(userId, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    (await cookies()).set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    return { error: "" };
  } catch (error) {
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error;
    }
    console.error(error);
    return {
      error: "Something went wrong. Please try again.",
    };
  }
}
