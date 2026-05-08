import CreateRolePageContent from '@/features/roles/components/create-role-page';
import { hasCreateRoleSession } from '@/features/roles/route-state';

export default async function NewRolePage() {
  const hasSession = await hasCreateRoleSession();

  return <CreateRolePageContent hasSession={hasSession} />;
}
