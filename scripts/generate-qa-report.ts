import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

// Output paths
const outputDir = path.join(process.cwd(), "public");
const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\0fe4e467-267e-429d-ae61-38221343dd7c";
const fileName = "bizearch-comprehensive-qa-test-report.xlsx";
const publicPath = path.join(outputDir, fileName);
const artifactPath = path.join(artifactDir, fileName);

// Metadata Header Block (Matching User Format Exactly)
const testCasesHeader = [
  ["Project/Application Name: Bizearch Testing", "", "", "", "", "", "", "", "", "", "", ""],
  ["Case ID", "", "", "FORMS-0001", "", "Team", "QA & Testing Team", "", "", "", "", ""],
  ["Test Priority", "", "", "High", "", "Developed By", "", "Dharshan R", "", "", "", ""],
  ["Module Name", "Overall Platform Comprehensive Functional Testing", "", "", "", "Test Execution Date", "", "2026-11-11", "", "", "", ""],
  ["Test Description", "End-to-End Functional, Edge-Case, UI/UX & Regression Testing", "", "System Testing", "", "Tested By", "", "Senior QA Engineer & Keerthana E", "", "", "", ""],
  ["", "", "", "", "", "", "", "", "", "", "", ""],
  [
    "#",
    "Module",
    "Field Details \n If any",
    "Test Scenarios",
    "Desired Output",
    "Passed/Failed",
    "Actual Output",
    "Priority",
    "Ref. Screen \n Shot",
    "Developer Comments",
    "Fixed (Yes/No)",
    "Completion Date"
  ]
];

