const SHEET_ID = '190c82inNnnhojtxBwB5MdiSpVngTer8tvMP3Y3bYjTA';
const ON_SPOT_SHEET_NAME = 'OnSpotRegistrations';
const REGISTRATION_HEADERS = ['Timestamp', 'Name', 'Phone', 'Pincode', 'Place', 'Angasamste', 'FamilyMembers', 'Notes'];

function getMembersSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const namedMembersSheet = ss.getSheetByName('Members');
  if (namedMembersSheet && hasMemberData(namedMembersSheet)) {
    return namedMembersSheet;
  }

  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i += 1) {
    const candidate = sheets[i];
    if (candidate.getName() === 'Attendance') continue;
    if (hasMemberData(candidate)) {
      return candidate;
    }
  }

  const sheet = namedMembersSheet || ss.insertSheet('Members');
  const headers = ['Timestamp', 'Name', 'Phone', 'Pincode', 'Place', 'Angasamste', 'FamilyMembers', 'Notes'];
  const existing = sheet.getDataRange().getValues();
  if (!existing.length || (existing.length === 1 && existing[0].every((value) => value === ''))) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function hasMemberData(sheet) {
  if (!sheet || sheet.getLastRow() < 2 || sheet.getLastColumn() < 2) return false;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const normalizedHeaders = headers.map(normalizeHeader);
  const hasName = normalizedHeaders.some((header) => header.includes('name') && !header.includes('family'));
  const hasPhone = normalizedHeaders.some((header) => header.includes('mobile') || header.includes('phone'));
  return hasName && hasPhone;
}

function getOnSpotSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(ON_SPOT_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(ON_SPOT_SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(REGISTRATION_HEADERS);
  return sheet;
}

function getRegistrationSources() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sources = [getMembersSheet()];
  const onSpotSheet = ss.getSheetByName(ON_SPOT_SHEET_NAME);
  if (onSpotSheet && onSpotSheet.getLastRow() > 1) sources.push(onSpotSheet);
  return sources;
}

function getSourceMemberId(sheet, rowIndex) {
  const prefix = sheet.getName() === ON_SPOT_SHEET_NAME ? 'OS' : 'M';
  return prefix + String(rowIndex).padStart(6, '0');
}

function findMemberById(memberId) {
  const sources = getRegistrationSources();
  for (const sheet of sources) {
    const prefix = sheet.getName() === ON_SPOT_SHEET_NAME ? 'OS' : 'M';
    if (!memberId.startsWith(prefix)) continue;
    const rowNumber = Number(memberId.slice(prefix.length));
    if (!rowNumber || rowNumber < 2 || rowNumber > sheet.getLastRow()) continue;
    const columns = getMembersColumnMap(sheet);
    const row = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (getCell(row, columns.name) === '') continue;
    return { sheet, columns, row, rowIndex: rowNumber - 1 };
  }
  return null;
}

function getAttendanceSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Attendance');
  if (!sheet) {
    sheet = ss.insertSheet('Attendance');
  }

  const headers = ['Timestamp', 'MemberID', 'Name', 'Phone', 'FamilyMember', 'Present', 'VerifiedBy'];
  const existing = sheet.getDataRange().getValues();
  if (!existing.length || (existing.length === 1 && existing[0].every((value) => value === ''))) {
    sheet.appendRow(headers);
    return sheet;
  }

  const firstRow = existing[0];
  const missing = headers.filter((header, idx) => firstRow[idx] !== header);
  if (missing.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }

  return sheet;
}

function ensureSheetHeaders(sheet, headers) {
  const values = sheet.getDataRange().getValues();
  if (!values.length) {
    sheet.appendRow(headers);
    return;
  }

  const firstRow = values[0];
  const needsUpdate = headers.some((header, idx) => firstRow[idx] !== header);
  if (needsUpdate) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function sanitizePhone(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeHeader(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getMembersColumnMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  const map = {};
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header);
    if (!normalized) return;
    if (!map.timestamp && normalized.includes('timestamp')) map.timestamp = index;
    if (!map.angasamste && (normalized.includes('angasamste') || normalized.includes('location'))) map.angasamste = index;
    if (!map.name && normalized.includes('name') && !normalized.includes('family')) map.name = index;
    if (!map.phone && (normalized.includes('mobile') || normalized.includes('phone'))) map.phone = index;
    if (!map.email && normalized.includes('email')) map.email = index;
    if (!map.address && normalized.includes('address') && !normalized.includes('email')) map.address = index;
    if (!map.pincode && (normalized.includes('pincode') || normalized.includes('postalcode') || normalized.includes('zipcode'))) map.pincode = index;
    if (!map.familyCount && normalized.includes('numberoffamily')) map.familyCount = index;
    if (!map.familyMembers && normalized.includes('familymembers')) map.familyMembers = index;
    if (!map.notes && normalized.includes('notes')) map.notes = index;
    if (!map.consent && !normalized.includes('numberoffamily') && (normalized.includes('wishtoattend') || normalized.includes('attendthekoot') || normalized.includes('attending'))) map.consent = index;
  });
  return map;
}

