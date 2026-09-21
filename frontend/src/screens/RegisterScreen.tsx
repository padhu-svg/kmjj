import { FormEvent, useMemo, useState } from 'react';
import { postJson } from '../api';
import { COUNTER_LABELS, getCounterFromQuery } from '../config';

const emptyForm = {
  name: '',
  phone: '',
  pincode: '',
  place: '',
  angasamste: '',
  familyMembers: '',
  notes: ''
};

const ANGASAMSTE_OPTIONS = [
  'Bantwal / ಬಂಟ್ವಾಳ',
  'Belthangady / ಬೆಳ್ತಂಗಡಿ',
  'Bengaluru / ಬೆಂಗಳೂರು',
  'Chennai / ಚೆನ್ನೈ',
  'Chikmagaluru / ಚಿಕ್ಕಮಗಳೂರು',
  'Chottanikara / ಚೊಟ್ಟಾನಿಕ್ಕರ',
  'Davangere / ದಾವಣಗೆರೆ',
  'Dharawada / ಧಾರವಾಡ',
  'Gokarna / ಗೋಕರ್ಣ',
  'Hassan / ಹಾಸನ',
  'Jayapura Koppa / ಜಯಪುರ ಕೊಪ್ಪ',
  'Kalasa Balehole / ಕಳಸ ಬಾಳೆಹೊಳೆ',
  'Kamalashile / ಕಮಲಶಿಲೆ',
  'Kasargod / ಕಾಸರಗೋಡು',
  'Katipalla Krishnapura / ಕಾಟಿಪಳ್ಳ ಕೃಷ್ಣಾಪುರ',
  'Kirimanjeshwara / ಕಿರಿಮಂಜೇಶ್ವರ',
  'Kundapura / ಕುಂದಾಪುರ',
  'Madikeri / ಮಡಿಕೇರಿ',
  'Manchi / ಮಂಚಿ',
  'Mandya / ಮಂಡ್ಯ',
  'Mangalore / ಮಂಗಳೂರು',
  'Mangalpady / ಮಂಗಲ್ಪಾಡಿ',
  'Miyapadavu / ಮಿಯಾಪಡವು',
  'Moodabidri / ಮೂಡುಬಿದಿರೆ',
  'Mumbai / ಮುಂಬೈ',
  'Mysore / ಮೈಸೂರು',
  'Polali / ಪೊಳಲಿ',
  'Pune / ಪುಣೆ',
  'Putturu / ಪುತ್ತೂರು',
  'Saligrama / ಸಾಲಿಗ್ರಾಮ',
  'Shivamogga / ಶಿವಮೊಗ್ಗ',
  'Sringeri / ಶೃಂಗೇರಿ',
  'Sulya / ಸುಳ್ಯ',
  'Thirthahalli / ತೀರ್ಥಹಳ್ಳಿ',
  'Tumakuru / ತುಮಕೂರು',
  'Udupi / ಉಡುಪಿ',
  'Uttarahalli / ಉತ್ತರಹಳ್ಳಿ',
  'Vorkadi / ವರ್ಕಾಡಿ'
];

const normalizeValue = (value: string) => value.replace(/\s+/g, ' ').trim();

