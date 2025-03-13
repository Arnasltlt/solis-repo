import { redirect } from 'next/navigation'

export default function ContentRedirect() {
  // Redirect to content creation page
  redirect('/manage/content/new')
}