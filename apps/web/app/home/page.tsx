import Link from 'next/link';
import { PageBody, PageHeader } from '@kit/ui/page';
import { DashboardDemo } from '~/home/_components/dashboard-demo';


export default function HomePage() {
  return (
    <>
      <PageHeader description={'Your SaaS at a glance'} />

      <PageBody>
        <DashboardDemo />

        {/* === Bouton vers ton module IA === */}
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link
            href="/generative-design"
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              display: 'inline-block',
            }}
          >
            🧠 Accéder au module de Conception Générative
          </Link>
        </div>
      </PageBody>
    </>
  );
}
