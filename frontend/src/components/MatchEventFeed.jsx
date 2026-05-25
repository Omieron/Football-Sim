import {
  eventIcon,
  eventTypeLabel,
  eventDescription,
  formatMinute,
  buildTimeline,
} from '../utils/matchEvents'

function eventRowKey(e) {
  if (e.synthetic && e.type === 'half_time') return 'half_time'
  if (e.id != null && e.id > 0) return String(e.id)
  return `${e.minute}-${e.type}-${e.player_id ?? e.player_name}-${e.team_id}`
}

function HalfTimeRow({ homeScore, awayScore }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      padding: '12px 0',
      margin: '4px 0',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      background: 'rgba(255,31,90,0.06)',
    }}>
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--pink)',
      }}>
        Half-time
      </span>
      <span style={{
        fontFamily: 'monospace',
        fontSize: 10,
        color: 'rgba(237,232,220,0.35)',
      }}>
        45'
      </span>
      <span style={{
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: '-0.04em',
        color: 'var(--cream)',
      }}>
        {homeScore}<span style={{ color: 'rgba(237,232,220,0.2)', margin: '0 4px' }}>–</span>{awayScore}
      </span>
    </div>
  )
}

export function EventFeedItem({ event, match }) {
  const isHome = event.team_id === match.home_team_id
  const { primary, secondary } = eventDescription(event, match)
  const accent = isHome ? 'var(--acid)' : 'var(--pink)'

  return (
    <div style={{
      display: 'flex',
      justifyContent: isHome ? 'flex-start' : 'flex-end',
      width: '100%',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        maxWidth: '78%',
        flexDirection: isHome ? 'row' : 'row-reverse',
        textAlign: isHome ? 'left' : 'right',
        padding: '8px 10px',
        background: 'rgba(237,232,220,0.04)',
        borderLeft: isHome ? `2px solid ${accent}` : 'none',
        borderRight: isHome ? 'none' : `2px solid ${accent}`,
      }}>
        <span style={{ fontFamily: 'monospace', color: accent, fontSize: 10, flexShrink: 0, marginTop: 1 }}>
          {formatMinute(event.minute)}
        </span>
        <span style={{ fontSize: 12, flexShrink: 0 }}>{eventIcon(event.type)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: 'rgba(237,232,220,0.4)', fontSize: 9, marginBottom: 2 }}>
            {eventTypeLabel(event.type)}
          </div>
          <div style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 11, lineHeight: 1.35 }}>
            {primary}
          </div>
          {secondary && (
            <div style={{ color: 'rgba(237,232,220,0.35)', fontSize: 10, marginTop: 2, lineHeight: 1.3 }}>
              {secondary}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function MatchEventFeed({ events, match, reverse = false, halftimeReached = false }) {
  const timeline = buildTimeline(events, match, halftimeReached)
  const list = reverse ? [...timeline].reverse() : timeline

  if (list.length === 0) return null

  const hasSecondHalf = events.some(e => e.minute > 45)

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 8,
        marginBottom: 10,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(237,232,220,0.25)',
      }}>
        <span style={{ color: 'var(--acid)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {match.home_team_name}
        </span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'right' }}>
          {match.away_team_name}
        </span>
      </div>

      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        maxHeight: 340,
        overflowY: 'auto',
        padding: '4px 0',
      }}>
        {hasSecondHalf && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 1,
            background: 'var(--border)',
            opacity: 0.35,
            pointerEvents: 'none',
          }} />
        )}
        {list.map((e) => {
          if (e.type === 'half_time') {
            return (
              <HalfTimeRow
                key={eventRowKey(e)}
                homeScore={e.homeScore}
                awayScore={e.awayScore}
              />
            )
          }
          return <EventFeedItem key={eventRowKey(e)} event={e} match={match} />
        })}
      </div>
    </div>
  )
}
