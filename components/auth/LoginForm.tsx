"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"
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
import { Loader2 } from "lucide-react"

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
    isLoading?: boolean;
    error?: string | null;
}

export function LoginForm({ onSubmit, isLoading = false, error }: LoginFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    return (
        <div className="w-full max-w-md space-y-8 px-4">
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
                    <h1 className="text-3xl font-bold text-foreground mb-2">Bienvenido</h1>
                    <p className="text-muted-foreground">Inicia sesión en tu cuenta</p>
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                                    <Input 
                                        type="password" 
                                        placeholder="••••••••" 
                                        className="h-12 text-base"
                                        disabled={isLoading}
                                        {...field} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex justify-end">
                        <Link 
                            href="/forgot-password" 
                            className="text-sm text-primary hover:underline font-medium"
                            tabIndex={isLoading ? -1 : 0}
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <Button 
                        type="submit" 
                        className="w-full h-12 text-base"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Iniciando sesión...
                            </>
                        ) : (
                            "Iniciar sesión"
                        )}
                    </Button>
                </form>
            </Form>

            {/* Registro link */}
            <div className="text-center text-sm text-muted-foreground">
                ¿No tienes una cuenta?{" "}
                <Link 
                    href="/register" 
                    className="text-primary hover:underline font-medium"
                    tabIndex={isLoading ? -1 : 0}
                >
                    Regístrate aquí
                </Link>
            </div>
        </div>
    )
}