import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isDevAuthBypassed, verifyToken } from '@/lib/auth';

export default async function CustomersPage() {
  if (!isDevAuthBypassed()) {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    const isAuthenticated = token ? !!verifyToken(token) : false;

    if (!isAuthenticated) {
      redirect('/');
    }
  }

  redirect('/dashboard');
}
