import type { Metadata } from 'next'
import { GeneralInquiryForm } from '@/features/inquiry/components/general-inquiry-form'
import { MessageCircle, Phone, Mail, MapPin } from 'lucide-react'

export const metadata: Metadata = {
  title: '문의하기 | Navid Auto',
  description: '렌탈, 리스 관련 문의를 남겨주세요. 빠른 시일 내에 답변 드리겠습니다.',
}

export default function InquiryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold">문의하기</h1>
        <p className="mt-2 text-muted-foreground">
          렌탈/리스 관련 문의를 남겨주시면 빠른 시일 내에 연락 드리겠습니다.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Contact Info */}
        <div className="space-y-6">
          <h2 className="text-lg font-semibold">연락처 안내</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-medium">전화 문의</p>
                <p className="text-sm text-muted-foreground">1588-0000 (평일 09:00~18:00)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-medium">이메일</p>
                <p className="text-sm text-muted-foreground">contact@navid-auto.kr</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-medium">방문 상담</p>
                <p className="text-sm text-muted-foreground">서울시 강남구 테헤란로 123</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessageCircle className="mt-0.5 size-5 text-primary" />
              <div>
                <p className="font-medium">카카오톡 상담</p>
                <p className="text-sm text-muted-foreground">@navid-auto</p>
              </div>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="rounded-lg border bg-background p-6">
          <h2 className="mb-4 text-lg font-semibold">온라인 문의</h2>
          <GeneralInquiryForm />
        </div>
      </div>
    </div>
  )
}