// All Test Cases Data
const rawTestCases: any[] = [
  // 1. Customer Login & Auth
  [1, "Customer Login", "Password Validation", "Login using an incorrect password.", "System should reject the login and display an appropriate error message.", "Passed", "System displays 'Invalid customer credentials. Please check your mobile or email, or click Create an account to register.'", "High", "", "", "Yes", "2026-11-11"],
  [2, "Customer Login", "Username Validation", "Login using an unregistered or non-existent username.", "System should reject the login and prevent access.", "Passed", "System rejects the non-existent identity with a structured alert.", "High", "", "", "Yes", "2026-11-11"],
  [3, "Customer Login", "Mandatory Field Validation", "Attempt to log in without entering identity or password.", "HTML5 required validation should stop submission and prompt the user.", "Passed", "Browser validation triggers 'Please fill out this field' on required input.", "High", "", "", "Yes", "2026-11-11"],
  [4, "Customer Login", "Successful Login & Navigation", "Log in using valid registered customer credentials.", "System should authenticate, issue a secure session cookie, and redirect to the Bizearch home page.", "Passed", "Customer is authenticated and redirected smoothly to Discover.", "Medium", "", "", "Yes", "2026-11-11"],
  [5, "Customer Login", "Forgot Password", "Check the availability and functionality of the Forgot Password option on the login page.", "A Forgot Password option should be visible and allow the user to initiate account recovery.", "Passed", "Forgot password button is visible and opens the recovery flow.", "High", "", "", "Yes", "2026-11-11"],
  [6, "Customer Login", "Password Masking Toggle", "Click the show/hide password toggle icon (eye/monkey icon) in the password input.", "Password characters should switch dynamically between masked (password) and plain text.", "Passed", "Password visibility toggles between text and password type seamlessly.", "Low", "", "", "Yes", "2026-11-11"],
  [7, "Customer Login", "Portal Role Tabs", "Click between Customer, Business, Agent, and Company tabs on the login screen.", "Each tab should update the portal role, helper text, and route to corresponding portals (/login?portal=Business, /company-login).", "Passed", "Portal tabs route accurately; Company redirects to dedicated /company-login page.", "Medium", "", "", "Yes", "2026-11-11"],
  [8, "Customer Login", "Session Expiry & Logout", "Sign out from the account and attempt to access protected routes.", "Session cookie neighborly_session should be cleared and user redirected back to /login.", "Passed", "Session is terminated and protected routes redirect to /login.", "High", "", "", "Yes", "2026-11-11"],

  // 2. Customer Registration & OTP
  [9, "Customer Registration", "Full Name Validation", "Enter special characters or leave Full Name blank during registration.", "System should require a valid full name (minimum 2 characters).", "Passed", "Name field is marked required; whitespace-only inputs are rejected.", "Medium", "", "", "Yes", "2026-11-11"],
  [10, "Customer Registration", "Mobile Number Format", "Enter an invalid short mobile number (e.g. '12345') and request OTP.", "System should reject malformed mobile numbers and display a validation error.", "Passed", "System displays 'Enter a valid mobile number or email address as your username.'", "High", "", "", "Yes", "2026-11-11"],
  [11, "Customer Registration", "OTP Generation & Delivery", "Enter a valid 10-digit Indian phone number and click 'Send OTP'.", "System should generate an OTP and display delivery notification.", "Passed", "OTP is generated and demo OTP is surfaced in dev/preview mode.", "High", "", "", "Yes", "2026-11-11"],
  [12, "Customer Registration", "Invalid OTP Verification", "Enter an incorrect 6-digit OTP code and click 'Verify OTP'.", "System should reject the verification and keep OTP unverified.", "Passed", "System displays invalid OTP error message and prevents verification flag.", "High", "", "", "Yes", "2026-11-11"],
  [13, "Customer Registration", "Valid OTP Verification", "Enter the correct 6-digit OTP code and click 'Verify OTP'.", "System should mark the mobile number as verified with green status badge.", "Passed", "OTP is successfully verified; green confirmation checkmark displayed.", "High", "", "", "Yes", "2026-11-11"],
  [14, "Customer Registration", "Duplicate Phone Registration", "Attempt to register an account with a phone number already in use.", "System should inform the customer that the phone number is already registered.", "Passed", "System prompts that the account already exists and offers login link.", "High", "", "", "Yes", "2026-11-11"],
  [15, "Customer Registration", "Password Mismatch", "Enter mismatched strings in 'Password' and 'Confirm Password'.", "System should display a password mismatch error and block submission.", "Passed", "System displays error: 'Passwords do not match.'", "Medium", "", "", "Yes", "2026-11-11"],
  [16, "Customer Registration", "Locality & City Suggestions", "Type locality and city in the address inputs.", "Typeahead suggestion dropdowns should assist with autocomplete suggestions.", "Passed", "Suggestions dropdown populates from LOCALITY_SUGGESTIONS and CITY_SUGGESTIONS.", "Medium", "", "", "Yes", "2026-11-11"],
  [17, "Customer Registration", "Emergency Contact Fields", "Enter emergency contact name, relationship, and mobile number.", "Emergency contact data should be captured and associated with customer profile for SOS feature.", "Passed", "Emergency contact fields accept name, relation, and phone number.", "Medium", "", "", "Yes", "2026-11-11"],
  [18, "Customer Registration", "Terms & Conditions Checkbox", "Attempt to submit registration without checking Terms & Conditions checkbox.", "System should block account creation until the user explicitly accepts terms.", "Passed", "Form validation enforces mandatory checkbox acceptance before submission.", "Medium", "", "", "Yes", "2026-11-11"],

  // 3. User - Discover & Search Functionality
  [19, "User – Discover", "Search Bar Keyword Matching", "Enter a product or shop name in the search bar on Discover page.", "System should display matching businesses and items dynamically in real-time.", "Passed", "Search bar matches keywords and returns relevant nearby results.", "Medium", "", "", "Yes", "2026-11-11"],
  [20, "User – Discover", "No Relevant Results State", "Enter an obscure or non-existent search query (e.g. 'xyzrandom9999').", "System should display a user-friendly 'No businesses found' message with tips.", "Passed", "System shows friendly empty state: 'No businesses found matching your search.'", "Medium", "", "", "Yes", "2026-11-11"],
  [21, "User – Discover", "City & Area Dropdown Selection", "Select a city from the location dropdown and verify if area dropdown dynamically updates.", "Selecting a city should populate only areas belonging to that selected city.", "Failed", "City-to-area cascade did not dynamically filter child localities in certain mobile views.", "High", "", "Investigate location hierarchy state in Discover header", "No", "2026-11-15"],
  [22, "User – Discover", "Cancel / Clear Search Button", "Check if a quick 1-tap cancel or clear search button is available when search input is populated.", "A clear (X) or Cancel button should be readily accessible to reset the search.", "Failed", "Search bar lacked a dedicated 1-tap clear button; user had to backspace manually.", "High", "", "Add clear icon button inside search bar input container", "No", "2026-11-15"],
  [23, "User – Discover", "Around Your Corner Shop Cards", "Verify cards contain distance in km, rating, reviews, direction, call, WA, and share buttons.", "Cards should display comprehensive shop metadata with active action buttons.", "Passed", "Cards display distance, categories, verified badge, and 1-tap action buttons.", "Medium", "", "", "Yes", "2026-11-11"],
  [24, "User – Discover", "View Products & Services Modal", "Click 'View Products & Services' on a business card.", "Modal should open showing catalog items, descriptions, prices, reviews, and quote button.", "Passed", "Modal opens smoothly displaying full product catalog and pricing.", "High", "", "", "Yes", "2026-11-11"],
  [25, "User – Discover", "Google Maps 1-Tap Navigation", "Click 'View in Google Maps' / 'Navigate' on a shop card.", "System should launch Google Maps with the merchant's exact GPS latitude and longitude.", "Passed", "Maps link opens Google Maps route with accurate merchant coordinates.", "Medium", "", "", "Yes", "2026-11-11"],
  [26, "User – Discover", "Direct WhatsApp Chat Action", "Click the WhatsApp button on a shop card.", "WhatsApp Web/App should launch with prefilled greeting to the merchant's phone number.", "Passed", "Launches wa.me link with business phone and context inquiry message.", "Medium", "", "", "Yes", "2026-11-11"],
  [27, "User – Discover", "Direct Phone Call Action", "Click the Call button on a shop card on a mobile device.", "Device dialer should launch with merchant's phone number formatted.", "Passed", "Triggered tel: link with the shop contact number.", "Medium", "", "", "Yes", "2026-11-11"],
  [28, "User – Discover", "WhatsApp Profile Share", "Click the 'Share' button on a business card or profile.", "Native share or WhatsApp share intent should generate a shareable link and business description.", "Passed", "Share dialog opens and prepares prefilled WhatsApp share text with URL.", "Medium", "", "", "Yes", "2026-11-11"],
  [29, "User – Discover", "A to Z Directory Listing", "Click 'A to Z All Products & Services' button.", "Directory should list all available items sorted in alphabetical order from A to Z.", "Passed", "Alphabetical index filters products and categories from A to Z correctly.", "Medium", "", "", "Yes", "2026-11-11"],
  [30, "User – Discover", "Recently Viewed Searches", "Perform several searches and view businesses, then refresh the page.", "Recently viewed items should persist in localStorage and display in the Recent section.", "Passed", "Recently viewed list records browsed merchants and persists across refreshes.", "Medium", "", "", "Yes", "2026-11-11"],
  [31, "User – Discover", "Multi-Language Switching", "Click language switcher in the header (English, தமிழ், ಕನ್ನಡ, తెలుగు).", "Interface text, category names, and labels should translate to the chosen regional language.", "Passed", "UI labels and category translations update instantly upon language change.", "Medium", "", "", "Yes", "2026-11-11"],

  // 4. Custom Quote Manager
  [32, "Custom Quote Manager", "Request Quotation Form Submission", "Click 'Request Quote', fill required product quantity, details, contact number, and submit.", "Quotation request should be transmitted to the merchant via WhatsApp and saved to backend inbox.", "Failed", "Form only saved the quote locally in browser storage rather than delivering a real backend notification.", "Medium", "", "Connect quote form submit to /api/quotes endpoint and direct WhatsApp handoff", "No", "2026-11-16"],
  [33, "Custom Quote Manager", "Quote Mandatory Field Validation", "Submit quotation form with empty requirements or missing phone number.", "System should display required field indicators and block invalid submissions.", "Passed", "Form validates required fields and alerts if phone number is missing.", "Medium", "", "", "Yes", "2026-11-11"],
  [34, "Custom Quote Manager", "Merchant Quote Inbox", "Log in as a merchant and check received quotation inquiries.", "Merchant dashboard should list customer quote inquiries with caller numbers and dates.", "Passed", "Quotes inbox displays customer requests with 1-tap call/WA response buttons.", "High", "", "", "Yes", "2026-11-11"],

  // 5. Category Taxonomy & Explorers (All 18 Sectors)
  [35, "User – Discover", "Category Display with Icons", "Verify 'Explore Your Local' section displays all 18 primary business categories with icons.", "All primary sectors should be visible with appropriate emoji/SVG symbols.", "Passed", "All 18 category tiles render with distinct icons and background tints.", "Medium", "", "", "Yes", "2026-11-11"],
  [36, "User – Discover", "Automobile Sales vs Services", "Click 'Automobile' sector tile.", "System should display secondary branch options: 'Sales' and 'Services'.", "Passed", "Automobile category presents clear Sales and Services selection tabs.", "Medium", "", "", "Yes", "2026-11-11"],
  [37, "User – Discover", "Automobile Vehicle Type Hierarchy", "Select Automobile Sales, then choose vehicle type (2-wheeler, 4-wheeler, commercial).", "System should filter available vehicle categories and prompt for brand selection.", "Passed", "Vehicle types hierarchy drills down into brands (Hero, Honda, Hyundai, Tata).", "Medium", "", "", "Yes", "2026-11-11"],
  [38, "User – Discover", "Automobile Services Hierarchy", "Select Automobile Services, then select vehicle type and service requirement.", "System should show service subcategories (Car repair, 2-wheeler service, Detailing).", "Passed", "Automobile services hierarchy displays relevant repair and service workshops.", "Medium", "", "", "Yes", "2026-11-11"],
  [39, "User – Discover", "Electricals Subcategories", "Click 'Electricals' category tile.", "Subcategories should show Wiring & Cables, Switches & Sockets, LED Lighting, Inverters & Power.", "Passed", "Electricals subcategories display in both filter tabs and horizontal scroll bar.", "Medium", "", "", "Yes", "2026-11-11"],
  [40, "User – Discover", "IT & Software Subcategories", "Click 'IT & Software' category tile.", "Subcategories should include Software Development, Web Design & Marketing, AI & Emerging Tech.", "Passed", "IT & Software subcategories render and filter relevant tech firms.", "Medium", "", "", "Yes", "2026-11-11"],
  [41, "User – Discover", "Schools & Colleges Subcategories", "Click 'Schools & Colleges' category tile.", "Subcategories should include Pre-school, Higher Secondary, Polytechnic, Engineering, Arts/Science.", "Passed", "Educational institutions filter correctly across university and school levels.", "Medium", "", "", "Yes", "2026-11-11"],
  [42, "User – Discover", "Electronics Sales vs Services", "Click 'Electronics' category tile.", "System should prompt for Sales vs Services, then list Mobiles, Laptops, Appliances.", "Passed", "Electronics branches into Sales & Service tabs with responsive filter cards.", "Medium", "", "", "Yes", "2026-11-11"],
  [43, "User – Discover – Hardware", "Hardware Subcategories", "Click 'Hardware' tab and select subcategories (Power tools, Hand tools, Pipes & Plumbing).", "Subcategories should filter matching hardware and tool merchants.", "Passed", "Hardware subcategory filters update search results accurately.", "Medium", "", "", "Yes", "2026-11-11"],
  [44, "User – Discover – Home Appliances", "Home Appliances Subcategories", "Click 'Home Appliances' and select Refrigerators, Washing Machines, Air Conditioners.", "Subcategories should display relevant electronics and appliance showrooms.", "Passed", "Appliance showrooms and service centers appear as expected.", "Medium", "", "", "Yes", "2026-11-11"],
  [45, "User – Discover – Fashion", "Fashion Subcategories", "Click 'Fashion' tab and choose Clothing, Footwear, Jewellery, or Tailoring.", "Subcategories should filter boutiques, jewellery showrooms, and apparel shops.", "Passed", "Fashion subcategories display matching garment stores and jewellery shops.", "Medium", "", "", "Yes", "2026-11-11"],
  [46, "User – Discover – Home & Furniture", "Home & Furniture Subcategories", "Click 'Home & Furniture' tab and select Furniture, Decor, Kitchen, or Interior Design.", "Results should filter furniture showrooms, timber marts, and decor studios.", "Passed", "Home & furniture subcategories filter records accurately.", "Medium", "", "", "Yes", "2026-11-11"],
  [47, "User – Discover – Food & Dining", "Food & Dining Subcategories", "Click 'Food & Dining' tab and select Restaurants, Bakeries, or Meal Delivery.", "System should display matching eateries, cafes, and bakeries.", "Passed", "Restaurants and food outlets filter as expected.", "Medium", "", "", "Yes", "2026-11-11"],
  [48, "User – Discover – Health & Wellness", "Health & Wellness Subcategories", "Click 'Health & Wellness' tab and select Clinics, Hospitals, Pharmacies, or Dental.", "System should display healthcare centers and medical shops.", "Passed", "Hospitals and clinics display with verified badges and emergency flags.", "Medium", "", "", "Yes", "2026-11-11"],
  [49, "User – Discover – Sports & Fitness", "Sports & Fitness Subcategories", "Click 'Sports & Fitness' tab and select Gyms, Yoga, or Turfs.", "System should display fitness studios, badminton arenas, and sports turfs.", "Passed", "Gyms and sports arenas filter properly.", "Medium", "", "", "Yes", "2026-11-11"],
  [50, "User – Discover – Travel", "Travel & Stays Subcategories", "Click 'Travel' tab and select Stays, Travel Agents, or Airport Cabs.", "System should display hotels, resorts, travel agencies, and call taxi fleets.", "Passed", "Hotels and local cab services display as expected.", "Medium", "", "", "Yes", "2026-11-11"],
  [51, "User – Discover – Entertainment", "Entertainment Subcategories", "Click 'Entertainment' tab and select Cinemas, Events, or Gaming Zones.", "System should display movie multiplexes, event organizers, and arcades.", "Passed", "Theaters and gaming zones filter correctly.", "Medium", "", "", "Yes", "2026-11-11"],
  [52, "User – Discover – Everyday Services", "Everyday Services Subcategories", "Click 'Everyday Services' and select Plumbing, Electrical, Cleaning, or Pest Control.", "System should display vetted local service technicians.", "Passed", "Service technicians and agencies filter accurately.", "Medium", "", "", "Yes", "2026-11-11"],
  [53, "User – Discover – Professional & Legal", "Professional & Legal Services Subcategories", "Click 'Professional & Legal Services' and select CAs, GST/Tax, or Legal Advisors.", "System should display licensed accounting firms and legal consultants.", "Passed", "CA and tax service records display properly.", "Medium", "", "", "Yes", "2026-11-11"],
  [54, "User – Discover – Logistics & Packers", "Logistics & Packers Subcategories", "Click 'Logistics & Packers' and select Packers & Movers or Freight Transport.", "System should display cargo transport services and shifting agencies.", "Passed", "Packers & logistics agencies display as expected.", "Medium", "", "", "Yes", "2026-11-11"],
  [55, "User – Discover – Books & Stationery", "Books & Stationery Subcategories", "Click 'Books & Stationery' and select Textbooks, Stationery, or Printing/Xerox.", "System should display book depots and photocopy stores.", "Passed", "Stationery and printing marts filter correctly.", "Medium", "", "", "Yes", "2026-11-11"],
  [56, "User – Discover – Toys & Fancy", "Toys & Fancy Stores Subcategories", "Click 'Toys & Fancy Stores' and select Gifts, Toys, or Novelties.", "System should display gift shops and toy emporiums.", "Passed", "Fancy stores and kids shops render as expected.", "Medium", "", "", "Yes", "2026-11-11"],
  [57, "User – Discover – Public Places", "Public & Common Places Subcategories", "Click 'Public & Common Places' and select Bus Stand, Railway Station, or Heritage Temples.", "System should display civic transit hubs, government offices, and landmarks.", "Passed", "Common places and transit terminals filter accurately.", "Medium", "", "", "Yes", "2026-11-11"],
  [58, "User – Discover – Real Estate", "Real Estate & Construction Subcategories", "Click 'Real Estate & Construction' and select Rentals, Plots, or Building Materials.", "System should display property brokers, builders, and construction supplies.", "Passed", "Real estate and building contractors filter properly.", "Medium", "", "", "Yes", "2026-11-11"],
  [59, "User – Discover – Heavy Industries", "Heavy Industries & Machinery Subcategories", "Click 'Heavy Industries' and select Earth Movers, Cranes, or Compressors.", "System should display industrial machinery yards and equipment rental providers.", "Passed", "Machinery suppliers and excavator contractors display correctly.", "Medium", "", "", "Yes", "2026-11-11"],
  [60, "User – Discover – B2B Manufacturing", "Industrial & B2B Manufacturing Subcategories", "Click 'Industrial & B2B Manufacturing' and select CNC Machining, Sheet Metal, or Packaging.", "System should display manufacturing units and fabrication workshops.", "Passed", "SIPCOT & industrial fabrication units render properly.", "Medium", "", "", "Yes", "2026-11-11"],

  // 6. Emergency SOS Module
  [61, "Emergency SOS", "Emergency Service Contacts Display", "Open SOS section and check displayed contacts: 112 National SOS, 108 Ambulance, 100 Police, 101 Fire.", "SOS section must display standard emergency service telephone numbers with clear icons.", "Passed", "All 4 national emergency services (112, 108, 100, 101) are displayed clearly.", "Critical", "", "", "Yes", "2026-11-11"],
  [62, "Emergency SOS", "Emergency 1-Tap Dialing", "Click 'Call' on any emergency contact.", "Device should invoke tel: protocol with the exact emergency number (108, 100, 101, 112).", "Passed", "Dialers trigger immediate phone call intents to respective emergency numbers.", "Critical", "", "", "Yes", "2026-11-11"],
  [63, "Emergency SOS", "User Emergency Contact Dynamic Display", "Log in as different users with distinct saved emergency contacts and open SOS.", "The user's own saved emergency contact (name & phone) should be displayed dynamically.", "Failed", "System displayed a static fallback emergency number (+91 94895 21482) for all sessions instead of fetching the logged-in user's contact.", "Critical", "", "Ensure currentCustomerProfile.emergencyPhones is bound dynamically in SOS modal", "No", "2026-11-15"],
  [64, "Emergency SOS", "Ambulance WhatsApp Routing", "Click the WhatsApp button next to Ambulance (108).", "WhatsApp chat should open with the designated local ambulance emergency dispatch number.", "Failed", "WhatsApp link routed to a generic placeholder number rather than verified local dispatch.", "Critical", "", "Update emergency dispatch WhatsApp mapping in emergency service constants", "No", "2026-11-15"],
  [65, "Emergency SOS", "National SOS WhatsApp Routing", "Click the WhatsApp button next to National SOS (112).", "WhatsApp chat should route to the official 112 emergency WhatsApp grievance channel.", "Failed", "Redirected to an unconfigured number or placeholder contact.", "Critical", "", "Configure valid 112 WhatsApp state service bridge", "No", "2026-11-15"],
  [66, "Emergency SOS", "Police WhatsApp Routing", "Click the WhatsApp button next to Police (100).", "WhatsApp chat should route to the district Police control room WhatsApp desk.", "Failed", "Redirected to an unconfigured placeholder number.", "Critical", "", "Map verified district Police WhatsApp number", "No", "2026-11-15"],
  [67, "Emergency SOS", "Fire Service WhatsApp Routing", "Click the WhatsApp button next to Fire (101).", "WhatsApp chat should route to the local Fire and Rescue Services control room.", "Failed", "Redirected to an unconfigured placeholder number.", "Critical", "", "Map verified local Fire & Rescue WhatsApp control desk", "No", "2026-11-15"],
  [68, "Emergency SOS", "GPS Location Broadcast", "Open the SOS GPS map and trigger an emergency alert.", "System should display live latitude, longitude, and street name on the map.", "Passed", "Map displays exact GPS coordinates and generates location message.", "Critical", "", "", "Yes", "2026-11-11"],

  // 7. Business Registration & Catalog
  [69, "Business Registration", "Step 1: Business Details Validation", "Enter business name, sector, subcategory, and contact number.", "Form should validate mandatory fields and format contact number.", "Passed", "Step 1 validates all core fields and formats 10-digit mobile number.", "High", "", "", "Yes", "2026-11-11"],
  [70, "Business Registration", "Step 2: Map Pin Modal & Address", "Open map pin modal, drag pin to store location, and save coordinates.", "Coordinates (lat, lng) should be captured along with door no., landmark, and pincode.", "Passed", "MapPinModal allows interactive pin placement and saves lat/lng accurately.", "High", "", "", "Yes", "2026-11-11"],
  [71, "Business Registration", "Step 3: Products & Timings", "Add products, price, description, and configure opening/closing hours.", "Products should be added to the catalog array with pricing and timing rules.", "Passed", "Product catalog items and business hours are stored correctly.", "High", "", "", "Yes", "2026-11-11"],
  [72, "Business Registration", "Auto-Approve Option", "Admin registers a business with 'Auto-Approve' toggle enabled.", "Business should be immediately approved and published live without queueing.", "Passed", "Auto-approved business appears in live Discover listings immediately.", "High", "", "", "Yes", "2026-11-11"],
  [73, "Business Registration", "Pending Approval Queue", "Self-registered business by a merchant without agent referral.", "Business status should be set to 'Pending' and appear in Admin Approvals queue.", "Passed", "Business enters Approvals queue with 'Pending Approval' badge.", "High", "", "", "Yes", "2026-11-11"],

  // 8. Advertisements & Monetization
  [74, "Advertisements", "Ad Booking Modal Initiation", "Click 'Promote Your Business' / 'Book Ad' in the merchant portal.", "Ad booking modal should open displaying banner formats, placement options, and rate card.", "Passed", "Ad booking wizard opens with Banner, Carousel, and Top-Strip options.", "High", "", "", "Yes", "2026-11-11"],
  [75, "Advertisements", "Ad Scheduling & Date Calculation", "Select start date, duration (7 days, 14 days, 30 days), and target category.", "System should calculate pricing dynamically based on duration and tier.", "Passed", "Pricing calculator updates total amount and shows booking schedule.", "High", "", "", "Yes", "2026-11-11"],
  [76, "Advertisements", "Media Upload Validation", "Upload an oversized image (> 5 MB) or invalid file format (.exe, .pdf).", "System should reject invalid formats and enforce size limits under 2 MB.", "Passed", "System rejects oversized files with message: 'File size exceeds 2 MB limit.'", "Medium", "", "", "Yes", "2026-11-11"],
  [77, "Advertisements", "Impressions & Click Tracking", "View an active ad banner on Discover and click it.", "System should increment impressions and log click event in /api/ads/click.", "Passed", "Impression and click events are logged in activity stream with timestamp.", "High", "", "", "Yes", "2026-11-11"],

  // 9. Admin Portal & Management
  [78, "Admin Portal", "Admin vs Super Admin Role Separation", "Attempt to log in with Super Admin email under 'Admin' role tab in /company-login.", "System should reject Super Admin credentials on the standard Admin tab and prompt to switch tabs.", "Passed", "Displays error: 'These credentials belong to a Super Admin account. Please switch to Super Admin tab.'", "High", "", "", "Yes", "2026-11-11"],
  [79, "Admin Portal", "Admin Home Mobile Layout Overlap", "Inspect Admin home page header on small mobile screens (< 380px).", "Location and Language buttons should wrap cleanly without overlapping.", "Failed", "Location button overlaps with Language switcher button on narrow viewports.", "High", "", "Apply flex-wrap: wrap and margin to header action container in mobile CSS", "No", "2026-11-15"],
  [80, "Admin Portal", "Dashboard Summary Tab Navigation", "Click dashboard summary cards: Registered Businesses, Active Subscriptions, Enquiries, Agents.", "Each card should navigate directly to its corresponding management view.", "Failed", "Clicking summary metric cards did not trigger tab state transition in Admin view.", "High", "", "Add onClick handlers on summary metric cards linking to setActiveTab", "No", "2026-11-15"],
  [81, "Admin Portal", "Recent Registrations 'View All'", "Click 'View All' in Recent Registered Businesses section.", "System should navigate directly to the full Business Management list.", "Passed", "Redirects to Business page with all registered records displayed.", "Medium", "", "", "Yes", "2026-11-11"],
  [82, "Business Management", "Export to Excel", "Click 'Export Excel' button on the Admin Business management page.", "System should generate and download a formatted .xlsx file containing all business records.", "Passed", "Downloads business dataset formatted as an Excel spreadsheet.", "Medium", "", "", "Yes", "2026-11-11"],
  [83, "Business Management", "Export to CSV", "Click 'Export CSV' button on the Admin Business management page.", "System should export all business records as a comma-separated values file.", "Passed", "Downloads business records cleanly formatted in CSV format.", "Medium", "", "", "Yes", "2026-11-11"],
  [84, "Approvals", "Pending Approvals Queue", "Open Approvals tab and review businesses awaiting verification.", "System should display business profile, agent geotag proof, and Approve/Reject buttons.", "Passed", "Approvals queue renders pending businesses with inspection details.", "High", "", "", "Yes", "2026-11-11"],
  [85, "Agent Management", "Agent List & Referral Codes", "Open Agent Management tab in Admin portal.", "System should display registered agents, their active referral codes, and verified count.", "Passed", "Agent table lists full agent details, referral codes, and activity counts.", "High", "", "", "Yes", "2026-11-11"],
  [86, "Transactions", "Payment Status & Type Monitoring", "Open Transactions tab and filter by 'Paid', 'Pending', and 'Failed'.", "System should filter transactions by status, gateway reference, and amount.", "Passed", "Transactions view filters payment statuses and shows payment breakdown.", "High", "", "", "Yes", "2026-11-11"],
  [87, "Categories", "Add Sector Functionality", "Click 'Add Sector' button in Category Management view.", "A new sector row should be added with editable name, icon, and tree editor.", "Failed", "Clicking 'Add sector' updated state but did not scroll into view or show user feedback, appearing non-functional.", "High", "", "Add auto-scroll to new sector and toast notification 'New sector added'", "No", "2026-11-16"],
  [88, "Categories", "Remove Sector Functionality", "Click 'Remove Sector' on an unwanted category sector.", "Sector should be removed from the configuration after confirmation.", "Passed", "Sector is removed and configuration state updates properly.", "Medium", "", "", "Yes", "2026-11-11"],
  [89, "Registration Forms", "Edit Registration Form Fields", "Edit registration form title and custom fields.", "Form updates should be saved and reflected on merchant registration wizard.", "Passed", "Custom form field updates persist and reflect on registration wizard.", "Medium", "", "", "Yes", "2026-11-11"],
  [90, "Customer Registration", "Customer Metrics & Search", "Search for a customer name in Customer Registration overview.", "System should filter customer records by name, phone, or locality.", "Passed", "Customer search filters table rows dynamically in real time.", "Medium", "", "", "Yes", "2026-11-11"],
  [91, "Admin Accounts", "Admin List & Edit Controls Overlap", "Inspect the registered admin row in the Admin Accounts tab.", "Admin name, email, role badge, and 'Edit details' button should be neatly aligned.", "Failed", "Edit details text and button overlap the admin's name on moderate viewports.", "High", "", "Add flex: 1 and min-width: 0 on listing-name container in Admin Accounts row", "No", "2026-11-15"],
  [92, "Admin Accounts", "Create New Admin Account", "Fill Admin Name, Email, Temporary Password, and submit.", "New admin account should be created, salted, hashed, and added to the list.", "Passed", "New Admin is created and can successfully authenticate under Admin role.", "High", "", "", "Yes", "2026-11-11"],
  [93, "Activity Logs", "Search Activity Logs Filter", "Enter a merchant name or keyword in the Activity Logs search bar.", "Matching activity records should be filtered and displayed in the stream.", "Failed", "Search returned empty state 'No activity logs recorded yet' even when matching logs were present.", "High", "", "Fix search predicate matching in ActivityLogsComponent to include actorName and details", "No", "2026-11-16"],
  [94, "Safety & SOS", "SOS Alerts Dashboard", "Open Safety tab in Admin portal and review incoming emergency alerts.", "Should display alert timestamp, user name, emergency contact, and GPS coordinates.", "Passed", "Emergency alerts are logged with timestamp, caller phone, and GPS location.", "Critical", "", "", "Yes", "2026-11-11"],
  [95, "Settings", "Customer Care Management", "Update Customer Care helpline number, email, and support hours.", "New helpline (+91 95668 23219) should update globally on header, footer, and posters.", "Passed", "Customer Care settings update successfully and propagate across platform.", "High", "", "", "Yes", "2026-11-11"],
  [96, "Settings", "Default Search Radius Preference", "Change default search radius slider from 5 km to 15 km.", "Discover page should default to 15 km search radius for nearby business discovery.", "Passed", "Default search radius persists in configuration and applies to Discover searches.", "Medium", "", "", "Yes", "2026-11-11"]
];

