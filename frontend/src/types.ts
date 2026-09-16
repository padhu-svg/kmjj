export type MemberRecord = {
  rowIndex: number;
  memberId: string;
  name: string;
  phone: string;
  pincode: string;
  place: string;
  angasamste: string;
  familyMembers: string[];
  notes: string;
  timestamp?: string;
};

export type SearchResult = MemberRecord & {
  primaryName: string;
};

export type AttendanceWrite = {
  memberId: string;
  name: string;
  phone: string;
  familyMember: string;
  present: boolean;
  verifiedBy: string;
  timestamp?: string;
};
