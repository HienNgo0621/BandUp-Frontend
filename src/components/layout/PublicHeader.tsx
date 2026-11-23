import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { PUBLIC_ABOUT_ITEMS, PUBLIC_PRACTICE_ITEMS } from '../../data/navigation';
import { Icon } from '../ui/Icon';

function getNavClass(isActive: boolean) {
  return `tn ${isActive ? 'on' : ''}`;
}

export function PublicHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const closeMenus = () => {
    setMobileOpen(false);
    setPracticeOpen(false);
    setAboutOpen(false);
  };

  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/" className="brand-lockup" onClick={closeMenus} aria-label="BandUp IELTS home">
          <span className="logo-mark">BU</span>
          <span>BandUp IELTS</span>
        </Link>

        <nav className="public-desktop-nav" aria-label="Main navigation">
          <NavLink to="/" end className={({ isActive }) => getNavClass(isActive)}>
            Home
          </NavLink>

          <div className="nav-dropdown-wrap">
            <button
              type="button"
              className={`tn nav-dropdown-trigger ${practiceOpen ? 'on' : ''}`}
              aria-expanded={practiceOpen}
              onClick={() => {
                setPracticeOpen((current) => !current);
                setAboutOpen(false);
              }}
            >
              Practice <Icon name="chevron-down" size={15} />
            </button>
            {practiceOpen ? (
              <div className="nav-dropdown card">
                {PUBLIC_PRACTICE_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-dropdown-link" onClick={closeMenus}>
                    {item.icon ? <Icon name={item.icon} size={17} /> : null}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>

          <NavLink to="/mocks" className={({ isActive }) => getNavClass(isActive)}>
            Mock Tests
          </NavLink>
          <NavLink to="/forum" className={({ isActive }) => getNavClass(isActive)}>
            Forum
          </NavLink>

          <div className="nav-dropdown-wrap">
            <button
              type="button"
              className={`tn nav-dropdown-trigger ${aboutOpen ? 'on' : ''}`}
              aria-expanded={aboutOpen}
              onClick={() => {
                setAboutOpen((current) => !current);
                setPracticeOpen(false);
              }}
            >
              About <Icon name="chevron-down" size={15} />
            </button>
            {aboutOpen ? (
              <div className="nav-dropdown card">
                {PUBLIC_ABOUT_ITEMS.map((item) => (
                  <NavLink key={item.to} to={item.to} className="nav-dropdown-link" onClick={closeMenus}>
                    {item.icon ? <Icon name={item.icon} size={17} /> : null}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
          <NavLink to="/help" className={({ isActive }) => getNavClass(isActive)}>Help Center</NavLink>
        </nav>

        <div className="public-auth-actions">
          <Link to="/login" className="tn">
            Log in
          </Link>
          <Link to="/signup" className="btn b1">
            Join us
          </Link>
        </div>

        <button
          type="button"
          className="public-mobile-toggle"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          <Icon name={mobileOpen ? 'x' : 'menu'} size={24} />
        </button>
      </div>

      {mobileOpen ? (
        <nav className="public-mobile-nav" aria-label="Mobile navigation">
          <NavLink to="/" end className="nav" onClick={closeMenus}>Home</NavLink>
          <p className="mobile-nav-heading">Practice</p>
          {PUBLIC_PRACTICE_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav" onClick={closeMenus}>
              {item.icon ? <Icon name={item.icon} size={19} /> : null}
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/mocks" className="nav" onClick={closeMenus}>Mock Tests</NavLink>
          <NavLink to="/forum" className="nav" onClick={closeMenus}>Forum</NavLink>
          <p className="mobile-nav-heading">About</p>
          {PUBLIC_ABOUT_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className="nav" onClick={closeMenus}>
              {item.icon ? <Icon name={item.icon} size={19} /> : null}
              {item.label}
            </NavLink>
          ))}
          <NavLink to="/help" className="nav" onClick={closeMenus}>Help Center</NavLink>
          <div className="public-mobile-auth">
            <Link to="/login" className="btn b4" onClick={closeMenus}>Log in</Link>
            <Link to="/signup" className="btn b1" onClick={closeMenus}>Join us</Link>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
