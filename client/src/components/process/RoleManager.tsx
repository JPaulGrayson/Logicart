/**
 * RoleManager - Sidebar for managing process roles
 */

import React, { useState } from 'react';
import type { Role, RoleType } from '@/types/process';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, User, Monitor, Bot, Building2, GripVertical, Pencil, Trash2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_TYPE_OPTIONS: { value: RoleType; label: string; icon: React.ReactNode }[] = [
  { value: 'human', label: 'Human', icon: <User className="w-4 h-4" /> },
  { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  { value: 'ai', label: 'AI Agent', icon: <Bot className="w-4 h-4" /> },
  { value: 'external', label: 'External', icon: <Building2 className="w-4 h-4" /> },
];

const DEFAULT_COLORS: Record<RoleType, string> = {
  human: '#3b82f6',
  system: '#10b981',
  ai: '#a855f7',
  external: '#f59e0b',
};

interface RoleManagerProps {
  roles: Role[];
  onRolesChange: (roles: Role[]) => void;
  stepsPerRole?: Map<string, number>;
  className?: string;
}

export function RoleManager({ roles, onRolesChange, stepsPerRole, className }: RoleManagerProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Role | null>(null);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<RoleType>('human');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS.human);
  
  const handleAddRole = () => {
    if (!newName.trim()) return;
    const newRole: Role = { id: `role-${Date.now()}`, name: newName.trim(), type: newType, color: newColor };
    onRolesChange([...roles, newRole]);
    setNewName('');
    setNewType('human');
    setNewColor(DEFAULT_COLORS.human);
    setIsAddOpen(false);
  };
  
  const handleEditRole = () => {
    if (!editingRole?.name.trim()) return;
    onRolesChange(roles.map(r => r.id === editingRole.id ? editingRole : r));
    setEditingRole(null);
  };
  
  const handleDeleteRole = (role: Role) => {
    const stepCount = stepsPerRole?.get(role.id) || 0;
    if (stepCount > 0) setDeleteConfirm(role);
    else onRolesChange(roles.filter(r => r.id !== role.id));
  };
  
  const handleTypeChange = (type: RoleType, isEdit: boolean) => {
    if (isEdit && editingRole) setEditingRole({ ...editingRole, type, color: DEFAULT_COLORS[type] });
    else { setNewType(type); setNewColor(DEFAULT_COLORS[type]); }
  };
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Roles / Swimlanes</h3>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 px-2"><Plus className="w-4 h-4" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add New Role</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g., Customer Support" />
              </div>
              <div className="space-y-2">
                <Label>Role Type</Label>
                <Select value={newType} onValueChange={(v) => handleTypeChange(v as RoleType, false)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">{opt.icon}{opt.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Lane Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" id="color" value={newColor} onChange={(e) => setNewColor(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                  <Input value={newColor} onChange={(e) => setNewColor(e.target.value)} className="font-mono text-sm" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button onClick={handleAddRole} disabled={!newName.trim()}>Add Role</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm">
            <Users className="w-8 h-8 mb-2 opacity-50" />
            <p>No roles defined</p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {roles.map(role => {
              const TypeIcon = ROLE_TYPE_OPTIONS.find(o => o.value === role.type)?.icon;
              const stepCount = stepsPerRole?.get(role.id) || 0;
              return (
                <div key={role.id} className="group flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 cursor-grab" />
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: role.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium truncate">{role.name}</span>
                      <span className="text-muted-foreground">{TypeIcon}</span>
                    </div>
                    {stepCount > 0 && <span className="text-[10px] text-muted-foreground">{stepCount} step{stepCount !== 1 ? 's' : ''}</span>}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingRole({ ...role })}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role)}><Trash2 className="w-3 h-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <Dialog open={!!editingRole} onOpenChange={(open) => !open && setEditingRole(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Role</DialogTitle></DialogHeader>
          {editingRole && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Role Name</Label>
                <Input value={editingRole.name} onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role Type</Label>
                <Select value={editingRole.type} onValueChange={(v) => handleTypeChange(v as RoleType, true)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLE_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">{opt.icon}{opt.label}</div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lane Color</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={editingRole.color} onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })} className="w-10 h-10 rounded border border-border cursor-pointer" />
                  <Input value={editingRole.color} onChange={(e) => setEditingRole({ ...editingRole, color: e.target.value })} className="font-mono text-sm" />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleEditRole}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role?</AlertDialogTitle>
            <AlertDialogDescription>This role has {stepsPerRole?.get(deleteConfirm?.id || '') || 0} steps. Deleting it will remove all associated steps.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onRolesChange(roles.filter(r => r.id !== deleteConfirm?.id)); setDeleteConfirm(null); }} className="bg-destructive text-destructive-foreground">Delete Role</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
