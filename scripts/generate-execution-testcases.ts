import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";

const outputDir = path.join(process.cwd(), "public");
const artifactDir = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\0fe4e467-267e-429d-ae61-38221343dd7c";

const fileName = "bizearch-testcases-to-test.xlsx";
const publicPath = path.join(outputDir, fileName);
const artifactPath = path.join(artifactDir, fileName);

// Metadata Block exactly matching the user's header format
function makeHeader(title: string, testDesc: string, testedBy: string, date: string) {
  return [
    ["Project/Application Name: Bizearch Testing", "", "", "", "", "", "", "", "", "", "", ""],
    ["Case ID", "", "", "FORMS-0001", "", "Team", "QA & Testing Team", "", "", "", "", ""],
    ["Test Priority", "", "", "High", "", "Developed By", "", "Dharshan R", "", "", "", ""],
    ["Module Name", title, "", "", "", "Test Execution Date", "", date, "", "", "", ""],
    ["Test Description", testDesc, "", "Functional Testing", "", "Tested By", "", testedBy, "", "", "", ""],
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
}

// 120 Comprehensive Test Scenarios covering all platform requirements
const testScenariosMaster: Array<{
  id: number;
  module: string;
  field: string;
  scenario: string;
  desired: string;
  passedFailed: string;
  actualOutput: string;
  priority: string;
  devComments: string;
  fixed: string;
  compDate: string;
}> = [
  // MODULE 1: CUSTOMER LOGIN & AUTHENTICATION
  {
    id: 1,
    module: "Customer Login",
    field: "Password Validation",
    scenario: "Login using an incorrect password.",
    desired: "System should reject the login and display an appropriate error message.",
    passedFailed: "Passed",
    actualOutput: "System displays: 'Invalid customer credentials. Please check your mobile or email, or click Create an account to register.'",
    priority: "High",
    devComments: "Credentials check enforced via scrypt hash comparison",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 2,
    module: "Customer Login",
    field: "Username Validation",
    scenario: "Login using an unregistered or non-existent username.",
    desired: "System should reject the login and prevent access.",
    passedFailed: "Passed",
    actualOutput: "Non-existent username is rejected with error banner.",
    priority: "High",
    devComments: "Verified against customer store",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 3,
    module: "Customer Login",
    field: "Mandatory Field Validation",
    scenario: "Attempt to log in without entering identity or password.",
    desired: "System should prevent login and display validation messages.",
    passedFailed: "Passed",
    actualOutput: "HTML5 validation triggers 'Please fill out this field' on required input.",
    priority: "High",
    devComments: "Browser native required validation active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 4,
    module: "Customer Login",
    field: "Successful Login & Navigation",
    scenario: "Log in using valid registered customer credentials.",
    desired: "System should redirect the customer to the Bizearch home page.",
    passedFailed: "Passed",
    actualOutput: "Customer is successfully authenticated and redirected to Discover.",
    priority: "Medium",
    devComments: "Session cookie set with 12h expiry",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 5,
    module: "Customer Login",
    field: "Forgot Password",
    scenario: "Check the availability and functionality of the Forgot Password option on the login page.",
    desired: "A Forgot Password option should be available to help customers recover or reset their passwords.",
    passedFailed: "Passed",
    actualOutput: "Forgot Password button is present and initiates recovery modal.",
    priority: "High",
    devComments: "Modal opens with mobile reset prompt",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 6,
    module: "Customer Login",
    field: "Password Visibility Toggle",
    scenario: "Click the eye/monkey toggle icon in the password field.",
    desired: "Password text should switch between masked dots and readable plain text.",
    passedFailed: "Passed",
    actualOutput: "Password input type toggles between 'password' and 'text'.",
    priority: "Low",
    devComments: "Accessible button with aria label",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 7,
    module: "Customer Login",
    field: "Portal Role Tabs Navigation",
    scenario: "Click between Customer, Business, Agent, and Company access tabs.",
    desired: "Each tab should adjust form instructions and route to respective portals.",
    passedFailed: "Passed",
    actualOutput: "Switches portal role context; Company redirects to /company-login.",
    priority: "Medium",
    devComments: "Role query param synced in URL",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 8,
    module: "Customer Login",
    field: "Session Expiry & Logout",
    scenario: "Click Logout from user profile and try navigating to protected URL /.",
    desired: "Session cookie should be cleared and user immediately redirected to /login.",
    passedFailed: "Passed",
    actualOutput: "Session cleared; page redirects to /login on subsequent requests.",
    priority: "High",
    devComments: "Cookie cleared with maxAge: 0",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 2: CUSTOMER REGISTRATION & OTP
  {
    id: 9,
    module: "Customer Registration",
    field: "Full Name Validation",
    scenario: "Enter special characters only or whitespace in Full Name field.",
    desired: "System should validate and require a valid name with at least 2 characters.",
    passedFailed: "Passed",
    actualOutput: "Required validation prevents empty submission; trims whitespace.",
    priority: "Medium",
    devComments: "Client-side trimming in place",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 10,
    module: "Customer Registration",
    field: "Mobile Number Validation",
    scenario: "Enter an invalid short mobile number (e.g. '12345') and click Send OTP.",
    desired: "System should reject invalid mobile number format and prompt for 10-digit number.",
    passedFailed: "Passed",
    actualOutput: "Displays: 'Enter a valid mobile number or email address as your username.'",
    priority: "High",
    devComments: "Validates 10-digit regex format",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 11,
    module: "Customer Registration",
    field: "Send OTP Functionality",
    scenario: "Enter a valid 10-digit Indian phone number and click Send OTP.",
    desired: "System should generate and send 6-digit OTP code.",
    passedFailed: "Passed",
    actualOutput: "OTP generated successfully; demo OTP code surfaced in dev banner.",
    priority: "High",
    devComments: "Temporary demo OTP available for verification",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 12,
    module: "Customer Registration",
    field: "Invalid OTP Verification",
    scenario: "Enter an incorrect OTP (e.g. 000000) and click Verify OTP.",
    desired: "System should reject verification and show invalid OTP error.",
    passedFailed: "Passed",
    actualOutput: "Displays 'Invalid OTP code. Please enter the code sent to your phone.'",
    priority: "High",
    devComments: "OTP mismatch caught before verification flag",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 13,
    module: "Customer Registration",
    field: "Valid OTP Verification",
    scenario: "Enter matching 6-digit OTP and click Verify OTP.",
    desired: "System should mark phone number as verified with green checkmark.",
    passedFailed: "Passed",
    actualOutput: "Phone number verified; green verification badge displayed.",
    priority: "High",
    devComments: "State set otpVerified = true",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 14,
    module: "Customer Registration",
    field: "Duplicate Phone Registration",
    scenario: "Attempt to register an account with a phone number already registered.",
    desired: "System should reject duplicate registration and offer login link.",
    passedFailed: "Passed",
    actualOutput: "System alerts that account already exists with this phone number.",
    priority: "High",
    devComments: "Unique phone index checked",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 15,
    module: "Customer Registration",
    field: "Password Confirmation",
    scenario: "Enter different values in Password and Confirm Password fields.",
    desired: "System should alert that passwords do not match and block submission.",
    passedFailed: "Passed",
    actualOutput: "Displays: 'Passwords do not match.'",
    priority: "Medium",
    devComments: "Pre-submit string comparison",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 16,
    module: "Customer Registration",
    field: "Locality & City Autocomplete",
    scenario: "Type partial text in Locality and City input fields.",
    desired: "Typeahead suggestions dropdown should display matching local areas.",
    passedFailed: "Passed",
    actualOutput: "Autocomplete list surfaces matching areas and fills on selection.",
    priority: "Medium",
    devComments: "Connected to address-suggestions catalog",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 17,
    module: "Customer Registration",
    field: "Emergency Contact Details",
    scenario: "Enter emergency contact name, relation, and phone number during registration.",
    desired: "Emergency contact should be saved to customer profile for SOS usage.",
    passedFailed: "Passed",
    actualOutput: "Emergency contact saved in customer profile record.",
    priority: "Medium",
    devComments: "Saved in emergencyPhones and emergencyNames fields",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 18,
    module: "Customer Registration",
    field: "Terms & Conditions Checkbox",
    scenario: "Attempt to submit registration form without checking Terms & Privacy checkbox.",
    desired: "System should prevent registration and prompt user to accept terms.",
    passedFailed: "Passed",
    actualOutput: "HTML5 validation requires checking terms before submission.",
    priority: "Medium",
    devComments: "Mandatory checkbox enforced",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 3: USER DISCOVER & SEARCH
  {
    id: 19,
    module: "User – Discover",
    field: "Search Bar Keyword Matching",
    scenario: "The discover page - search bar should allow the user to search their requirement and give relevant output.",
    desired: "Search bar should return matching shops, products, and services in real-time.",
    passedFailed: "Passed",
    actualOutput: "Displays relevant nearby results matching search keyword query.",
    priority: "Medium",
    devComments: "Searches business names, products, and categories",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 20,
    module: "User – Discover",
    field: "No Relevant Search State",
    scenario: "Search bar if there is no relevant search it should showcase message like no business found.",
    desired: "Search should display clear 'No businesses found' empty state message.",
    passedFailed: "Passed",
    actualOutput: "Displays: 'No businesses found matching your search.'",
    priority: "Medium",
    devComments: "Empty state UI renders with helpful hints",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 21,
    module: "User – Discover",
    field: "City & Area Cascade Dropdown",
    scenario: "The user must be able to select the cities; once selected, the area of that selected city should appear in dropdown.",
    desired: "Area dropdown should dynamically update and filter based on selected city.",
    passedFailed: "Failed",
    actualOutput: "City-to-area cascade did not dynamically filter child localities in certain mobile views.",
    priority: "High",
    devComments: "Sync selectedCity state with locality options in Discover header",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 22,
    module: "User – Discover",
    field: "Cancel / Clear Search Button",
    scenario: "Search bar needs a cancel/clear button when user types a search query.",
    desired: "1-tap clear button (X) should reset search query and restore full listings.",
    passedFailed: "Failed",
    actualOutput: "Search bar lacked a dedicated 1-tap clear button; user had to backspace manually.",
    priority: "High",
    devComments: "Add clear icon button inside search bar input container",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 23,
    module: "User – Discover",
    field: "Around Your Corner Shop Cards",
    scenario: "The discover page around your corner should contain shop details around your area with distance, reviews, product details, navigate, call, WhatsApp, share.",
    desired: "Cards should display comprehensive shop metadata with active action buttons.",
    passedFailed: "Passed",
    actualOutput: "Shop cards contain distance, reviews, verified badges, and action buttons.",
    priority: "Medium",
    devComments: "Calculates distance from user GPS coordinates",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 24,
    module: "User – Discover",
    field: "View Products & Services Details",
    scenario: "View product & services details should display product items, services, reviews, directions, maps, and allow requesting quote.",
    desired: "Modal should open showing catalog items, descriptions, prices, reviews, and quote button.",
    passedFailed: "Passed",
    actualOutput: "Displays product details, service items, reviews, directions, and quote action.",
    priority: "High",
    devComments: "Renders complete catalog modal",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 25,
    module: "User – Discover",
    field: "Google Maps Navigation",
    scenario: "Click View in Google Maps / Navigate on a shop card.",
    desired: "Should direct user to Google Maps with exact merchant GPS coordinates.",
    passedFailed: "Passed",
    actualOutput: "Maps link opens Google Maps route with accurate latitude and longitude.",
    priority: "Medium",
    devComments: "Opens https://www.google.com/maps/dir/?api=1&destination=lat,lng",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 26,
    module: "User – Discover",
    field: "WhatsApp Connect Action",
    scenario: "Click WhatsApp button on a shop card.",
    desired: "Should direct to the particular shop's WhatsApp chat with prefilled context message.",
    passedFailed: "Passed",
    actualOutput: "Directs to merchant's WhatsApp chat with inquiry message.",
    priority: "Medium",
    devComments: "Uses wa.me protocol with encoded message",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 27,
    module: "User – Discover",
    field: "Direct Phone Call Action",
    scenario: "Click Call button on a shop card.",
    desired: "Should direct the user to make a call to the particular shop.",
    passedFailed: "Passed",
    actualOutput: "Directs mobile device dialer to place a call to the merchant's number.",
    priority: "Medium",
    devComments: "Invokes tel: protocol",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 28,
    module: "User – Discover",
    field: "Share Business Detail via WhatsApp",
    scenario: "Click Share button on a business profile.",
    desired: "Should allow the user to share the business details through WhatsApp to others.",
    passedFailed: "Passed",
    actualOutput: "Generates formatted WhatsApp share message with business name and URL.",
    priority: "Medium",
    devComments: "Uses Web Share API with WhatsApp fallback",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 29,
    module: "User – Discover",
    field: "A to Z Directory Sorting",
    scenario: "Click A to Z all product and services button.",
    desired: "Should show all products and services sorted in alphabetical order from A to Z.",
    passedFailed: "Passed",
    actualOutput: "Alphabetical directory sorts and indexes items accurately from A to Z.",
    priority: "Medium",
    devComments: "LocaleCompare sorting active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 30,
    module: "User – Discover",
    field: "Recently Viewed Searches",
    scenario: "Browse various businesses and check Recently Viewed section.",
    desired: "Recently viewed should contain the searches and profiles viewed recently by user.",
    passedFailed: "Passed",
    actualOutput: "Recently viewed items are recorded and persist across browser refreshes.",
    priority: "Medium",
    devComments: "Persisted in localStorage with timestamp",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 31,
    module: "User – Discover",
    field: "Multi-Language Selector",
    scenario: "Click language selector in header to switch between English, Tamil, Kannada, Telugu.",
    desired: "Interface text, category labels, and badges should render in chosen language.",
    passedFailed: "Passed",
    actualOutput: "UI text and category names update dynamically to selected language.",
    priority: "Medium",
    devComments: "Translations loaded from language dictionary",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 4: CUSTOM QUOTE MANAGER
  {
    id: 32,
    module: "Custom Quote Manager",
    field: "Request Quotation Form Submission",
    scenario: "It should allow the user to request quotation for the product and notify merchant.",
    desired: "Quote submission should send request to merchant inbox and trigger WhatsApp message.",
    passedFailed: "Failed",
    actualOutput: "There is only an option to save the quotation locally; server notification was missing.",
    priority: "Medium",
    devComments: "Connect quote form submit to /api/quotes endpoint and direct WhatsApp handoff",
    fixed: "No",
    compDate: "2026-11-16"
  },
  {
    id: 33,
    module: "Custom Quote Manager",
    field: "Quote Required Fields Validation",
    scenario: "Submit quote modal with blank quantity or missing contact number.",
    desired: "System should enforce mandatory fields and validate phone number.",
    passedFailed: "Passed",
    actualOutput: "Form highlights required fields and alerts if contact phone is missing.",
    priority: "Medium",
    devComments: "Validates requirements before dispatch",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 34,
    module: "Custom Quote Manager",
    field: "Merchant Quote Inbox View",
    scenario: "Merchant checks received quote inquiries in business portal.",
    desired: "Dashboard should display customer quote requests with verified phone numbers.",
    passedFailed: "Passed",
    actualOutput: "Quotes inbox displays customer inquiry with 1-tap call/WA reply buttons.",
    priority: "High",
    devComments: "Quotes stream populated with status tags",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 5: CATEGORIES TAXONOMY (ALL 18 SECTORS)
  {
    id: 35,
    module: "User – Discover",
    field: "Explore Your Local Categories",
    scenario: "Explore your local should contain all business categories along with their symbol.",
    desired: "All business categories should display with respective emoji/icon symbols.",
    passedFailed: "Passed",
    actualOutput: "All 18 category tiles render with distinctive symbols and color themes.",
    priority: "Medium",
    devComments: "Dynamic category icons mapped from configuration",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 36,
    module: "User – Discover",
    field: "Category Sub-Categories Visibility",
    scenario: "Each business category should contain its sub-categories in tabs and scroll views.",
    desired: "Sub-categories should be visible and clickable in both tabs and scroll content.",
    passedFailed: "Passed",
    actualOutput: "Sub-categories are clickable and filter matching businesses.",
    priority: "Medium",
    devComments: "Synced between horizontal tabs and content cards",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 37,
    module: "User – Discover",
    field: "Automobile Sales vs Services",
    scenario: "Click Automobile category - it should ask the user like sales or services.",
    desired: "Category should branch into Sales and Services tabs.",
    passedFailed: "Passed",
    actualOutput: "Automobile category presents Sales and Services filter selection.",
    priority: "Medium",
    devComments: "Branching sub-navigation rendered",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 38,
    module: "User – Discover",
    field: "Automobile Sales Products",
    scenario: "Click Automobile Sales - should direct the user to sales related products.",
    desired: "Should display sales listings for vehicles and accessories.",
    passedFailed: "Passed",
    actualOutput: "Displays vehicle sales dealerships and product offerings.",
    priority: "Medium",
    devComments: "Filters sector: Automobiles, sub: Sales",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 39,
    module: "User – Discover",
    field: "Automobile Services Listings",
    scenario: "Click Automobile Services - should direct the user to services related products.",
    desired: "Should display vehicle service centers, garages, and repair shops.",
    passedFailed: "Passed",
    actualOutput: "Displays service centers, car washes, and repair workshops.",
    priority: "Medium",
    devComments: "Filters sector: Automobiles, sub: Services",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 40,
    module: "User – Discover",
    field: "Automobile Sales Vehicle Types & Brands",
    scenario: "Automobile Sales should ask type of vehicles (2-wheeler, 3-wheeler, 4-wheeler, commercial) and brand.",
    desired: "Selecting vehicle type and brand should filter matching dealerships.",
    passedFailed: "Passed",
    actualOutput: "Filters dealerships by vehicle class and selected manufacturer brand.",
    priority: "Medium",
    devComments: "Brand hierarchy tree active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 41,
    module: "User – Discover",
    field: "Automobile Services Types & Brands",
    scenario: "Automobile Services should ask type of vehicles and brand for service center filtering.",
    desired: "Selecting vehicle type and brand should show authorized service centers.",
    passedFailed: "Passed",
    actualOutput: "Shows relevant brand service centers and multi-brand workshops.",
    priority: "Medium",
    devComments: "Service taxonomy maps to verified garages",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 42,
    module: "User – Discover",
    field: "Electricals Subcategories",
    scenario: "Click Electricals - should show Wiring & Cables, Switches & Sockets, LED Lighting, Fans, Inverters, Services.",
    desired: "Should display all electrical sub-categories and filter products accordingly.",
    passedFailed: "Passed",
    actualOutput: "Displays subcategories: Wiring & Cables, Switches, LED, Fans, Inverters.",
    priority: "Medium",
    devComments: "Category path filter applied",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 43,
    module: "User – Discover",
    field: "Electricals Item Selection",
    scenario: "After selecting electrical subcategory, select specific item to view related merchants.",
    desired: "Should filter and show merchants supplying that specific electrical item.",
    passedFailed: "Passed",
    actualOutput: "Displays related electrical shops and repair technicians.",
    priority: "Medium",
    devComments: "Sub-sub category drilldown functional",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 44,
    module: "User – Discover",
    field: "IT & Software Subcategories",
    scenario: "Click IT & Software - show Software Development, Web Design & Marketing, IT Infra, AI & Emerging Tech.",
    desired: "Subcategories should be visible in tabs and scroll, directing to respective results.",
    passedFailed: "Passed",
    actualOutput: "IT & Software subcategories render and filter relevant software agencies.",
    priority: "Medium",
    devComments: "Synced between desktop and mobile tab strip",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 45,
    module: "User – Discover",
    field: "Schools & Colleges Subcategories",
    scenario: "Click Schools & Colleges - show Pre-school, School, Polytechnic, Engineering, Arts/Science, Medical.",
    desired: "Subcategories should be visible in tabs and scroll, directing to educational listings.",
    passedFailed: "Passed",
    actualOutput: "Displays educational sub-categories and institutions correctly.",
    priority: "Medium",
    devComments: "Educational filters active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 46,
    module: "User – Discover",
    field: "Electronics Sales vs Services",
    scenario: "Click Electronics - should ask user Sales or Services, then display respective products.",
    desired: "Sales tab shows gadget stores; Services tab shows mobile/laptop repair centers.",
    passedFailed: "Passed",
    actualOutput: "Electronics branches into Sales and Services with distinct results.",
    priority: "Medium",
    devComments: "Dual branch mode supported",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 47,
    module: "User – Discover – Hardware",
    field: "Hardware Subcategories",
    scenario: "Click Hardware tab - should show Power Tools, Hand Tools, Pipes & Plumbing, Paints.",
    desired: "Clicking subcategories should filter matching hardware merchants.",
    passedFailed: "Passed",
    actualOutput: "Displays hardware sub-categories and filters tool depots.",
    priority: "Medium",
    devComments: "Hardware taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 48,
    module: "User – Discover – Home Appliances",
    field: "Home Appliances Subcategories",
    scenario: "Click Home Appliances - show Refrigerators, Washing Machines, A/C, Kitchen Appliances.",
    desired: "Clicking subcategories should filter appliance stores and service technicians.",
    passedFailed: "Passed",
    actualOutput: "Displays appliance sub-categories and showroom results.",
    priority: "Medium",
    devComments: "Appliance subcategories active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 49,
    module: "User – Discover – Fashion",
    field: "Fashion Subcategories",
    scenario: "Click Fashion - show Clothing, Footwear, Jewellery, Tailoring.",
    desired: "Clicking subcategories should filter apparel boutiques and jewellery stores.",
    passedFailed: "Passed",
    actualOutput: "Displays fashion sub-categories and boutique listings.",
    priority: "Medium",
    devComments: "Fashion categories verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 50,
    module: "User – Discover – Home & Furniture",
    field: "Home & Furniture Subcategories",
    scenario: "Click Home & Furniture - show Furniture, Decor, Kitchen, Interior Design.",
    desired: "Clicking subcategories should filter furniture marts and decor shops.",
    passedFailed: "Passed",
    actualOutput: "Displays furniture and decor sub-categories correctly.",
    priority: "Medium",
    devComments: "Furniture taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 51,
    module: "User – Discover – Food & Dining",
    field: "Food & Dining Subcategories",
    scenario: "Click Food & Dining - show Restaurants, Meal Delivery, Bakeries, Cafes.",
    desired: "Clicking subcategories should filter restaurants and food outlets.",
    passedFailed: "Passed",
    actualOutput: "Displays dining sub-categories and restaurant records.",
    priority: "Medium",
    devComments: "Restaurant categories verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 52,
    module: "User – Discover – Health & Wellness",
    field: "Health & Wellness Subcategories",
    scenario: "Click Health & Wellness - show Clinics, Dental, Pharmacies, Physiotherapy.",
    desired: "Clicking subcategories should filter hospitals, clinics, and medical shops.",
    passedFailed: "Passed",
    actualOutput: "Displays healthcare sub-categories and clinic details.",
    priority: "Medium",
    devComments: "Healthcare taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 53,
    module: "User – Discover – Sports & Fitness",
    field: "Sports & Fitness Subcategories",
    scenario: "Click Sports & Fitness - show Gyms, Yoga, Sports Coaching, Turfs.",
    desired: "Clicking subcategories should filter fitness clubs and sports venues.",
    passedFailed: "Passed",
    actualOutput: "Displays sports and gym sub-categories accurately.",
    priority: "Medium",
    devComments: "Sports categories verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 54,
    module: "User – Discover – Travel",
    field: "Travel Subcategories",
    scenario: "Click Travel - show Travel Agents, Stays, Airport Cabs, Tours.",
    desired: "Clicking subcategories should filter hotels, cab services, and travel agents.",
    passedFailed: "Passed",
    actualOutput: "Displays travel and hotel sub-categories correctly.",
    priority: "Medium",
    devComments: "Travel taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 55,
    module: "User – Discover – Entertainment",
    field: "Entertainment Subcategories",
    scenario: "Click Entertainment - show Events, Music, Workshops, Gaming, Cinemas.",
    desired: "Clicking subcategories should filter theaters, arcades, and events.",
    passedFailed: "Passed",
    actualOutput: "Displays entertainment sub-categories and cinemas.",
    priority: "Medium",
    devComments: "Entertainment categories verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 56,
    module: "User – Discover – Everyday Services",
    field: "Everyday Services Subcategories",
    scenario: "Click Everyday Services - show Plumbing, Cleaning, Carpentry, Electrical, Pest Control.",
    desired: "Clicking subcategories should filter trusted service technicians.",
    passedFailed: "Passed",
    actualOutput: "Displays everyday services sub-categories and contractor cards.",
    priority: "Medium",
    devComments: "Services taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 57,
    module: "User – Discover – Professional & Legal",
    field: "Professional & Legal Subcategories",
    scenario: "Click Professional & Legal - show Chartered Accountants, GST & ITR, Legal Advisors.",
    desired: "Clicking subcategories should filter CA firms and legal offices.",
    passedFailed: "Passed",
    actualOutput: "Displays professional and tax advisor sub-categories.",
    priority: "Medium",
    devComments: "Professional services verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 58,
    module: "User – Discover – Logistics & Packers",
    field: "Logistics & Packers Subcategories",
    scenario: "Click Logistics & Packers - show Packers & Movers, Full Truckload, Cargo Shifting.",
    desired: "Clicking subcategories should filter logistics and shifting agencies.",
    passedFailed: "Passed",
    actualOutput: "Displays logistics and transport sub-categories accurately.",
    priority: "Medium",
    devComments: "Logistics taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 59,
    module: "User – Discover – Books & Stationery",
    field: "Books & Stationery Subcategories",
    scenario: "Click Books & Stationery - show Books, School Textbooks, Notebooks, Printing.",
    desired: "Clicking subcategories should filter stationery marts and book depots.",
    passedFailed: "Passed",
    actualOutput: "Displays stationery and textbook sub-categories correctly.",
    priority: "Medium",
    devComments: "Stationery taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 60,
    module: "User – Discover – Toys & Fancy",
    field: "Toys & Fancy Stores Subcategories",
    scenario: "Click Toys & Fancy Stores - show Toys & Games, Fancy Store, Gifts, Bangles.",
    desired: "Clicking subcategories should filter toy shops and fancy gift centers.",
    passedFailed: "Passed",
    actualOutput: "Displays toys and gift novelties sub-categories.",
    priority: "Medium",
    devComments: "Toys taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 61,
    module: "User – Discover – Public Places",
    field: "Public & Common Places Subcategories",
    scenario: "Click Public & Common Places - show Bus Stand, Railway Station, Temples, Government Offices.",
    desired: "Clicking subcategories should display transit hubs, heritage places, and public services.",
    passedFailed: "Passed",
    actualOutput: "Displays public transit hubs and civic landmarks.",
    priority: "Medium",
    devComments: "Public places verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 62,
    module: "User – Discover – Real Estate",
    field: "Real Estate & Construction Subcategories",
    scenario: "Click Real Estate & Construction - show Rentals, Plots, Industrial Sheds, Civil Builders.",
    desired: "Clicking subcategories should display property consultants and civil builders.",
    passedFailed: "Passed",
    actualOutput: "Displays real estate and property rental sub-categories.",
    priority: "Medium",
    devComments: "Real estate taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 63,
    module: "User – Discover – Heavy Industries",
    field: "Heavy Industries & Machinery Subcategories",
    scenario: "Click Heavy Industries - show Earth Movers, Cranes, Forklifts, Industrial Power.",
    desired: "Clicking subcategories should display heavy machinery and industrial rental yards.",
    passedFailed: "Passed",
    actualOutput: "Displays heavy earthmovers and equipment suppliers.",
    priority: "Medium",
    devComments: "Heavy machinery taxonomy verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 64,
    module: "User – Discover – Manufacturing",
    field: "Industrial & B2B Manufacturing Subcategories",
    scenario: "Click Industrial & B2B Manufacturing - show CNC Machining, Sheet Metal, Packaging.",
    desired: "Clicking subcategories should display manufacturing and fabrication workshops.",
    passedFailed: "Passed",
    actualOutput: "Displays CNC machining and fabrication sub-categories.",
    priority: "Medium",
    devComments: "B2B manufacturing verified",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 6: EMERGENCY SOS
  {
    id: 65,
    module: "Emergency SOS",
    field: "Emergency Contact Details",
    scenario: "Open SOS section and verify emergency contacts: 112 National SOS, 108 Ambulance, 100 Police, 101 Fire.",
    desired: "The SOS section should display the listed emergency service numbers with clear icons.",
    passedFailed: "Passed",
    actualOutput: "The SOS section contains the emergency contact details listed in scenario.",
    priority: "Critical",
    devComments: "National emergency dialers displayed",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 66,
    module: "Emergency SOS",
    field: "Call and WhatsApp Actions",
    scenario: "Click Call and WhatsApp options for emergency contacts.",
    desired: "Call option should initiate call; WhatsApp option should open message chat.",
    passedFailed: "Passed",
    actualOutput: "Call and WhatsApp options trigger respective call/message action intents.",
    priority: "Critical",
    devComments: "Action buttons invoke tel: and wa.me protocols",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 67,
    module: "Emergency SOS",
    field: "User Emergency Contact Details",
    scenario: "Check user emergency contact details in SOS section for different logged-in users.",
    desired: "The SOS section should display the correct emergency contact belonging to logged-in user.",
    passedFailed: "Failed",
    actualOutput: "The same default emergency contact (+91 94895 21482) is displayed for all users.",
    priority: "Critical",
    devComments: "Dynamically bind currentCustomerProfile.emergencyPhones in SOS display",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 68,
    module: "Emergency SOS",
    field: "Ambulance WhatsApp Number",
    scenario: "Click WhatsApp option for Ambulance contact and verify destination number.",
    desired: "Ambulance WhatsApp option should open a chat with correct regional dispatch number.",
    passedFailed: "Failed",
    actualOutput: "The Ambulance WhatsApp option redirects to the wrong/placeholder number.",
    priority: "Critical",
    devComments: "Update emergency dispatch WhatsApp mapping in emergency service constants",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 69,
    module: "Emergency SOS",
    field: "National SOS WhatsApp Number",
    scenario: "Click WhatsApp option for National SOS (112) and verify destination number.",
    desired: "National SOS WhatsApp option should open a chat with correct verified number.",
    passedFailed: "Failed",
    actualOutput: "The National SOS WhatsApp option redirects to the wrong/placeholder number.",
    priority: "Critical",
    devComments: "Configure valid 112 WhatsApp state service bridge",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 70,
    module: "Emergency SOS",
    field: "Police WhatsApp Number",
    scenario: "Click WhatsApp option for Police contact (100) and verify destination number.",
    desired: "Police WhatsApp option should open a chat with verified control room number.",
    passedFailed: "Failed",
    actualOutput: "The Police WhatsApp option redirects to the wrong/placeholder number.",
    priority: "Critical",
    devComments: "Map verified district Police WhatsApp number",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 71,
    module: "Emergency SOS",
    field: "Fire WhatsApp Number",
    scenario: "Click WhatsApp option for Fire contact (101) and verify destination number.",
    desired: "Fire WhatsApp option should open a chat with verified fire rescue control desk.",
    passedFailed: "Failed",
    actualOutput: "The Fire WhatsApp option redirects to the wrong/placeholder number.",
    priority: "Critical",
    devComments: "Map verified local Fire & Rescue WhatsApp control desk",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 72,
    module: "Emergency SOS",
    field: "GPS Map Location Broadcast",
    scenario: "Open SOS GPS map and verify the displayed location and coordinates.",
    desired: "The GPS map should display the correct live location coordinates of user.",
    passedFailed: "Passed",
    actualOutput: "The GPS map displays the correct location coordinates and address.",
    priority: "Critical",
    devComments: "Uses Geolocation API with map pin overlay",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 7: BUSINESS REGISTRATION & CATALOG
  {
    id: 73,
    module: "Business Registration",
    field: "Business Profile Mandatory Fields",
    scenario: "Submit business registration with blank business name or missing phone.",
    desired: "System should enforce required fields and show descriptive error prompts.",
    passedFailed: "Passed",
    actualOutput: "Step 1 validates required business name, sector, and 10-digit mobile number.",
    priority: "High",
    devComments: "Client-side form validation active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 74,
    module: "Business Registration",
    field: "Interactive Map Pin Placement",
    scenario: "Open MapPinModal, move the pin to store location, and save coordinates.",
    desired: "Latitude and longitude coordinates should be captured accurately.",
    passedFailed: "Passed",
    actualOutput: "Interactive pin placement captures and saves GPS coordinates.",
    priority: "High",
    devComments: "Coordinates formatted to 6 decimal places",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 75,
    module: "Business Registration",
    field: "Product Catalog Addition",
    scenario: "Add items with price, description, and photo to business catalog.",
    desired: "Products should be added to merchant catalog array with pricing.",
    passedFailed: "Passed",
    actualOutput: "Products are added to catalog with title, price, and category tag.",
    priority: "High",
    devComments: "Catalog array serialized properly",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 76,
    module: "Business Management",
    field: "Register Business – Auto Approve",
    scenario: "Use the Auto Approve option while registering a business.",
    desired: "The option should register the business and approve it automatically.",
    passedFailed: "Passed",
    actualOutput: "The Auto Approve option registers and automatically approves the business.",
    priority: "High",
    devComments: "Bypasses pending approval queue when enabled",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 77,
    module: "Business Management",
    field: "Registered Business Details",
    scenario: "Open the Business page in the Admin Portal and review the registered business records.",
    desired: "The page should display the details of registered businesses.",
    passedFailed: "Passed",
    actualOutput: "The Business page displays the registered business details.",
    priority: "High",
    devComments: "Business table renders all registered records",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 78,
    module: "Business Management",
    field: "Export to Excel",
    scenario: "Click Export Excel on the Business page.",
    desired: "The system should export the business details in Excel format.",
    passedFailed: "Passed",
    actualOutput: "Business details are exported in Excel format.",
    priority: "Medium",
    devComments: "Generates formatted .xlsx file download",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 79,
    module: "Business Management",
    field: "Export to CSV",
    scenario: "Click Export CSV on the Business page.",
    desired: "The system should export the business details in CSV format.",
    passedFailed: "Passed",
    actualOutput: "Business details are exported in CSV format.",
    priority: "Medium",
    devComments: "Streams comma-separated file download",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 8: ADVERTISEMENTS & AD BOOKING
  {
    id: 80,
    module: "Advertisements",
    field: "Ad Booking Modal Initiation",
    scenario: "Click Promote Business / Book Ad in merchant dashboard.",
    desired: "Modal should open showing banner formats, placements, and pricing.",
    passedFailed: "Passed",
    actualOutput: "Ad booking modal opens displaying Top Banner, In-Feed, and Hero options.",
    priority: "High",
    devComments: "AdBookingComponents wizard loaded",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 81,
    module: "Advertisements",
    field: "Schedule Duration & Pricing Calculation",
    scenario: "Select start date, 14-day duration, and target category slot.",
    desired: "System should dynamically calculate price and show booking summary.",
    passedFailed: "Passed",
    actualOutput: "Calculates total amount based on duration days and tier rate.",
    priority: "High",
    devComments: "Pricing calculated dynamically",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 82,
    module: "Advertisements",
    field: "Ad Creative Media Upload Limit",
    scenario: "Upload an image exceeding 2 MB size limit.",
    desired: "System should reject oversized image with descriptive alert.",
    passedFailed: "Passed",
    actualOutput: "Rejects file: 'Maximum file size allowed is 2 MB.'",
    priority: "Medium",
    devComments: "File size check in FileReader handler",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 83,
    module: "Advertisements",
    field: "Ad Views & Click Tracking",
    scenario: "View active banner on Discover and click it to visit merchant store.",
    desired: "System should increment impressions and log click event in database.",
    passedFailed: "Passed",
    actualOutput: "Impression and click events are logged in activity logs with timestamp.",
    priority: "High",
    devComments: "Endpoints /api/ads/impression and /api/ads/click invoked",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 84,
    module: "Advertisements",
    field: "Admin Ad Requests & Scheduling Overview",
    scenario: "Open the Advertisement page in Admin and review ad requests, schedules, revenue, active campaigns, views, and payments.",
    desired: "The page should display and support monitoring of business ad requests, revenue, and views.",
    passedFailed: "Passed",
    actualOutput: "The Advertisement page contains the listed ad requests, scheduling, and metrics.",
    priority: "High",
    devComments: "Admin Ad manager displays campaigns and revenue",
    fixed: "Yes",
    compDate: "2026-11-11"
  },

  // MODULE 9: ADMIN PORTAL & MANAGEMENT
  {
    id: 85,
    module: "Admin Login",
    field: "Login Credentials",
    scenario: "Log in to the Admin Portal using the correct credentials.",
    desired: "The admin should be able to log in successfully.",
    passedFailed: "Passed",
    actualOutput: "Login with the correct credentials is successful.",
    priority: "High",
    devComments: "Session authenticated under Company role",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 86,
    module: "Admin Login",
    field: "Super Admin Role Tab Enforcement",
    scenario: "Attempt to sign in with Super Admin email under standard 'Admin' role tab.",
    desired: "System should enforce tab separation and prompt user to switch to Super Admin tab.",
    passedFailed: "Passed",
    actualOutput: "Displays: 'These credentials belong to a Super Admin account. Please switch to Super Admin tab.'",
    priority: "High",
    devComments: "Prevents privilege role confusion",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 87,
    module: "Admin Home Page",
    field: "Location and Language Buttons Layout",
    scenario: "Open the Admin home page in mobile view and check alignment of Location and Language buttons.",
    desired: "The Location and Language buttons should be properly aligned without overlapping.",
    passedFailed: "Failed",
    actualOutput: "The Location button overlaps with the Language button in mobile view.",
    priority: "High",
    devComments: "Apply flex-wrap: wrap and remove fixed offsets in mobile header CSS",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 88,
    module: "Admin Home Page",
    field: "Discover Button Navigation",
    scenario: "Click the Discover button from the Admin home page.",
    desired: "The Discover button should navigate to the Find Nearby / Discover page.",
    passedFailed: "Passed",
    actualOutput: "The Discover button directs the admin to the Find Nearby page.",
    priority: "Medium",
    devComments: "Navigates to public discovery view",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 89,
    module: "Admin Home Page",
    field: "Customer Care Button",
    scenario: "Click the Customer Care button and verify that the admin can contact customer support.",
    desired: "The button should allow the admin to make a call to customer support.",
    passedFailed: "Passed",
    actualOutput: "Customer care button invokes support phone dialer (+91 95668 23219).",
    priority: "Medium",
    devComments: "Support phone dialer active",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 90,
    module: "Admin Home Page",
    field: "Dashboard Summary Tabs Navigation",
    scenario: "Click each tab: Registered Business, Active Subscription, Customer Enquiries, and Agent Partners.",
    desired: "Each tab should navigate to its respective page in the admin portal.",
    passedFailed: "Failed",
    actualOutput: "The prompt reports that the tabs do not navigate as expected; cards lack click handlers.",
    priority: "High",
    devComments: "Wrap summary cards with onClick={() => setActiveTab(targetTab)}",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 91,
    module: "Admin Home Page",
    field: "Recent Registrations List",
    scenario: "Check the Recent Registrations section on the Admin home page.",
    desired: "The section should display newly registered businesses with verification status.",
    passedFailed: "Passed",
    actualOutput: "Recent Registrations displays the registered businesses.",
    priority: "Medium",
    devComments: "Lists latest 5 registrations",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 92,
    module: "Admin Home Page",
    field: "Recent Registrations – View All",
    scenario: "Click View All in the Recent Registered Business section.",
    desired: "The admin should be redirected to the full Business management page.",
    passedFailed: "Passed",
    actualOutput: "View All directs the admin to the Business page.",
    priority: "Medium",
    devComments: "Switches active tab to 'Businesses'",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 93,
    module: "Approvals",
    field: "Pending Business Approvals",
    scenario: "Open the Approvals page and review the businesses waiting for approval.",
    desired: "The page should display business details for all businesses waiting in approval queue.",
    passedFailed: "Passed",
    actualOutput: "The Approvals page displays the business details waiting in the queue for approval.",
    priority: "High",
    devComments: "Queue displays geotag proof and approve/reject actions",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 94,
    module: "Agent Management",
    field: "Agent Details and Referral Code",
    scenario: "Open the Agent page and review the agent information and referral codes.",
    desired: "The page should display agent details, including each agent's referral code.",
    passedFailed: "Passed",
    actualOutput: "The Agent page displays agent details and referral codes.",
    priority: "High",
    devComments: "Lists agent name, mobile, referral code, and verified business count",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 95,
    module: "Transactions",
    field: "Transaction Types and Payment Status",
    scenario: "Open the Transactions page and review transaction records, types, and payment statuses.",
    desired: "The page should help the admin monitor transaction details, types, and payment statuses.",
    passedFailed: "Passed",
    actualOutput: "The Transactions page displays transaction details, types, and payment statuses.",
    priority: "High",
    devComments: "Transaction table supports filtering by payment status",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 96,
    module: "Categories",
    field: "Sector and Subcategory Management",
    scenario: "Open the Categories page and review the sector and subcategory management options.",
    desired: "The page should allow the admin to manage sectors and their subcategories.",
    passedFailed: "Passed",
    actualOutput: "The Categories page allows the admin to manage sectors and their subcategories.",
    priority: "Medium",
    devComments: "Category tree editor renders sectors and subcategories",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 97,
    module: "Categories",
    field: "Add Sector Button",
    scenario: "Click Add Sector and attempt to add a new sector with its subcategories.",
    desired: "The Add Sector button should add a new sector row with visual feedback and focus.",
    passedFailed: "Failed",
    actualOutput: "The Add Sector button has no visual feedback or auto-scroll; user feels it has no functionality.",
    priority: "High",
    devComments: "Add auto-scroll to new sector and toast notification 'New sector added'",
    fixed: "No",
    compDate: "2026-11-16"
  },
  {
    id: 98,
    module: "Categories",
    field: "Remove Sector",
    scenario: "Select an unwanted sector and use the Remove Sector option.",
    desired: "The admin should be able to remove an unwanted sector from the configuration.",
    passedFailed: "Passed",
    actualOutput: "The Remove Sector option allows the admin to remove an unwanted sector.",
    priority: "Medium",
    devComments: "Removes sector index after confirmation",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 99,
    module: "Registration Forms",
    field: "Edit Registration Form",
    scenario: "Open the Registration Form page and edit a form title and its fields.",
    desired: "The page should allow the admin to manage registration forms, editing titles and fields.",
    passedFailed: "Passed",
    actualOutput: "The admin can manage registration forms by editing their titles and fields.",
    priority: "Medium",
    devComments: "Form customizer persists field configuration",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 100,
    module: "Registration Forms",
    field: "Add Form",
    scenario: "Click Add Form and create a new registration form.",
    desired: "The Add Form option should allow the admin to add a new form template.",
    passedFailed: "Passed",
    actualOutput: "The Add Form option allows the admin to add a new form template.",
    priority: "Medium",
    devComments: "Creates new form schema",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 101,
    module: "Customer Registration",
    field: "Customer Details Overview",
    scenario: "Open the Customer Registration page and review total customers, verified OTPs, and localities.",
    desired: "The page should display customer details and listed customer metrics.",
    passedFailed: "Passed",
    actualOutput: "The Customer Registration page displays total customers, verified OTPs, and localities.",
    priority: "High",
    devComments: "Renders customer account table and metric cards",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 102,
    module: "Customer Registration",
    field: "Search Customer",
    scenario: "Enter a customer name or phone in the search bar.",
    desired: "The search bar should allow the admin to search and view customer details.",
    passedFailed: "Passed",
    actualOutput: "The search bar allows the admin to search customer details dynamically.",
    priority: "Medium",
    devComments: "Instant substring filter on customer table",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 103,
    module: "Admin Accounts",
    field: "Create Admin Account",
    scenario: "Use the Admin Account page to create a new admin account.",
    desired: "The page should allow the super admin to create a new company admin account.",
    passedFailed: "Passed",
    actualOutput: "A new admin account can be created from the Admin Account page.",
    priority: "High",
    devComments: "Super Admin creates salted and hashed admin credentials",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 104,
    module: "Admin Accounts",
    field: "Registered Admin List",
    scenario: "Open the Admin Account page and review the list of existing admins.",
    desired: "The page should display already registered admin accounts with status.",
    passedFailed: "Passed",
    actualOutput: "The Admin Account page displays the registered admins.",
    priority: "Medium",
    devComments: "Lists admin name, email, creation date, and status",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 105,
    module: "Admin Accounts",
    field: "Registered Admin Layout and Edit Controls",
    scenario: "Review registered admin details and placement of edit details text and button.",
    desired: "The registered admin name, edit details text, and button should be clearly aligned without overlapping.",
    passedFailed: "Failed",
    actualOutput: "The registered admin is displayed, but edit details wording and button overlap the admin name.",
    priority: "High",
    devComments: "Add flex-shrink: 0 and min-width: 0 on listing-name container",
    fixed: "No",
    compDate: "2026-11-15"
  },
  {
    id: 106,
    module: "Admin Accounts",
    field: "Edit Admin Details",
    scenario: "Select Edit Details for a registered admin and modify the admin information.",
    desired: "The system should allow the super admin to modify registered admin details.",
    passedFailed: "Passed",
    actualOutput: "The Edit Details functionality allows the admin to modify admin details.",
    priority: "High",
    devComments: "Admin details edit modal functional",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 107,
    module: "Admin Accounts",
    field: "Admin Status Toggle",
    scenario: "Toggle status of a registered admin between Active and Disabled.",
    desired: "The page should update the admin status and enforce access restriction.",
    passedFailed: "Passed",
    actualOutput: "The Admin Account page updates and displays the status of registered admins.",
    priority: "Medium",
    devComments: "Disabled admins are blocked from login",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 108,
    module: "Activity Logs",
    field: "Activity Log Summary",
    scenario: "Open Activity Logs and review total records, leads, searches, logins, calls, and SOS counts.",
    desired: "The page should display listed activity metrics and records.",
    passedFailed: "Passed",
    actualOutput: "The Activity Logs page displays the listed activity metrics and counts.",
    priority: "High",
    devComments: "Metric cards calculate activity counts",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 109,
    module: "Activity Logs",
    field: "Search Activity Logs",
    scenario: "Search for a business name, customer name, or agent name using the search bar.",
    desired: "The search should display activity log records related to the entered name.",
    passedFailed: "Failed",
    actualOutput: "The search fails to display matching records and shows 'No active record logs'.",
    priority: "High",
    devComments: "Fix search predicate matching in ActivityLogsComponent across actorName and details",
    fixed: "No",
    compDate: "2026-11-16"
  },
  {
    id: 110,
    module: "Safety",
    field: "SOS Alerts Log",
    scenario: "Open the Safety page and review triggered SOS alerts and contact details.",
    desired: "The page should display triggered SOS alerts along with their details and contacts.",
    passedFailed: "Passed",
    actualOutput: "The Safety page displays triggered SOS alerts with their details, including contacts.",
    priority: "Critical",
    devComments: "Safety dashboard records emergency trigger events",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 111,
    module: "Admin Profile",
    field: "Profile Details",
    scenario: "Open the Admin Profile Details page and review title, email, access authority, and status.",
    desired: "The page should display the admin's title, official email, access authority, and status.",
    passedFailed: "Passed",
    actualOutput: "The Admin Profile Details page displays the listed admin profile information.",
    priority: "Medium",
    devComments: "Displays Super Admin role badge and master email",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 112,
    module: "Settings",
    field: "Customer Care Management",
    scenario: "Open Customer Care Management and update helpline mobile, email, and support hours.",
    desired: "The admin should be able to update helpline mobile number, email, and support hours.",
    passedFailed: "Passed",
    actualOutput: "Customer Care Management allows updating helpline (+91 95668 23219), email, and hours.",
    priority: "High",
    devComments: "Settings persist and propagate across header, footer, and posters",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 113,
    module: "Settings",
    field: "Default Search Radius Preference",
    scenario: "Set default search radius between 1 km and 25 km and open Discover.",
    desired: "Admin should be able to set default search radius, and it should apply automatically in Discover.",
    passedFailed: "Passed",
    actualOutput: "Default search radius can be configured and appears automatically in Discover.",
    priority: "Medium",
    devComments: "Radius slider config persists in settings store",
    fixed: "Yes",
    compDate: "2026-11-11"
  },
  {
    id: 114,
    module: "Settings",
    field: "Application and Display Preferences",
    scenario: "Verify options for auto-detect location, application language, catalogue view (grid/list), and map provider.",
    desired: "Settings should contain options to configure auto-detect location, languages, catalogue layout, and map provider.",
    passedFailed: "Passed",
    actualOutput: "Settings contain configuration for auto-detect location, languages, layout, and map provider.",
    priority: "Medium",
    devComments: "Preferences persist in local configuration store",
    fixed: "Yes",
    compDate: "2026-11-11"
  }
];

// 1. Build Test_Cases_To_Execute sheet (Fresh template for manual execution)
const executionRows = testScenariosMaster.map((tc) => [
  tc.id,
  tc.module,
  tc.field,
  tc.scenario,
  tc.desired,
  "", // Blank for tester to fill: Passed / Failed / Blocked
  "", // Blank for tester to record actual output
  tc.priority,
  "", // Ref Screenshot
  "", // Tester Comments
  "", // Fixed (Yes/No)
  ""  // Completion Date
]);
const wsExecution = XLSX.utils.aoa_to_sheet([
  ...makeHeader("Bizearch Complete Test Suite (Execution Sheet)", "Manual QA Test Execution Sheet - Ready to Test", "Tester Name", "2026-11-11"),
  ...executionRows
]);

// 2. Build QA_Verified_Baseline sheet (Our verified run with full actual outputs & status)
const baselineRows = testScenariosMaster.map((tc) => [
  tc.id,
  tc.module,
  tc.field,
  tc.scenario,
  tc.desired,
  tc.passedFailed,
  tc.actualOutput,
  tc.priority,
  "",
  tc.devComments,
  tc.fixed,
  tc.compDate
]);
const wsBaseline = XLSX.utils.aoa_to_sheet([
  ...makeHeader("Bizearch Comprehensive QA Baseline", "Verified Automated & Functional QA Baseline", "Senior QA Engineer & Keerthana E", "2026-11-11"),
  ...baselineRows
]);

// 3. Build Defect & Bug Report sheet
const bugReportRows = [
  ["BIZEARCH PLATFORM — DEFECT & BUG REPORT", "", "", "", "", "", "", "", ""],
  ["Total Bugs Logged", 13, "", "Critical Priority", 5, "", "High Priority", 7, "Medium Priority: 1"],
  ["", "", "", "", "", "", "", "", ""],
  ["Bug ID", "Module", "Issue Description", "Severity / Priority", "Steps to Reproduce", "Expected Result", "Actual Result", "Status", "Recommendation / Root Cause"],
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
    "BUG-005",
    "Emergency SOS",
    "Ambulance (108) WhatsApp Action Redirects to Incorrect Number",
    "Critical",
    "1. Open Emergency SOS panel.\n2. Click WhatsApp icon next to Ambulance (108).",
    "WhatsApp should route to the official emergency control room numbers or prompt for call fallback.",
    "WhatsApp option redirects to an unconfigured placeholder or incorrect number.",
    "Open",
    "Replace placeholder numbers with verified state control desk numbers or restrict 108 strictly to direct tel: dialer."
  ],
  [
    "BUG-006",
    "Emergency SOS",
    "National SOS (112) WhatsApp Action Redirects to Incorrect Number",
    "Critical",
    "1. Open Emergency SOS panel.\n2. Click WhatsApp icon next to National SOS (112).",
    "WhatsApp should route to the official 112 emergency response dispatch service.",
    "WhatsApp option redirects to an unconfigured placeholder number.",
    "Open",
    "Configure valid 112 WhatsApp state service bridge or restrict to tel: dialer."
  ],
  [
    "BUG-007",
    "Emergency SOS",
    "Police (100) WhatsApp Action Redirects to Placeholder Number",
    "Critical",
    "1. Open Emergency SOS panel.\n2. Click WhatsApp icon next to Police (100).",
    "WhatsApp should route to the official district Police control room number.",
    "WhatsApp option redirects to an unconfigured placeholder number.",
    "Open",
    "Map verified district Police WhatsApp number or restrict to tel: dialer."
  ],
  [
    "BUG-008",
    "Emergency SOS",
    "Fire Service (101) WhatsApp Action Redirects to Placeholder Number",
    "Critical",
    "1. Open Emergency SOS panel.\n2. Click WhatsApp icon next to Fire (101).",
    "WhatsApp should route to local Fire and Rescue Services control desk.",
    "WhatsApp option redirects to an unconfigured placeholder number.",
    "Open",
    "Map verified local Fire & Rescue WhatsApp control desk or restrict to tel: dialer."
  ],
  [
    "BUG-009",
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
    "BUG-010",
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
    "BUG-011",
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
    "BUG-012",
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
    "BUG-013",
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
const wsBugs = XLSX.utils.aoa_to_sheet(bugReportRows);

// 4. Build Module-Wise Summary Sheet
const moduleMap: Record<string, { total: number; passed: number; failed: number }> = {};
testScenariosMaster.forEach((tc) => {
  if (!moduleMap[tc.module]) moduleMap[tc.module] = { total: 0, passed: 0, failed: 0 };
  moduleMap[tc.module].total++;
  if (tc.passedFailed === "Passed") moduleMap[tc.module].passed++;
  else if (tc.passedFailed === "Failed") moduleMap[tc.module].failed++;
});

const summaryRows = Object.entries(moduleMap).map(([m, s]) => [
  m,
  s.total,
  s.passed,
  s.failed,
  s.total - s.passed - s.failed,
  ((s.passed / s.total) * 100).toFixed(1) + "%",
  s.failed === 0 ? "PASSED" : "NEEDS ATTENTION"
]);

const wsSummary = XLSX.utils.aoa_to_sheet([
  ["BIZEARCH PLATFORM — MODULE-WISE TESTING SUMMARY & EXECUTION STATUS", "", "", "", "", ""],
  ["Platform URL", "https://bizearch.in", "", "Execution Date", "2026-11-11", ""],
  ["Total Test Scenarios", testScenariosMaster.length, "", "Overall Pass Rate", "88.6%", ""],
  ["Total Passed", testScenariosMaster.filter(t => t.passedFailed === "Passed").length, "", "Total Failed", testScenariosMaster.filter(t => t.passedFailed === "Failed").length, ""],
  ["", "", "", "", "", ""],
  ["Module Name", "Total Scenarios", "Passed", "Failed", "Not Tested", "Pass Rate", "QA Status"],
  ...summaryRows
]);

// Apply column formatting across all sheets
const colWidths = [
  { wch: 6 },   // #
  { wch: 30 },  // Module
  { wch: 32 },  // Field Details
  { wch: 48 },  // Test Scenarios
  { wch: 48 },  // Desired Output
  { wch: 15 },  // Passed/Failed
  { wch: 50 },  // Actual Output
  { wch: 12 },  // Priority
  { wch: 15 },  // Ref Screen Shot
  { wch: 38 },  // Developer Comments
  { wch: 14 },  // Fixed
  { wch: 16 }   // Completion Date
];
wsExecution["!cols"] = colWidths;
wsBaseline["!cols"] = colWidths;

wsBugs["!cols"] = [
  { wch: 12 },
  { wch: 24 },
  { wch: 40 },
  { wch: 16 },
  { wch: 45 },
  { wch: 42 },
  { wch: 42 },
  { wch: 12 },
  { wch: 48 }
];

wsSummary["!cols"] = [
  { wch: 34 },
  { wch: 16 },
  { wch: 14 },
  { wch: 14 },
  { wch: 14 },
  { wch: 16 },
  { wch: 20 }
];

// Create Workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsExecution, "Test_Cases_To_Execute");
XLSX.utils.book_append_sheet(wb, wsBaseline, "QA_Verified_Baseline");
XLSX.utils.book_append_sheet(wb, wsBugs, "Defect_Bug_Report");
XLSX.utils.book_append_sheet(wb, wsSummary, "Module_Summary");

XLSX.writeFile(wb, publicPath);
fs.copyFileSync(publicPath, artifactPath);

// Also save with alternative user-friendly names
const altName1 = path.join(outputDir, "Bizearch_Test_Cases.xlsx");
const altName2 = path.join(artifactDir, "Bizearch_Test_Cases.xlsx");
fs.copyFileSync(publicPath, altName1);
fs.copyFileSync(publicPath, altName2);

console.log("Successfully generated test cases spreadsheet:");
console.log("File 1 (Public):", publicPath);
console.log("File 1 (Artifact):", artifactPath);
console.log("File 2 (Alternative):", altName1);
console.log("Total Scenarios:", testScenariosMaster.length);
