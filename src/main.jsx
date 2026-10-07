import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { bridge, health, historicalInfo } from './data/bridgeData.js';
import { getHistory, getLatestReading } from './services/bridgeApi.js';
import './styles.css';

const pages = ['Dashboard', 'Bridge Health', 'Alerts', 'History', 'Bridge Information', 'Report a Problem'];

function Icon({ name, size = 18 }) {
  const paths = {
    shield: <><path d="M12 2 4 5v6c0 5.2 3.4 9 8 11 4.6-2 8-5.8 8-11V5l-8-3Z"/><path d="m8.5 12 2.2 2.2 4.8-5"/></>,
    distance: <><path d="M4 12h16M7 8l-3 4 3 4M17 8l3 4-3 4"/><circle cx="12" cy="12" r="2"/></>,
    load: <><path d="M5 19V8m14 11V8M3 8h18M7 8l2-4h6l2 4M8 13h8"/><path d="M10 16h4"/></>,
    vibration: <><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M7 12h2l2-3 3 6 2-3h1"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    pin: <><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v5m0-9h.01"/></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 20h16"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    report: <><path d="M12 3v12m-4-4 4 4 4-4M5 21h14"/><path d="M7 3h10"/></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.info}</svg>;
}

function Header({ page, onNavigate, connectionStatus }) {
  const connectionLabel = connectionStatus === 'online' ? 'LIVE MONITORING' : connectionStatus === 'loading' ? 'CONNECTING TO SENSOR DATA...' : 'DATA CONNECTION OFFLINE';
  return <header className="topbar">
    <button className="brand" onClick={() => onNavigate('Dashboard')} aria-label="Civic Nova dashboard">
      <span className="brand-mark"><Icon name="shield" size={23}/></span>
      <span className="brand-words"><strong>CIVIC NOVA</strong><small>Smart Bridge Monitoring</small></span>
    </button>
    <div className={`live-pill ${connectionStatus}`}><span/> {connectionLabel}</div>
    <nav className="nav" aria-label="Main navigation">{pages.map(p => <button key={p} className={page === p ? 'active' : ''} onClick={() => onNavigate(p)}>{p}</button>)}</nav>
    <button className="mobile-menu" onClick={() => document.querySelector('.nav')?.classList.toggle('nav-open')} aria-label="Toggle navigation">☰</button>
  </header>;
}

function StatusPill({ children = 'NORMAL' }) { return <span className="status-pill">{children}</span>; }

function Hero({ children, className = '' }) { return <section className={`hero ${className}`}>{children}</section>; }

function Dashboard({ latest, connectionStatus, lastUpdated }) {
  const available = Boolean(latest);
  const pendingValue = connectionStatus === 'loading' ? 'Connecting to sensor data...' : '—';
  const statusMessage = connectionStatus === 'loading' ? 'Connecting to sensor data...' : connectionStatus === 'offline' ? 'Sensor data temporarily unavailable.' : 'No immediate structural alert is active.';
  return <>
    <Hero className="dashboard-hero">
      <div className="hero-copy"><p className="eyebrow">Smarter Infrastructure. Safer Communities.</p><h1>CIVIC NOVA</h1><h2>Smart Bridge Monitoring</h2><div className="bridge-id"><Icon name="vibration" size={15}/> Bridge ID: {bridge.id}</div></div>
      <div className="bridge-status"><div className="card-kicker">BRIDGE STATUS</div><div className="safe-line"><span className="check-circle"><Icon name="check" size={18}/></span> SAFE</div><p>{statusMessage}</p><div className="status-stats"><div><small>Health Score</small><strong>{health.score} / 100</strong></div><div><small>Status</small><strong className="green-text">HEALTHY</strong></div><div><small>Last Updated</small><strong>{available ? lastUpdated || '—' : pendingValue}</strong></div></div></div>
    </Hero>
    <section className="panel dashboard-panel">
      <h3 className="section-title">LIVE SENSOR CONDITION</h3>
      <div className="sensor-grid">
        <SensorCard icon="distance" title="Structural Distance" sensor="VL53L0X" value={available ? `${latest.distance_mm} mm` : pendingValue} loading={!available}/>
        <SensorCard icon="load" title="Structural Load / Movement" sensor="HX711" value={available ? `${latest.hx711_raw} raw` : pendingValue} loading={!available}/>
        <SensorCard icon="vibration" title="Vibration" sensor="MPU6500" value={available ? `${Number(latest.accel_z_g).toFixed(3)} g` : pendingValue} loading={!available}/>
      </div>
      <div className="structure-card"><h3 className="section-title">STRUCTURE CONDITION</h3><div className="structure-grid">{[['Crack / Surface', 'Normal'], ['Movement', 'Normal'], ['Vibration', 'Normal']].map(([a,b])=><div className="structure-item" key={a}><span className="tiny-check"><Icon name="check" size={13}/></span><div><small>{a}</small><strong>{b}</strong></div></div>)}</div></div>
    </section>
  </>;
}

function SensorCard({ icon, title, sensor, value, loading = false }) { return <article className="sensor-card"><span className="sensor-icon"><Icon name={icon} size={23}/></span><div className="sensor-meta"><strong>{title}</strong><small>{sensor}</small><b className={loading ? 'placeholder-value' : ''}>{value}</b><StatusPill/></div></article>; }

function Gauge({ score }) {
  const radius = 76, circumference = Math.PI * radius;
  return <div className="gauge"><svg viewBox="0 0 190 120" aria-label={`Bridge health score ${score} out of 100`}><path className="gauge-track" d="M19 101a76 76 0 0 1 152 0"/><path className="gauge-value" d="M19 101a76 76 0 0 1 152 0" strokeDasharray={`${circumference * score / 100} ${circumference}`}/></svg><div className="gauge-number"><strong>{score}</strong><span>/ 100</span></div><span className="health-chip">HEALTHY</span></div>;
}

function PageHeading({ title, subtitle, hero = false }) { return <div className={hero ? 'page-heading hero-heading' : 'page-heading'}><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>; }

function BridgeHealth() {
  return <>
    <Hero className="subpage-hero"><PageHeading hero title="BRIDGE HEALTH" subtitle="Civic Nova continuously monitors structural sensor readings and identifies unusual changes."/></Hero>
    <section className="panel health-panel"><div className="health-card"><h3 className="section-title">BRIDGE HEALTH SCORE</h3><Gauge score={health.score}/></div><div className="health-details"><Detail label="Health Level" value="Healthy" valueClass="green-text"/><Detail label="Monitoring Status" value="Normal monitoring"/><Detail label="Last Updated" value="a few seconds ago"/><div className="notice info-notice"><Icon name="info" size={17}/><span>Prototype estimate based on sensor readings. Professional structural inspection is required for real-world safety decisions.</span></div></div></section>
  </>;
}

function Detail({ label, value, valueClass = '' }) { return <div className="detail-row"><span>{label}</span><strong className={valueClass}>{value}</strong></div>; }

const alertTypes = [
  ['NORMAL', 'Bridge is in good condition.', 'normal'],
  ['MONITORING NOTICE', 'Unusual changes detected. Increased monitoring recommended.', 'notice'],
  ['INSPECTION REQUIRED', 'Structural issues detected. Professional inspection needed.', 'inspection'],
  ['CRITICAL ALERT', 'Potentially unsafe condition. Follow safety instructions and seek professional inspection.', 'critical'],
];

function Alerts() {
  return <><Hero className="subpage-hero"><PageHeading hero title="ALERTS" subtitle="Bridge conditions are currently being monitored normally."/></Hero><section className="panel alerts-panel"><div className="no-alerts"><span className="big-check"><Icon name="check" size={25}/></span><h2>NO ACTIVE ALERTS</h2><p>Bridge conditions are currently being monitored normally.</p></div><div className="alert-types"><h3 className="section-title">ALERT TYPES <small>(for future use)</small></h3>{alertTypes.map(([title, desc, type])=><div className={`alert-type ${type}`} key={title}><span className="alert-icon">{type === 'normal' ? <Icon name="check" size={20}/> : '!'}</span><div><strong>{title}</strong><small>{desc}</small></div></div>)}</div></section></>;
}

function MiniChart({ title, subtitle, values, color, unit, min, max, labels, status }) {
  const span = max - min || 1;
  const xAt = index => 35 + index * (273 / Math.max(values.length - 1, 1));
  const yAt = value => 126 - ((value - min) / span) * 82;
  const points = values.map((value, index) => `${xAt(index)},${yAt(value)}`).join(' ');
  const tick = value => Number.isInteger(value) ? value : Number(value.toFixed(2));
  const labelStep = Math.max(1, Math.ceil(labels.length / 4));
  const displayLabels = labels.filter((_, index) => index % labelStep === 0 || index === labels.length - 1);
  return <article className="chart-card"><strong>{title}</strong><small>{subtitle}</small><div className="chart-wrap"><div className="ylabels"><span>{tick(max)}{unit}</span><span>{tick((min+max)/2)}{unit}</span><span>{tick(min)}{unit}</span></div><svg viewBox="0 0 310 145" preserveAspectRatio="none" className="chart"><path d="M35 20H308M35 61H308M35 103H308M35 126H308" className="gridline"/>{values.length > 0 && <><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>{values.map((value,index)=><circle key={index} cx={xAt(index)} cy={yAt(value)} r="3" fill={color}/>)}</>}</svg>{values.length === 0 && <div className="chart-empty">{status === 'loading' ? 'Connecting to sensor data...' : status === 'offline' ? 'Sensor data temporarily unavailable.' : 'No sensor history available.'}</div>}</div><div className="xlabels">{displayLabels.map((label,index)=><span key={`${label}-${index}`}>{label}</span>)}</div></article>;
}

function timeLabel(reading) { return String(reading?.timestamp || '').split(' ')[1]?.slice(0,5) || '—'; }
function bounds(values, fallbackMin, fallbackMax) {
  if (!values.length) return [fallbackMin, fallbackMax];
  let min = Math.min(...values), max = Math.max(...values);
  if (min === max) { const pad = Math.abs(min) * .05 || 1; min -= pad; max += pad; }
  else { const pad = (max - min) * .08; min -= pad; max += pad; }
  return [min, max];
}

function History() {
  const [range, setRange] = useState('Last 1 Hour');
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const data = await getHistory(); if (active) { setHistory(data); setStatus('online'); } }
      catch { if (active) setStatus('offline'); }
    };
    refresh();
    const timer = window.setInterval(refresh, 20000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const csv = useMemo(() => ['Time,Distance (mm),HX711 Raw,Accel X (g),Accel Y (g),Accel Z (g),Status', ...history.map(r => `${timeLabel(r)},${r.distance_mm ?? ''},${r.hx711_raw ?? ''},${r.accel_x_g ?? ''},${r.accel_y_g ?? ''},${r.accel_z_g ?? ''},NORMAL`)].join('\n'), [history]);
  function exportCsv() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'civic-nova-sensor-readings.csv'; a.click(); URL.revokeObjectURL(a.href); }
  const chartRows = [...history].reverse();
  const distances = chartRows.map(r => Number(r.distance_mm)).filter(Number.isFinite);
  const loads = chartRows.map(r => Number(r.hx711_raw)).filter(Number.isFinite);
  const vibrations = chartRows.map(r => Number(r.accel_z_g)).filter(Number.isFinite);
  const distBounds = bounds(distances, 88, 100), loadBounds = bounds(loads, 46000, 49000), vibrationBounds = bounds(vibrations, .8, 1.1);
  const latest = history[0];
  const avgDistance = distances.length ? `${(distances.reduce((sum, value) => sum + value, 0) / distances.length).toFixed(1)} mm` : '—';
  return <section className="panel history-panel"><PageHeading title="HISTORICAL SENSOR DATA" subtitle="Review previous structural sensor readings and monitoring trends."/><div className="history-controls"><div className="range-buttons">{['Last 1 Hour','Last 24 Hours','Last 7 Days'].map(x=><button className={range===x?'selected':''} onClick={()=>setRange(x)} key={x}>{x}</button>)}</div><button className="outline-button" onClick={exportCsv}><Icon name="download" size={15}/> Export CSV</button></div>{status === 'offline' && <div className="connection-note">Sensor data temporarily unavailable.</div>}<div className="chart-grid"><MiniChart title="Structural Distance vs Time" subtitle="VL53L0X distance readings (mm)" values={distances} labels={chartRows.map(timeLabel)} min={distBounds[0]} max={distBounds[1]} unit="" color="#1878ed" status={status}/><MiniChart title="Structural Load vs Time" subtitle="HX711 raw readings" values={loads} labels={chartRows.map(timeLabel)} min={loadBounds[0]} max={loadBounds[1]} unit="" color="#0aa66a" status={status}/><MiniChart title="Vibration vs Time" subtitle="MPU6500 acceleration readings" values={vibrations} labels={chartRows.map(timeLabel)} min={vibrationBounds[0]} max={vibrationBounds[1]} unit="g" color="#903df1" status={status}/></div><div className="history-lower"><div className="table-card"><h3 className="section-title">RECENT SENSOR READINGS</h3><div className="table-scroll"><table><thead><tr>{['Time','Distance (mm)','HX711 Raw','Accel X (g)','Accel Y (g)','Accel Z (g)','Status'].map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{history.length ? history.map((r,i)=><tr key={r.id ?? `${r.timestamp}-${i}`}><td>{timeLabel(r)}</td><td>{r.distance_mm ?? '—'}</td><td>{r.hx711_raw ?? '—'}</td><td>{Number(r.accel_x_g).toFixed(3)}</td><td>{Number(r.accel_y_g).toFixed(3)}</td><td>{Number(r.accel_z_g).toFixed(3)}</td><td><StatusPill>NORMAL</StatusPill></td></tr>) : <tr><td colSpan="7">{status === 'loading' ? 'Connecting to sensor data...' : status === 'offline' ? 'Sensor data temporarily unavailable.' : 'No sensor history available.'}</td></tr>}</tbody></table></div></div><aside className="summary-card"><h3 className="section-title">LATEST SUMMARY</h3>{[['Latest Reading',latest ? `${latest.distance_mm} mm` : '—'],['Average Distance',avgDistance],['Latest Vibration',latest ? `${Number(latest.accel_z_g).toFixed(3)} g` : '—'],['Latest HX711 Reading',latest ? `${latest.hx711_raw} raw` : '—']].map(([a,b],i)=><div className="summary-row" key={a}><span className="summary-icon"><Icon name={['distance','load','vibration','report'][i]} size={16}/></span><div><small>{a}</small><strong>{b}</strong></div></div>)}</aside></div></section>;
}

