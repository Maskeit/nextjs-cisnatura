"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

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
    isLoading?: boolean;
    error?: string | null;
}

export function RegisterForm({ onSubmit, isLoading = false, error }: RegisterFormProps) {
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

    return (
        <div className="w-full max-w-md space-y-8 px-4">
            {/* Back button */}
            <div className="flex justify-start">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/')}
                    disabled={isLoading}
                    className="-ml-2"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al inicio
                </Button>
            </div>
            {/* Logo */}
            <div className="flex flex-col items-center space-y-4">
                <div className="rounded-lg flex items-center justify-center">
                    <Image 
                        src="/logocis.svg" 
                        alt="CISnatura Logo" 
                        width={120} 
                        height={120}
                        priority
                    />
                </div>
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Crear cuenta</h1>
                    <p className="text-muted-foreground">Regístrate para comenzar</p>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                        control={form.control}
                        name="full_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Nombre completo</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="text" 
                                        placeholder="Juan Pérez" 
                                        className="h-12 text-base"
                                        disabled={isLoading}
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Correo electrónico</FormLabel>
                                <FormControl>
                                    <Input 
                                        type="email" 
                                        placeholder="correo@ejemplo.com" 
                                        className="h-12 text-base"
                                        disabled={isLoading}
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Contraseña</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••" 
                                            className="h-12 text-base pr-10"
                                            disabled={isLoading}
                                            {...field} 
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
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="confirm_password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-base">Confirmar contraseña</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input 
                                            type={showConfirmPassword ? "text" : "password"}
                                            placeholder="••••••••" 
                                            className="h-12 text-base pr-10"
                                            disabled={isLoading}
                                            {...field} 
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
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button 
                        type="submit" 
                        className="w-full h-12 text-base"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            "Crear cuenta"
                        )}
                    </Button>
                </form>
            </Form>

            {/* Login link */}
            <div className="text-center text-sm text-muted-foreground">
                ¿Ya tienes una cuenta?{" "}
                <Link 
                    href="/login" 
                    className="text-primary hover:underline font-medium"
                    tabIndex={isLoading ? -1 : 0}
                >
                    Inicia sesión aquí
                </Link>
            </div>
        </div>
    )
}
