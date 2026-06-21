import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Plus, Edit2, Key, Shield, UserX, UserCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { User, PaginatedResponse } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/contexts/AuthContext";

export function TeamManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "user",
    phone: "",
  });

  const fetchUsers = async () => {
    try {
      const { data } = await api.get<PaginatedResponse<User>>("/users");
      setUsers(data.items);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/saas/invite", { email: formData.email, role: formData.role });
      setIsCreateModalOpen(false);
      alert(`Invitation sent to ${formData.email}`);
      fetchUsers();
    } catch (error) {
      console.error("Failed to invite user:", error);
      alert("Error inviting user");
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.id}`, {
        full_name: formData.full_name,
        phone: formData.phone,
        role: formData.role,
      });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to edit user:", error);
      alert("Error editing user");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await api.put(`/users/${selectedUser.id}/reset-password`, {
        password: formData.password,
      });
      setIsResetModalOpen(false);
      alert("Password reset successfully");
    } catch (error) {
      console.error("Failed to reset password:", error);
      alert("Error resetting password");
    }
  };

  const toggleStatus = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert("You cannot deactivate yourself.");
      return;
    }
    try {
      await api.put(`/users/${user.id}`, { is_active: !user.is_active });
      fetchUsers();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      alert("Error changing user status");
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      phone: user.phone || "",
    });
    setIsEditModalOpen(true);
  };

  const openResetModal = (user: User) => {
    setSelectedUser(user);
    setFormData({ ...formData, password: "" });
    setIsResetModalOpen(true);
  };

  const columns = [
    {
      header: "User",
      accessor: (row: User) => (
        <div>
          <div className="font-medium text-white">
            {row.full_name}
          </div>
          <div className="text-sm text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: (row: User) => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300 capitalize">
          <Shield className="h-3.5 w-3.5 text-brand-400" />
          {row.role.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      header: "Status",
      accessor: (row: User) => (
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.is_active
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      header: "Last Login",
      accessor: (row: User) => (
        <div className="text-sm text-slate-400">
          {row.last_login_at
            ? format(new Date(row.last_login_at), "MMM d, yyyy HH:mm")
            : "Never"}
        </div>
      ),
    },
    {
      header: "Actions",
      accessor: (row: User) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="h-8 w-8 p-0 text-slate-400 hover:text-white"
            title="Edit User"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openResetModal(row)}
            className="h-8 w-8 p-0 text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10"
            title="Reset Password"
          >
            <Key className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleStatus(row)}
            className={`h-8 w-8 p-0 ${row.is_active ? 'text-red-500/80 hover:text-red-400 hover:bg-red-500/10' : 'text-emerald-500/80 hover:text-emerald-400 hover:bg-emerald-500/10'}`}
            title={row.is_active ? "Deactivate" : "Activate"}
          >
            {row.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Team Management
          </h1>
          <p className="text-sm text-slate-400">
            Manage your workspace users, roles, and access.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => {
            setFormData({ email: "", password: "", full_name: "", role: "user", phone: "" });
            setIsCreateModalOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="glass-panel rounded-xl shadow-glow-super">
        <Table data={users} columns={columns} loading={loading} />
      </div>

      {/* Create Modal */}
      <Modal 
        open={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="Create New User"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: "company_admin", label: "Company Admin" },
              { value: "sales_representative", label: "Sales Representative" },
              { value: "user", label: "User" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create User</Button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal 
        open={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit User"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <Input
            label="Full Name"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Select
            label="Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: "company_admin", label: "Company Admin" },
              { value: "sales_representative", label: "Sales Representative" },
              { value: "user", label: "User" },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Password"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-sm text-slate-500 mb-4">
            Resetting password for <strong>{selectedUser?.full_name}</strong>.
          </p>
          <Input
            label="New Password"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" type="button" onClick={() => setIsResetModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">Reset Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