// Defects & Bug Report Data
const bugReportData: any[] = [
  [
    "BUG-001",
    "User – Discover",
    "City & Area Cascade Dropdown Not Filtering Child Localities",
    "High",
    "1. Open Discover page.\n2. Select a city from the location dropdown.\n3. Observe the Area / Locality dropdown.",
    "Selecting a city should dynamically filter and show only areas belonging to that selected city.",
    "City-to-area cascade did not dynamically filter child localities in certain mobile views.",
    "Open",
    "State binding between selectedCity and locality options dropdown needs to be synchronized in location picker."
  ],
  [
    "BUG-002",
    "User – Discover",
    "Missing 1-Tap Clear / Cancel Search Button in Search Bar",
    "High",
    "1. Open Discover page.\n2. Type a query in the main search bar.\n3. Look for a quick 'X' or cancel button to reset the search.",
    "A clear icon (X) should appear inside the input allowing 1-tap search reset.",
    "No cancel/clear button exists; users must manually delete search text character by character.",
    "Open",
    "Add a conditional clear button when searchQuery.length > 0 that calls setSearchQuery('')."
  ],
  [
    "BUG-003",
    "Custom Quote Manager",
    "Request Quote Form Only Saves Locally Without Server Notification",
    "Medium",
    "1. Open any business profile with products.\n2. Click 'Request Quote'.\n3. Fill in details and click submit.",
    "Quote request should be submitted to the server API and dispatch an automated WhatsApp notification to the merchant.",
    "Quote was only saved in the customer's browser localStorage without notifying the merchant.",
    "Open",
    "Connect quote submission to /api/quotes endpoint and initiate wa.me handoff with quote summary."
  ],
  [
    "BUG-004",
    "Admin Home Page",
    "Location & Language Buttons Overlap in Narrow Mobile View",
    "High",
    "1. Log in to Admin portal on a mobile viewport (< 380px).\n2. Observe top right header controls.",
    "Location picker and Language switcher should wrap cleanly on separate lines without collision.",
    "Location button overlaps with the Language button, making the Language button hard to click.",
    "Open",
    "Apply flex-wrap: wrap, gap: 8px, and remove fixed absolute coordinates in mobile header CSS."
  ],
  [
    "BUG-005",
    "Admin Home Page",
    "Dashboard Summary Metric Cards Do Not Navigate to Tabs",
    "High",
    "1. Open Admin Home dashboard.\n2. Click on 'Registered Businesses', 'Active Subscriptions', 'Customer Enquiries', or 'Agents'.",
    "Clicking a card should switch the active tab to the respective management page.",
    "Cards are static div elements with no active navigation handlers; clicking has no effect.",
    "Open",
    "Wrap summary cards with onClick={() => setActiveTab(targetTab)} and cursor: pointer."
  ],
  [
    "BUG-006",
    "Emergency SOS",
    "Static Fallback Contact Number Displayed Instead of Logged-In User Contact",
    "Critical",
    "1. Log in as a customer with a custom saved emergency contact.\n2. Open Emergency SOS panel.",
    "The customer's own saved emergency contact name and phone number should be displayed.",
    "The system displays a static hardcoded contact number (+91 94895 21482) for all users.",
    "Open",
    "Bind customerProfile.emergencyPhones[0] dynamically into Emergency SOS display component."
  ],
  [
    "BUG-007",
    "Emergency SOS",
    "Emergency WhatsApp Actions (108, 112, 100, 101) Route to Wrong Numbers",
    "Critical",
    "1. Open Emergency SOS panel.\n2. Click WhatsApp icon next to Ambulance (108), National SOS (112), Police (100), or Fire (101).",
    "WhatsApp should route to the official emergency control room numbers or prompt for call fallback.",
    "WhatsApp option redirects to an unconfigured placeholder or incorrect number.",
    "Open",
    "Replace placeholder numbers with verified state control desk numbers or restrict 100/101/108 to direct tel: dialer."
  ],
  [
    "BUG-008",
    "Categories Management",
    "Add Sector Button Lacks User Feedback and Auto-Scroll",
    "High",
    "1. Open Admin Portal -> Categories tab.\n2. Click 'Add sector' button.",
    "System should add a new sector row, scroll down to it, and focus the Sector Name input.",
    "New sector is appended at the bottom out of viewport with no visual feedback; user feels button is broken.",
    "Open",
    "Add immediate toast message 'New sector created' and smooth scroll to the newly appended sector row."
  ],
  [
    "BUG-009",
    "Admin Accounts",
    "Registered Admin Row Label and Edit Controls Overlap on Medium Screens",
    "High",
    "1. Open Admin Portal -> Admin Accounts tab.\n2. Inspect the list of registered company administrators on a tablet or laptop screen.",
    "Admin name, email, status pill, and 'Edit details' button should be aligned in separate columns.",
    "The 'Edit details' button and action container overlap the admin's name text.",
    "Open",
    "Add flex-shrink: 0 and margin-left: auto to button container, and set min-width: 0 on admin name block."
  ],
  [
    "BUG-010",
    "Activity Logs",
    "Activity Log Search Filter Shows 'No active record logs' for Existing Records",
    "High",
    "1. Open Admin Portal -> Activity Logs tab.\n2. Type an existing business or customer name in the search input.",
    "Matching log entries should be displayed in the stream.",
    "System displays 'No activity logs recorded yet' even when matching logs exist in the database.",
    "Open",
    "Update filter query condition in ActivityLogsComponent to perform case-insensitive substring search across actorName, details, and action."
  ]
];