function getCell(row, columnIndex) {
  return columnIndex === undefined ? '' : row[columnIndex];
}

function safeMemberId(rowIndex) {
  const number = Number(rowIndex) + 1;
  return 'M' + String(number).padStart(6, '0');
}

function getMemberIdRowMap() {
  const sheet = getMembersSheet();
  const columns = getMembersColumnMap(sheet);
  const values = sheet.getDataRange().getValues();
  const map = {};
  for (let i = 1; i < values.length; i += 1) {
    const row = values[i];
    if (!row || getCell(row, columns.name) === '') continue;
    const rowIndex = i + 1;
    const memberId = 'M' + String(rowIndex).padStart(6, '0');
    map[memberId] = rowIndex;
  }
  return map;
}

function buildMemberRecord(row, rowIndex, columns, sheet) {
  const memberColumns = columns || getMembersColumnMap(getMembersSheet());
  const timestamp = getCell(row, memberColumns.timestamp);
  const name = getCell(row, memberColumns.name);
  const phone = getCell(row, memberColumns.phone);
  const pincode = getCell(row, memberColumns.pincode);
  const place = getCell(row, memberColumns.address);
  const angasamste = getCell(row, memberColumns.angasamste);
  const familyMembers = getCell(row, memberColumns.familyMembers) || getCell(row, memberColumns.familyCount);
  const familyCount = getCell(row, memberColumns.familyCount);
  const notes = getCell(row, memberColumns.notes);
  const email = getCell(row, memberColumns.email);
  const consent = getCell(row, memberColumns.consent);
  const cleanedPhone = sanitizePhone(phone);
  const familyArray = String(familyMembers || '')
    .split(',')
    .map((value) => normalizeText(value))
    .filter(Boolean);

  return {
    rowIndex: rowIndex + 1,
    memberId: getSourceMemberId(sheet || getMembersSheet(), rowIndex + 1),
    timestamp: timestamp || '',
    name: normalizeText(name),
    phone: cleanedPhone,
    pincode: normalizeText(pincode),
    place: normalizeText(place),
    angasamste: normalizeText(angasamste),
    familyMembers: memberColumns.familyMembers === undefined ? [] : familyArray,
    familyCount: normalizeText(familyCount || (memberColumns.familyMembers === undefined ? familyMembers : '')),
    notes: normalizeText(notes),
    email: normalizeText(email),
    consent: normalizeText(consent)
  };
}

function findPossibleDuplicate(name, phone) {
  const normalizedPhone = sanitizePhone(phone);
  const normalizedName = normalizeText(name).toLowerCase();

  for (const sheet of getRegistrationSources()) {
    const columns = getMembersColumnMap(sheet);
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i += 1) {
      const row = values[i];
      if (!row || getCell(row, columns.name) === '') continue;
      const rowName = normalizeText(getCell(row, columns.name)).toLowerCase();
      const rowPhone = sanitizePhone(getCell(row, columns.phone));
      if (normalizedPhone && normalizedPhone === rowPhone) {
        return {
          name: getCell(row, columns.name),
          phone: getCell(row, columns.phone),
          place: getCell(row, columns.address) || ''
        };
      }
      if (normalizedName && rowName && normalizedName === rowName && normalizedPhone && rowPhone === normalizedPhone) {
        return {
          name: getCell(row, columns.name),
          phone: getCell(row, columns.phone),
          place: getCell(row, columns.address) || ''
        };
      }
    }
  }

  return null;
}

function createError(errorMessage) {
  return { success: false, error: errorMessage };
}

function doGet(e) {
  return HtmlService.createHtmlOutput('<p>Community Event Management Platform</p>');
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (parseError) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || '';

    if (action === 'register') {
      return handleRegister(payload);
    }

    if (action === 'search') {
      return handleSearch(payload);
    }

    if (action === 'verifyAttendance') {
      return handleVerifyAttendance(payload);
    }

    return ContentService.createTextOutput(JSON.stringify(createError('Unsupported action.'))).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const message = error && error.message ? error.message : String(error);
    return jsonResponse(createError('Backend error: ' + message));
  }
}

