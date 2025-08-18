import { redirect } from 'next/navigation'

export default function ContentRedirect() {
  // Redirect to content management list
  redirect('/manage/content/list')
}