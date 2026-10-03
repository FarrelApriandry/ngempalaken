import { LoginForm } from "@/src/components/login-form";

export const metadata = { title: "Login — LaprakHub" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