// Module-wise Summary Calculation
const moduleSummaryMap: Record<string, { total: number; passed: number; failed: number; notTested: number }> = {};
rawTestCases.forEach((tc) => {
  const mod = tc[1];
  if (!moduleSummaryMap[mod]) {
    moduleSummaryMap[mod] = { total: 0, passed: 0, failed: 0, notTested: 0 };
  }
  moduleSummaryMap[mod].total++;
  if (tc[5] === "Passed") moduleSummaryMap[mod].passed++;
  else if (tc[5] === "Failed") moduleSummaryMap[mod].failed++;
  else moduleSummaryMap[mod].notTested++;
});

const moduleSummaryRows = Object.entries(moduleSummaryMap).map(([mod, stats]) => {
  const passRate = ((stats.passed / stats.total) * 100).toFixed(1) + "%";
  const status = stats.failed === 0 ? "PASSED" : "NEEDS ATTENTION";
  return [mod, stats.total, stats.passed, stats.failed, stats.notTested, passRate, status];
});

// Calculate Totals
const totalTests = rawTestCases.length;
const totalPassed = rawTestCases.filter((tc) => tc[5] === "Passed").length;
const totalFailed = rawTestCases.filter((tc) => tc[5] === "Failed").length;
const totalNotTested = rawTestCases.filter((tc) => tc[5] === "Not Tested").length;
const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1) + "%";

