import { redirect } from 'next/navigation';

export default function RootRedirect() {
  redirect('/realestate-admin/dashboard');
}
