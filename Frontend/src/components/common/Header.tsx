import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import WalletConnect from './WalletConnect';
import styles from '../../styles/components/Header.module.css';

const Header = () => {
  const { connected, account } = useWallet();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Vaults', href: '/vaults' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Analytics', href: '/analytics' },
  ];

  const isActive = (path: string) => router.pathname === path;

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <div className={styles.logoIcon}>🏦</div>
          <span className={styles.logoText}>Aptos Vaults</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className={styles.desktopNav}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${styles.navLink} ${isActive(item.href) ? styles.active : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Wallet & User Section */}
        <div className={styles.walletSection}>
          <WalletConnect />
          {connected && account && (
            <div className={styles.userInfo}>
              <span className={styles.userAddress}>
                {account.address.slice(0, 6)}...{account.address.slice(-4)}
              </span>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className={styles.mobileNav}>
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`${styles.mobileNavLink} ${isActive(item.href) ? styles.active : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            {connected && account && (
              <div className={styles.mobileUserInfo}>
                <span>
                  Connected: {account.address.slice(0, 8)}...{account.address.slice(-6)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
