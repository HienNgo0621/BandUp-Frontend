import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';

export interface PlaceholderPageProps {
  title: string;
  description: string;
  section?: string;
}

const workspaceLinks = [
  { label: 'Student workspace', to: '/workspace/student', description: 'Preview the learner shell.' },
  { label: 'Teacher workspace', to: '/workspace/teacher', description: 'Preview the volunteer shell.' },
  { label: 'Admin workspace', to: '/workspace/admin', description: 'Preview the management shell.' },
];

export function PlaceholderPage({
  title,
  description,
  section = 'Phase 1 · Foundation',
}: PlaceholderPageProps) {
  const location = useLocation();
  const { showToast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [sampleValue, setSampleValue] = useState('');

  const isPublicHome = location.pathname === '/';
  const isWorkspace = location.pathname.startsWith('/workspace/');

  return (
    <div className="placeholder-page">
      <div className="placeholder-page-heading">
        <div>
          <div className="placeholder-eyebrow">
            <Badge variant="green">{section}</Badge>
            <span className="placeholder-route">{location.pathname}</span>
          </div>
          <h1 className="serif placeholder-title">{title}</h1>
          <p className="placeholder-description">{description}</p>
        </div>
        <div className="placeholder-mark" aria-hidden="true">
          <span className="logo-mark">BU</span>
        </div>
      </div>

      <Card className="placeholder-notice">
        <div className="placeholder-notice-icon">
          <Icon name="info" size={21} />
        </div>
        <div>
          <h2>Foundation is ready. Feature migration comes next.</h2>
          <p>
            This route is registered and uses the new React layout. Its original business logic and
            page-specific interface will be migrated in a later phase; no login, exam, Forum or data
            operation is implemented in this foundation build.
          </p>
        </div>
      </Card>

      <div className="placeholder-demo-grid">
        <Card className="placeholder-demo-card">
          <div className="placeholder-card-topline">
            <span className="placeholder-section-label">UI COMPONENT CHECK</span>
            <Badge variant="blue">Interactive</Badge>
          </div>
          <h2>Design System components</h2>
          <p>Use these controls to verify the shared UI primitives before feature pages are migrated.</p>
          <div className="placeholder-input-area">
            <Input
              label="Sample input"
              placeholder="Type something to test the input component"
              value={sampleValue}
              onChange={(event) => setSampleValue(event.target.value)}
              helperText="This value is temporary and is not saved."
            />
          </div>
          <div className="placeholder-action-row">
            <Button
              variant="primary"
              leftIcon={<Icon name="check" size={17} />}
              onClick={() => showToast(sampleValue.trim() ? `Input received: ${sampleValue.trim()}` : 'The input is empty.', sampleValue.trim() ? 'success' : 'warning')}
            >
              Test toast
            </Button>
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open modal
            </Button>
          </div>
        </Card>

        <Card className="placeholder-demo-card">
          <div className="placeholder-card-topline">
            <span className="placeholder-section-label">ROUTE PREVIEW</span>
            <Badge variant="slate">No authentication yet</Badge>
          </div>
          <h2>{isWorkspace ? 'Switch workspace preview' : 'Preview role layouts'}</h2>
          <p>
            The three workspace routes are available to inspect their layout shells. They are not
            protected by authentication in Phase 1.
          </p>
          <div className="workspace-preview-list">
            {workspaceLinks.map((item) => (
              <Link key={item.to} to={item.to} className="workspace-preview-link">
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
                <Icon name="arrow-right" size={18} />
              </Link>
            ))}
          </div>
        </Card>
      </div>

      {isPublicHome ? (
        <div className="placeholder-route-shortcuts">
          <h2>Public route shortcuts</h2>
          <div className="route-chip-list">
            <Link to="/practice/listening">Listening</Link>
            <Link to="/practice/reading">Reading</Link>
            <Link to="/practice/writing">Writing</Link>
            <Link to="/practice/speaking">Speaking</Link>
            <Link to="/mocks">Mock Tests</Link>
            <Link to="/forum">Forum</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title="Phase 1 modal test"
        description="This is a shared modal primitive. It is not connected to a business action."
        onClose={() => setModalOpen(false)}
        size="sm"
        footer={(
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close dialog
          </Button>
        )}
      >
        <p className="modal-demo-copy">
          The dialog supports Escape to close, backdrop dismissal, focus restoration and a responsive
          maximum height.
        </p>
      </Modal>
    </div>
  );
}