export function RegisterScreen() {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ memberId: string } | null>(null);
  const [duplicateCandidate, setDuplicateCandidate] = useState<null | {
    name: string;
    phone: string;
    place: string;
  }>(null);

  const counter = getCounterFromQuery();
  const counterLabel = counter ? COUNTER_LABELS[counter] : 'Registration Counter';

  const isValidPhone = (phone: string) => /^\d{10}$/.test(phone.replace(/\D/g, ''));
  const isValidPincode = (pincode: string) => /^\d{6}$/.test(String(pincode).trim());

  const validationMessage = useMemo(() => {
    if (!form.name.trim()) return 'Name is required.';
    if (!isValidPhone(form.phone)) return 'Phone number must be 10 digits.';
    if (!isValidPincode(form.pincode)) return 'Pincode must be a 6-digit number.';
    if (!form.place.trim()) return 'Place is required.';
    return '';
  }, [form]);

  const handleChange = (field: keyof typeof emptyForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    setDuplicateCandidate(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setLoading(true);
    setError('');
    setDuplicateCandidate(null);

    try {
      const payload = {
        action: 'register',
        name: normalizeValue(form.name),
        phone: normalizeValue(form.phone).replace(/\D/g, ''),
        pincode: normalizeValue(form.pincode),
        place: normalizeValue(form.place),
        angasamste: normalizeValue(form.angasamste),
        familyMembers: normalizeValue(form.familyMembers),
        notes: normalizeValue(form.notes)
      };

      const response = await postJson(payload);

      if (!response.success) {
        if (response.error) {
          setError(response.error);
        } else {
          setError('Registration could not be completed.');
        }
        return;
      }

      if (response.duplicate && response.duplicateCandidate) {
        setDuplicateCandidate({
          name: String(response.duplicateCandidate.name ?? ''),
          phone: String(response.duplicateCandidate.phone ?? ''),
          place: String(response.duplicateCandidate.place ?? '')
        });
        return;
      }

      setSuccess({ memberId: String(response.memberId || '') });
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong during registration.');
    } finally {
      setLoading(false);
    }
  };

  const registerAnyway = async () => {
    setLoading(true);
    setError('');

    try {
      const payload = {
        action: 'register',
        name: normalizeValue(form.name),
        phone: normalizeValue(form.phone).replace(/\D/g, ''),
        pincode: normalizeValue(form.pincode),
        place: normalizeValue(form.place),
        angasamste: normalizeValue(form.angasamste),
        familyMembers: normalizeValue(form.familyMembers),
        notes: normalizeValue(form.notes),
        force: true
      };

      const response = await postJson(payload);

      if (!response.success) {
        setError(response.error || 'Registration could not be completed.');
        return;
      }

      setSuccess({ memberId: String(response.memberId || '') });
      setForm(emptyForm);
      setDuplicateCandidate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-panel success-panel__wide">
        <div className="success-icon">✓</div>
        <h2>REGISTRATION SUCCESSFUL</h2>
        <div className="success-section">
          <div className="label">Member ID</div>
          <div className="member-id">{success.memberId}</div>
          <p>Registration has been saved successfully.</p>
          <p>Please proceed to the<br />Verification & Attendance Counter.</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setSuccess(null)}>
          REGISTER ANOTHER PERSON
        </button>
      </div>
    );
  }

  return (
    <section className="card-panel">
      <div className="section-header">
        <div>
          <h2>On-Spot Registration</h2>
        </div>
        <div className="counter-tag">{counterLabel}</div>
      </div>

      <form className="registration-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label className="field">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              autoComplete="name"
              placeholder="Full name"
              required
            />
          </label>

          <label className="field">
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              placeholder="9876543210"
              required
            />
          </label>

          <label className="field">
            <span>Pincode</span>
            <input
              value={form.pincode}
              onChange={(e) => handleChange('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              maxLength={6}
              autoComplete="postal-code"
              placeholder="576101"
              required
            />
          </label>

          <label className="field">
            <span>Place</span>
            <input
              value={form.place}
              onChange={(e) => handleChange('place', e.target.value)}
              autoComplete="address-level2"
              placeholder="Udupi"
              required
            />
          </label>

          <label className="field full-width">
            <span>Angasamste</span>
            <input
              value={form.angasamste}
              onChange={(e) => handleChange('angasamste', e.target.value)}
              list="angasamste-options"
              placeholder="Type to choose an Angasamste"
            />
            <datalist id="angasamste-options">
              {ANGASAMSTE_OPTIONS.map((option) => <option key={option} value={option} />)}
            </datalist>
          </label>

          <label className="field full-width">
            <span>Family Members</span>
            <input
              value={form.familyMembers}
              onChange={(e) => handleChange('familyMembers', e.target.value)}
              placeholder="Ravi Kumar, Lakshmi Kumar, Anu Kumar"
            />
          </label>

          <label className="field full-width">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </label>
        </div>

        {duplicateCandidate && (
          <div className="warning-box">
            <h3>Possible Existing Registration</h3>
            <p>This person may already be registered.</p>
            <p>
              <strong>Name:</strong> {duplicateCandidate.name}
              <br />
              <strong>Phone:</strong> {duplicateCandidate.phone}
              <br />
              <strong>Place:</strong> {duplicateCandidate.place}
            </p>
            <p>Please verify before creating another registration.</p>
            <div className="row-actions">
              <button type="button" className="secondary-button" onClick={() => setDuplicateCandidate(null)}>
                CANCEL
              </button>
              <button type="button" className="primary-button" onClick={registerAnyway} disabled={loading}>
                REGISTER ANYWAY
              </button>
            </div>
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        <button type="submit" className="primary-button submit-button" disabled={loading || !!validationMessage}>
          {loading ? 'Registering...' : 'REGISTER MEMBER'}
        </button>
      </form>
    </section>
  );
}