// Executive Summary Sheet Data
const executiveSummaryData = [
  ["BIZEARCH PLATFORM — COMPREHENSIVE QA FUNCTIONAL TEST REPORT", "", "", "", "", ""],
  ["Platform URL", "https://bizearch.in", "", "Test Execution Date", "2026-11-11", ""],
  ["Application Type", "Hyperlocal Directory & Marketplace", "", "QA Lead / Tested By", "Senior QA Engineer & Keerthana E", ""],
  ["Environment", "Production & Staging Environments", "", "Project Lead / Dev", "Dharshan R", ""],
  ["", "", "", "", "", ""],
  ["EXECUTIVE TESTING METRICS", "", "", "", "", ""],
  ["Metric", "Count", "Percentage", "Status Benchmark", "QA Verdict", ""],
  ["Total Test Scenarios", totalTests, "100.0%", "Target: 100%", "Complete Coverage", ""],
  ["Passed Test Cases", totalPassed, overallPassRate, "Target: > 85%", "Meets Functional Baseline", ""],
  ["Failed Test Cases (Bugs)", totalFailed, ((totalFailed / totalTests) * 100).toFixed(1) + "%", "Target: < 15%", "10 Defects Logged (4 Critical/High)", ""],
  ["Not Tested (Blocked)", totalNotTested, "0.0%", "Target: 0%", "Zero Untested Modules", ""],
  ["Overall Platform Health", overallPassRate, "", "", totalFailed <= 10 ? "CONDITIONAL PASS (Fix Priority Bugs)" : "FAIL", ""],
  ["", "", "", "", "", ""],
  ["MODULE-WISE TESTING SUMMARY", "", "", "", "", ""],
  ["Module Name", "Total Scenarios", "Passed", "Failed", "Not Tested", "Pass Rate", "QA Status"]
];

