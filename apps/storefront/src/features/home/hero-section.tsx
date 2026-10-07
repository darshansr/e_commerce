import Link from 'next/link';
import { BookOpen, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

const highlights = [
  { icon: Truck, title: 'Free delivery', description: 'On orders above ₹499 across India' },
  { icon: BookOpen, title: 'Curated catalogue', description: 'Academic, fiction and children’s titles' },
  { icon: RotateCcw, title: 'Easy returns', description: '7-day replacement on damaged books' },
  { icon: ShieldCheck, title: 'Secure checkout', description: 'Encrypted payments, no card storage' },
] as const;

export function HeroSection() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container-custom relative py-20 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              Meghana Book House
            </span>

            <h1 className="text-balance mt-6 font-heading text-4xl font-bold tracking-tight md:text-6xl">
              Your gateway to <span className="text-primary">knowledge</span>
            </h1>

            <p className="text-balance mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Bestsellers, academic texts and children’s books — delivered across India, with
              in-store pickup at your nearest branch.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="#featured"
                className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Browse featured books
              </Link>
              <Link
                href="/books"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card px-8 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                See the full catalogue
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-muted/30">
        <div className="container-custom grid gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
