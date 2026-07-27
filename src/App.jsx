import Nav from './components/Nav';
import Hero from './components/Hero';
import Proof from './components/Proof';
import Experience from './components/Experience';
import Builds from './components/Builds';
import Principles from './components/Principles';
import Value from './components/Value';
import Toolkit from './components/Toolkit';
import Contact from './components/Contact';
import { useReveal } from './hooks/useReveal';

/* Page order. Reordering these lines reorders the site.
   Sections are independent — comment one out and nothing breaks.

   The argument the page makes, in order:
     Hero       — the claim, plus a live system as proof it isn't talk
     Proof      — four numbers
     Experience — where I've worked
     Builds     — what I've built
     Principles — how I think about building
     Value      — what that's worth to you
     Toolkit    — the boring inventory
     Contact    — the ask
*/
export default function App() {
  useReveal();

  return (
    <>
      <Nav />
      <Hero />
      <Proof />
      <Experience />
      <Builds />
      <Principles />
      <Value />
      <Toolkit />
      <Contact />
    </>
  );
}
