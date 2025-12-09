"use client";
import { z } from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldDescription,
    FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const formSchema = z.object({
    email: z.string().email({
        message: "Por favor ingresa un correo electrónico válido.",
    }),
    password: z.string().min(6, {
        message: "La contraseña debe tener al menos 6 caracteres.",
    }),
})

interface LoginFormProps {
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
    onGoogleLogin?: () => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    className?: string;
}

export const LoginForm = ({ className, onSubmit, onGoogleLogin, isLoading, error }: LoginFormProps) => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    return (<div className={cn("flex flex-col gap-6", className)}>
        <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
                <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-bold">Bienvenido</h1>
                            <p className="text-muted-foreground text-balance">
                                Ingresa tu correo electrónico para iniciar sesión en tu cuenta
                            </p>
                        </div>
                        <Field>
                            <FieldLabel htmlFor="email">Correo electrónico</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                disabled={isLoading}
                                {...form.register("email")}
                                required
                            />
                            {form.formState.errors.email && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
                            )}
                        </Field>
                        <Field >
                            <div className="flex items-center">
                                <FieldLabel htmlFor="password">Contraseña</FieldLabel>
                                <a
                                    href="/recover-password"
                                    className="ml-auto text-sm underline-offset-4 hover:underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pr-10"
                                    disabled={isLoading}
                                    {...form.register("password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isLoading}
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {form.formState.errors.password && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
                            )}
                        </Field>
                        {error && (
                            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}
                        <Field>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Iniciando sesión...
                                    </>
                                ) : (
                                    "Iniciar sesión"
                                )}
                            </Button>
                        </Field>
                        <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                            O continúa con
                        </FieldSeparator>
                        <Field className="flex gap-4">
                            <Button 
                                variant="outline" 
                                type="button" 
                                onClick={onGoogleLogin}
                                disabled={isLoading || !onGoogleLogin}
                                className="w-full"
                            >
                                <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
                                    <g fill="none" fillRule="evenodd" clipRule="evenodd">
                                        <path fill="#F44336" d="M7.209 1.061c.725-.081 1.154-.081 1.933 0a6.57 6.57 0 0 1 3.65 1.82a100 100 0 0 0-1.986 1.93q-1.876-1.59-4.188-.734q-1.696.78-2.362 2.528a78 78 0 0 1-2.148-1.658a.26.26 0 0 0-.16-.027q1.683-3.245 5.26-3.86" opacity=".987"/>
                                        <path fill="#FFC107" d="M1.946 4.92q.085-.013.161.027a78 78 0 0 0 2.148 1.658A7.6 7.6 0 0 0 4.04 7.99q.037.678.215 1.331L2 11.116Q.527 8.038 1.946 4.92" opacity=".997"/>
                                        <path fill="#448AFF" d="M12.685 13.29a26 26 0 0 0-2.202-1.74q1.15-.812 1.396-2.228H8.122V6.713q3.25-.027 6.497.055q.616 3.345-1.423 6.032a7 7 0 0 1-.51.49" opacity=".999"/>
                                        <path fill="#43A047" d="M4.255 9.322q1.23 3.057 4.51 2.854a3.94 3.94 0 0 0 1.718-.626q1.148.812 2.202 1.74a6.62 6.62 0 0 1-4.027 1.684a6.4 6.4 0 0 1-1.02 0Q3.82 14.524 2 11.116z" opacity=".993"/>
                                    </g>
                                </svg>
                                Continuar con Google
                            </Button>
                        </Field>
                        <FieldDescription className="text-center">
                            ¿No tienes una cuenta? <Link href="/register">Regístrate</Link>
                        </FieldDescription>
                        </FieldGroup>
                </form>
                <div className="bg-white relative hidden md:block flex items-center justify-center">
                    <img
                        src="/logocis.svg"
                        alt="Image"
                        className="absolute inset-0 h-full mx-auto w-70"
                    />
                </div>
            </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
            Al hacer clic en continuar, aceptas nuestros <a href="#">Términos de Servicio</a>{" "}
            y <a href="#">Política de Privacidad</a>.
        </FieldDescription>
    </div>)
}
