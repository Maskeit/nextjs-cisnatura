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
        message: "Por favor ingresa un email válido."
    })
})

interface RecoverPasswordProp {
    className?: string;
    onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
}
export default function RecoverPasswordForm({className, onSubmit, isLoading, error }: RecoverPasswordProp) { // any temporal

    const router = useRouter();
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues:{
            email:""
        }
    })


    return (<div className={cn("flex flex-col gap-6", className)}>
        <Card className="overflow-hidden p-0">
            <CardContent className="grid p-0 md:grid-cols-2">
                <form className="p-6 md:p-8" onSubmit={form.handleSubmit(onSubmit)}>
                    <FieldGroup>
                        <div className="flex flex-col items-center gap-2 text-center">
                            <h1 className="text-2xl font-bold">Bienvenido</h1>
                            <p className="text-muted-foreground text-balance">
                                Ingresa tu correo electrónico para verificar que eres tu.
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
                        <FieldDescription className="text-center">
                            ¿No tienes una cuenta? <Link href="/register">Regístrate</Link>
                        </FieldDescription>
                            {error && (
                                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                                    <p className="text-sm text-destructive text-center">{error}</p>
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enviando...
                                    </>
                                ) : (
                                    "Enviar Enlace de Recuperación"
                                )}
                            </Button>
                        </FieldGroup>
                </form>
                <div className="bg-white relative hidden md:block">
                    <img
                        src="/logocis.svg"
                        alt="CISnatura Logo"
                        className="absolute inset-0 h-full mx-auto w-70"
                    />
                </div>
            </CardContent>
        </Card>
    </div>)
}