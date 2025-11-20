import UsersTable from '@/components/admin/users/UsersTable';

export default function AdminUsersPage() {
  return (
    <div className="py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-500">Gestión de Usuarios</h1>
        <p className="text-muted-foreground mt-1">
          Administra los usuarios, sus roles y permisos del sistema
        </p>
      </div>
      
      <UsersTable />
    </div>
  );
}
