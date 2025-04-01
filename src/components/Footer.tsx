import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-wrapper">
        <div className="footer-content">
          <div className="footer-text">
            Hey, I'm The Coding Sloth and I started this terrible website:
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <a
              href="https://www.youtube.com/@TheCodingSloth"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="YouTube channel"
            >
              YouTube
            </a>
            <a
              href="https://slothbytes.beehiiv.com/subscribe"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="Newsletter subscription"
            >
              Newsletter
            </a>
            <a
              href="https://github.com/The-CodingSloth/brainrot-games"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
              aria-label="GitHub repository"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
