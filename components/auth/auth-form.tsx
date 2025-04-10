"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthFormProps {
  type: "signin" | "signup";
}

export function AuthForm({ type }: AuthFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (type === "signup") {
        // Call signup API
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, phone }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to sign up");
        }

        toast.success("Account created successfully!");
        
        // Auto sign in after successful signup
        const signInResult = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInResult?.error) {
          throw new Error("Failed to sign in after signup");
        }

        router.push("/");
      } else {
        // Sign-in logic
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error("Invalid email or password");
        }

        router.push("/");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAuth} className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {type === "signup" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-[#4FD1C5] focus:outline-none"
            required
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Email</label>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-[#4FD1C5] focus:outline-none"
          required
        />
      </div>

      {type === "signup" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Phone Number</label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-[#4FD1C5] focus:outline-none"
            required
          />
        </div>
      )}
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-400">Password</label>
        <input
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:border-[#4FD1C5] focus:outline-none"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#4FD1C5] text-black p-2 rounded-md font-medium hover:bg-[#4FD1C5]/90 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {type === "signup" ? "Creating account..." : "Signing in..."}
          </span>
        ) : (
          type === "signup" ? "Create Account" : "Sign In"
        )}
      </button>
    </form>
  );
}