function BridgeInformation() {
  const [location, setLocation] = useState('Gurugram, Haryana'); const [query, setQuery] = useState(''); const [searched, setSearched] = useState(false);
  return <section className="panel information-panel"><div className="section-header"><PageHeading title="BRIDGE INFORMATION"/><span className="demo-badge">PROTOTYPE / DEMO DATA</span></div><div className="search-row"><div className="search-field"><Icon name="pin" size={17}/><input aria-label="Enter location" value={location} onChange={e=>setLocation(e.target.value)} placeholder="Enter Location"/></div><button className="primary-button" onClick={()=>setSearched(true)}>Search</button><span className="or-label">or</span><div className="search-field"><input aria-label="Bridge name or ID" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Enter Bridge Name/ID"/><button className="search-icon" aria-label="Search bridge" onClick={()=>setSearched(true)}><Icon name="search" size={17}/></button></div></div>{searched && <p className="search-feedback">Showing prototype bridge information for {query || location || bridge.id}.</p>}<article className="bridge-summary"><div className="bridge-photo"/><div><h2>BRIDGE {bridge.id}</h2><p>{bridge.name}</p><p className="location-line"><Icon name="pin" size={14}/>{bridge.location}</p><span className="road-badge">Road Bridge</span></div></article><div className="notice demo-notice"><Icon name="info" size={17}/><span>This historical information is sample data for demonstration purposes and is not verified official bridge-record data.</span></div><div className="info-grid"><InfoCard title="BRIDGE OVERVIEW" rows={[["Construction Date",historicalInfo.constructionDate],["Bridge Type","Road Bridge"],["Location",bridge.location]]}/><InfoCard title="MAINTENANCE & INSPECTIONS" rows={[["Total Renovations",historicalInfo.totalRenovations],["Last Renovation",historicalInfo.lastRenovation],["Total Manual Inspections",historicalInfo.totalInspections],["Last Inspection",historicalInfo.lastInspection]]}/><div className="info-card incident-card"><h3 className="section-title">INCIDENT HISTORY</h3><Detail label="Recorded Incidents" value={historicalInfo.recordedIncidents}/></div><div className="info-card timeline-card"><h3 className="section-title">LAST 6 YEARS (SUMMARY)</h3><div className="timeline">{['2019','2020','2021','2022','2023','2024'].map(y=><span key={y}><b/>{y}</span>)}</div></div></div></section>;
}

