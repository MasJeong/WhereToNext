import Link from "next/link";

import { ExperienceShell } from "@/components/trip-compass/experience-shell";
import { isIosShellMode } from "@/lib/runtime/shell";

export const dynamic = "force-static";

const policySections = [
  {
    title: "무엇을 수집하나요?",
    body:
      "추천 결과를 저장하거나 여행 기록을 남길 때 이름, 이메일, 로그인 공급자 정보, 여행 기록, 저장한 추천, 예정 여행 데이터를 보관할 수 있어요.",
  },
  {
    title: "왜 사용하나요?",
    body:
      "로그인을 유지하고, 저장한 추천을 다시 보여 주고, 여행 기록을 바탕으로 더 맞는 추천을 이어 주기 위해 사용해요.",
  },
  {
    title: "외부 서비스는 어떤가요?",
    body:
      "로그인, 지도, 영상, 이미지, 제휴 링크에는 Apple, Google, Kakao, YouTube, Unsplash 같은 외부 서비스가 함께 쓰일 수 있어요. 각 서비스는 자체 약관과 정책을 따릅니다.",
  },
  {
    title: "삭제는 어떻게 하나요?",
    body:
      "계정 설정 화면에서 계정 삭제를 진행할 수 있어요. 삭제하면 로그인 정보와 개인 여행 기록, 저장한 추천이 함께 지워져요.",
  },
] as const;

export default function PrivacyPage() {
  const hideAccountSettingsLink = isIosShellMode();

  return (
    <ExperienceShell
      eyebrow="정책"
      title="개인정보처리방침"
      intro="SooGo가 어떤 정보를 왜 쓰는지, 그리고 어떻게 삭제할 수 있는지 한눈에 확인할 수 있어요."
      capsule="최종 검토일 · 2026년 4월 5일"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5">
          <p className="text-[0.88rem] leading-7 text-[var(--color-ink-soft)]">
            `SooGo`는 여행 추천과 저장 기능을 안정적으로 제공하기 위해 필요한 최소 정보만 사용하려고 합니다.
            계정 기능은 선택 사항이며, 로그인 없이도 기본 추천 흐름은 사용할 수 있어요.
          </p>
        </div>

        <div className="grid gap-3">
          {policySections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5"
            >
              <h2 className="text-[0.95rem] font-bold text-[var(--color-ink)]">{section.title}</h2>
              <p className="mt-2 text-[0.86rem] leading-7 text-[var(--color-ink-soft)]">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-[var(--color-surface-muted)] px-5 py-5">
          <h2 className="text-[0.95rem] font-bold text-[var(--color-ink)]">문의와 다음 단계</h2>
          <p className="mt-2 text-[0.86rem] leading-7 text-[var(--color-ink-soft)]">
            정책 문의나 삭제 요청 전 확인이 필요하면 계정 화면에서 먼저 현재 저장 상태를 확인해 주세요.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {hideAccountSettingsLink ? null : (
              <Link
                href="/account/settings"
                className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-[0.8rem] font-semibold"
              >
                계정 설정으로
              </Link>
            )}
            <Link
              href="/"
              className="rounded-full border border-[var(--color-frame-soft)] px-4 py-2 text-[0.8rem] font-medium text-[var(--color-ink-soft)] transition-colors hover:text-[var(--color-ink)]"
            >
              홈으로
            </Link>
          </div>
        </div>
      </div>
    </ExperienceShell>
  );
}
