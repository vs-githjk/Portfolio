import Background from './components/Background';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Experience from './components/Experience';
import Builds from './components/Builds';
import Highlights from './components/Highlights';
import ProofOfWork from './components/ProofOfWork';
import Principles from './components/Principles';
import Value from './components/Value';
import Toolkit from './components/Toolkit';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { useReveal } from './hooks/useReveal';

/* Page order. Reordering these lines reorders the site.

   The argument the page makes, in order:
     Hero          - his name, lit from above, and a ring of what he has built
     Experience    - where he has worked, every result a complete statement
     Builds        - PrismAI, six featured builds, the paper, seven more
     Highlights    - four one-line statements, after the stories they summarize
     ProofOfWork   - the commit graph, the wins, and where to check them
     Principles    - how he thinks about building (2x2 tiles)
     Value         - what that is worth to you (hairline rows)
     Toolkit       - the inventory
     Contact       - the ask

   <Background /> is the one fixed light-beam layer behind everything. */
export default function App() {
  useReveal();

  return (
    <>
      <Background />
      <div className="page">
        <Nav />
        <main id="main" tabIndex={-1}>
          <Hero />
          <Experience />
          <Builds />
          <Highlights />
          <ProofOfWork />
          <Principles />
          <Value />
          <Toolkit />
          <Contact />
        </main>
        <Footer />
      </div>
    </>
  );
}
