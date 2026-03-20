import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useSignup } from "../../hooks/useSignup";
import FormInput from "../../components/auth/FormInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Icons ─────────────────────────────────────────────────────────────────────

const PhoneIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

// ── Form types ────────────────────────────────────────────────────────────────

interface SignupFormValues {
  phoneNo: string;
  username: string;
  password: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const { signup, isLoading } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>();

  const onSubmit = (data: SignupFormValues) => signup(data);

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12 transition-colors duration-300">

      {/* Ambient glow */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-200/20 dark:bg-violet-900/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md mx-auto">
        <Card className="border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl shadow-neutral-200/50 dark:shadow-black/40">

          <CardHeader className="pb-4">
            {/* Logo mark */}
            <div className="mb-4 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">ChatMet</span>
            </div>

            <CardTitle className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Create your account
            </CardTitle>
            <CardDescription className="text-neutral-500 dark:text-neutral-400">
              Get started — it only takes a moment.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form
              id="signup-form"
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-5"
            >
              <FormInput
                label="Phone Number"
                type="tel"
                autoComplete="tel"
                placeholder="000****000"
                icon={<PhoneIcon />}
                registration={register("phoneNo", {
                  required: "Phone number is required.",
                })}
                error={errors.phoneNo?.message}
                disabled={isLoading}
              />

              <FormInput
                label="Username"
                type="text"
                autoComplete="username"
                placeholder="john_doe"
                icon={<UserIcon />}
                registration={register("username", {
                  required: "Username is required.",
                })}
                error={errors.username?.message}
                disabled={isLoading}
              />

              <FormInput
                label="Password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a strong password"
                icon={<LockIcon />}
                registration={register("password", {
                  required: "Password is required.",
                })}
                error={errors.password?.message}
                disabled={isLoading}
              />
            </form>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-0">
            <Button
              type="submit"
              form="signup-form"
              disabled={isLoading}
              className="
                w-full rounded-xl py-3 text-sm font-semibold
                bg-gradient-to-r from-indigo-500 to-violet-600
                hover:from-indigo-600 hover:to-violet-700
                shadow-md shadow-indigo-500/25
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 active:scale-[0.99]
              "
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </Button>

            <div className="flex items-center gap-3 w-full">
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
              <span className="text-xs text-neutral-400 dark:text-neutral-500">or</span>
              <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            </div>

            <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}