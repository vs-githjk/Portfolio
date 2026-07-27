import { toolkit } from '../data/content';
import RainbowText from './RainbowText';

export default function Toolkit() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="sec-head reveal">
          <h2>{toolkit.heading}</h2>
          <p>{toolkit.intro}</p>
        </div>

        <div className="kit reveal">
          {toolkit.groups.map((group) => (
            <div className="kit-cell" key={group.name}>
              <h4>{group.name}</h4>
              <ul>
                {group.items.map((item) => (
                  <li key={item}>
                    <RainbowText text={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
