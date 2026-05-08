import CreateUserPage from '@/features/users/components/create-user-page';
import { hasCreateUserSession } from '@/features/users/route-state';

export default async function NewUserPage() {
  const hasSession = await hasCreateUserSession();

  return <CreateUserPage hasSession={hasSession} />;
}
