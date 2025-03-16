import { Metadata } from 'next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Registracijos patvirtinimas | Solis',
  description: 'Patvirtinkite savo el. pašto adresą',
}

export default function SignUpConfirmationPage() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Patikrinkite savo el. paštą</CardTitle>
            <CardDescription>
              Patvirtinkite savo el. pašto adresą, kad užbaigtumėte registraciją
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>
              Išsiuntėme patvirtinimo nuorodą į jūsų el. pašto adresą.
              Patikrinkite savo pašto dėžutę ir spustelėkite nuorodą, kad užbaigtumėte registraciją.
            </p>
            <p className="text-sm text-muted-foreground">
              Jei nematote el. laiško, patikrinkite savo šlamšto aplanką.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link href="/login">
                Eiti į prisijungimą
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 