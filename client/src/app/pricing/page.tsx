import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';

const plans = [
  { code: 'starter', name: 'Starter', price: '৳149', per: '/child/mo', features: ['Logging, routines, OCR notes', '10 AI quizzes/mo', 'Basic charts', 'Basic result summary', '3-month history'] },
  { code: 'standard', name: 'Standard', price: '৳299', per: '/child/mo', recommended: true, features: ['40 AI quizzes/mo', 'Full dashboards', 'AI explanations', '12-month history', 'Priority routine support'] },
  { code: 'premium', name: 'Premium', price: '৳499', per: '/child/mo', features: ['120 AI quizzes/mo', 'AI vision OCR fallback', 'Weekly digest', 'Unlimited history', 'Priority support'] },
];

export default function PricingPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Simple, honest pricing</h1>
        <p className="text-muted-foreground">15-day free trial with full Standard features (up to 2 children). Sibling: 25% off 2nd, 35% off 3rd+. Annual: pay for 10, get 12.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map(p => (
          <Card key={p.code} className={p.recommended ? 'border-primary shadow-lg scale-[1.02]' : ''}>
            <CardHeader>
              {p.recommended && <Badge className="w-fit">Recommended</Badge>}
              <CardTitle className="text-2xl">{p.name}</CardTitle>
              <div className="flex items-baseline gap-1"><span className="text-3xl font-bold">{p.price}</span><span className="text-muted-foreground">{p.per}</span></div>
              <CardDescription>Billed per child • Demo checkout (real gateway later)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">{p.features.map(f => <li key={f} className="flex gap-2 text-sm"><Check className="w-4 h-4 text-emerald-500 mt-0.5" />{f}</li>)}</ul>
              <Link href="/register"><Button className="w-full" variant={p.recommended ? 'default' : 'outline'}>Start Free Trial</Button></Link>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-8">Cost guardrail: AI cost &lt; 20% of price • Provider interface with DemoProvider • Trial cron at day 10/13/15</p>
    </div>
  );
}
