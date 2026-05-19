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
import { uuidv7 } from 'uuidv7';
import { syncReferralStructure } from '@/lib/referral-structure-client';

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

    // const userId = generateIdFromEntropySize(10);
    const userId = uuidv7();

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
    let joinUserRole = 10;

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

        joinUserRole = 40;

        // 팀마스터 정보 조회
        const teamMasterSettings = await prisma.systemSetting.findFirst({
          where: {
            key: `agencySettings_${teamMasterId}`,
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
            const directReferralLimit =
              Number(settings.settings?.binaryNetwork?.directReferralLimit) ||
              Number(settings.settings?.network?.payoutQualification?.memberCount) ||
              2;

            // 추천인의 직접 추천 가입자 수 조회
            // const directReferrals = await prisma.user.count({
            //   where: {
            //     referredBy: referrer.username,
            //   },
            // });

            const directReferrals = await prisma.user.count({
              where: {
                referredBy: referrer.id,
              },
            });

            // 바이너리 네트워크는 직접 하위 레그 수를 제한한다.
            if (directReferrals >= directReferralLimit) {
              // 워커에서 로그를 기록하므로 클라이언트 측 로그는 제거

              return {
                error: `해당 추천인은 추천가입자수(${directReferralLimit}명) 완료로 추가할 수 없습니다.`,
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
          userRole: joinUserRole,
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

    // 추천인 구조 워커 호출 (팀마스터가 있는 경우)
    if (teamMasterId && referrer) {
      try {     
        await syncReferralStructure(userId, "add", teamMasterId);

      } catch (error) {
        console.error('신규회원 영업자 추가 워커 호출 오류:', error);
        
        return {
          error: "신규회원 영업자 워커 추가에 실패했습니다. 나중에 다시 시도해 주세요.",
        };
      }
    }

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