function handleRegister(payload) {
  const name = normalizeText(payload.name);
  const phone = sanitizePhone(payload.phone);
  const pincode = normalizeText(payload.pincode);
  const place = normalizeText(payload.place);
  const angasamste = normalizeText(payload.angasamste);
  const familyMembers = normalizeText(payload.familyMembers);
  const notes = normalizeText(payload.notes);
  const force = Boolean(payload.force);

  if (!name || !phone || !pincode || !place) {
    return jsonResponse(createError('Name, phone, pincode, and place are required.'));
  }

  if (phone.length !== 10) {
    return jsonResponse(createError('Phone number must be 10 digits.'));
  }

  if (!/^\d{6}$/.test(pincode)) {
    return jsonResponse(createError('Pincode must be a 6-digit number.'));
  }

  const sheet = getOnSpotSheet();
  const columns = getMembersColumnMap(sheet);
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const values = sheet.getDataRange().getValues();
    const duplicate = findPossibleDuplicate(name, phone);
    if (!force && duplicate) {
      return jsonResponse({
        success: false,
        error: 'Possible Existing Registration',
        duplicate: true,
        duplicateCandidate: duplicate
      });
    }

    const timestamp = new Date().toISOString();
    const rowIndex = values.length;
    const memberId = getSourceMemberId(sheet, rowIndex);
    const memberRow = new Array(sheet.getLastColumn() || 1).fill('');
    if (columns.timestamp !== undefined) memberRow[columns.timestamp] = timestamp;
    if (columns.name !== undefined) memberRow[columns.name] = name;
    if (columns.phone !== undefined) memberRow[columns.phone] = phone;
    if (columns.pincode !== undefined) memberRow[columns.pincode] = pincode;
    if (columns.address !== undefined) memberRow[columns.address] = place;
    if (columns.angasamste !== undefined) memberRow[columns.angasamste] = angasamste;
    if (columns.familyMembers !== undefined) memberRow[columns.familyMembers] = familyMembers;
    if (columns.familyCount !== undefined && columns.familyMembers === undefined) memberRow[columns.familyCount] = familyMembers;
    if (columns.notes !== undefined) memberRow[columns.notes] = notes;
    if (columns.consent !== undefined) memberRow[columns.consent] = 'Yes';
    sheet.appendRow(memberRow);

    return jsonResponse({
      success: true,
      message: 'Registration completed successfully.',
      memberId: memberId,
      member: {
        memberId: memberId,
        rowNumber: rowIndex,
        timestamp: timestamp,
        name: name,
        phone: phone,
        pincode: pincode,
        place: place,
        angasamste: angasamste,
        familyMembers: familyMembers,
        notes: notes
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function handleSearch(payload) {
  const query = normalizeText(payload.query);
  const name = normalizeText(payload.name);
  const phone = sanitizePhone(payload.phone);
  const angasamste = normalizeText(payload.angasamste);
  const pincode = normalizeText(payload.pincode);
  const place = normalizeText(payload.place);
  const familyMembers = normalizeText(payload.familyMembers);
  const notes = normalizeText(payload.notes);

  if (!payload.fetchAll && !query && !name && !phone && !angasamste && !pincode && !place && !familyMembers && !notes) {
    return jsonResponse(createError('Please enter at least one search value.'));
  }

  const matches = [];
  let sourceRows = 0;
  const sourceSheets = getRegistrationSources();
  for (const membersSheet of sourceSheets) {
    const memberColumns = getMembersColumnMap(membersSheet);
    const values = membersSheet.getDataRange().getValues();
    sourceRows += Math.max(values.length - 1, 0);
    for (let i = 1; i < values.length; i += 1) {
      const row = values[i];
      if (!row || getCell(row, memberColumns.name) === '') continue;
      const member = buildMemberRecord(row, i, memberColumns, membersSheet);
      const rowName = normalizeText(member.name).toLowerCase();
      const rowPhone = normalizeText(member.phone).toLowerCase();
      const rowAngasamste = normalizeText(member.angasamste).toLowerCase();
      const rowPincode = normalizeText(member.pincode).toLowerCase();
      const rowPlace = normalizeText(member.place).toLowerCase();
      const rowFamilyMembers = normalizeText(member.familyMembers.join(', ')).toLowerCase();
      const rowNotes = normalizeText(member.notes).toLowerCase();
      const rowAllFields = row.map((value) => normalizeText(value).toLowerCase()).join(' ');

      const queryMatches = query ? rowAllFields.includes(query.toLowerCase()) : false;
      const nameMatches = name ? rowName.includes(name.toLowerCase()) : false;
      const phoneMatches = phone ? rowPhone.includes(phone) : false;
      const angasamsteMatches = angasamste ? rowAngasamste.includes(angasamste.toLowerCase()) : false;
      const pincodeMatches = pincode ? rowPincode.includes(pincode.toLowerCase()) : false;
      const placeMatches = place ? rowPlace.includes(place.toLowerCase()) : false;
      const familyMatches = familyMembers ? rowFamilyMembers.includes(familyMembers.toLowerCase()) : false;
      const notesMatches = notes ? rowNotes.includes(notes.toLowerCase()) : false;

      if (payload.fetchAll || queryMatches || nameMatches || phoneMatches || angasamsteMatches || pincodeMatches || placeMatches || familyMatches || notesMatches) {
        matches.push({
        memberId: member.memberId,
        timestamp: member.timestamp,
        name: member.name,
        phone: member.phone,
        place: member.place,
        pincode: member.pincode,
        angasamste: member.angasamste,
        familyMembers: member.familyMembers,
        familyCount: member.familyCount,
        notes: member.notes,
        email: member.email,
        consent: member.consent
        });
      }
    }
  }

  return jsonResponse({
    success: true,
    count: matches.length,
    results: matches,
    sourceSheet: sourceSheets.map((sheet) => sheet.getName()).join(', '),
    sourceRows
  });
}

function handleVerifyAttendance(payload) {
  const memberId = normalizeText(payload.memberId);
  const familyMember = normalizeText(payload.familyMember || '');
  const present = Boolean(payload.present);
  const updatedPhone = sanitizePhone(payload.updatedPhone || '');
  const familyCount = normalizeText(payload.familyCount || '');

  if (!memberId || !familyMember) {
    return jsonResponse(createError('Member ID and family member are required.'));
  }

  const attendanceSheet = getAttendanceSheet();
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const member = findMemberById(memberId);
    if (!member) {
      return jsonResponse(createError('Member not found.'));
    }
    const memberSheet = member.sheet;
    const memberColumns = member.columns;
    const memberRow = member.row;
    const memberIndex = member.rowIndex;

    const attendanceValues = attendanceSheet.getDataRange().getValues();
    for (let i = 1; i < attendanceValues.length; i += 1) {
      const row = attendanceValues[i];
      const rowMemberId = normalizeText(row[1]);
      const rowFamilyMember = normalizeText(row[4]);
      const rowPresent = String(row[5] || '').toLowerCase() === 'true' || String(row[5] || '').toLowerCase() === 'yes';
      if (rowMemberId === memberId && rowPresent) {
        return jsonResponse({
          success: false,
          error: 'ALREADY VERIFIED. This registration has already been marked present.'
        });
      }
    }

    if (updatedPhone) {
      if (updatedPhone.length !== 10) {
        return jsonResponse(createError('Updated phone number must be 10 digits.'));
      }
      if (memberColumns.phone !== undefined) {
        memberSheet.getRange(memberIndex + 1, memberColumns.phone + 1, 1, 1).setValue(updatedPhone);
      }
      if (memberColumns.timestamp !== undefined) {
        memberSheet.getRange(memberIndex + 1, memberColumns.timestamp + 1, 1, 1).setValue(new Date().toISOString());
      }
    }

    if (familyCount) {
      if (!/^\d+$/.test(familyCount) || Number(familyCount) < 1) {
        return jsonResponse(createError('Family member count must be a positive whole number.'));
      }
      if (memberColumns.familyCount !== undefined) {
        memberSheet.getRange(memberIndex + 1, memberColumns.familyCount + 1, 1, 1).setValue(Number(familyCount));
      }
    }

    const verifiedBy = Session.getActiveUser() && Session.getActiveUser().getEmail ? Session.getActiveUser().getEmail() : 'Anonymous';
    const attendanceRow = [new Date().toISOString(), memberId, getCell(memberRow, memberColumns.name) || '', updatedPhone || getCell(memberRow, memberColumns.phone) || '', familyMember, String(present), verifiedBy];
    attendanceSheet.appendRow(attendanceRow);

    return jsonResponse({ success: true, message: 'Attendance recorded successfully.' });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
