export interface City {
  name: string;
  pincode: string;
}

export interface State {
  name: string;
  cities: City[];
}

export const indiaStates: State[] = [
  {
    name: "Andhra Pradesh",
    cities: [
      { name: "Visakhapatnam", pincode: "530001" },
      { name: "Vijayawada", pincode: "520001" },
      { name: "Guntur", pincode: "522001" },
      { name: "Tirupati", pincode: "517501" },
      { name: "Nellore", pincode: "524001" },
    ],
  },
  {
    name: "Bihar",
    cities: [
      { name: "Patna", pincode: "800001" },
      { name: "Gaya", pincode: "823001" },
      { name: "Muzaffarpur", pincode: "842001" },
      { name: "Bhagalpur", pincode: "812001" },
      { name: "Darbhanga", pincode: "846004" },
    ],
  },
  {
    name: "Chhattisgarh",
    cities: [
      { name: "Raipur", pincode: "492001" },
      { name: "Bhilai", pincode: "490001" },
      { name: "Bilaspur", pincode: "495001" },
      { name: "Durg", pincode: "491001" },
      { name: "Korba", pincode: "495677" },
    ],
  },
  {
    name: "Delhi",
    cities: [
      { name: "New Delhi", pincode: "110001" },
      { name: "North Delhi", pincode: "110002" },
      { name: "South Delhi", pincode: "110001" },
      { name: "East Delhi", pincode: "110006" },
      { name: "West Delhi", pincode: "110001" },
    ],
  },
  {
    name: "Gujarat",
    cities: [
      { name: "Ahmedabad", pincode: "380001" },
      { name: "Surat", pincode: "395001" },
      { name: "Vadodara", pincode: "390001" },
      { name: "Rajkot", pincode: "360001" },
      { name: "Gandhinagar", pincode: "382010" },
      { name: "Bhavnagar", pincode: "364001" },
      { name: "Jamnagar", pincode: "361001" },
      { name: "Junagadh", pincode: "362001" },
      { name: "Anand", pincode: "388001" },
      { name: "Morbi", pincode: "363641" },
    ],
  },
  {
    name: "Haryana",
    cities: [
      { name: "Faridabad", pincode: "121001" },
      { name: "Gurgaon", pincode: "122001" },
      { name: "Panipat", pincode: "132103" },
      { name: "Karnal", pincode: "132001" },
      { name: "Rohtak", pincode: "124001" },
      { name: "Sonipat", pincode: "131001" },
    ],
  },
  {
    name: "Himachal Pradesh",
    cities: [
      { name: "Shimla", pincode: "171001" },
      { name: "Mandi", pincode: "175001" },
      { name: "Solan", pincode: "173212" },
      { name: "Dharamshala", pincode: "176215" },
      { name: "Kullu", pincode: "175101" },
    ],
  },
  {
    name: "Jharkhand",
    cities: [
      { name: "Ranchi", pincode: "834001" },
      { name: "Jamshedpur", pincode: "831001" },
      { name: "Dhanbad", pincode: "826001" },
      { name: "Bokaro", pincode: "827001" },
      { name: "Hazaribagh", pincode: "825301" },
    ],
  },
  {
    name: "Karnataka",
    cities: [
      { name: "Bangalore", pincode: "560001" },
      { name: "Mysore", pincode: "570001" },
      { name: "Mangalore", pincode: "575001" },
      { name: "Hubli", pincode: "580001" },
      { name: "Belgaum", pincode: "590001" },
      { name: "Davangere", pincode: "577001" },
      { name: "Bellary", pincode: "583101" },
    ],
  },
  {
    name: "Kerala",
    cities: [
      { name: "Thiruvananthapuram", pincode: "695001" },
      { name: "Kochi", pincode: "682001" },
      { name: "Kozhikode", pincode: "673001" },
      { name: "Thrissur", pincode: "680001" },
      { name: "Kollam", pincode: "691001" },
    ],
  },
  {
    name: "Madhya Pradesh",
    cities: [
      { name: "Bhopal", pincode: "462001" },
      { name: "Indore", pincode: "452001" },
      { name: "Jabalpur", pincode: "482001" },
      { name: "Gwalior", pincode: "474001" },
      { name: "Ujjain", pincode: "456001" },
    ],
  },
  {
    name: "Maharashtra",
    cities: [
      { name: "Mumbai", pincode: "400001" },
      { name: "Pune", pincode: "411001" },
      { name: "Nagpur", pincode: "440001" },
      { name: "Nashik", pincode: "422001" },
      { name: "Aurangabad", pincode: "431001" },
      { name: "Thane", pincode: "400601" },
      { name: "Solapur", pincode: "413001" },
      { name: "Kolhapur", pincode: "416001" },
      { name: "Navi Mumbai", pincode: "400703" },
      { name: "Sangli", pincode: "416410" },
    ],
  },
  {
    name: "Odisha",
    cities: [
      { name: "Bhubaneswar", pincode: "751001" },
      { name: "Cuttack", pincode: "753001" },
      { name: "Rourkela", pincode: "769001" },
      { name: "Berhampur", pincode: "760001" },
      { name: "Sambalpur", pincode: "768001" },
    ],
  },
  {
    name: "Punjab",
    cities: [
      { name: "Ludhiana", pincode: "141001" },
      { name: "Amritsar", pincode: "143001" },
      { name: "Jalandhar", pincode: "144001" },
      { name: "Patiala", pincode: "147001" },
      { name: "Bathinda", pincode: "151001" },
      { name: "Mohali", pincode: "140301" },
    ],
  },
  {
    name: "Rajasthan",
    cities: [
      { name: "Jaipur", pincode: "302001" },
      { name: "Jodhpur", pincode: "342001" },
      { name: "Udaipur", pincode: "313001" },
      { name: "Kota", pincode: "324001" },
      { name: "Bikaner", pincode: "334001" },
      { name: "Ajmer", pincode: "305001" },
      { name: "Pilani", pincode: "333031" },
    ],
  },
  {
    name: "Tamil Nadu",
    cities: [
      { name: "Chennai", pincode: "600001" },
      { name: "Coimbatore", pincode: "641001" },
      { name: "Madurai", pincode: "625001" },
      { name: "Tiruchirappalli", pincode: "620001" },
      { name: "Salem", pincode: "636001" },
      { name: "Tirunelveli", pincode: "627001" },
      { name: "Vellore", pincode: "632001" },
    ],
  },
  {
    name: "Telangana",
    cities: [
      { name: "Hyderabad", pincode: "500001" },
      { name: "Warangal", pincode: "506001" },
      { name: "Karimnagar", pincode: "505001" },
      { name: "Khammam", pincode: "507001" },
      { name: "Nizamabad", pincode: "503001" },
    ],
  },
  {
    name: "Uttar Pradesh",
    cities: [
      { name: "Lucknow", pincode: "226001" },
      { name: "Kanpur", pincode: "208001" },
      { name: "Varanasi", pincode: "221001" },
      { name: "Agra", pincode: "282001" },
      { name: "Meerut", pincode: "250001" },
      { name: "Allahabad", pincode: "211001" },
      { name: "Bareilly", pincode: "243001" },
      { name: "Aligarh", pincode: "202001" },
      { name: "Moradabad", pincode: "244001" },
      { name: "Saharanpur", pincode: "247001" },
    ],
  },
  {
    name: "Uttarakhand",
    cities: [
      { name: "Dehradun", pincode: "248001" },
      { name: "Haridwar", pincode: "249401" },
      { name: "Roorkee", pincode: "247667" },
      { name: "Rishikesh", pincode: "249201" },
      { name: "Kashipur", pincode: "244713" },
    ],
  },
  {
    name: "West Bengal",
    cities: [
      { name: "Kolkata", pincode: "700001" },
      { name: "Howrah", pincode: "711101" },
      { name: "Durgapur", pincode: "713201" },
      { name: "Asansol", pincode: "713301" },
      { name: "Siliguri", pincode: "734001" },
      { name: "Malda", pincode: "732101" },
      { name: "Kharagpur", pincode: "721301" },
    ],
  },
];

export const getStateNames = (): string[] => {
  return indiaStates.map((state) => state.name);
};

export const getCitiesByState = (stateName: string): City[] => {
  const state = indiaStates.find((s) => s.name === stateName);
  return state?.cities || [];
};
