'use client';

import { useEffect, useState } from 'react';
import { useStudio } from '@/lib/context/studio-context';
import apiClient from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import type { ApiResponse, Studio } from '@/lib/types';

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function SettingsPage() {
  const { activeStudio, refreshStudios } = useStudio();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (activeStudio) {
      setName(activeStudio.name);
      setSlug(activeStudio.slug);
      setDescription(activeStudio.description ?? '');
      setSuccess(false);
    }
  }, [activeStudio]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStudio) return;
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await apiClient.patch<ApiResponse<{ studio: Studio }>>(
        `/api/studios/${activeStudio.id}`,
        { name: name.trim(), slug: slug.trim(), description: description.trim() || null },
      );
      await refreshStudios(res.data.data.studio.id);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update studio');
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeStudio) return <p className="text-sm text-secondary-foreground">No active studio.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Studio settings</h1>
        <p className="text-sm text-secondary-foreground">Manage your studio details and account.</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Basic information about your studio.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="sName">Studio name</Label>
              <Input id="sName" required value={name} onChange={(e) => handleNameChange(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sSlug">Slug</Label>
              <Input
                id="sSlug"
                required
                value={slug}
                onChange={(e) => { setSlugTouched(true); setSlug(slugify(e.target.value)); }}
              />
              <p className="text-xs text-muted">Lowercase letters, numbers and hyphens only.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sDesc">Description</Label>
              <Input
                id="sDesc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your studio"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-success">Studio updated successfully.</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="max-w-lg border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <CardDescription>
            Deleting your studio is permanent. All clients, workout plans, sessions and data will be removed.
            You can then create a new studio with a different name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" aria-label="Delete studio">
                Delete studio
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete &ldquo;{activeStudio.name}&rdquo;?</DialogTitle>
                <DialogDescription>
                  This action is permanent and cannot be undone. All data associated with this studio
                  will be deleted. Type the studio name to confirm.
                </DialogDescription>
              </DialogHeader>
              <DeleteStudioConfirm
                studio={activeStudio}
                onDeleted={() => { setDeleteOpen(false); refreshStudios(); }}
                onCancel={() => setDeleteOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

function DeleteStudioConfirm({
  studio,
  onDeleted,
  onCancel,
}: {
  studio: Studio;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await apiClient.delete(`/api/studios/${studio.id}`);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete studio');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="confirmName">
          Type <span className="font-bold text-foreground">{studio.name}</span> to confirm
        </Label>
        <Input
          id="confirmName"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={studio.name}
          autoComplete="off"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-3">
        <Button
          variant="destructive"
          className="flex-1"
          disabled={confirm !== studio.name || deleting}
          onClick={handleDelete}
          aria-label="Confirm studio deletion"
        >
          {deleting ? 'Deleting...' : 'Yes, delete studio'}
        </Button>
        <Button variant="ghost" onClick={onCancel} aria-label="Cancel deletion">
          Cancel
        </Button>
      </div>
    </div>
  );
}
