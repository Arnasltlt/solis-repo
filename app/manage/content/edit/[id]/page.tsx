import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditContentPage({ params }: { params: { id: string } }) {
  return redirect(`/manage/content/editor/${params.id}`)
}