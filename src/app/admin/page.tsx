import TopNav from '@/components/layout/TopNav'
import AdminView from '@/components/layout/AdminView'

export default function AdminPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav />
      <AdminView />
    </div>
  )
}
