export interface AddressSuggestion {
  value: string;
  label?: string;
  sublabel?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export const LOCALITY_SUGGESTIONS: AddressSuggestion[] = [
  // Hosur & surroundings
  { value: "SIPCOT Phase 1", label: "SIPCOT Phase 1", sublabel: "Hosur, Tamil Nadu · 635126", city: "Hosur", state: "Tamil Nadu", pincode: "635126" },
  { value: "SIPCOT Phase 2", label: "SIPCOT Phase 2", sublabel: "Hosur, Tamil Nadu · 635126", city: "Hosur", state: "Tamil Nadu", pincode: "635126" },
  { value: "Bagalur Road", label: "Bagalur Road", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Rayakottai Road", label: "Rayakottai Road", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Mathigiri", label: "Mathigiri", sublabel: "Hosur, Tamil Nadu · 635110", city: "Hosur", state: "Tamil Nadu", pincode: "635110" },
  { value: "Mookandapalli", label: "Mookandapalli", sublabel: "Hosur, Tamil Nadu · 635126", city: "Hosur", state: "Tamil Nadu", pincode: "635126" },
  { value: "Avalapalli", label: "Avalapalli", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Moranapalli", label: "Moranapalli", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Zuzuvadi", label: "Zuzuvadi", sublabel: "Hosur, Tamil Nadu · 635124", city: "Hosur", state: "Tamil Nadu", pincode: "635124" },
  { value: "Denkanikottai Road", label: "Denkanikottai Road", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Thally Road", label: "Thally Road", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Hosur Town / Center", label: "Hosur Town / Center", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "MG Road / Railway Station", label: "MG Road / Railway Station", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Kamaraj Nagar", label: "Kamaraj Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Shanthi Nagar", label: "Shanthi Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Gandhi Nagar", label: "Gandhi Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Appavu Nagar", label: "Appavu Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Bharathidasan Nagar", label: "Bharathidasan Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Bathalapalli", label: "Bathalapalli", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Poonapalli", label: "Poonapalli", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Bedrapalli", label: "Bedrapalli", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Chennathur", label: "Chennathur", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Alasanatham", label: "Alasanatham", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Seetharam Nagar", label: "Seetharam Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "NGGOs Colony", label: "NGGOs Colony", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Nallur", label: "Nallur", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Dinnur", label: "Dinnur", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Ram Nagar", label: "Ram Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Annamalai Nagar", label: "Annamalai Nagar", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Onnalvadi", label: "Onnalvadi", sublabel: "Hosur, Tamil Nadu · 635109", city: "Hosur", state: "Tamil Nadu", pincode: "635109" },
  { value: "Kelamangalam", label: "Kelamangalam", sublabel: "Krishnagiri Dist, Tamil Nadu · 635117", city: "Krishnagiri", state: "Tamil Nadu", pincode: "635117" },
  { value: "Denkanikottai", label: "Denkanikottai", sublabel: "Krishnagiri Dist, Tamil Nadu · 635107", city: "Krishnagiri", state: "Tamil Nadu", pincode: "635107" },
  { value: "Thally", label: "Thally", sublabel: "Krishnagiri Dist, Tamil Nadu · 635118", city: "Krishnagiri", state: "Tamil Nadu", pincode: "635118" },
  { value: "Berigai", label: "Berigai", sublabel: "Krishnagiri Dist, Tamil Nadu · 635104", city: "Krishnagiri", state: "Tamil Nadu", pincode: "635104" },
  { value: "Attibele", label: "Attibele", sublabel: "Bengaluru Border, Karnataka · 562107", city: "Bengaluru", state: "Karnataka", pincode: "562107" },
  { value: "Chandapura", label: "Chandapura", sublabel: "Bengaluru, Karnataka · 560099", city: "Bengaluru", state: "Karnataka", pincode: "560099" },
  { value: "Anekal", label: "Anekal", sublabel: "Bengaluru, Karnataka · 562106", city: "Bengaluru", state: "Karnataka", pincode: "562106" },

  // Bengaluru key localities
  { value: "Indiranagar", label: "Indiranagar", sublabel: "Bengaluru, Karnataka · 560038", city: "Bengaluru", state: "Karnataka", pincode: "560038" },
  { value: "Koramangala", label: "Koramangala", sublabel: "Bengaluru, Karnataka · 560034", city: "Bengaluru", state: "Karnataka", pincode: "560034" },
  { value: "Whitefield", label: "Whitefield", sublabel: "Bengaluru, Karnataka · 560066", city: "Bengaluru", state: "Karnataka", pincode: "560066" },
  { value: "HSR Layout", label: "HSR Layout", sublabel: "Bengaluru, Karnataka · 560102", city: "Bengaluru", state: "Karnataka", pincode: "560102" },
  { value: "Electronic City Phase 1", label: "Electronic City Phase 1", sublabel: "Bengaluru, Karnataka · 560100", city: "Bengaluru", state: "Karnataka", pincode: "560100" },
  { value: "Electronic City Phase 2", label: "Electronic City Phase 2", sublabel: "Bengaluru, Karnataka · 560100", city: "Bengaluru", state: "Karnataka", pincode: "560100" },
  { value: "BTM Layout", label: "BTM Layout", sublabel: "Bengaluru, Karnataka · 560076", city: "Bengaluru", state: "Karnataka", pincode: "560076" },
  { value: "Jayanagar", label: "Jayanagar", sublabel: "Bengaluru, Karnataka · 560011", city: "Bengaluru", state: "Karnataka", pincode: "560011" },
  { value: "JP Nagar", label: "JP Nagar", sublabel: "Bengaluru, Karnataka · 560078", city: "Bengaluru", state: "Karnataka", pincode: "560078" },
  { value: "Marathahalli", label: "Marathahalli", sublabel: "Bengaluru, Karnataka · 560037", city: "Bengaluru", state: "Karnataka", pincode: "560037" },
  { value: "Bellandur", label: "Bellandur", sublabel: "Bengaluru, Karnataka · 560103", city: "Bengaluru", state: "Karnataka", pincode: "560103" },
  { value: "Sarjapur Road", label: "Sarjapur Road", sublabel: "Bengaluru, Karnataka · 560035", city: "Bengaluru", state: "Karnataka", pincode: "560035" },
  { value: "Bannerghatta Road", label: "Bannerghatta Road", sublabel: "Bengaluru, Karnataka · 560076", city: "Bengaluru", state: "Karnataka", pincode: "560076" },
  { value: "Hebbal", label: "Hebbal", sublabel: "Bengaluru, Karnataka · 560092", city: "Bengaluru", state: "Karnataka", pincode: "560092" },
  { value: "Yelahanka", label: "Yelahanka", sublabel: "Bengaluru, Karnataka · 560064", city: "Bengaluru", state: "Karnataka", pincode: "560064" },
  { value: "Malleshwaram", label: "Malleshwaram", sublabel: "Bengaluru, Karnataka · 560003", city: "Bengaluru", state: "Karnataka", pincode: "560003" },
  { value: "Rajajinagar", label: "Rajajinagar", sublabel: "Bengaluru, Karnataka · 560010", city: "Bengaluru", state: "Karnataka", pincode: "560010" },
  { value: "Banashankari", label: "Banashankari", sublabel: "Bengaluru, Karnataka · 560085", city: "Bengaluru", state: "Karnataka", pincode: "560085" },
  { value: "Basavanagudi", label: "Basavanagudi", sublabel: "Bengaluru, Karnataka · 560004", city: "Bengaluru", state: "Karnataka", pincode: "560004" },

  // Chennai key localities
  { value: "T. Nagar", label: "T. Nagar", sublabel: "Chennai, Tamil Nadu · 600017", city: "Chennai", state: "Tamil Nadu", pincode: "600017" },
  { value: "Anna Nagar", label: "Anna Nagar", sublabel: "Chennai, Tamil Nadu · 600040", city: "Chennai", state: "Tamil Nadu", pincode: "600040" },
  { value: "Adyar", label: "Adyar", sublabel: "Chennai, Tamil Nadu · 600020", city: "Chennai", state: "Tamil Nadu", pincode: "600020" },
  { value: "Velachery", label: "Velachery", sublabel: "Chennai, Tamil Nadu · 600042", city: "Chennai", state: "Tamil Nadu", pincode: "600042" },
  { value: "Mylapore", label: "Mylapore", sublabel: "Chennai, Tamil Nadu · 600004", city: "Chennai", state: "Tamil Nadu", pincode: "600004" },
  { value: "Guindy", label: "Guindy", sublabel: "Chennai, Tamil Nadu · 600032", city: "Chennai", state: "Tamil Nadu", pincode: "600032" },
  { value: "Tambaram", label: "Tambaram", sublabel: "Chennai, Tamil Nadu · 600045", city: "Chennai", state: "Tamil Nadu", pincode: "600045" },
  { value: "OMR / Thoraipakkam", label: "OMR / Thoraipakkam", sublabel: "Chennai, Tamil Nadu · 600097", city: "Chennai", state: "Tamil Nadu", pincode: "600097" },
  { value: "Porur", label: "Porur", sublabel: "Chennai, Tamil Nadu · 600116", city: "Chennai", state: "Tamil Nadu", pincode: "600116" },

  // Other major cities
  { value: "Old Pet", label: "Old Pet", sublabel: "Krishnagiri, Tamil Nadu · 635001", city: "Krishnagiri", state: "Tamil Nadu", pincode: "635001" },
  { value: "Gandhipuram", label: "Gandhipuram", sublabel: "Coimbatore, Tamil Nadu · 641012", city: "Coimbatore", state: "Tamil Nadu", pincode: "641012" },
  { value: "RS Puram", label: "RS Puram", sublabel: "Coimbatore, Tamil Nadu · 641002", city: "Coimbatore", state: "Tamil Nadu", pincode: "641002" },
  { value: "Peelamedu", label: "Peelamedu", sublabel: "Coimbatore, Tamil Nadu · 641004", city: "Coimbatore", state: "Tamil Nadu", pincode: "641004" },
  { value: "Fairlands", label: "Fairlands", sublabel: "Salem, Tamil Nadu · 636016", city: "Salem", state: "Tamil Nadu", pincode: "636016" },
  { value: "New Bus Stand", label: "New Bus Stand", sublabel: "Salem, Tamil Nadu · 636004", city: "Salem", state: "Tamil Nadu", pincode: "636004" },
  { value: "Thillai Nagar", label: "Thillai Nagar", sublabel: "Tiruchirappalli, Tamil Nadu · 620018", city: "Tiruchirappalli", state: "Tamil Nadu", pincode: "620018" },
  { value: "KK Nagar", label: "KK Nagar", sublabel: "Madurai, Tamil Nadu · 625020", city: "Madurai", state: "Tamil Nadu", pincode: "625020" },
  { value: "HITEC City", label: "HITEC City", sublabel: "Hyderabad, Telangana · 500081", city: "Hyderabad", state: "Telangana", pincode: "500081" },
  { value: "Gachibowli", label: "Gachibowli", sublabel: "Hyderabad, Telangana · 500032", city: "Hyderabad", state: "Telangana", pincode: "500032" },
  { value: "Bandra West", label: "Bandra West", sublabel: "Mumbai, Maharashtra · 400050", city: "Mumbai", state: "Maharashtra", pincode: "400050" },
  { value: "Connaught Place", label: "Connaught Place", sublabel: "New Delhi, Delhi · 110001", city: "New Delhi", state: "Delhi", pincode: "110001" },
];

export const CITY_SUGGESTIONS: AddressSuggestion[] = [
  { value: "Hosur", label: "Hosur", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Bengaluru", label: "Bengaluru (Bangalore)", sublabel: "Karnataka", state: "Karnataka" },
  { value: "Krishnagiri", label: "Krishnagiri", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Chennai", label: "Chennai", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Coimbatore", label: "Coimbatore", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Salem", label: "Salem", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Dharmapuri", label: "Dharmapuri", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Mysuru", label: "Mysuru (Mysore)", sublabel: "Karnataka", state: "Karnataka" },
  { value: "Hyderabad", label: "Hyderabad", sublabel: "Telangana", state: "Telangana" },
  { value: "Tiruchirappalli", label: "Tiruchirappalli (Trichy)", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Madurai", label: "Madurai", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Tirunelveli", label: "Tirunelveli", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Vellore", label: "Vellore", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Tirupathur", label: "Tirupathur", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Erode", label: "Erode", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Tiruppur", label: "Tiruppur", sublabel: "Tamil Nadu", state: "Tamil Nadu" },
  { value: "Mangaluru", label: "Mangaluru (Mangalore)", sublabel: "Karnataka", state: "Karnataka" },
  { value: "Kochi", label: "Kochi (Cochin)", sublabel: "Kerala", state: "Kerala" },
  { value: "Thiruvananthapuram", label: "Thiruvananthapuram (Trivandrum)", sublabel: "Kerala", state: "Kerala" },
  { value: "Kozhikode", label: "Kozhikode (Calicut)", sublabel: "Kerala", state: "Kerala" },
  { value: "Visakhapatnam", label: "Visakhapatnam (Vizag)", sublabel: "Andhra Pradesh", state: "Andhra Pradesh" },
  { value: "Vijayawada", label: "Vijayawada", sublabel: "Andhra Pradesh", state: "Andhra Pradesh" },
  { value: "Mumbai", label: "Mumbai", sublabel: "Maharashtra", state: "Maharashtra" },
  { value: "Pune", label: "Pune", sublabel: "Maharashtra", state: "Maharashtra" },
  { value: "Nagpur", label: "Nagpur", sublabel: "Maharashtra", state: "Maharashtra" },
  { value: "Nashik", label: "Nashik", sublabel: "Maharashtra", state: "Maharashtra" },
  { value: "Delhi", label: "Delhi", sublabel: "Delhi (NCT)", state: "Delhi" },
  { value: "New Delhi", label: "New Delhi", sublabel: "Delhi", state: "Delhi" },
  { value: "Noida", label: "Noida", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Greater Noida", label: "Greater Noida", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Gurugram", label: "Gurugram (Gurgaon)", sublabel: "Haryana", state: "Haryana" },
  { value: "Faridabad", label: "Faridabad", sublabel: "Haryana", state: "Haryana" },
  { value: "Ghaziabad", label: "Ghaziabad", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Kolkata", label: "Kolkata", sublabel: "West Bengal", state: "West Bengal" },
  { value: "Ahmedabad", label: "Ahmedabad", sublabel: "Gujarat", state: "Gujarat" },
  { value: "Surat", label: "Surat", sublabel: "Gujarat", state: "Gujarat" },
  { value: "Vadodara", label: "Vadodara", sublabel: "Gujarat", state: "Gujarat" },
  { value: "Rajkot", label: "Rajkot", sublabel: "Gujarat", state: "Gujarat" },
  { value: "Jaipur", label: "Jaipur", sublabel: "Rajasthan", state: "Rajasthan" },
  { value: "Jodhpur", label: "Jodhpur", sublabel: "Rajasthan", state: "Rajasthan" },
  { value: "Udaipur", label: "Udaipur", sublabel: "Rajasthan", state: "Rajasthan" },
  { value: "Lucknow", label: "Lucknow", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Kanpur", label: "Kanpur", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Varanasi", label: "Varanasi", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Agra", label: "Agra", sublabel: "Uttar Pradesh", state: "Uttar Pradesh" },
  { value: "Chandigarh", label: "Chandigarh", sublabel: "Chandigarh", state: "Chandigarh" },
  { value: "Ludhiana", label: "Ludhiana", sublabel: "Punjab", state: "Punjab" },
  { value: "Amritsar", label: "Amritsar", sublabel: "Punjab", state: "Punjab" },
  { value: "Bhopal", label: "Bhopal", sublabel: "Madhya Pradesh", state: "Madhya Pradesh" },
  { value: "Indore", label: "Indore", sublabel: "Madhya Pradesh", state: "Madhya Pradesh" },
  { value: "Patna", label: "Patna", sublabel: "Bihar", state: "Bihar" },
  { value: "Ranchi", label: "Ranchi", sublabel: "Jharkhand", state: "Jharkhand" },
  { value: "Bhubaneswar", label: "Bhubaneswar", sublabel: "Odisha", state: "Odisha" },
  { value: "Guwahati", label: "Guwahati", sublabel: "Assam", state: "Assam" },
  { value: "Raipur", label: "Raipur", sublabel: "Chhattisgarh", state: "Chhattisgarh" },
  { value: "Dehradun", label: "Dehradun", sublabel: "Uttarakhand", state: "Uttarakhand" },
  { value: "Shimla", label: "Shimla", sublabel: "Himachal Pradesh", state: "Himachal Pradesh" },
  { value: "Panaji", label: "Panaji (Goa)", sublabel: "Goa", state: "Goa" },
];

export const STATE_SUGGESTIONS: AddressSuggestion[] = [
  { value: "Tamil Nadu", label: "Tamil Nadu", sublabel: "State" },
  { value: "Karnataka", label: "Karnataka", sublabel: "State" },
  { value: "Andhra Pradesh", label: "Andhra Pradesh", sublabel: "State" },
  { value: "Telangana", label: "Telangana", sublabel: "State" },
  { value: "Kerala", label: "Kerala", sublabel: "State" },
  { value: "Maharashtra", label: "Maharashtra", sublabel: "State" },
  { value: "Gujarat", label: "Gujarat", sublabel: "State" },
  { value: "Rajasthan", label: "Rajasthan", sublabel: "State" },
  { value: "Uttar Pradesh", label: "Uttar Pradesh", sublabel: "State" },
  { value: "Madhya Pradesh", label: "Madhya Pradesh", sublabel: "State" },
  { value: "West Bengal", label: "West Bengal", sublabel: "State" },
  { value: "Bihar", label: "Bihar", sublabel: "State" },
  { value: "Odisha", label: "Odisha", sublabel: "State" },
  { value: "Punjab", label: "Punjab", sublabel: "State" },
  { value: "Haryana", label: "Haryana", sublabel: "State" },
  { value: "Delhi", label: "Delhi (National Capital Territory)", sublabel: "Union Territory" },
  { value: "Goa", label: "Goa", sublabel: "State" },
  { value: "Assam", label: "Assam", sublabel: "State" },
  { value: "Uttarakhand", label: "Uttarakhand", sublabel: "State" },
  { value: "Himachal Pradesh", label: "Himachal Pradesh", sublabel: "State" },
  { value: "Jharkhand", label: "Jharkhand", sublabel: "State" },
  { value: "Chhattisgarh", label: "Chhattisgarh", sublabel: "State" },
  { value: "Jammu and Kashmir", label: "Jammu and Kashmir", sublabel: "Union Territory" },
  { value: "Puducherry", label: "Puducherry", sublabel: "Union Territory" },
  { value: "Chandigarh", label: "Chandigarh", sublabel: "Union Territory" },
  { value: "Ladakh", label: "Ladakh", sublabel: "Union Territory" },
  { value: "Tripura", label: "Tripura", sublabel: "State" },
  { value: "Meghalaya", label: "Meghalaya", sublabel: "State" },
  { value: "Manipur", label: "Manipur", sublabel: "State" },
  { value: "Nagaland", label: "Nagaland", sublabel: "State" },
  { value: "Arunachal Pradesh", label: "Arunachal Pradesh", sublabel: "State" },
  { value: "Mizoram", label: "Mizoram", sublabel: "State" },
  { value: "Sikkim", label: "Sikkim", sublabel: "State" },
  { value: "Andaman and Nicobar Islands", label: "Andaman and Nicobar Islands", sublabel: "Union Territory" },
  { value: "Dadra and Nagar Haveli and Daman and Diu", label: "Dadra and Nagar Haveli and Daman and Diu", sublabel: "Union Territory" },
  { value: "Lakshadweep", label: "Lakshadweep", sublabel: "Union Territory" },
];

export const PINCODE_SUGGESTIONS: AddressSuggestion[] = [
  // Hosur & Krishnagiri
  { value: "635109", label: "635109", sublabel: "Hosur HO · Gandhi Nagar · SIPCOT Phase 1", city: "Hosur", state: "Tamil Nadu" },
  { value: "635126", label: "635126", sublabel: "SIPCOT Phase 2 · Mookandapalli, Hosur", city: "Hosur", state: "Tamil Nadu" },
  { value: "635110", label: "635110", sublabel: "Mathigiri, Hosur", city: "Hosur", state: "Tamil Nadu" },
  { value: "635103", label: "635103", sublabel: "Bagalur, Hosur", city: "Hosur", state: "Tamil Nadu" },
  { value: "635124", label: "635124", sublabel: "Zuzuvadi, Hosur", city: "Hosur", state: "Tamil Nadu" },
  { value: "635117", label: "635117", sublabel: "Kelamangalam, Krishnagiri Dist", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635107", label: "635107", sublabel: "Denkanikottai, Krishnagiri Dist", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635118", label: "635118", sublabel: "Thally, Krishnagiri Dist", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635104", label: "635104", sublabel: "Berigai, Krishnagiri Dist", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635115", label: "635115", sublabel: "Kaveripattinam, Krishnagiri Dist", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635001", label: "635001", sublabel: "Krishnagiri Town", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635002", label: "635002", sublabel: "Krishnagiri Collectorate", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635112", label: "635112", sublabel: "Rayakottai, Krishnagiri", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635111", label: "635111", sublabel: "Pochampalli, Krishnagiri", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635201", label: "635201", sublabel: "Barugur, Krishnagiri", city: "Krishnagiri", state: "Tamil Nadu" },
  { value: "635851", label: "635851", sublabel: "Vaniyambadi", city: "Tirupathur", state: "Tamil Nadu" },
  { value: "635601", label: "635601", sublabel: "Tirupathur", city: "Tirupathur", state: "Tamil Nadu" },
  { value: "636701", label: "636701", sublabel: "Dharmapuri", city: "Dharmapuri", state: "Tamil Nadu" },
  { value: "636001", label: "636001", sublabel: "Salem Head Post Office", city: "Salem", state: "Tamil Nadu" },
  { value: "641001", label: "641001", sublabel: "Coimbatore Head Post Office", city: "Coimbatore", state: "Tamil Nadu" },

  // Chennai
  { value: "600001", label: "600001", sublabel: "Chennai GPO, George Town", city: "Chennai", state: "Tamil Nadu" },
  { value: "600017", label: "600017", sublabel: "T. Nagar, Chennai", city: "Chennai", state: "Tamil Nadu" },
  { value: "600028", label: "600028", sublabel: "Mylapore / Raja Annamalaipuram, Chennai", city: "Chennai", state: "Tamil Nadu" },
  { value: "600042", label: "600042", sublabel: "Velachery, Chennai", city: "Chennai", state: "Tamil Nadu" },
  { value: "600096", label: "600096", sublabel: "Perungudi / OMR, Chennai", city: "Chennai", state: "Tamil Nadu" },

  // Bengaluru
  { value: "560100", label: "560100", sublabel: "Electronic City, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560034", label: "560034", sublabel: "Koramangala, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560038", label: "560038", sublabel: "Indiranagar, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560102", label: "560102", sublabel: "HSR Layout, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560068", label: "560068", sublabel: "Bommanahalli, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560103", label: "560103", sublabel: "Bellandur, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560066", label: "560066", sublabel: "Whitefield, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560001", label: "560001", sublabel: "Bengaluru GPO / MG Road", city: "Bengaluru", state: "Karnataka" },
  { value: "560004", label: "560004", sublabel: "Basavanagudi, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560011", label: "560011", sublabel: "Jayanagar, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560076", label: "560076", sublabel: "BTM Layout, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560037", label: "560037", sublabel: "Marathahalli, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560092", label: "560092", sublabel: "Hebbal, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560064", label: "560064", sublabel: "Yelahanka, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560003", label: "560003", sublabel: "Malleshwaram, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560010", label: "560010", sublabel: "Rajajinagar, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560085", label: "560085", sublabel: "Banashankari, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "560078", label: "560078", sublabel: "JP Nagar, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "562106", label: "562106", sublabel: "Anekal, Bengaluru", city: "Bengaluru", state: "Karnataka" },
  { value: "562107", label: "562107", sublabel: "Attibele, Bengaluru Border", city: "Bengaluru", state: "Karnataka" },
  { value: "560099", label: "560099", sublabel: "Chandapura, Bengaluru", city: "Bengaluru", state: "Karnataka" },

  // Other metros
  { value: "500081", label: "500081", sublabel: "HITEC City / Madhapur, Hyderabad", city: "Hyderabad", state: "Telangana" },
  { value: "400050", label: "400050", sublabel: "Bandra West, Mumbai", city: "Mumbai", state: "Maharashtra" },
  { value: "110001", label: "110001", sublabel: "Connaught Place, New Delhi", city: "New Delhi", state: "Delhi" },
];

/**
 * Filter address suggestions.
 * Strictly adheres to the requirement:
 * Returns NO options if query has 0 non-whitespace characters (only shows on 1+ character).
 */
export function filterAddressSuggestions(
  query: string,
  suggestions: AddressSuggestion[],
  maxResults = 8
): AddressSuggestion[] {
  const q = (query || "").trim().toLowerCase();
  if (q.length < 1) {
    return [];
  }

  const results: AddressSuggestion[] = [];
  for (const item of suggestions) {
    const valMatch = item.value.toLowerCase().includes(q);
    const labelMatch = item.label ? item.label.toLowerCase().includes(q) : false;
    const subMatch = item.sublabel ? item.sublabel.toLowerCase().includes(q) : false;
    const cityMatch = item.city ? item.city.toLowerCase().includes(q) : false;

    if (valMatch || labelMatch || subMatch || cityMatch) {
      results.push(item);
      if (results.length >= maxResults) break;
    }
  }

  return results;
}
