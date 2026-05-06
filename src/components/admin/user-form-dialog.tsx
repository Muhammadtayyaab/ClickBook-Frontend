import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser, updateUser, type AdminUser } from "@/lib/admin-api";

const ROLES = ["user", "admin"] as const;
const PLANS = ["free", "starter", "pro", "business"] as const;

/**
 * Single schema used for both create and update. In update mode we pass
 * a `isEdit` flag via context so the refine skips the min-length check
 * when password is empty.
 */
function buildSchema(isEdit: boolean) {
  return z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(150),
    email: z.string().email("Invalid email"),
    role: z.enum(ROLES),
    plan: z.enum(PLANS),
    is_active: z.boolean(),
    password: z.string().refine(
      (v) => (isEdit ? v === "" || v.length >= 8 : v.length >= 8),
      { message: isEdit ? "Password must be at least 8 characters" : "Password is required (min 8 chars)" },
    ),
  });
}

type UserFormValues = {
  name: string;
  email: string;
  role: (typeof ROLES)[number];
  plan: (typeof PLANS)[number];
  is_active: boolean;
  password: string;
};

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null; // null = create mode
  onSaved: () => void;
}

export function UserFormDialog({ open, onOpenChange, user, onSaved }: UserFormDialogProps) {
  const isEdit = !!user;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(buildSchema(isEdit)),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "user",
      plan: "free",
      is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: user?.name ?? "",
        email: user?.email ?? "",
        password: "",
        role: (user?.role as (typeof ROLES)[number]) ?? "user",
        plan: (user?.plan as (typeof PLANS)[number]) ?? "free",
        is_active: user?.is_active ?? true,
      });
    }
  }, [open, user, form]);

  async function onSubmit(values: UserFormValues) {
    setSubmitting(true);
    try {
      if (isEdit && user) {
        const payload: Partial<AdminUser> & { password?: string } = {
          name: values.name,
          role: values.role,
          plan: values.plan,
          is_active: values.is_active,
        };
        if (values.password) payload.password = values.password;
        await updateUser(user.id, payload);
        toast.success("User updated");
      } else {
        await createUser(values);
        toast.success("User created");
      }
      onSaved();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit user" : "Create user"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update user details and permissions." : "Add a new user to the platform."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...form.register("name")} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" disabled={isEdit} {...form.register("email")} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{isEdit ? "New password (optional)" : "Password"}</Label>
            <Input id="password" type="password" {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch("role")}
                onValueChange={(v) => form.setValue("role", v as (typeof ROLES)[number])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select
                value={form.watch("plan")}
                onValueChange={(v) => form.setValue("plan", v as (typeof PLANS)[number])}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={form.watch("is_active")}
              onChange={(e) => form.setValue("is_active", e.target.checked)}
            />
            Active
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
