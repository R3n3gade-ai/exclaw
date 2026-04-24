import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { webRequest } from '../../services/webClient';
import './SocialStationPanel.css';

type SocialPlatformId = 'facebook' | 'x' | 'instagram' | 'tiktok' | 'linkedin' | 'youtube' | 'rss';
type SocialConnectionStatus = 'connected' | 'needs_config' | 'planned';
type SocialPostType = 'text' | 'image' | 'video' | 'link' | 'carousel' | 'rss';
type SocialJobStatus = 'draft' | 'scheduled' | 'ready' | 'disabled';

type SocialConnection = {
  platform: SocialPlatformId;
  label: string;
  status: SocialConnectionStatus;
  enabled: boolean;
  connectedAccount?: string;
  details?: string;
  capabilities: string[];
};

type SocialPostTemplate = {
  id: string;
  name: string;
  platforms: SocialPlatformId[];
  post_types: SocialPostType[];
  status: SocialJobStatus;
  schedule?: string;
  notes?: string;
};

type SocialAgentProfile = {
  id: string;
  name: string;
  status: 'active' | 'draft';
  goal: string;
  capabilities: string[];
};

type SocialStationOverview = {
  connections: SocialConnection[];
  templates: SocialPostTemplate[];
  agents: SocialAgentProfile[];
  main_agent: {
    connected: boolean;
    scope: string[];
    notes: string;
  };
  rss: {
    enabled: boolean;
    feed_count: number;
    publish_targets: SocialPlatformId[];
    notes: string;
  };
};

const PLATFORM_META: Record<SocialPlatformId, { label: string; icon: string }> = {
  facebook: { label: 'Facebook', icon: 'f' },
  x: { label: 'X / Twitter', icon: 'X' },
  instagram: { label: 'Instagram', icon: '◎' },
  tiktok: { label: 'TikTok', icon: '♪' },
  linkedin: { label: 'LinkedIn', icon: 'in' },
  youtube: { label: 'YouTube', icon: '▶' },
  rss: { label: 'RSS', icon: 'RSS' },
};

const STATUS_TONE: Record<SocialConnectionStatus, string> = {
  connected: 'is-success',
  needs_config: 'is-warning',
  planned: 'is-muted',
};

const JOB_TONE: Record<SocialJobStatus, string> = {
  draft: 'is-muted',
  scheduled: 'is-info',
  ready: 'is-success',
  disabled: 'is-warning',
};

const emptyOverview: SocialStationOverview = {
  connections: [],
  templates: [],
  agents: [],
  main_agent: {
    connected: false,
    scope: [],
    notes: '',
  },
  rss: {
    enabled: false,
    feed_count: 0,
    publish_targets: [],
    notes: '',
  },
};