function InfoCard({ title, rows }) { return <div className="info-card"><h3 className="section-title">{title}</h3>{rows.map(([a,b])=><Detail label={a} value={b} key={a}/>)}</div>; }

function ReportProblem({ onOpen }) { return <><Hero className="report-hero"><div className="report-copy"><h1>REPORT A PROBLEM</h1><p>Help us keep the bridge safe. If you notice any unusual signs<br className="desktop-break"/> or damage, please report it here.</p><button className="primary-button report-cta" onClick={onOpen}><Icon name="report" size={16}/> Report a Problem</button></div></Hero><section className="panel report-under"><div className="no-alerts compact"><span className="big-check"><Icon name="check" size={25}/></span><h2>Bridge conditions are currently monitored.</h2><p>Use the report form to share anything unusual you notice.</p></div></section></>; }

function ReportModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false); const [photo, setPhoto] = useState(''); const [type, setType] = useState(''); const [description, setDescription] = useState('');
  function submit(e) { e.preventDefault(); if (!type || !description.trim()) return; setSubmitted(true); }
  return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">{submitted ? <div className="thank-you"><button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close"/></button><span className="big-check"><Icon name="check" size={25}/></span><h2 id="modal-title">Thank You!</h2><p>Your report has been recorded.</p><button className="outline-button" onClick={onClose}>Close</button></div> : <><div className="modal-heading"><h2 id="modal-title">Report a Problem</h2><button className="modal-close" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div><form onSubmit={submit}><label>Problem Type <em>*</em><select required value={type} onChange={e=>setType(e.target.value)}><option value="">Select problem type</option>{['Visible crack','Unusual movement','Strong vibration','Damaged bridge/road surface','Other'].map(x=><option key={x}>{x}</option>)}</select></label><label>Location<input value={`Bridge ID: ${bridge.id}`} readOnly/></label><label>Description <em>*</em><textarea required value={description} onChange={e=>setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows="4"/></label><div className="upload-row"><label className="upload-box"><input type="file" accept="image/*" onChange={e=>setPhoto(e.target.files?.[0]?.name || '')}/><Icon name="image" size={24}/><span>{photo || 'Choose Image'}</span><small>{photo ? 'Image selected' : 'No file chosen'}</small></label><small className="optional">Optional Photo</small></div><button className="primary-button submit-button" type="submit">SUBMIT REPORT</button></form></>}</section></div>;
}

function App() {
  const [page, setPage] = useState('Dashboard'); const [modal, setModal] = useState(false);
  const [latest, setLatest] = useState(null); const [connectionStatus, setConnectionStatus] = useState('loading');
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try { const reading = await getLatestReading(); if (active) { setLatest(reading); setConnectionStatus('online'); } }
      catch { if (active) setConnectionStatus('offline'); }
    };
    refresh();
    const timer = window.setInterval(refresh, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  const lastUpdated = latest?.timestamp || '—';
  return <div className="app-shell"><Header page={page} onNavigate={setPage} connectionStatus={connectionStatus}/><main className="main-content">{page==='Dashboard'&&<Dashboard latest={latest} connectionStatus={connectionStatus} lastUpdated={lastUpdated} />}{page==='Bridge Health'&&<BridgeHealth/>}{page==='Alerts'&&<Alerts/>}{page==='History'&&<History/>}{page==='Bridge Information'&&<BridgeInformation/>}{page==='Report a Problem'&&<ReportProblem onOpen={()=>setModal(true)}/>}</main>{modal&&<ReportModal onClose={()=>setModal(false)}/>}<footer>Prototype monitoring interface · Demo readings for illustration only</footer></div>;
}

createRoot(document.getElementById('root')).render(<App/>);
