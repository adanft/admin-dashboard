import Button from '@adanft/ui/button';
import Image from 'next/image';

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-foreground">
      <section className="flex flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold text-heading font-(family-name:--font-sansita-swashed)">
          Admin Dashboard
        </h1>
        <Image src="/logo.png" alt="Admin Dashboard logo" width={96} height={96} priority />
        <Button>Initial Configurations</Button>
      </section>
    </main>
  );
}
