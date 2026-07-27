import { proof } from '../data/content';

export default function Proof() {
  return (
    <section className="proof">
      <div className="proof-grid">
        {proof.map((item) => (
          <div className="proof-cell" key={item.label}>
            <div className="proof-num">
              {item.value}
              {item.sup && <sup>{item.sup}</sup>}
            </div>
            <div className="proof-lab">
              {item.label}
              <br />
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
