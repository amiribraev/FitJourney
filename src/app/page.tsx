import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <div className="flex flex-col min-h-screen">
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center">
        {heroImage && (
           <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container px-4 md:px-6">
          <h1 className="text-4xl md:text-6xl font-headline font-bold text-white tracking-tighter">
            Ваш путь к здоровью с ФитПуть
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-200">
            Получите персональные планы питания и тренировок, созданные искусственным интеллектом, чтобы достичь ваших целей.
          </p>
          <Button asChild size="lg" className="mt-8 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Link href="/register">Начать сейчас</Link>
          </Button>
        </div>
      </section>

      <section className="py-12 md:py-20 bg-card">
        <div className="container px-4 md:px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-headline font-bold">Как спорт влияет на здоровье?</h2>
              <p className="mt-4 text-muted-foreground">
                Регулярные физические упражнения являются одним из лучших способов сохранить и улучшить ваше здоровье. Они укрепляют сердце, улучшают кровообращение, помогают контролировать вес и снижают риск развития многих хронических заболеваний. Кроме того, спорт улучшает настроение, повышает уровень энергии и способствует качественному сну.
              </p>
            </div>
            <div className="space-y-4">
               <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Персональный подход</h3>
                      <p className="text-sm text-muted-foreground">Планы, адаптированные под ваши цели и параметры.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <CheckCircle className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Научно-обоснованные методики</h3>
                      <p className="text-sm text-muted-foreground">Рекомендации на основе данных от ИИ.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