export function SocialStationPanel() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState<SocialStationOverview>(emptyOverview);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await webRequest<SocialStationOverview>('social.station.overview');
      setOverview({
        ...emptyOverview,
        ...payload,
      });
      setLastUpdatedAt(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : t('socialStation.errors.load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const connectedCount = useMemo(
    () => overview.connections.filter((item) => item.status === 'connected').length,
    [overview.connections]
  );

  const configuredPlatforms = useMemo(
    () => overview.connections.filter((item) => item.enabled).map((item) => item.label),
    [overview.connections]
  );

  return (
    <div className="social-station-panel">
      <div className="social-station-panel__hero card">
        <div>
          <div className="social-station-panel__eyebrow">{t('socialStation.eyebrow')}</div>
          <h2 className="social-station-panel__title">{t('socialStation.title')}</h2>
          <p className="social-station-panel__subtitle">{t('socialStation.subtitle')}</p>
        </div>
        <div className="social-station-panel__hero-actions">
          <button type="button" className="btn secondary" onClick={() => void loadOverview()} disabled={loading}>
            {loading ? t('common.loading') : t('common.refresh')}
          </button>
        </div>
      </div>

      {error && <div className="social-station-panel__error card">{error}</div>}

      <div className="social-station-panel__summary-grid">
        <div className="card social-station-panel__summary-card">
          <div className="social-station-panel__summary-label">{t('socialStation.summary.connectedPlatforms')}</div>
          <div className="social-station-panel__summary-value">{connectedCount}/{overview.connections.length || 0}</div>
          <div className="social-station-panel__summary-note">
            {configuredPlatforms.length > 0 ? configuredPlatforms.join(', ') : t('socialStation.summary.noneConfigured')}
          </div>
        </div>
        <div className="card social-station-panel__summary-card">
          <div className="social-station-panel__summary-label">{t('socialStation.summary.postingFlows')}</div>
          <div className="social-station-panel__summary-value">{overview.templates.length}</div>
          <div className="social-station-panel__summary-note">{t('socialStation.summary.postingFlowsNote')}</div>
        </div>
        <div className="card social-station-panel__summary-card">
          <div className="social-station-panel__summary-label">{t('socialStation.summary.socialAgents')}</div>
          <div className="social-station-panel__summary-value">{overview.agents.length}</div>
          <div className="social-station-panel__summary-note">{t('socialStation.summary.socialAgentsNote')}</div>
        </div>
        <div className="card social-station-panel__summary-card">
          <div className="social-station-panel__summary-label">{t('socialStation.summary.rssFeeds')}</div>
          <div className="social-station-panel__summary-value">{overview.rss.feed_count}</div>
          <div className="social-station-panel__summary-note">{overview.rss.notes || t('socialStation.summary.rssNote')}</div>
        </div>
      </div>

      <div className="social-station-panel__grid">
        <section className="card social-station-panel__section">
          <div className="social-station-panel__section-header">
            <div>
              <h3>{t('socialStation.sections.connections')}</h3>
              <p>{t('socialStation.sections.connectionsHint')}</p>
            </div>
          </div>
          <div className="social-station-panel__connection-list">
            {overview.connections.map((connection) => {
              const meta = PLATFORM_META[connection.platform];
              return (
                <div className="social-station-panel__connection-item" key={connection.platform}>
                  <div className="social-station-panel__platform-mark">{meta.icon}</div>
                  <div className="social-station-panel__connection-copy">
                    <div className="social-station-panel__connection-title-row">
                      <strong>{connection.label || meta.label}</strong>
                      <span className={`social-station-panel__status-pill ${STATUS_TONE[connection.status]}`}>
                        {t(`socialStation.status.${connection.status}`)}
                      </span>
                    </div>
                    <div className="social-station-panel__connection-details">
                      {connection.connectedAccount || connection.details || t('socialStation.connection.noAccount')}
                    </div>
                    <div className="social-station-panel__capabilities">
                      {connection.capabilities.map((capability) => (
                        <span key={capability} className="social-station-panel__capability-pill">{capability}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
            {overview.connections.length === 0 && (
              <div className="social-station-panel__empty">{t('socialStation.empty.connections')}</div>
            )}
          </div>
        </section>

        <section className="card social-station-panel__section">
          <div className="social-station-panel__section-header">
            <div>
              <h3>{t('socialStation.sections.posting')}</h3>
              <p>{t('socialStation.sections.postingHint')}</p>
            </div>
          </div>
          <div className="social-station-panel__template-list">
            {overview.templates.map((template) => (
              <div className="social-station-panel__template-item" key={template.id}>
                <div className="social-station-panel__connection-title-row">
                  <strong>{template.name}</strong>
                  <span className={`social-station-panel__status-pill ${JOB_TONE[template.status]}`}>
                    {t(`socialStation.jobStatus.${template.status}`)}
                  </span>
                </div>
                <div className="social-station-panel__template-meta">
                  <span>{template.platforms.map((platform) => PLATFORM_META[platform]?.label || platform).join(', ')}</span>
                  <span>•</span>
                  <span>{template.post_types.join(', ')}</span>
                  {template.schedule ? (
                    <>
                      <span>•</span>
                      <span>{template.schedule}</span>
                    </>
                  ) : null}
                </div>
                {template.notes ? <p className="social-station-panel__template-notes">{template.notes}</p> : null}
              </div>
            ))}
            {overview.templates.length === 0 && (
              <div className="social-station-panel__empty">{t('socialStation.empty.templates')}</div>
            )}
          </div>
        </section>
      </div>

      <div className="social-station-panel__grid social-station-panel__grid--bottom">
        <section className="card social-station-panel__section">
          <div className="social-station-panel__section-header">
            <div>
              <h3>{t('socialStation.sections.agentControl')}</h3>
              <p>{t('socialStation.sections.agentControlHint')}</p>
            </div>
          </div>
          <div className="social-station-panel__agent-summary">
            <div className="social-station-panel__agent-summary-row">
              <span>{t('socialStation.mainAgent.connected')}</span>
              <strong>{overview.main_agent.connected ? t('common.ok') : t('common.error')}</strong>
            </div>
            <div className="social-station-panel__agent-summary-row">
              <span>{t('socialStation.mainAgent.scope')}</span>
              <strong>{overview.main_agent.scope.length ? overview.main_agent.scope.join(', ') : '—'}</strong>
            </div>
            <p className="social-station-panel__template-notes">
              {overview.main_agent.notes || t('socialStation.mainAgent.defaultNotes')}
            </p>
          </div>
          <div className="social-station-panel__agent-list">
            {overview.agents.map((agent) => (
              <div key={agent.id} className="social-station-panel__agent-item">
                <div className="social-station-panel__connection-title-row">
                  <strong>{agent.name}</strong>
                  <span className={`social-station-panel__status-pill ${agent.status === 'active' ? 'is-success' : 'is-muted'}`}>
                    {agent.status}
                  </span>
                </div>
                <p className="social-station-panel__template-notes">{agent.goal}</p>
                <div className="social-station-panel__capabilities">
                  {agent.capabilities.map((capability) => (
                    <span key={capability} className="social-station-panel__capability-pill">{capability}</span>
                  ))}
                </div>
              </div>
            ))}
            {overview.agents.length === 0 && (
              <div className="social-station-panel__empty">{t('socialStation.empty.agents')}</div>
            )}
          </div>
        </section>

        <section className="card social-station-panel__section">
          <div className="social-station-panel__section-header">
            <div>
              <h3>{t('socialStation.sections.rss')}</h3>
              <p>{t('socialStation.sections.rssHint')}</p>
            </div>
          </div>
          <div className="social-station-panel__agent-summary">
            <div className="social-station-panel__agent-summary-row">
              <span>{t('socialStation.rss.enabled')}</span>
              <strong>{overview.rss.enabled ? t('common.ok') : t('common.error')}</strong>
            </div>
            <div className="social-station-panel__agent-summary-row">
              <span>{t('socialStation.rss.targets')}</span>
              <strong>
                {overview.rss.publish_targets.length
                  ? overview.rss.publish_targets.map((platform) => PLATFORM_META[platform]?.label || platform).join(', ')
                  : '—'}
              </strong>
            </div>
            <p className="social-station-panel__template-notes">
              {overview.rss.notes || t('socialStation.rss.defaultNotes')}
            </p>
          </div>
        </section>
      </div>

      <div className="social-station-panel__footer text-text-muted">
        {lastUpdatedAt
          ? t('socialStation.lastUpdated', { time: new Date(lastUpdatedAt).toLocaleString() })
          : t('socialStation.notLoadedYet')}
      </div>
    </div>
  );
}
