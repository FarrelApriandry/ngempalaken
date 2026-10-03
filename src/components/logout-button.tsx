"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { logoutAction } from "@/src/actions/auth";

export function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await logoutAction();
        } finally {
          router.push("/login");
          router.refresh();
        }
      }}
    >
      <LogOut /> {loading ? "..." : "Logout"}
    </Button>
  );
}
