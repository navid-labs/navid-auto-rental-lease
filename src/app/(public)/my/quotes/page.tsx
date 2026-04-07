import { MyQuotesList } from '@/features/quotes/components/my-quotes-list'

export const metadata = { title: '내 견적 요청 | Navid Auto' }

export default function MyQuotesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">내 견적 요청</h1>
      <MyQuotesList />
    </div>
  )
}
