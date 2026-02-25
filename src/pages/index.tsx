import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';

import styles from './index.module.css';

/* ─── Data ─── */

type Project = {
  name: string;
  description: string;
  href: string;
  comingSoon?: boolean;
};

const projects: Project[] = [
  {
    name: 'Onepercent',
    description:
      'User guide, deployment instructions, technical reference, and FAQ for the Onepercent platform.',
    href: '/onepercent/intro',
  },
  {
    name: 'Project 2',
    description: 'Documentation coming soon.',
    href: '#',
    comingSoon: true,
  },
  {
    name: 'Project 3',
    description: 'Documentation coming soon.',
    href: '#',
    comingSoon: true,
  },
];

/* ─── Components ─── */

function Hero() {
  const {siteConfig} = useDocusaurusContext();

  return (
    <header className={styles.hero}>
      <div className={styles.heroBg} />
      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
        <p className={styles.heroSubtitle}>
          Everything you need to build with Aiva. Guides, references, and
          resources for every product.
        </p>
        <div className={styles.heroCtas}>
          <Link className={styles.ctaPrimary} to="/onepercent/intro">
            Get started &rarr;
          </Link>
          <a className={styles.ctaSecondary} href="#products">
            Browse projects
          </a>
        </div>
      </div>
    </header>
  );
}

function ProjectCard({name, description, href, comingSoon}: Project) {
  const Wrapper = comingSoon ? 'div' : Link;
  const wrapperProps = comingSoon ? {} : {to: href};

  return (
    <Wrapper
      className={clsx(
        styles.card,
        comingSoon && styles.comingSoon,
        !comingSoon && styles.featured,
      )}
      {...wrapperProps}>
      <h3 className={styles.cardName}>
        {name}
        {comingSoon ? (
          <span className={styles.badge}>Coming soon</span>
        ) : (
          <span className={styles.cardArrow}>&rarr;</span>
        )}
      </h3>
      <p className={styles.cardDesc}>{description}</p>
    </Wrapper>
  );
}

/* ─── Page ─── */

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();

  return (
    <Layout title="Home" description={siteConfig.tagline}>
      <Hero />

      <main className={styles.content}>
        {/* Products */}
        <div id="products">
          <p className={styles.sectionLabel}>Products</p>
          <div className={styles.grid}>
            {projects.map((project) => (
              <ProjectCard key={project.name} {...project} />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerDot} />
        </div>

        {/* Quote */}
        <blockquote className={styles.pullQuote}>
          <p>Build with clarity. Ship with confidence.</p>
        </blockquote>

        {/* Story */}
        <p className={styles.story}>
          Behind every feature is a question: does this make someone&apos;s day
          easier? We believe the best tools disappear into your workflow
          &mdash; invisible when they work, indispensable when you need them.
          That&apos;s the standard we hold ourselves to, one detail at a time.
        </p>
      </main>
    </Layout>
  );
}
