import Hero from '@/components/Hero';
import Concept from '@/components/Concept';
import Menu from '@/components/Menu';
import Gallery from '@/components/Gallery';
import Access from '@/components/Access';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main>
      <Hero />
      <Concept />
      <Menu />
      <Gallery />
      <Access />
      <Footer />
    </main>
  );
}
