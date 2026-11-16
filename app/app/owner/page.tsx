import { redirect } from 'next/navigation';

export default function AppOwnerRedirect() {
  redirect('/owner');
}