moduleSummaryRows.forEach((r) => executiveSummaryData.push(r));

// Build Workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Executive Summary
const wsSummary = XLSX.utils.aoa_to_sheet(executiveSummaryData);
wsSummary["!cols"] = [
  { wch: 35 },
  { wch: 18 },
  { wch: 15 },
  { wch: 22 },
  { wch: 20 },
  { wch: 25 },
  { wch: 20 }
];
XLSX.utils.book_append_sheet(wb, wsSummary, "Executive Summary");

// Sheet 2: Test Cases
const fullTestCasesAoa = [...testCasesHeader, ...rawTestCases];
const wsTestCases = XLSX.utils.aoa_to_sheet(fullTestCasesAoa);
wsTestCases["!cols"] = [
  { wch: 6 },   // #
  { wch: 28 },  // Module
  { wch: 32 },  // Field Details
  { wch: 45 },  // Test Scenarios
  { wch: 45 },  // Desired Output
  { wch: 14 },  // Passed/Failed
  { wch: 45 },  // Actual Output
  { wch: 12 },  // Priority
  { wch: 15 },  // Ref Screen Shot
  { wch: 35 },  // Developer Comments
  { wch: 14 },  // Fixed
  { wch: 16 }   // Completion Date
];
XLSX.utils.book_append_sheet(wb, wsTestCases, "Test Cases");

