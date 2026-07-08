"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useTranslations } from "@/components/i18n/provider"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "admin@erp.local", password: "admin123" },
  })

  async function onSubmit(values: LoginInput) {
    setError(null)
    setIsSubmitting(true)

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    setIsSubmitting(false)

    if (result?.error) {
      setError(t("auth.invalid"))
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("auth.loginTitle")}</CardTitle>
          <CardDescription>{t("auth.loginSubtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("common.email")}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@company.com" {...field} />
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
                    <FormLabel>{t("auth.password")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
