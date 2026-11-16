import Background from './components/Background';
import Nav from './components/Nav';
import Welcome from './components/Welcome';
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
import Vista from './components/Vista';
import Shell from './shell/Shell';
import { worlds } from './data/content';
import { useReveal } from './hooks/useReveal';

/* Page order. Reordering these lines reorders the site.

   The argument the page makes, in order:
     Welcome       - his face in light says hello; one scroll plays it into the hero
     Hero          - his name, lit from above, and a ring of what he has built
     Experience    - where he has worked, every result a complete statement
     Builds        - PrismAI, six featured builds, the paper, seven more
     Highlights    - four one-line statements, after the stories they summarize
     ProofOfWork   - the commit graph, the wins, and where to check them
     Principles    - how he thinks about building (2x2 tiles)
     Value         - what that is worth to you (hairline rows)
     Toolkit       - the inventory
     Contact       - the ask

   <Background /> is the one fixed layer behind everything: the hero's light
   beams, then the 3D world. The page is one descent through three worlds:
   space (Welcome, Hero), the sea (Experience, Builds) and the earth (the crew's
   panel and everything after it). A <Vista /> is an empty window in the page
   where a set piece of that world shows whole: the sea's surface, the shore
   (inside Builds), the galaxy, the horizon. The giant's window is the Builds
   opener (Builds.jsx carries data-world-anchor="giant").

   <Shell /> is everything that sits over the page and the world: the kit's
   signals, travel, the Chart, the depth rail, Receipts and the sound switch. */
export default function App() {
  useReveal();

  return (
    <>
      <Background />
      <div className="page">
        <Nav />
        <main id="main" tabIndex={-1}>
          <Welcome />
          <Hero />
          <Vista set="surface" line={worlds.surface} />
          <Experience />
          <Builds />
          <Highlights />
          <Vista set="galaxy" />
          <ProofOfWork />
          <Principles />
          <Value />
          <Toolkit />
          <Contact />
          <Vista set="horizon" />
        </main>
        <Footer />
      </div>
      <Shell />
    </>
  );
}
