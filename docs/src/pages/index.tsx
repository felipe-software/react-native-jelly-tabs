import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import CodeBlock from "@theme/CodeBlock";
import StorybookPreview from "@site/src/components/StorybookPreview";
import styles from "./index.module.css";

function Hero() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <header className={styles.hero}>
            <div className={styles.heroInner}>
                <p className={styles.eyebrow}>react-native-jelly-tabs</p>
                <h1 className={styles.title}>{siteConfig.tagline}</h1>
                <p className={styles.subtitle}>
                   Drop-in for Expo Router and React Navigation, or headless for your own layout.
                </p>
                <div className={styles.cta}>
                    <Link className="button button--primary button--lg" to="/docs/intro">
                        Get started
                    </Link>
                    <Link
                        className="button button--secondary button--lg"
                        to="pathname:///storybook/index.html"
                    >
                        Open Storybook
                    </Link>
                </div>
                <div className={styles.install}>
                    <CodeBlock language="bash">npx expo install react-native-jelly-tabs</CodeBlock>
                </div>
            </div>
        </header>
    );
}

export default function Home() {
    const { siteConfig } = useDocusaurusContext();
    return (
        <Layout
            title={siteConfig.title}
            description="A playful, jelly-like animated tab bar for React Native."
        >
            <Hero />
            <main className={styles.main}>
                <StorybookPreview
                    id="getting-started-playground--homepage"
                    height={420}
                />
            </main>
        </Layout>
    );
}