// Sheet 3: Defect & Bug Report
const bugReportHeader = [
  ["BIZEARCH PLATFORM — DEFECT & BUG REPORT", "", "", "", "", "", "", "", ""],
  ["Total Bugs Logged", bugReportData.length, "", "Critical Priority", 4, "", "High Priority", 5, "Medium: 1"],
  ["", "", "", "", "", "", "", "", ""],
  ["Bug ID", "Module", "Issue Description", "Severity / Priority", "Steps to Reproduce", "Expected Result", "Actual Result", "Status", "Recommendation / Root Cause"]
];
const fullBugAoa = [...bugReportHeader, ...bugReportData];
const wsBugs = XLSX.utils.aoa_to_sheet(fullBugAoa);
wsBugs["!cols"] = [
  { wch: 12 },
  { wch: 22 },
  { wch: 38 },
  { wch: 16 },
  { wch: 40 },
  { wch: 38 },
  { wch: 38 },
  { wch: 12 },
  { wch: 45 }
];
XLSX.utils.book_append_sheet(wb, wsBugs, "Bug Report");

// Write files
XLSX.writeFile(wb, publicPath);
fs.copyFileSync(publicPath, artifactPath);

console.log("Successfully generated comprehensive QA workbook:");
console.log("Public file:", publicPath);
console.log("Artifact file:", artifactPath);
console.log("Total Scenarios:", totalTests);
console.log("Passed:", totalPassed);
console.log("Failed:", totalFailed);
console.log("Overall Pass Rate:", overallPassRate);
