import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { isDevAuthBypassed, verifyToken } from '@/lib/auth';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  if (!isDevAuthBypassed()) {
    const cookieStore = await cookies();
    const token = cookieStore.get('session_token')?.value;
    const isAuthenticated = token ? !!verifyToken(token) : false;

    if (!isAuthenticated) {
      redirect('/');
    }
  }

  return <>{children}</>;
}
