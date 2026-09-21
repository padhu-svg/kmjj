import { FormEvent, useMemo, useState } from 'react';
import { postJson } from '../api';
import { COUNTER_LABELS, getCounterFromQuery } from '../config';

const emptySearch = {
  query: ''
};

type SearchResultItem = {
  memberId: string;
  name: string;
  phone: string;
  place: string;
  pincode: string;
  angasamste: string;
  familyMembers: string[];
  familyCount?: string;
  notes?: string;
  timestamp?: string;
  email?: string;
  consent?: string;
  primaryName?: string;
};

function normalizeText(value: string) {
  return String(value || '').replace(/\s+/g, ' ').trim().toLowerCase();
}

export function SearchScreen() {
  const [form, setForm] = useState(emptySearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selected, setSelected] = useState<SearchResultItem | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [attendanceDone, setAttendanceDone] = useState<{ names: string[] } | null>(null);
  const [attendanceError, setAttendanceError] = useState('');
  const [selectedFamilyMembers, setSelectedFamilyMembers] = useState<string[]>([]);
  const [searchField, setSearchField] = useState<'all' | 'name' | 'phone' | 'pincode'>('name');
  const [searchValue, setSearchValue] = useState('');

  const counter = getCounterFromQuery();
  const counterLabel = counter ? COUNTER_LABELS[counter] : 'Verification Counter';

  const hasSearchCriteria = useMemo(
    () => normalizeText(searchValue).length > 0,
    [searchValue]
  );

  const handleChange = (field: keyof typeof emptySearch, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const clearSearch = () => {
    setForm(emptySearch);
    setSearchValue('');
    setResults([]);
    setSelected(null);
    setError('');
    setAttendanceDone(null);
    setAttendanceError('');
    setSelectedFamilyMembers([]);
    setConfirming(false);
  };

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!hasSearchCriteria) {
      setError('Please enter at least one search field.');
      return;
    }

    setLoading(true);
    setError('');
    setSelected(null);
    setConfirming(false);
    setAttendanceDone(null);
    setAttendanceError('');

    try {
      const payload = {
        action: 'search',
        query: searchField === 'all' ? searchValue : '',
        name: searchField === 'name' ? searchValue : '',
        phone: searchField === 'phone' ? searchValue : '',
        pincode: searchField === 'pincode' ? searchValue : ''
      };

      const response = await postJson<SearchResultItem>(payload);
      if (!response.success) {
        throw new Error(response.error || 'Search failed.');
      }

      const items = Array.isArray(response.results) ? response.results : [];
      setResults(items);
      if (items.length === 0) {
        setSelected(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search members.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPresent = async () => {
    if (!selected) return;
    setConfirming(true);
  };

  const handleDirectMarkPresent = async (member: SearchResultItem) => {
    setLoading(true);
    setAttendanceError('');

    try {
      const presentCount = member.familyCount || '1';
      const label = presentCount === '1' ? member.name : `${member.name} (+${Number(presentCount) - 1})`;
      
      const response = await postJson({
        action: 'verifyAttendance',
        memberId: member.memberId,
        familyMember: label,
        present: true,
        updatedPhone: member.phone,
        familyCount: presentCount
      });
      
      if (!response.success) {
        setAttendanceError(response.error || 'Attendance could not be verified.');
        return;
      }

      setAttendanceDone({ names: [label] });
      setResults([]);
      setSelected(null);
      setConfirming(false);
      setForm(emptySearch);
    } catch (err) {
      setAttendanceError(err instanceof Error ? err.message : 'Unable to save attendance.');
    } finally {
      setLoading(false);
    }
  };

  const confirmAttendance = async () => {
    if (!selected) return;
    setLoading(true);
    setAttendanceError('');

    try {
      const presentCount = selected.familyCount || '1';
      const label = presentCount === '1' ? selected.name : `${selected.name} (+${Number(presentCount) - 1})`;
      
      const response = await postJson({
        action: 'verifyAttendance',
        memberId: selected.memberId,
        familyMember: label,
        present: true,
        updatedPhone: selected.phone,
        familyCount: presentCount
      });
      
      if (!response.success) {
        setAttendanceError(response.error || 'Attendance could not be verified.');
        return;
      }

      setAttendanceDone({ names: [label] });
      setResults([]);
      setSelected(null);
      setConfirming(false);
      setForm(emptySearch);
      setSelectedFamilyMembers([]);
    } catch (err) {
      setAttendanceError(err instanceof Error ? err.message : 'Unable to save attendance.');
    } finally {
      setLoading(false);
    }
  };

  const primaryName = selected?.name || '';
  const familyChoices = selected ? [selected.name, ...(selected.familyMembers || [])].filter(Boolean) : [];

  return (
    <section className="card-panel">
      <div className="section-header">
        <div>
          <h2>Registration Verification</h2>
          <p className="subtitle">Search registered members and verify attendance</p>
        </div>
        <div className="counter-tag">{counterLabel}</div>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="field-grid search-grid">
          <label className="field">
            <span>Search by</span>
            <select value={searchField} onChange={(e) => setSearchField(e.target.value as typeof searchField)}>
              <option value="name">Name</option>
              <option value="phone">Phone</option>
              <option value="pincode">Pincode</option>
              <option value="all">All fields</option>
            </select>
          </label>
          <label className="field full-width">
            <span>{searchField === 'all' ? 'Search value' : `Search ${searchField}`}</span>
            <input
              value={searchValue}
              onChange={(e) => { setSearchValue(searchField === 'pincode' ? e.target.value.replace(/\D/g, '').slice(0, 6) : searchField === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value); setError(''); }}
              inputMode={searchField === 'phone' || searchField === 'pincode' ? 'numeric' : 'text'}
              maxLength={searchField === 'pincode' ? 6 : searchField === 'phone' ? 10 : undefined}
              placeholder={searchField === 'phone' ? 'Enter mobile number' : searchField === 'pincode' ? 'Enter pincode' : searchField === 'all' ? 'Enter any member detail' : 'Enter full or partial name'}
            />
          </label>
        </div>

        <div className="row-actions">
          <button type="submit" className="primary-button" disabled={loading || !hasSearchCriteria}>
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button type="button" className="secondary-button" onClick={clearSearch}>
            Clear
          </button>
        </div>
      </form>

      {error && <div className="error-box">{error}</div>}

      {!attendanceDone && results.length > 0 && (
        <div className="results-summary">{results.length} registration{results.length === 1 ? '' : 's'} found</div>
      )}

      {!attendanceDone && results.length > 0 && !selected && (
        <div className="result-list">
          {results.map((result) => (
            <article key={result.memberId} className="member-card">
              <div className="member-card__header">
                <div>
                  <h3>{result.name}</h3>
                  <span className="member-id-tag">{result.memberId}</span>
                </div>
              </div>

              <div className="member-card__body">
                <div className="info-line">📞 {result.phone}</div>
                <div className="info-line">📍 {result.place}</div>
                <div className="info-line">Pincode: {result.pincode}</div>
                <div className="info-line">Angasamste: {result.angasamste || '—'}</div>
                <div className="info-line">Email: {result.email || '—'}</div>
                <div className="info-line">Family members attending: {result.familyCount || '1'}</div>
                <div className="info-line">Attendance consent: {result.consent || '—'}</div>
                <div className="info-line">Notes: {result.notes || '—'}</div>
              </div>

              <div className="family-box">
                <div className="family-label">SELECT TOTAL MEMBERS PRESENT</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={(result.familyCount || '1') === String(num) ? 'primary-button' : 'secondary-button'}
                      style={{ padding: '0.5rem 1rem', minWidth: '3rem' }}
                      onClick={() => setResults(results.map(r => r.memberId === result.memberId ? { ...r, familyCount: String(num) } : r))}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="member-actions">
                <button type="button" className="primary-button" onClick={() => handleDirectMarkPresent(result)} disabled={loading}>
                  MARK PRESENT
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {selected && !confirming && !attendanceDone && (
        <div className="member-detail card-panel__inner">
          <div className="status-pill success">✓ REGISTRATION FOUND</div>
          <div className="detail-grid">
            <div><strong>Name:</strong> {selected.name}</div>
            <div><strong>Phone:</strong> {selected.phone}</div>
            <div><strong>Place:</strong> {selected.place}</div>
            <div><strong>Pincode:</strong> {selected.pincode}</div>
            <div><strong>Angasamste:</strong> {selected.angasamste || '—'}</div>
            <div><strong>Email:</strong> {selected.email || '—'}</div>
            <div><strong>Family members attending:</strong> {selected.familyMembers?.join(', ') || '—'}</div>
            <div><strong>Attendance consent:</strong> {selected.consent || '—'}</div>
            <div><strong>Notes:</strong> {selected.notes || '—'}</div>
            <div><strong>Registered:</strong> {selected.timestamp || '—'}</div>
          </div>

          <div className="family-box">
            <div className="family-label">TOTAL MEMBERS PRESENT</div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <button
                  key={num}
                  type="button"
                  className={selected.familyCount === String(num) ? 'primary-button' : 'secondary-button'}
                  style={{ padding: '0.5rem 1rem', minWidth: '3rem' }}
                  onClick={() => setSelected((prev) => prev ? { ...prev, familyCount: String(num) } : null)}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <span>Registered Phone</span>
            <input value={selected.phone} onChange={(e) => setSelected((prev) => prev ? { ...prev, phone: e.target.value } : null)} />
          </div>
          <div className="field">
            <span>Total Members Attending (Custom)</span>
            <input
              type="number"
              min="1"
              step="1"
              value={selected.familyCount || '1'}
              onChange={(e) => setSelected((prev) => prev ? { ...prev, familyCount: e.target.value } : null)}
            />
          </div>

          <div className="row-actions">
            <button type="button" className="secondary-button" onClick={() => setSelected(null)}>
              BACK
            </button>
            <button type="button" className="primary-button" onClick={handleMarkPresent}>
              MARK PRESENT
            </button>
          </div>
        </div>
      )}

      {confirming && selected && (
        <div className="confirm-panel">
          <h3>Mark the following as PRESENT?</h3>
          <ul>
            {[selected.name, ...(selected.familyMembers || [])].filter(Boolean).map((memberName) => (
              <li key={memberName}>✓ {memberName}</li>
            ))}
          </ul>
          <div className="confirm-phone">
            <span>Phone:</span>
            <strong>{selected.phone}</strong>
          </div>
          <div className="row-actions">
            <button type="button" className="secondary-button" onClick={() => setConfirming(false)}>
              BACK
            </button>
            <button type="button" className="primary-button" onClick={confirmAttendance} disabled={loading}>
              {loading ? 'Saving attendance...' : 'CONFIRM ATTENDANCE'}
            </button>
          </div>
        </div>
      )}

      {!loading && !selected && results.length === 0 && !attendanceDone && !error && hasSearchCriteria && (
        <div className="empty-state danger">
          <div className="status-pill danger">REGISTRATION NOT FOUND</div>
          <p>This person could not be found in the registration database.</p>
          <p>Please direct them to one of the 3 Registration Counters.</p>
        </div>
      )}

      {attendanceDone && (
        <div className="success-panel">
          <div className="success-icon">✓</div>
          <h2>ATTENDANCE VERIFIED</h2>
          <div className="success-list">
            {attendanceDone.names.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>
          <p>Attendance recorded successfully.</p>
          <button type="button" className="primary-button" onClick={() => {
            setAttendanceDone(null);
            clearSearch();
          }}>
            SEARCH NEXT MEMBER
          </button>
        </div>
      )}

      {attendanceError && <div className="error-box">{attendanceError}</div>}
    </section>
  );
}
