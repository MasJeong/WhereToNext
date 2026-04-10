import Link from "next/link";

import { ExperienceShell } from "@/components/trip-compass/experience-shell";

export const dynamic = "force-static";

const supportSections = [
  {
    title: "무엇을 도와드리나요?",
    body:
      "추천 결과가 다르게 보이거나, 저장한 추천과 여행 기록, 로그인, 링크 복원에서 막히는 부분이 있으면 먼저 확인해 주세요.",
  },
  {
    title: "먼저 확인해 볼 것",
    body:
      "로그인 문제는 다시 로그인하거나 소셜 공급자 연결 상태를 확인해 주세요. 저장과 복원 문제는 같은 링크를 웹 브라우저에서 다시 열어 보면 원인을 빠르게 좁힐 수 있어요.",
  },
  {
    title: "문의할 때 함께 알려 주세요",
    body:
      "기기 종류, iOS 버전, 문제가 난 화면, 가능하면 snapshot 링크나 목적지 이름을 함께 알려 주면 더 빠르게 확인할 수 있어요.",
  },
] as const;

export default function SupportPage() {
  return (
    <ExperienceShell
      eyebrow="지원"
      title="지원 안내"
      intro="앱 사용 중 막히는 부분을 빠르게 정리하고, App Review와 TestFlight 확인에도 바로 쓸 수 있게 준비한 안내예요."
      capsule="최종 검토일 · 2026년 4월 10일"
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--color-frame-soft)] bg-white px-5 py-5">
          <h2 className="text-[0.95rem] font-bold text-[var(--color-ink)]">문의 채널</h2>
          <div className="mt-3 space-y-2 text-[0.88rem] leading-7 text-[var(--color-ink-soft)]">
            <p>이메일: support@tteonabolkka.app</p>
            <p>응답 기준: 영업일 기준 1~2일 안에 확인해 드려요.</p>
            <p>심사나 TestFlight 확인용 문의라면 메일 제목에 `App Review` 또는 `TestFlight`를 함께 적어 주세요.</p>
          </div>
        </div>

        <div className="grid gap-3">
          {supportSections.map((section) => (
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
          <h2 className="text-[0.95rem] font-bold text-[var(--color-ink)]">바로 가기</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/privacy"
              className="compass-action-secondary compass-soft-press rounded-full px-4 py-2 text-[0.8rem] font-semibold"
            >
              개인정보처리방침
            </Link>
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
