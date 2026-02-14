"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Camera,
  Check,
  Loader2,
  LogOut,
  Mail,
  KeyRound,
  User,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCsrf } from "@/hooks/use-csrf";
import { updateEmail, updatePassword, signOut } from "../actions";

type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
};

export default function ProfileEditPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { csrfFetch } = useCsrf();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [authEmail, setAuthEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // Name
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Email
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Logout
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function fetchProfile() {
    const res = await fetch("/api/profile");
      if (!res.ok) {
        toast.error("Failed to load profile");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setAuthEmail(data.authEmail ?? data.profile.email);
      setFullName(data.profile.full_name ?? "");
      setAvatarUrl(data.profile.avatar_url);
      setNewEmail(data.authEmail ?? data.profile.email);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  // ─── Save Name ──────────────────────────────────────
  async function handleSaveName() {
    if (!fullName.trim()) {
      toast.error("Name cannot be empty.");
      return;
    }
    setSavingName(true);
    const res = await csrfFetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: fullName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to update name.");
    } else {
      toast.success("Name updated.");
      setProfile((p) => (p ? { ...p, full_name: fullName.trim() } : p));
    }
    setSavingName(false);
  }

  // ─── Upload Avatar ─────────────────────────────────
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await csrfFetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Failed to upload avatar.");
    } else {
      setAvatarUrl(data.avatar_url + "?t=" + Date.now());
      toast.success("Avatar updated.");
    }
    setUploadingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Update Email ──────────────────────────────────
  async function handleUpdateEmail() {
    if (newEmail === authEmail) {
      toast.info("Email is unchanged.");
      return;
    }
    setSavingEmail(true);
    const fd = new FormData();
    fd.set("email", newEmail);
    const result = await updateEmail(fd);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(result.success);
    }
    setSavingEmail(false);
  }

  // ─── Update Password ──────────────────────────────
  async function handleUpdatePassword() {
    setSavingPassword(true);
    const fd = new FormData();
    fd.set("currentPassword", currentPassword);
    fd.set("newPassword", newPassword);
    fd.set("confirmPassword", confirmPassword);
    const result = await updatePassword(fd);
    if (result?.error) {
      toast.error(result.error);
    } else if (result?.success) {
      toast.success(result.success);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  }

  // ─── Logout ────────────────────────────────────────
  function handleLogout() {
    startTransition(async () => {
      await signOut();
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const initials =
    fullName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || authEmail?.slice(0, 2).toUpperCase() || "U";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage your account details and preferences.
        </p>
      </div>

      {/* Avatar Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="size-4" />
            Profile Picture
          </CardTitle>
          <CardDescription>
            Click on your avatar to upload a new photo. Max 2MB (JPEG, PNG,
            WebP).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="relative group rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Avatar
              size="lg"
              className="size-20 text-lg transition-opacity group-hover:opacity-75"
            >
              <AvatarImage src={avatarUrl ?? undefined} />
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
              {uploadingAvatar ? (
                <Loader2 className="size-5 text-white animate-spin" />
              ) : (
                <Camera className="size-5 text-white" />
              )}
            </div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              {fullName || "No name set"}
            </p>
            <p>{authEmail}</p>
          </div>
        </CardContent>
      </Card>

      {/* Name Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-4" />
            Full Name
          </CardTitle>
          <CardDescription>
            This is the name displayed on your profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>
          <Button
            onClick={handleSaveName}
            disabled={savingName || fullName === profile?.full_name}
            size="sm"
          >
            {savingName ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Save Name
          </Button>
        </CardContent>
      </Card>

      {/* Email Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="size-4" />
            Email Address
          </CardTitle>
          <CardDescription>
            Changing your email will require verification on both the old and new
            addresses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button
            onClick={handleUpdateEmail}
            disabled={savingEmail || newEmail === authEmail}
            size="sm"
          >
            {savingEmail ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Update Email
          </Button>
        </CardContent>
      </Card>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-4" />
            Password
          </CardTitle>
          <CardDescription>
            Must be at least 8 characters with an uppercase letter, lowercase
            letter, and a number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showCurrentPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleUpdatePassword}
            disabled={
              savingPassword ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            size="sm"
          >
            {savingPassword ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Logout */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">Sign out</p>
          <p className="text-muted-foreground text-sm">
            Sign out of your account on this device.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          disabled={isPending}
          className="text-destructive hover:text-destructive"
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <LogOut className="size-4" />
          )}
          Logout
        </Button>
      </div>
    </div>
  );
}
