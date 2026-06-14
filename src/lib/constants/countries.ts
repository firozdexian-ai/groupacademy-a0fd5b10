// Country constants for Study Abroad features and phone input
export interface Country {
  code: string;
  name: string;
  flag: string;
}

export interface CountryWithPhone extends Country {
  phoneCode: string;
}

export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "ðŸ‡ºðŸ‡¸" },
  { code: "UK", name: "United Kingdom", flag: "ðŸ‡¬ðŸ‡§" },
  { code: "GB", name: "United Kingdom", flag: "ðŸ‡¬ðŸ‡§" },
  { code: "CA", name: "Canada", flag: "ðŸ‡¨ðŸ‡¦" },
  { code: "AU", name: "Australia", flag: "ðŸ‡¦ðŸ‡º" },
  { code: "DE", name: "Germany", flag: "ðŸ‡©ðŸ‡ª" },
  { code: "FR", name: "France", flag: "ðŸ‡«ðŸ‡·" },
  { code: "NL", name: "Netherlands", flag: "ðŸ‡³ðŸ‡±" },
  { code: "IE", name: "Ireland", flag: "ðŸ‡®ðŸ‡ª" },
  { code: "NZ", name: "New Zealand", flag: "ðŸ‡³ðŸ‡¿" },
  { code: "SG", name: "Singapore", flag: "ðŸ‡¸ðŸ‡¬" },
  { code: "JP", name: "Japan", flag: "ðŸ‡¯ðŸ‡µ" },
  { code: "KR", name: "South Korea", flag: "ðŸ‡°ðŸ‡·" },
  { code: "CN", name: "China", flag: "ðŸ‡¨ðŸ‡³" },
  { code: "SE", name: "Sweden", flag: "ðŸ‡¸ðŸ‡ª" },
  { code: "NO", name: "Norway", flag: "ðŸ‡³ðŸ‡´" },
  { code: "DK", name: "Denmark", flag: "ðŸ‡©ðŸ‡°" },
  { code: "FI", name: "Finland", flag: "ðŸ‡«ðŸ‡®" },
  { code: "CH", name: "Switzerland", flag: "ðŸ‡¨ðŸ‡­" },
  { code: "AT", name: "Austria", flag: "ðŸ‡¦ðŸ‡¹" },
  { code: "BE", name: "Belgium", flag: "ðŸ‡§ðŸ‡ª" },
  { code: "IT", name: "Italy", flag: "ðŸ‡®ðŸ‡¹" },
  { code: "ES", name: "Spain", flag: "ðŸ‡ªðŸ‡¸" },
  { code: "PT", name: "Portugal", flag: "ðŸ‡µðŸ‡¹" },
  { code: "PL", name: "Poland", flag: "ðŸ‡µðŸ‡±" },
  { code: "CZ", name: "Czech Republic", flag: "ðŸ‡¨ðŸ‡¿" },
  { code: "HU", name: "Hungary", flag: "ðŸ‡­ðŸ‡º" },
  { code: "MY", name: "Malaysia", flag: "ðŸ‡²ðŸ‡¾" },
  { code: "TH", name: "Thailand", flag: "ðŸ‡¹ðŸ‡­" },
  { code: "IN", name: "India", flag: "ðŸ‡®ðŸ‡³" },
  { code: "AE", name: "United Arab Emirates", flag: "ðŸ‡¦ðŸ‡ª" },
  { code: "SA", name: "Saudi Arabia", flag: "ðŸ‡¸ðŸ‡¦" },
  { code: "ZA", name: "South Africa", flag: "ðŸ‡¿ðŸ‡¦" },
  { code: "BR", name: "Brazil", flag: "ðŸ‡§ðŸ‡·" },
  { code: "MX", name: "Mexico", flag: "ðŸ‡²ðŸ‡½" },
  { code: "AR", name: "Argentina", flag: "ðŸ‡¦ðŸ‡·" },
  { code: "BD", name: "Bangladesh", flag: "ðŸ‡§ðŸ‡©" },
];

