"use client";

import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, Eye, EyeOff, Lock, Mail, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const formSchema = z.object({
    new_password: z
        .string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
        .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula" })
        .regex(/[a-z]/, { message: "Debe contener al menos una minúscula" })
        .regex(/[0-9]/, { message: "Debe contener al menos un número" }),
    confirm_password: z.string()
}).refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden",
    path: ["confirm_password"],
});

interface ResetPasswordFormProps {
    className?: string;
    onSubmit: (values: { new_password: string }) => Promise<void>;
    isLoading?: boolean;
    error?: string | null;
    email?: string;
}

export default function ResetPasswordForm({
    className,
    onSubmit,
    isLoading,
    error,
    email
}: ResetPasswordFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            new_password: "",
            confirm_password: ""
        }
    });

    const handleSubmit = async (values: z.infer<typeof formSchema>) => {
        await onSubmit({ new_password: values.new_password });
    };

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <Card className="overflow-hidden p-0">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <form className="p-6 md:p-8" onSubmit={form.handleSubmit(handleSubmit)}>
                        <FieldGroup>
                            <div className="flex flex-col items-center gap-2 text-center">
                                <div className="bg-primary/10 rounded-full p-3 mb-2">
                                    <Lock className="h-8 w-8 text-primary" />
                                </div>
                                <h1 className="text-2xl font-bold">Restablecer Contraseña</h1>
                                <p className="text-muted-foreground text-balance">
                                    Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta
                                </p>
                            </div>

                            {email && (
                                <div className="bg-muted/50 rounded-md p-3 flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">
                                        Cuenta: <span className="font-medium text-foreground">{email}</span>
                                    </p>
                                </div>
                            )}

                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Field>
                                <FieldLabel htmlFor="new_password">Nueva Contraseña</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="new_password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Mínimo 8 caracteres"
                                        disabled={isLoading}
                                        {...form.register("new_password")}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {form.formState.errors.new_password && (
                                    <p className="text-sm text-destructive mt-1">
                                        {form.formState.errors.new_password.message}
                                    </p>
                                )}
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="confirm_password">Confirmar Contraseña</FieldLabel>
                                <div className="relative">
                                    <Input
                                        id="confirm_password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Repite tu contraseña"
                                        disabled={isLoading}
                                        {...form.register("confirm_password")}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        disabled={isLoading}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                                {form.formState.errors.confirm_password && (
                                    <p className="text-sm text-destructive mt-1">
                                        {form.formState.errors.confirm_password.message}
                                    </p>
                                )}
                            </Field>

                            {/* Password Requirements */}
                            <div className="bg-muted/50 rounded-md p-4 space-y-2">
                                <p className="text-sm font-medium">La contraseña debe contener:</p>
                                <ul className="text-sm space-y-1 text-muted-foreground">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Mínimo 8 caracteres</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Al menos una letra mayúscula</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Al menos una letra minúscula</span>
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span>Al menos un número</span>
                                    </li>
                                </ul>
                            </div>

                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Actualizando...
                                    </>
                                ) : (
                                    "Restablecer Contraseña"
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
        </div>
    );
}
