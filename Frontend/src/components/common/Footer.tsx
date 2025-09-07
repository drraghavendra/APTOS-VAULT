import Link from 'next/link';
import styles from '../../styles/components/Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Brand Section */}
          <div className={styles.brandSection}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>🏦</div>
              <span className={styles.logoText}>Aptos Vaults</span>
            </div>
            <p className={styles.description}>
              Automated yield strategies on the Aptos blockchain. 
              Earn passive income with secure, audited smart contracts.
            </p>
            <div className={styles.socialLinks}>
              <a href="#" className={styles.socialLink}>Twitter</a>
              <a href="#" className={styles.socialLink}>Discord</a>
              <a href="#" className={styles.socialLink}>Telegram</a>
              <a href="#" className={styles.socialLink}>GitHub</a>
            </div>
          </div>

          {/* Links Sections */}
          <div className={styles.linksSections}>
            <div className={styles.linksColumn}>
              <h4>Products</h4>
              <Link href="/vaults" className={styles.footerLink}>Yield Vaults</Link>
              <Link href="/strategies" className={styles.footerLink}>Strategies</Link>
              <Link href="/analytics" className={styles.footerLink}>Analytics</Link>
              <Link href="/api" className={styles.footerLink}>API</Link>
            </div>

            <div className={styles.linksColumn}>
              <h4>Company</h4>
              <Link href="/about" className={styles.footerLink}>About</Link>
              <Link href="/blog" className={styles.footerLink}>Blog</Link>
              <Link href="/careers" className={styles.footerLink}>Careers</Link>
              <Link href="/press" className={styles.footerLink}>Press</Link>
            </div>

            <div className={styles.linksColumn}>
              <h4>Support</h4>
              <Link href="/help" className={styles.footerLink}>Help Center</Link>
              <Link href="/docs" className={styles.footerLink}>Documentation</Link>
              <Link href="/security" className={styles.footerLink}>Security</Link>
              <Link href="/contact" className={styles.footerLink}>Contact</Link>
            </div>

            <div className={styles.linksColumn}>
              <h4>Legal</h4>
              <Link href="/terms" className={styles.footerLink}>Terms of Service</Link>
              <Link href="/privacy" className={styles.footerLink}>Privacy Policy</Link>
              <Link href="/cookies" className={styles.footerLink}>Cookie Policy</Link>
              <Link href="/disclaimer" className={styles.footerLink}>Disclaimer</Link>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className={styles.bottomSection}>
          <div className={styles.copyright}>
            © {currentYear} Aptos Vaults. All rights reserved.
          </div>
          <div className={styles.legalLinks}>
            <Link href="/security" className={styles.legalLink}>Security</Link>
            <Link href="/compliance" className={styles.legalLink}>Compliance</Link>
            <Link href="/audits" className={styles.legalLink}>Audits</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