// Countries with phone codes for phone input component
export const COUNTRIES_WITH_PHONE: CountryWithPhone[] = [
  { code: "BD", name: "Bangladesh", flag: "ðŸ‡§ðŸ‡©", phoneCode: "+880" },
  { code: "IN", name: "India", flag: "ðŸ‡®ðŸ‡³", phoneCode: "+91" },
  { code: "AE", name: "United Arab Emirates", flag: "ðŸ‡¦ðŸ‡ª", phoneCode: "+971" },
  { code: "SA", name: "Saudi Arabia", flag: "ðŸ‡¸ðŸ‡¦", phoneCode: "+966" },
  { code: "US", name: "United States", flag: "ðŸ‡ºðŸ‡¸", phoneCode: "+1" },
  { code: "GB", name: "United Kingdom", flag: "ðŸ‡¬ðŸ‡§", phoneCode: "+44" },
  { code: "CA", name: "Canada", flag: "ðŸ‡¨ðŸ‡¦", phoneCode: "+1" },
  { code: "AU", name: "Australia", flag: "ðŸ‡¦ðŸ‡º", phoneCode: "+61" },
  { code: "DE", name: "Germany", flag: "ðŸ‡©ðŸ‡ª", phoneCode: "+49" },
  { code: "FR", name: "France", flag: "ðŸ‡«ðŸ‡·", phoneCode: "+33" },
  { code: "NL", name: "Netherlands", flag: "ðŸ‡³ðŸ‡±", phoneCode: "+31" },
  { code: "IE", name: "Ireland", flag: "ðŸ‡®ðŸ‡ª", phoneCode: "+353" },
  { code: "NZ", name: "New Zealand", flag: "ðŸ‡³ðŸ‡¿", phoneCode: "+64" },
  { code: "SG", name: "Singapore", flag: "ðŸ‡¸ðŸ‡¬", phoneCode: "+65" },
  { code: "JP", name: "Japan", flag: "ðŸ‡¯ðŸ‡µ", phoneCode: "+81" },
  { code: "KR", name: "South Korea", flag: "ðŸ‡°ðŸ‡·", phoneCode: "+82" },
  { code: "CN", name: "China", flag: "ðŸ‡¨ðŸ‡³", phoneCode: "+86" },
  { code: "MY", name: "Malaysia", flag: "ðŸ‡²ðŸ‡¾", phoneCode: "+60" },
  { code: "TH", name: "Thailand", flag: "ðŸ‡¹ðŸ‡­", phoneCode: "+66" },
  { code: "PH", name: "Philippines", flag: "ðŸ‡µðŸ‡­", phoneCode: "+63" },
  { code: "ID", name: "Indonesia", flag: "ðŸ‡®ðŸ‡©", phoneCode: "+62" },
  { code: "VN", name: "Vietnam", flag: "ðŸ‡»ðŸ‡³", phoneCode: "+84" },
  { code: "PK", name: "Pakistan", flag: "ðŸ‡µðŸ‡°", phoneCode: "+92" },
  { code: "NP", name: "Nepal", flag: "ðŸ‡³ðŸ‡µ", phoneCode: "+977" },
  { code: "LK", name: "Sri Lanka", flag: "ðŸ‡±ðŸ‡°", phoneCode: "+94" },
  { code: "QA", name: "Qatar", flag: "ðŸ‡¶ðŸ‡¦", phoneCode: "+974" },
  { code: "KW", name: "Kuwait", flag: "ðŸ‡°ðŸ‡¼", phoneCode: "+965" },
  { code: "BH", name: "Bahrain", flag: "ðŸ‡§ðŸ‡­", phoneCode: "+973" },
  { code: "OM", name: "Oman", flag: "ðŸ‡´ðŸ‡²", phoneCode: "+968" },
  { code: "SE", name: "Sweden", flag: "ðŸ‡¸ðŸ‡ª", phoneCode: "+46" },
  { code: "NO", name: "Norway", flag: "ðŸ‡³ðŸ‡´", phoneCode: "+47" },
  { code: "DK", name: "Denmark", flag: "ðŸ‡©ðŸ‡°", phoneCode: "+45" },
  { code: "FI", name: "Finland", flag: "ðŸ‡«ðŸ‡®", phoneCode: "+358" },
  { code: "CH", name: "Switzerland", flag: "ðŸ‡¨ðŸ‡­", phoneCode: "+41" },
  { code: "AT", name: "Austria", flag: "ðŸ‡¦ðŸ‡¹", phoneCode: "+43" },
  { code: "BE", name: "Belgium", flag: "ðŸ‡§ðŸ‡ª", phoneCode: "+32" },
  { code: "IT", name: "Italy", flag: "ðŸ‡®ðŸ‡¹", phoneCode: "+39" },
  { code: "ES", name: "Spain", flag: "ðŸ‡ªðŸ‡¸", phoneCode: "+34" },
  { code: "PT", name: "Portugal", flag: "ðŸ‡µðŸ‡¹", phoneCode: "+351" },
  { code: "PL", name: "Poland", flag: "ðŸ‡µðŸ‡±", phoneCode: "+48" },
  { code: "CZ", name: "Czech Republic", flag: "ðŸ‡¨ðŸ‡¿", phoneCode: "+420" },
  { code: "HU", name: "Hungary", flag: "ðŸ‡­ðŸ‡º", phoneCode: "+36" },
  { code: "ZA", name: "South Africa", flag: "ðŸ‡¿ðŸ‡¦", phoneCode: "+27" },
  { code: "NG", name: "Nigeria", flag: "ðŸ‡³ðŸ‡¬", phoneCode: "+234" },
  { code: "KE", name: "Kenya", flag: "ðŸ‡°ðŸ‡ª", phoneCode: "+254" },
  { code: "EG", name: "Egypt", flag: "ðŸ‡ªðŸ‡¬", phoneCode: "+20" },
  { code: "BR", name: "Brazil", flag: "ðŸ‡§ðŸ‡·", phoneCode: "+55" },
  { code: "MX", name: "Mexico", flag: "ðŸ‡²ðŸ‡½", phoneCode: "+52" },
  { code: "AR", name: "Argentina", flag: "ðŸ‡¦ðŸ‡·", phoneCode: "+54" },
  { code: "CO", name: "Colombia", flag: "ðŸ‡¨ðŸ‡´", phoneCode: "+57" },
  { code: "CL", name: "Chile", flag: "ðŸ‡¨ðŸ‡±", phoneCode: "+56" },
  { code: "TR", name: "Turkey", flag: "ðŸ‡¹ðŸ‡·", phoneCode: "+90" },
  { code: "RU", name: "Russia", flag: "ðŸ‡·ðŸ‡º", phoneCode: "+7" },
  { code: "UA", name: "Ukraine", flag: "ðŸ‡ºðŸ‡¦", phoneCode: "+380" },
];

export const getCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find((c) => c.code === code);
};

export const getCountryFlag = (code: string): string => {
  return getCountryByCode(code)?.flag || "ðŸŒ";
};

export const getCountryName = (code: string): string => {
  return getCountryByCode(code)?.name || code;
};

export const getCountryByPhoneCode = (phoneCode: string): CountryWithPhone | undefined => {
  return COUNTRIES_WITH_PHONE.find((c) => c.phoneCode === phoneCode);
};

