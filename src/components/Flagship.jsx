import Badge from './Badge';
import Media from './Media';
import Metrics from './Metrics';
import LinkRow from './LinkRow';
import Rich from './Rich';

/* The PrismAI panel, laid out on one grid so every edge is shared:

     [ lead still + caption     ] [ kind, title, story, role ]
     [ "Now building" box       ] [                          ]  (on a phone it follows the story)
     [ three stills: one band, equal frames, full width      ]
     [ metrics                  ] [ stack, links             ]

   The first row pairs the lead still and the "Now building" box with the story;
   the two columns end on the same line (the left one spreads any difference
   between its two blocks). The three stills are a full-width band of identical
   frames with their captions on one baseline. The lead is the agency release,
   in development, and is labelled as such. */
export default function Flagship({ item }) {
  const { lead, stack } = item.media;
  return (
    <article className="flag reveal" id={`build-${item.id}`}>
      <div className="flag-media flag-lead">
        <Media
          image={lead.image}
          alt={lead.alt}
          tilt={2.5}
          badges={<Badge dot>{lead.badge}</Badge>}
          width={1200}
          height={750}
          sizes="(min-width: 960px) 540px, 92vw"
        />
        <p className="media-cap">{lead.caption}</p>
      </div>
      <div className="flag-now">
        <div className="now-box">
          <span className="now">
            <i aria-hidden="true" />
            {item.now.label}
          </span>
          <p className="text">
            <Rich text={item.now.text} />
          </p>
        </div>
      </div>
      <div className="flag-body">
        <div className="kind">
          <span className="eyebrow">{item.kind}</span>
          <span className="eyebrow">{item.when}</span>
        </div>
        <h3 className="flag-title">
          {item.title} <span>{item.descriptor}</span>
        </h3>
        <p className="one">{item.oneLiner}</p>
        {item.body.map((p) => (
          <p className="text" key={p.slice(0, 24)}>
            <Rich text={p} />
          </p>
        ))}
        <p className="role">{item.role}</p>
      </div>
      <div className="flag-stack">
        {stack.map((s) => (
          <figure key={s.image}>
            <Media image={s.image} alt={s.alt} ratio="16 / 9" width={800} height={500} steps={[320, 640]} sizes="(min-width: 960px) 340px, 92vw" />
            <figcaption className="media-cap">{s.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="flag-metrics">
        <Metrics items={item.metrics} />
      </div>
      <div className="flag-facts">
        <p className="stack">{item.stack}</p>
        <LinkRow links={item.links} />
      </div>
    </article>
  );
}
