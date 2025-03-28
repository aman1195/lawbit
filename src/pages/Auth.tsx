import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { FileCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Button from "@/components/Button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const resetSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { signIn, signUp, resetPassword } = useAuthContext();

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Reset password form
  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    const { error } = await signIn(data.email, data.password);
    
    if (error) {
      toast.error("Login failed", {
        description: error.message,
      });
    } else {
      toast.success("Login successful", {
        description: "Welcome back!",
      });
    }
  };

  const onSignupSubmit = async (data: SignupFormValues) => {
    const { error } = await signUp(data.email, data.password);
    
    if (error) {
      toast.error("Signup failed", {
        description: error.message,
      });
    } else {
      toast.success("Signup successful", {
        description: "Please check your email to verify your account.",
      });
      
      setActiveTab("login");
    }
  };

  const onResetSubmit = async (data: ResetFormValues) => {
    const { error } = await resetPassword(data.email);
    
    if (error) {
      toast.error("Reset password failed", {
        description: error.message,
      });
    } else {
      toast.success("Reset password email sent", {
        description: "Please check your email for further instructions.",
      });
      
      setActiveTab("login");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-center items-center p-4">
        <Link to="/" className="flex items-center space-x-2 text-primary">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <FileCheck className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-medium">LawBit</span>
        </Link>
      </div>
      
      <div className="flex-1 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold">Welcome to LawBit</h1>
            <p className="text-muted-foreground mt-2">
              Intelligent legal document analysis and contract generation
            </p>
          </div>

          <div className="bg-card border rounded-lg shadow-sm p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="orange"
                      title={
                        loginForm.formState.isSubmitting ? (
                          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-current rounded-full" />
                        ) : (
                          "Login"
                        )
                      }
                      disabled={loginForm.formState.isSubmitting}
                    />
                  </form>
                </Form>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("reset")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot your password?
                  </button>
                </div>
              </TabsContent>

              <TabsContent value="signup">
                <Form {...signupForm}>
                  <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
                    <FormField
                      control={signupForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={signupForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="orange"
                      title={
                        signupForm.formState.isSubmitting ? (
                          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-current rounded-full" />
                        ) : (
                          "Sign Up"
                        )
                      }
                      disabled={signupForm.formState.isSubmitting}
                    />
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="reset">
                <Form {...resetForm}>
                  <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                    <FormField
                      control={resetForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="your.email@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      variant="orange"
                      title={
                        resetForm.formState.isSubmitting ? (
                          <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-current rounded-full" />
                        ) : (
                          "Reset Password"
                        )
                      }
                      disabled={resetForm.formState.isSubmitting}
                    />

                    <Button
                      type="button"
                      variant="default"
                      title="Back to Login"
                      onClick={() => setActiveTab("login")}
                    />
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
