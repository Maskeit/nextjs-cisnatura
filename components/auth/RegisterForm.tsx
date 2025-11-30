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
    full_name: z.string().min(2, {
        message: "El nombre debe tener al menos 2 caracteres.",
    }),
    email: z.string().email({
        message: "Por favor ingresa un correo electrónico válido.",
    }),
    password: z.string().min(8, {
        message: "La contraseña debe tener al menos 8 caracteres.",
    }),
    confirm_password: z.string().min(8, {
        message: "La contraseña debe tener al menos 8 caracteres.",
    }),
}).refine((data) => data.password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
})

interface RegisterFormProps {
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
    onGoogleLogin?: () => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    className?: string;
}

export const RegisterForm = ({ className, onSubmit, onGoogleLogin, isLoading, error }: RegisterFormProps) => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            full_name: "",
            email: "",
            password: "",
            confirm_password: "",
        },
    })

    return (<div className={cn("flex flex-col gap-6", className)}>
        <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
                <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-bold">Crear cuenta</h1>
                            <p className="text-muted-foreground text-balance">
                                Completa tus datos para registrarte en CISnatura
                            </p>
                        </div>
                        <Field>
                            <FieldLabel htmlFor="full_name">Nombre completo</FieldLabel>
                            <Input
                                id="full_name"
                                type="text"
                                placeholder="Juan Pérez"
                                disabled={isLoading}
                                {...form.register("full_name")}
                                required
                            />
                            {form.formState.errors.full_name && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.full_name.message}</p>
                            )}
                        </Field>
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
                        <Field >
                            <div className="flex items-center">
                                <FieldLabel htmlFor="repeat-password">Repite la Contraseña</FieldLabel>
                            </div>
                            <div className="relative">
                                <Input
                                    id="repeat-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pr-10"
                                    disabled={isLoading}
                                    {...form.register("confirm_password")}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    disabled={isLoading}
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {form.formState.errors.confirm_password && (
                                <p className="text-sm text-destructive mt-1">{form.formState.errors.confirm_password.message}</p>
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
                                        Registrando...
                                    </>
                                ) : (
                                    "Registrarse"
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
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-5 h-5 mr-2">
                                    <path
                                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                        fill="currentColor"
                                    />
                                </svg>
                                Continuar con Google
                            </Button>
                        </Field>
                        <FieldDescription className="text-center">
                            ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
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
