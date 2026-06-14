import TopNav from '@/components/layout/TopNav'
import ShowcaseView from '@/components/layout/ShowcaseView'

export const dynamic = 'force-dynamic'

export default function ShowcasePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <ShowcaseView />
    </div>
  )
}
