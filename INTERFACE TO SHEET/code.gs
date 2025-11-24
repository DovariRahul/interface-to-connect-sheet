const SHEET_NAME = 'sheet1'; // name of the sheet tab

function doGet(e) {
  // Serve the HTML UI
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Data Collection with OTP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Helper: include HTML partials if needed
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// Send OTP to the email and store it temporarily
function sendOtp(email) {
  if (!email) {
    throw new Error('Email is required.');
  }

  const otp = generateOtp();
  const cache = CacheService.getUserCache(); // per-user cache

  // Store OTP for 5 minutes (300 seconds)
  cache.put(email, otp, 300);

  // Send email
  const subject = 'Your OTP for Verification';
  const body =
    'Your one-time password (OTP) is: ' +
    otp +
    '\n\nThis OTP is valid for 5 minutes.';

  MailApp.sendEmail(email, subject, body);

  return 'OTP sent successfully to ' + email;
}

// Verify OTP and save data to the sheet
function verifyAndSave(formData, otpInput) {
  if (!formData || !formData.email) {
    throw new Error('Invalid form data.');
  }

  const email = formData.email;
  const cache = CacheService.getUserCache();
  const storedOtp = cache.get(email);

  if (!storedOtp) {
    throw new Error('OTP expired or not requested. Please request a new OTP.');
  }

  if (storedOtp !== otpInput) {
    throw new Error('Invalid OTP. Please try again.');
  }

  // OTP is valid → save data to sheet
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error('Sheet named "' + SHEET_NAME + '" not found.');
  }

  // Convert date string (yyyy-mm-dd) to Date object
  let formDate = formData.date ? new Date(formData.date) : '';

  // Append row in this order:
  // Timestamp, Date, Name, Email, Phone, Address, Gender, Age, ID Number, Comments, City, Department
  sheet.appendRow([
    new Date(),              // Timestamp
    formDate,                // Date from form
    formData.name,           // Name
    formData.email,          // Email
    formData.phone,          // Phone number
    formData.address,        // Address
    formData.gender,         // Gender
    formData.age,            // Age
    formData.idNumber,       // ID number
    formData.comments,       // Comments
    formData.city,           // City
    formData.department      // Department
  ]);

  // Clear OTP after use
  cache.remove(email);

  return 'Data saved successfully!';
}

// Generate 6-digit OTP
function generateOtp() {
  const otp = Math.floor(100000 + Math.random() * 900000);
  return otp.toString();
}
