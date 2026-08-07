import { redirect } from 'next/navigation';

// Oro-compatible URL: /customer/user/login → /login
export function GET() {
  redirect('/login');
}
