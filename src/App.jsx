import Background from './components/Background';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Proof from './components/Proof';
import Experience from './components/Experience';
import Builds from './components/Builds';
import ProofOfWork from './components/ProofOfWork';
import Principles from './components/Principles';
import Value from './components/Value';
import Toolkit from './components/Toolkit';
import Contact from './components/Contact';
import { useReveal } from './hooks/useReveal';

/* Page order. Reordering these lines reorders the site.

   The argument the page makes, in order:
     Hero          - his name, and a deck of what he has built
     Proof         - six numbers, the one loud band
     Experience    - where he has worked
     Builds        - PrismAI, six featured builds, the paper, four smaller ones
     ProofOfWork   - the commit graph, the wins, and where to check them
     Principles    - how he thinks about building (2x2 grid)
     Value         - what that is worth to you (hairline rows)
     Toolkit       - the inventory
     Contact       - the ask

   <Background /> is the one WebGL layer, fixed behind everything. */
export default function App() {
  useReveal();

  return (
    <>
      <Background />
      <div className="page">
        <Nav />
        <main id="main" tabIndex={-1}>
          <Hero />
          <Proof />
          <Experience />
          <Builds />
          <ProofOfWork />
          <Principles />
          <Value />
          <Toolkit />
        </main>
        <Contact />
      </div>
    </>
  );
}
