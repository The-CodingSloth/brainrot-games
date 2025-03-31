import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-text">
          Hey, I'm The Coding Sloth and I started this terrible website:
        </div>
        <div className="footer-links">
          <a
            href="https://www.youtube.com/@TheCodingSloth"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            YouTube
          </a>
          <a
            href="https://slothbytes.beehiiv.com/subscribe"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            Newsletter
          </a>
          <a
            href="https://github.com/The-CodingSloth/brainrot-games"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
