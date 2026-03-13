

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import axiosInstance from "../../api/axiosInstance";
import FormInput from "../../components/common/FormInput";


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



interface FormFields {
  phoneNo: string;
  username: string;
  password: string;
}

interface FormErrors {
  phoneNo?: string;
  username?: string;
  password?: string;
}


export default function Register() {
  const navigate = useNavigate();

  const [fields, setFields] = useState<FormFields>({
    phoneNo: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);


  const validate = (): boolean => {
    const next: FormErrors = {};

    if (!fields.phoneNo.trim()) next.phoneNo = "Phone number is required.";
    if (!fields.username.trim()) next.username = "Username is required.";
    if (!fields.password.trim()) next.password = "Password is required.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await axiosInstance.post("/auth/signup", fields);
      toast.success("Account created successfully!");
      navigate("/login");
    } catch (err: any) {
      // Axios error → err.response.data.message (ApiError shape from your backend)
      // Network/unknown error → fallback message
      const message =
        err?.response?.data?.message ?? "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      // Always stop the spinner, no matter what happened
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 px-4 py-12 transition-colors duration-300">

      {/* Subtle ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-violet-200/20 dark:bg-violet-900/10 blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl shadow-xl shadow-neutral-200/50 dark:shadow-black/40 px-8 py-10">

          {/* Header */}
          <div className="mb-8">
            {/* Logo mark */}
            <div className="mb-6 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="text-sm font-bold tracking-tight text-neutral-900 dark:text-white">ChatMet</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              Get started — it only takes a moment.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormInput
              label="Phone Number"
              id="phoneNo"
              name="phoneNo"
              type="tel"
              autoComplete="tel"
              placeholder="+1 (555) 000-0000"
              value={fields.phoneNo}
              onChange={handleChange}
              error={errors.phoneNo}
              icon={<PhoneIcon />}
              disabled={isLoading}
            />

            <FormInput
              label="Username"
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="john_doe"
              value={fields.username}
              onChange={handleChange}
              error={errors.username}
              icon={<UserIcon />}
              disabled={isLoading}
            />

            <FormInput
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={fields.password}
              onChange={handleChange}
              error={errors.password}
              icon={<LockIcon />}
              disabled={isLoading}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                mt-1 w-full rounded-xl py-3 px-4 text-sm font-semibold text-white
                bg-gradient-to-r from-indigo-500 to-violet-600
                hover:from-indigo-600 hover:to-violet-700
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500
                shadow-md shadow-indigo-500/25
                disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
                transition-all duration-200 active:scale-[0.99]
                flex items-center justify-center gap-2
              "
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
            <span className="text-xs text-neutral-400 dark:text-neutral-500">or</span>
            <div className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          </div>

          {/* Login redirect */}
          <p className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}